const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "signed-runtime-qa-preflight.json");
const signedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");
const signedAabEvidencePath = path.join(reportsDir, "signed-aab-evidence.json");
const emulatorQaReportPath = path.join(reportsDir, "emulator-qa-report.json");

function envValue(name) {
  const direct = process.env[name];
  if (direct) {
    return direct;
  }
  const match = Object.keys(process.env).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? process.env[match] : "";
}

function pathEntries() {
  return String(envValue("PATH") || "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function executableNames(name) {
  if (process.platform === "win32") {
    return [name, `${name}.cmd`, `${name}.bat`, `${name}.exe`];
  }
  return [name];
}

function windowsTestPath(candidate) {
  if (process.platform !== "win32" || !candidate) {
    return false;
  }
  const literal = `'${candidate.replace(/'/g, "''")}'`;
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `if (Test-Path -LiteralPath ${literal}) { exit 0 } else { exit 1 }`
    ],
    {
      stdio: "ignore",
      shell: false,
      timeout: 3000
    }
  );
  return result.status === 0;
}

function safeExists(candidate, options = {}) {
  return fs.existsSync(candidate) || (options.allowWindowsShell === true && windowsTestPath(candidate));
}

function findOnPath(name) {
  for (const entry of pathEntries()) {
    for (const executable of executableNames(name)) {
      const candidate = path.join(entry, executable);
      if (safeExists(candidate)) {
        return candidate;
      }
    }
  }
  return "";
}

function androidSdkRoots() {
  const localAppData = envValue("LOCALAPPDATA");
  const userProfile = envValue("USERPROFILE");
  return [
    envValue("ANDROID_HOME"),
    envValue("ANDROID_SDK_ROOT"),
    localAppData ? path.join(localAppData, "Android", "Sdk") : "",
    userProfile ? path.join(userProfile, "AppData", "Local", "Android", "Sdk") : ""
  ].filter(Boolean);
}

function firstExisting(candidates) {
  return candidates.find((candidate) => safeExists(candidate, { allowWindowsShell: true })) || "";
}

function findAdb() {
  return findOnPath("adb") || firstExisting(androidSdkRoots().map((sdk) => path.join(sdk, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb")));
}

function findEmulator() {
  return findOnPath("emulator") || firstExisting(androidSdkRoots().map((sdk) => path.join(sdk, "emulator", process.platform === "win32" ? "emulator.exe" : "emulator")));
}

function findBundletoolCandidates() {
  const candidates = [];
  const pathBundletool = findOnPath("bundletool");
  if (pathBundletool) {
    candidates.push({ kind: "executable", runnable: true });
  }
  const pathBundletoolJar = findOnPath("bundletool.jar");
  if (pathBundletoolJar) {
    candidates.push({ kind: "standalone-jar", runnable: true });
  }

  const localToolDirs = [
    path.join(root, "reports", "tools"),
    path.join(root, "tools")
  ];
  for (const dir of localToolDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && /^bundletool-all-.*\.jar$/i.test(entry.name)) {
        candidates.push({ kind: "local-standalone-jar", runnable: true });
      }
    }
  }

  for (const sdk of androidSdkRoots()) {
    const directDirs = [
      sdk,
      path.join(sdk, "tools"),
      path.join(sdk, "cmdline-tools"),
      path.join(sdk, "cmdline-tools", "latest"),
      path.join(sdk, "cmdline-tools", "latest", "bin")
    ];
    for (const dir of directDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile() && /^bundletool.*\.jar$/i.test(entry.name)) {
          candidates.push({ kind: "standalone-jar-candidate", runnable: true });
        }
      }
    }
  }

  const userProfile = envValue("USERPROFILE");
  const gradleBundletoolDir = userProfile
    ? path.join(userProfile, ".gradle", "caches", "modules-2", "files-2.1", "com.android.tools.build", "bundletool")
    : "";
  if (gradleBundletoolDir && fs.existsSync(gradleBundletoolDir)) {
    const stack = [gradleBundletoolDir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (/^bundletool.*\.jar$/i.test(entry.name)) {
          candidates.push({ kind: "gradle-library-jar", runnable: false });
        }
      }
    }
  }

  return candidates;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function signedEvidenceSummary() {
  if (!fs.existsSync(signedAabEvidencePath)) {
    return {
      status: "missing",
      evidencePath: "reports/signed-aab-evidence.json",
      failures: ["Missing signed AAB evidence. Run npm run mobile:signed-aab:evidence -- --require-signed."]
    };
  }

  try {
    const evidence = readJson(signedAabEvidencePath);
    const failures = [];
    if (evidence.status !== "pass") {
      failures.push("Signed AAB evidence status is not pass.");
    }
    if (evidence.verification?.status !== "pass") {
      failures.push("Signed AAB jarsigner verification did not pass.");
    }
    if (!fs.existsSync(signedAabPath)) {
      failures.push("Signed AAB file is missing.");
    } else {
      const actualHash = sha256(signedAabPath);
      const actualSize = fs.statSync(signedAabPath).size;
      if (String(evidence.signedAabSha256 || "").toLowerCase() !== actualHash.toLowerCase()) {
        failures.push("Signed AAB hash does not match reports/signed-aab-evidence.json.");
      }
      if (Number(evidence.signedAabSizeBytes || 0) !== actualSize) {
        failures.push("Signed AAB size does not match reports/signed-aab-evidence.json.");
      }
    }

    return {
      status: failures.length === 0 ? "pass" : "fail",
      evidencePath: "reports/signed-aab-evidence.json",
      signedAabPath: "apps/mobile/android/app/build/outputs/bundle/release/app-release-signed.aab",
      signedAabSha256: evidence.signedAabSha256 || null,
      signedAabSizeBytes: evidence.signedAabSizeBytes || null,
      jarsignerVerification: evidence.verification?.status || "unknown",
      failures
    };
  } catch (error) {
    return {
      status: "invalid",
      evidencePath: "reports/signed-aab-evidence.json",
      failures: [error instanceof Error ? error.message : "Could not parse signed AAB evidence."]
    };
  }
}

function emulatorQaSummary() {
  if (!fs.existsSync(emulatorQaReportPath)) {
    return {
      status: "missing",
      reportPath: "reports/emulator-qa-report.json"
    };
  }
  try {
    const report = readJson(emulatorQaReportPath);
    return {
      status: report.status || "unknown",
      reportPath: "reports/emulator-qa-report.json",
      screenshotCount: Array.isArray(report.screenshots) ? report.screenshots.length : undefined
    };
  } catch {
    return {
      status: "invalid",
      reportPath: "reports/emulator-qa-report.json"
    };
  }
}

function main() {
  const adbPath = findAdb();
  const emulatorPath = findEmulator();
  const bundletoolCandidates = findBundletoolCandidates();
  const runnableBundletoolCandidates = bundletoolCandidates.filter((candidate) => candidate.runnable);
  const signedEvidence = signedEvidenceSummary();
  const missingTools = [
    ...(adbPath ? [] : ["adb"]),
    ...(emulatorPath ? [] : ["emulator"]),
    ...(runnableBundletoolCandidates.length > 0 ? [] : ["bundletool"])
  ];

  const signedCandidateReady = signedEvidence.status === "pass";
  const localInstallReady = signedCandidateReady && missingTools.length === 0;
  const readiness = !signedCandidateReady
    ? "needs-signed-aab-evidence"
    : localInstallReady
      ? "ready-for-signed-emulator-install"
      : "needs-android-install-tooling";

  const report = {
    generatedAt: new Date().toISOString(),
    status: "pass",
    signedRuntimeQaReadiness: readiness,
    secretSafe: true,
    publicSafe: true,
    privateMaterialIncluded: false,
    signedCandidateReady,
    localInstallReady,
    missingTools,
    tools: {
      adb: {
        available: Boolean(adbPath),
        source: adbPath ? "available" : "missing"
      },
      emulator: {
        available: Boolean(emulatorPath),
        source: emulatorPath ? "available" : "missing"
      },
      bundletool: {
        available: runnableBundletoolCandidates.length > 0,
        candidateCount: bundletoolCandidates.length,
        runnableCandidateCount: runnableBundletoolCandidates.length,
        source: runnableBundletoolCandidates.length > 0
          ? "available"
          : bundletoolCandidates.length > 0
            ? "library-jars-only"
            : "missing"
      }
    },
    signedAabEvidence: signedEvidence,
    existingEmulatorQaEvidence: emulatorQaSummary(),
    nextCommands: [
      "npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate",
      "npm run mobile:signed-aab:evidence -- --require-signed",
      "npm run validate:android -- --require-signed",
      "npm run generate:runtime-qa-report",
      "npm run validate:runtime-qa-report",
      "npm run validate:runtime-qa-report -- --require-complete"
    ],
    ownerNotes: [
      "Use Play internal testing, Android Studio, or bundletool to install the signed candidate.",
      "If adb or emulator is missing, install Android Studio SDK Platform Tools and Android Emulator, then reopen the terminal so PATH refreshes.",
      "Keep signed AAB files, keystore paths, passwords, tester identity, account screenshots, and Play Console credentials out of public GitHub.",
      "Complete reports/runtime-qa-report.md only after testing the signed candidate."
    ],
    failures: signedEvidence.failures || []
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Signed runtime QA preflight written to ${reportPath}`);
  console.log(`Readiness: ${readiness}`);
  if (missingTools.length > 0) {
    console.log(`Missing local install tooling: ${missingTools.join(", ")}`);
  }
}

main();

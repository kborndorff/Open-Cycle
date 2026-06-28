const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportPath = path.join(root, "reports", "play-store-preflight.json");

const paths = {
  unsignedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  signedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab"),
  signedAabEvidence: path.join(root, "reports", "signed-aab-evidence.json"),
  manifest: path.join(root, "apps", "mobile", "android", "app", "src", "main", "AndroidManifest.xml"),
  sitePrivacy: path.join(root, "site", "dist", "privacy.html"),
  playMetadata: path.join(root, "store-assets", "play", "listing.json"),
  playReleaseNotes: path.join(root, "store-assets", "play", "release-notes.txt"),
  runtimeQa: path.join(root, "docs", "runtime-qa.md")
};

const playAssets = [
  ["appIcon", path.join(root, "store-assets", "play", "app-icon.png"), 512, 512],
  ["featureGraphic", path.join(root, "store-assets", "play", "feature-graphic.png"), 1024, 500],
  ["phoneScreenshot1", path.join(root, "store-assets", "play", "phone-screenshot-1.png"), 1080, 1920],
  ["phoneScreenshot2", path.join(root, "store-assets", "play", "phone-screenshot-2.png"), 1080, 1920],
  ["phoneScreenshot3", path.join(root, "store-assets", "play", "phone-screenshot-3.png"), 1080, 1920],
  ["phoneScreenshot4", path.join(root, "store-assets", "play", "phone-screenshot-4.png"), 1080, 1920]
];

function exists(file) {
  return fs.existsSync(file);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileInfo(file) {
  if (!exists(file)) {
    return { exists: false };
  }
  const stat = fs.statSync(file);
  return {
    exists: true,
    bytes: stat.size,
    sha256: sha256(file)
  };
}

function pngDimensions(file) {
  if (!exists(file)) {
    return null;
  }
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function resolveJavaTool(name) {
  const tool = process.platform === "win32" ? `${name}.exe` : name;
  if (process.env.JAVA_HOME) {
    const javaTool = path.join(process.env.JAVA_HOME, "bin", tool);
    if (exists(javaTool)) {
      return javaTool;
    }
  }
  if (process.platform === "win32") {
    for (const rootPath of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        const javaTool = path.join(rootPath, "Android", androidStudioDir, "jbr", "bin", tool);
        if (exists(javaTool)) {
          return javaTool;
        }
      }
    }
  }
  return name;
}

function verifySignedAab(file) {
  if (!exists(file)) {
    return { status: "pending", reason: "Signed AAB has not been created yet." };
  }
  if (!exists(paths.signedAabEvidence)) {
    return { status: "pending", reason: "Signed AAB evidence has not been generated for the current bundle." };
  }

  const evidence = JSON.parse(fs.readFileSync(paths.signedAabEvidence, "utf8"));
  if (
    evidence.status !== "pass" ||
    !Array.isArray(evidence.failures) ||
    evidence.failures.length !== 0
  ) {
    return {
      status: "pending",
      reason: "Signed AAB evidence is not pass; re-sign the current AAB and regenerate signed evidence."
    };
  }

  const jarsigner = resolveJavaTool("jarsigner");
  const result = spawnSync(jarsigner, ["-verify", "-certs", file], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.error || result.status !== 0 || output.includes("jar is unsigned") || !output.includes("jar verified")) {
    return {
      status: "pending",
      reason: "Signed AAB exists but could not be verified with jarsigner; regenerate the signed AAB with the private upload keystore."
    };
  }
  return { status: "pass" };
}

function verifyPlayMetadata(file) {
  if (!exists(file)) {
    return {
      status: "fail",
      detail: "Missing store-assets/play/listing.json. Run npm run generate:play-metadata."
    };
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(file, "utf8"));
    const dataSafety = metadata.dataSafety || {};
    const requiredReleaseChecks = [
      "npm run validate:release",
      "npm run validate:android -- --require-aab",
      "npm run validate:android -- --require-signed"
    ];
    const referencedAssets = [
      metadata.assets?.appIcon,
      metadata.assets?.featureGraphic,
      ...(metadata.assets?.phoneScreenshots || []),
      ...(metadata.assets?.editableSources || [])
    ].filter(Boolean);

    const valid =
      metadata.appName === "open-cycle" &&
      metadata.packageName === "com.opencycle.app" &&
      metadata.price === "Free" &&
      metadata.containsAds === false &&
      metadata.inAppPurchases === false &&
      metadata.accountRequired === false &&
      metadata.internetRequiredForCoreTracking === false &&
      /^https:\/\/.+\/privacy(?:\.html)?$/.test(metadata.privacyPolicyUrl || "") &&
      dataSafety.dataCollected === "None" &&
      dataSafety.dataSharedWithThirdParties === false &&
      dataSafety.locationDataCollected === false &&
      dataSafety.advertisingIdUsed === false &&
      metadata.assets?.appIcon === "store-assets/play/app-icon.png" &&
      Array.isArray(metadata.assets?.phoneScreenshots) &&
      metadata.assets.phoneScreenshots.length >= 4 &&
      requiredReleaseChecks.every((command) => metadata.releaseChecks?.includes(command)) &&
      referencedAssets.every((asset) => exists(path.join(root, asset)));

    return valid
      ? { status: "pass", detail: "Play Store listing and data-safety metadata are present and consistent." }
      : { status: "fail", detail: "Play Store metadata is missing required local-only claims, release checks, or assets." };
  } catch (error) {
    return {
      status: "fail",
      detail: `Play Store metadata could not be parsed: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}

function verifyPlayReleaseNotes(file) {
  if (!exists(file)) {
    return {
      status: "fail",
      detail: "Missing store-assets/play/release-notes.txt. Run npm run generate:play-release-notes."
    };
  }

  const notes = fs.readFileSync(file, "utf8").trim();
  const valid =
    notes.length > 0 &&
    notes.length <= 500 &&
    notes.includes("Free local cycle logging") &&
    notes.includes("no account") &&
    notes.includes("hidden tracking") &&
    notes.includes("Cycle data stays");

  return valid
    ? { status: "pass", detail: "Play release notes are present and local-only." }
    : { status: "fail", detail: "Play release notes are missing required local-only wording or exceed 500 characters." };
}

function check(condition, passDetail, failDetail) {
  return condition ? { status: "pass", detail: passDetail } : { status: "fail", detail: failDetail };
}

function main() {
  const manifest = exists(paths.manifest) ? fs.readFileSync(paths.manifest, "utf8") : "";
  const privacy = exists(paths.sitePrivacy) ? fs.readFileSync(paths.sitePrivacy, "utf8") : "";
  const runtimeQa = exists(paths.runtimeQa) ? fs.readFileSync(paths.runtimeQa, "utf8") : "";

  const assets = Object.fromEntries(playAssets.map(([name, file, width, height]) => {
    const dimensions = pngDimensions(file);
    return [
      name,
      {
        ...fileInfo(file),
        dimensions,
        expected: { width, height },
        status: dimensions?.width === width && dimensions?.height === height ? "pass" : "fail"
      }
    ];
  }));

  const checks = {
    unsignedAab: check(exists(paths.unsignedAab), "Unsigned AAB exists.", "Run npm run mobile:build:aab."),
    signedAab: verifySignedAab(paths.signedAab),
    manifestNoInternet: check(!manifest.includes("android.permission.INTERNET"), "No Android internet permission.", "Remove android.permission.INTERNET for public local-only build."),
    manifestNoBackup: check(
      manifest.includes('android:allowBackup="false"') && manifest.includes('android:fullBackupContent="false"'),
      "Android backup is disabled.",
      "Disable Android backup in AndroidManifest.xml."
    ),
    privacyPolicy: check(
      privacy.includes("does not collect, sell, share, transmit, or monetize personal data"),
      "Privacy policy is present in site/dist.",
      "Build site and ensure privacy.html is copied to site/dist."
    ),
    runtimeQaChecklist: check(
      runtimeQa.includes("Launch app with airplane mode enabled") && runtimeQa.includes("Confirm the cycle entry remains visible"),
      "Runtime QA checklist exists.",
      "Update docs/runtime-qa.md with signed-candidate QA steps."
    ),
    playAssets: check(
      Object.values(assets).every((asset) => asset.status === "pass"),
      "Play Store PNG assets exist with expected dimensions.",
      "Run npm run generate:play-assets && npm run export:play-assets && npm run validate:play-assets."
    ),
    playMetadata: verifyPlayMetadata(paths.playMetadata),
    playReleaseNotes: verifyPlayReleaseNotes(paths.playReleaseNotes)
  };

  const blockingFailures = Object.entries(checks)
    .filter(([name, result]) => result.status === "fail" && name !== "signedAab")
    .map(([name]) => name);
  const pending = Object.entries(checks)
    .filter(([, result]) => result.status === "pending")
    .map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    status: blockingFailures.length > 0
      ? "needs-work"
      : pending.length === 0
        ? "ready-for-play-upload"
        : "ready-for-private-signing",
    blockingFailures,
    pendingPrivateSteps: pending,
    artifacts: {
      unsignedAab: fileInfo(paths.unsignedAab),
      signedAab: fileInfo(paths.signedAab),
      playMetadata: fileInfo(paths.playMetadata),
      playReleaseNotes: fileInfo(paths.playReleaseNotes),
      playAssets: assets
    },
    checks
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Play Store preflight report written to ${reportPath}`);
  console.log(`Status: ${report.status}`);
  if (pending.length > 0) {
    console.log(`Pending private steps: ${pending.join(", ")}`);
  }
  if (blockingFailures.length > 0) {
    console.error(`Blocking failures: ${blockingFailures.join(", ")}`);
    process.exit(1);
  }
}

main();

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "signing-readiness.json");

const files = {
  unsignedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  signedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab"),
  promptedRelease: path.join(root, "scripts", "run-android-private-release.ps1"),
  keystoreCreator: path.join(root, "scripts", "create-android-upload-keystore.ps1"),
  localRelease: path.join(root, "scripts", "android-local-release.js"),
  signAab: path.join(root, "scripts", "sign-aab.js"),
  runtimeQaTemplate: path.join(root, "reports", "runtime-qa-report.md"),
  playUploadTemplate: path.join(root, "reports", "play-console-upload-confirmation.json")
};

function javaHomeCandidates() {
  const candidates = [process.env.JAVA_HOME].filter(Boolean);
  if (process.platform === "win32") {
    for (const rootPath of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        candidates.push(path.join(rootPath, "Android", androidStudioDir, "jbr"));
      }
    }
  }
  return candidates;
}

function resolveJavaTool(name) {
  const executable = process.platform === "win32" ? `${name}.exe` : name;
  for (const javaHome of javaHomeCandidates()) {
    const candidate = path.join(javaHome, "bin", executable);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return executable;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileInfo(file) {
  if (!fs.existsSync(file)) {
    return { exists: false };
  }
  const stat = fs.statSync(file);
  return {
    exists: true,
    bytes: stat.size,
    sha256: sha256(file)
  };
}

function commandPresent(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 15000
  });
  return {
    status: result.error || result.status !== 0 ? "fail" : "pass",
    detail: result.error ? result.error.message : "Tool responded without requiring secrets."
  };
}

function checkExists(file, passDetail, failDetail) {
  return fs.existsSync(file)
    ? { status: "pass", detail: passDetail }
    : { status: "fail", detail: failDetail };
}

const checks = {
  unsignedAab: checkExists(files.unsignedAab, "Unsigned AAB exists and can be signed privately.", "Build the unsigned AAB before signing."),
  jarsigner: commandPresent(resolveJavaTool("jarsigner"), ["-help"]),
  keytool: commandPresent(resolveJavaTool("keytool"), ["-help"]),
  promptedReleaseWrapper: checkExists(files.promptedRelease, "Prompted signing wrapper exists.", "Missing prompted signing wrapper."),
  keystoreCreator: checkExists(files.keystoreCreator, "Upload keystore creation helper exists.", "Missing upload keystore creation helper."),
  localReleaseScript: checkExists(files.localRelease, "Local private release orchestrator exists.", "Missing local private release orchestrator."),
  signAabScript: checkExists(files.signAab, "AAB signing helper exists.", "Missing AAB signing helper."),
  runtimeQaTemplate: checkExists(files.runtimeQaTemplate, "Runtime QA report template exists.", "Run npm run generate:runtime-qa-report."),
  playUploadTemplate: checkExists(files.playUploadTemplate, "Play upload confirmation template exists.", "Run npm run generate:play-upload-confirmation.")
};

const failedChecks = Object.entries(checks)
  .filter(([, result]) => result.status !== "pass")
  .map(([name]) => name);

const report = {
  generatedAt: new Date().toISOString(),
  status: failedChecks.length === 0 ? "ready-for-private-keystore" : "needs-signing-prep",
  secretSafe: true,
  note: "This report checks non-secret signing prerequisites only. It does not read, print, or store keystore passwords, key passwords, Cloudflare tokens, or Play Console credentials.",
  failedChecks,
  checks,
  artifacts: {
    unsignedAab: fileInfo(files.unsignedAab),
    signedAab: fileInfo(files.signedAab),
    runtimeQaTemplate: fileInfo(files.runtimeQaTemplate),
    playUploadTemplate: fileInfo(files.playUploadTemplate)
  },
  privateRemaining: [
    "Provide the private upload keystore path through npm run mobile:release:android:prompted.",
    "Enter keystore and key passwords only at local prompts.",
    "Complete signed runtime QA after signing.",
    "Upload the signed AAB in Play Console."
  ]
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Signing readiness report written to ${reportPath}`);
console.log(`Status: ${report.status}`);
if (failedChecks.length > 0) {
  console.error(`Failed checks: ${failedChecks.join(", ")}`);
  process.exit(1);
}

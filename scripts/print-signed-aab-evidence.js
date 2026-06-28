const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "signed-aab-evidence.json");
const args = new Set(process.argv.slice(2));
const requireSigned = args.has("--require-signed");

const defaultSignedAabPath = path.join(
  root,
  "apps",
  "mobile",
  "android",
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
  "app-release-signed.aab"
);
const unsignedAabPath = path.join(
  root,
  "apps",
  "mobile",
  "android",
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
  "app-release.aab"
);

const signedAabArg = process.argv.find((arg) => arg.startsWith("--signed-aab="));
const signedAabPath = signedAabArg
  ? path.resolve(signedAabArg.split("=").slice(1).join("="))
  : defaultSignedAabPath;

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function resolveJavaTool(name) {
  const tool = process.platform === "win32" ? `${name}.exe` : name;
  if (process.env.JAVA_HOME) {
    const candidate = path.join(process.env.JAVA_HOME, "bin", tool);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  if (process.platform === "win32") {
    for (const rootPath of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        const candidate = path.join(rootPath, "Android", androidStudioDir, "jbr", "bin", tool);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }
  return name;
}

function verifySignedAab(file) {
  const jarsigner = resolveJavaTool("jarsigner");
  const result = spawnSync(jarsigner, ["-verify", "-certs", file], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const pass = !result.error && result.status === 0 && !output.includes("jar is unsigned") && output.includes("jar verified");
  return {
    status: pass ? "pass" : "fail",
    tool: path.basename(jarsigner),
    reason: pass ? "Signed AAB passed jarsigner verification." : "Signed AAB could not be verified with jarsigner."
  };
}

function unsignedAabEvidence() {
  if (!fs.existsSync(unsignedAabPath)) {
    return null;
  }
  const unsignedStat = fs.statSync(unsignedAabPath);
  return {
    path: unsignedAabPath,
    sha256: sha256(unsignedAabPath),
    sizeBytes: unsignedStat.size,
    modifiedAt: unsignedStat.mtime.toISOString()
  };
}

function main() {
  console.log("Signed AAB evidence");
  console.log("This helper reads only the signed AAB file. It does not read keystores, passwords, or Play credentials.");

  if (!fs.existsSync(signedAabPath)) {
    const report = {
      generatedAt: new Date().toISOString(),
      status: "pending-signed-aab",
      signedAabPath,
      exists: false,
      unsignedAab: unsignedAabEvidence(),
      secretSafe: true,
      failures: [`Signed AAB not found: ${signedAabPath}`]
    };
    writeReport(report);
    console.log(`Signed AAB not found: ${signedAabPath}`);
    console.log(`Evidence report written to ${reportPath}`);
    if (requireSigned) {
      process.exit(1);
    }
    return;
  }

  const stat = fs.statSync(signedAabPath);
  const verification = verifySignedAab(signedAabPath);
  const unsignedStat = fs.existsSync(unsignedAabPath) ? fs.statSync(unsignedAabPath) : null;
  const unsignedAab = unsignedAabEvidence();
  const freshness = unsignedStat && stat.mtimeMs < unsignedStat.mtimeMs
    ? {
        status: "fail",
        reason: "Signed AAB is older than the unsigned AAB. Re-sign the current app-release.aab."
      }
    : {
        status: "pass",
        reason: "Signed AAB is current relative to the unsigned AAB, or no unsigned AAB is present for comparison."
      };
  const failures = [
    ...(verification.status === "pass" ? [] : [verification.reason]),
    ...(freshness.status === "pass" ? [] : [freshness.reason])
  ];
  const evidence = {
    generatedAt: new Date().toISOString(),
    status: verification.status === "pass" && freshness.status === "pass" ? "pass" : "pending-signed-aab",
    signedAabPath,
    exists: true,
    signedAabSha256: sha256(signedAabPath),
    signedAabSizeBytes: stat.size,
    unsignedAab,
    verification,
    freshness,
    secretSafe: true,
    failures
  };
  writeReport(evidence);

  console.log(`Signed AAB: ${signedAabPath}`);
  console.log(`SHA-256: ${evidence.signedAabSha256}`);
  console.log(`Size bytes: ${evidence.signedAabSizeBytes}`);
  console.log(`Verification: ${verification.status}`);
  console.log(`Freshness: ${freshness.status}`);
  console.log(`Evidence report written to ${reportPath}`);

  if (requireSigned && evidence.status !== "pass") {
    process.exit(1);
  }
}

main();

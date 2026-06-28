const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "unsigned-aab-evidence.json");
const args = new Set(process.argv.slice(2));
const requireAab = args.has("--require-aab");

const defaultUnsignedAabPath = path.join(
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

const unsignedAabArg = process.argv.find((arg) => arg.startsWith("--unsigned-aab="));
const unsignedAabPath = unsignedAabArg
  ? path.resolve(unsignedAabArg.split("=").slice(1).join("="))
  : defaultUnsignedAabPath;

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function main() {
  console.log("Unsigned AAB evidence");
  console.log("This helper reads only the unsigned AAB file. It does not read signing keys, passwords, tokens, or Play credentials.");

  if (!fs.existsSync(unsignedAabPath)) {
    const report = {
      generatedAt: new Date().toISOString(),
      status: "pending-unsigned-aab",
      unsignedAabPath,
      exists: false,
      secretSafe: true,
      failures: [`Unsigned AAB not found: ${unsignedAabPath}`]
    };
    writeReport(report);
    console.log(`Unsigned AAB not found: ${unsignedAabPath}`);
    console.log(`Evidence report written to ${reportPath}`);
    if (requireAab) {
      process.exit(1);
    }
    return;
  }

  const stat = fs.statSync(unsignedAabPath);
  const evidence = {
    generatedAt: new Date().toISOString(),
    status: "pass",
    unsignedAabPath,
    exists: true,
    unsignedAabSha256: sha256(unsignedAabPath),
    unsignedAabSizeBytes: stat.size,
    secretSafe: true,
    failures: []
  };
  writeReport(evidence);

  console.log(`Unsigned AAB: ${unsignedAabPath}`);
  console.log(`SHA-256: ${evidence.unsignedAabSha256}`);
  console.log(`Size bytes: ${evidence.unsignedAabSizeBytes}`);
  console.log(`Evidence report written to ${reportPath}`);
}

main();

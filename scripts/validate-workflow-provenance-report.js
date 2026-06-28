const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "workflow-provenance.json");

const expectedFiles = [
  ".github/workflows/ci.yml",
  ".github/workflows/android-aab.yml",
  ".github/workflows/deploy-site.yml",
  ".github/workflows/deploy-redirect-worker.yml"
];

const expectedCommands = [
  "npm run generate:workflow-provenance",
  "npm run validate:workflow-provenance",
  "npm run validate:workflows"
];

const secretLikePatterns = [
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[A-Za-z0-9+/]{80,}={0,2}\b/
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/workflow-provenance.json. Run npm run generate:workflow-provenance.");
} else {
  const raw = fs.readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw);

  for (const pattern of secretLikePatterns) {
    if (pattern.test(raw)) {
      fail(`Workflow provenance report contains secret-like material matching ${pattern}.`);
    }
  }

  if (report.status !== "pass") {
    fail("Workflow provenance report status must be pass.");
  }
  if (report.secretSafe !== true) {
    fail("Workflow provenance report must mark secretSafe true.");
  }
  if (report.signedArtifactsPublished !== false) {
    fail("Workflow provenance report must prove signedArtifactsPublished is false.");
  }
  if (report.playUploadAutomation !== false) {
    fail("Workflow provenance report must prove Play upload automation is false.");
  }
  if (report.siteDeploySource !== "site/dist") {
    fail("Workflow provenance report must prove the Pages deploy source is site/dist.");
  }

  for (const command of expectedCommands) {
    if (!report.validationCommands?.includes(command)) {
      fail(`Workflow provenance report is missing validation command: ${command}`);
    }
  }

  for (const file of expectedFiles) {
    const workflow = report.workflows?.find((entry) => entry.file === file);
    if (!workflow) {
      fail(`Workflow provenance report is missing workflow: ${file}`);
      continue;
    }
    if (workflow.status !== "pass") {
      fail(`Workflow provenance report did not pass workflow: ${file}`);
    }
    if (workflow.permissions?.contentsReadOnly !== true) {
      fail(`${file} must have read-only contents permission.`);
    }
    if (workflow.checkoutPresent !== true) {
      fail(`${file} must use actions/checkout@v4.`);
    }
    if (!workflow.requiredChecks?.every((check) => check.present === true)) {
      fail(`${file} is missing at least one required workflow check.`);
    }
    if (!workflow.forbiddenChecks?.every((check) => check.absent === true)) {
      fail(`${file} contains a forbidden workflow signal.`);
    }
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["generate:workflow-provenance"]) {
  fail("Missing generate:workflow-provenance script.");
}
if (!packageJson.scripts?.["validate:workflow-provenance"]) {
  fail("Missing validate:workflow-provenance script.");
}
if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:workflow-provenance")) {
  fail("release:handoff must include validate:workflow-provenance.");
}
if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:workflow-provenance")) {
  fail("validate:release must include validate:workflow-provenance.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Workflow provenance checks passed.");

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const matrixPath = path.join(reportsDir, "release-completion-matrix.json");
const matrixMdPath = path.join(reportsDir, "release-completion-matrix.md");

const requiredAreas = ["Mobile app", "Website", "Public GitHub", "Security and privacy", "Play Store"];
const forbiddenSecretTerms = [
  "BEGIN PRIVATE KEY",
  "BEGIN RSA PRIVATE KEY",
  "BEGIN ENCRYPTED PRIVATE KEY",
  "private_key",
  "storePassword",
  "keyPassword",
  "CF_API_TOKEN=",
  "GOOGLE_APPLICATION_CREDENTIALS",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(auditPath)) {
    fail(`Missing audit report: ${auditPath}`);
    return;
  }
  if (!fs.existsSync(matrixPath)) {
    fail(`Missing release completion matrix JSON: ${matrixPath}`);
    return;
  }
  if (!fs.existsSync(matrixMdPath)) {
    fail(`Missing release completion matrix Markdown: ${matrixMdPath}`);
    return;
  }

  const audit = readJson(auditPath);
  const matrix = readJson(matrixPath);
  const md = fs.readFileSync(matrixMdPath, "utf8");

  if (matrix.auditStatus !== audit.status) {
    fail(`Matrix audit status ${matrix.auditStatus} does not match audit status ${audit.status}.`);
  }

  for (const area of requiredAreas) {
    if (!matrix.rows.some((row) => row.area === area)) {
      fail(`Matrix is missing required area: ${area}`);
    }
    if (!md.includes(area)) {
      fail(`Markdown matrix is missing required area: ${area}`);
    }
  }

  const expectedPendingGates = Array.isArray(audit.pendingChecks)
    ? audit.pendingChecks.filter((gate) => gate !== "releaseBlockerReport")
    : [];

  for (const gate of expectedPendingGates) {
    if (!matrix.pendingOwnerOnlyGates.includes(gate)) {
      fail(`Matrix is missing pending owner gate: ${gate}`);
    }
    if (!md.includes(gate)) {
      fail(`Markdown matrix is missing pending owner gate: ${gate}`);
    }
  }

  const allEvidenceIds = new Set(
    matrix.rows.flatMap((row) => row.evidenceChecks.map((check) => check.id)),
  );
  for (const id of ["localOnlyRuntime", "publicPushReadiness", "publicRepositoryPublicationManifest", "liveSitePublication", "cloudflarePagesDeployment", "visualTestReport", "visualEvidenceManifest", "signedAab", "signedRuntimeQa", "playConsoleUpload"]) {
    if (!allEvidenceIds.has(id)) {
      fail(`Matrix evidence does not include required audit check: ${id}`);
    }
  }

  const matrixText = `${JSON.stringify(matrix)}\n${md}`;
  for (const term of forbiddenSecretTerms) {
    if (matrixText.includes(term)) {
      fail(`Matrix appears to include forbidden secret marker: ${term}`);
    }
  }

  if (!process.exitCode) {
    console.log("Release completion matrix checks passed.");
  }
}

main();

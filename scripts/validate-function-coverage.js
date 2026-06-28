const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "function-coverage.json");
const checks = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function requireIncludes(area, file, expectedValues) {
  const contents = read(file);
  for (const expected of expectedValues) {
    const pass = contents.includes(expected);
    checks.push({
      area,
      evidenceFile: file,
      expected,
      status: pass ? "pass" : "fail"
    });
    if (!contents.includes(expected)) {
      fail(`${file} is missing required validation evidence: ${expected}`);
    }
  }
}

requireIncludes("Core local tracking", "apps/web/test/api.local.test.ts", [
  "local storage mode creates, lists, updates, and deletes cycle entries without network",
  "local storage mode clears all cycle entries without network",
  "Local storage mode must not call fetch.",
  "local storage mode sorts cycle entries newest first and recovers from corrupt local data",
  "local storage mode validates updates and missing records",
  "local storage mode rejects invalid cycle entry payloads",
  "apiGet",
  "apiPost",
  "apiPatch",
  "apiDelete"
]);

requireIncludes("Standalone local API workspace", "apps/api/test/api.test.ts", [
  "health endpoints stay public and report service status",
  "cycle CRUD persists local records and returns expected statuses",
  "cycle clear-all removes local records and reports deleted count",
  "API storage ignores malformed local cycle records and normalizes valid entries",
  "cycle validation rejects invalid payloads and ids",
  "API key guard protects API routes when configured"
]);

requireIncludes("Validation matrix", "docs/validation-matrix.md", [
  "Create cycle entry locally",
  "List cycle entries locally",
  "Sort cycle entries newest first",
  "Update cycle entry locally",
  "Delete cycle entry locally",
  "Clear all local cycle entries",
  "Reject invalid local create payloads",
  "Reject invalid local update payloads",
  "Avoid network in local mode",
  "Ignore malformed standalone local API storage records",
  "Clear all standalone local API cycle records",
  "Local Wrangler deploy uses site/dist",
  "Signed Play upload bundle"
]);

const failedChecks = checks.filter((check) => check.status === "fail");
const report = {
  generatedAt: new Date().toISOString(),
  status: failedChecks.length === 0 ? "pass" : "fail",
  secretSafe: true,
  note: "This report contains public-safe function coverage evidence only.",
  totalChecks: checks.length,
  failedChecks: failedChecks.map((check) => ({
    area: check.area,
    evidenceFile: check.evidenceFile,
    expected: check.expected
  })),
  checks
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Function validation coverage checks passed.");
console.log(`Function coverage report written to ${reportPath}`);

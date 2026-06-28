const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "git-publication-preflight.json");
const generatorPath = path.join(root, "scripts", "generate-git-publication-preflight.js");
const packageJsonPath = path.join(root, "package.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(generatorPath)) {
  fail("Missing scripts/generate-git-publication-preflight.js.");
} else {
  const generator = fs.readFileSync(generatorPath, "utf8");
  for (const expected of [
    "Git publication preflight",
    "does not push code, read tokens, or contact GitHub",
    "git-publication-preflight.json",
    "https://github.com/kborndorff/Open-Cycle.git",
    "validate:github:live",
    "validate:github:actions",
    "secretSafe",
    "networkUsed",
    "pushed"
  ]) {
    if (!generator.includes(expected)) {
      fail(`Git publication preflight generator is missing expected text: ${expected}`);
    }
  }
}

if (!fs.existsSync(packageJsonPath)) {
  fail("Missing package.json.");
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const script of ["generate:git-publication-preflight", "validate:git-publication-preflight"]) {
    if (!packageJson.scripts?.[script]) {
      fail(`Missing package script: ${script}`);
    }
  }
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/git-publication-preflight.json. Run npm run generate:git-publication-preflight.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (!["ready-for-owner-push", "needs-owner-git-setup"].includes(report.status)) {
    fail("Git publication preflight report has an unexpected status.");
  }
  if (report.repository !== "https://github.com/kborndorff/Open-Cycle") {
    fail("Git publication preflight report must target the public OpenCycle repository.");
  }
  if (report.secretSafe !== true || report.networkUsed !== false || report.pushed !== false) {
    fail("Git publication preflight report must remain secret-safe, offline, and non-pushing.");
  }
  if (!Array.isArray(report.checks) || report.checks.length < 8) {
    fail("Git publication preflight report must include the expected check list.");
  }
  if (!Array.isArray(report.safeNextSteps) || !report.safeNextSteps.some((step) => step.includes("owner approval"))) {
    fail("Git publication preflight report must include owner-approval publication guidance.");
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Git publication preflight checks passed.");

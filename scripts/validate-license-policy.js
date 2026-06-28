const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "license-policy.json");
const failures = [];

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function includesNormalized(contents, expected) {
  return contents.replace(/\s+/g, " ").includes(expected.replace(/\s+/g, " "));
}

function requireFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing ${relativePath}.`);
    return "";
  }
  return read(relativePath);
}

const license = requireFile("LICENSE.md");
const readme = requireFile("README.md");
const packageJsonText = requireFile("package.json");

if (license) {
  for (const expected of [
    "This is a source-available license, not an open-source license.",
    "public so people can inspect, audit, learn from, and verify",
    "Public visibility does not grant permission to profit from this work",
    "commercial reuse, resale, white-labeling, or competing product distribution",
    "Publish, submit, distribute, or make available builds of this software through",
    "Google Play, the Apple App Store, F-Droid, Microsoft Store",
    "hosted service, mobile app, paid app, subscription product, or competing product",
    "Security researchers, privacy reviewers, journalists, educators, and users are welcome",
    "For commercial licensing, redistribution, app store distribution, hosted use"
  ]) {
    if (!includesNormalized(license, expected)) {
      fail(`LICENSE.md is missing expected source-available term: ${expected}`);
    }
  }
}

if (readme) {
  for (const expected of [
    "source-available, not open source",
    "public for scrutiny",
    "personal non-commercial local use",
    "app store redistribution by others",
    "commercial reuse",
    "See [LICENSE.md](LICENSE.md) for the full terms."
  ]) {
    if (!includesNormalized(readme, expected)) {
      fail(`README.md is missing expected license notice: ${expected}`);
    }
  }
}

if (packageJsonText) {
  try {
    const packageJson = JSON.parse(packageJsonText);
    if (packageJson.license !== "LicenseRef-OpenCycle-Source-Available") {
      fail("package.json must use LicenseRef-OpenCycle-Source-Available.");
    }
    if (!packageJson.scripts?.["validate:license"]) {
      fail("package.json must expose a validate:license script.");
    }
  } catch (error) {
    fail(`package.json could not be parsed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length > 0 ? "fail" : "pass",
  licenseFile: "LICENSE.md",
  packageLicense: "LicenseRef-OpenCycle-Source-Available",
  publicPurpose: "source-available for scrutiny, audit, security review, and personal non-commercial local use",
  commercialRestriction: "no commercial reuse, resale, white-labeling, competing product distribution, hosted service, or third-party app store publication without written permission",
  secretSafe: true,
  failures
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length > 0) {
  console.error(`License policy validation failed. Report written to ${reportPath}`);
  process.exit(process.exitCode || 1);
}

console.log(`License policy checks passed. Report written to ${reportPath}`);

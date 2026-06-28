const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const scriptPath = path.join(root, "scripts", "publish-github-repository-bundles.ps1");
const packagePath = path.join(root, "package.json");
const docsPath = path.join(root, "docs", "github-web-publication.md");
const helperPath = path.join(root, "scripts", "print-github-publication-help.ps1");

const requiredScriptText = [
  "OpenCycle GitHub bundle publisher",
  "validate:github-repository-bundles",
  "validate:github-repository-archives",
  "dist\\github-repositories",
  "Open-Cycle.zip",
  "open-cycle-source.zip",
  "https://github.com/kborndorff/Open-Cycle.git",
  "https://github.com/kborndorff/open-cycle-source.git",
  "Get-ChildItem -LiteralPath $Bundle.SourceDirectory -Force",
  "Dry run only",
  "-Apply",
  "Push-Location $WorkingDirectory",
  "Pop-Location",
  "git init -b",
  "git config user.name",
  "git config user.email",
  "kborndorff@users.noreply.github.com",
  "git fetch origin",
  "git push",
  "validate:github:live",
  "validate:github:actions",
  "does not read, print, or store GitHub tokens"
];

const requiredDocsText = [
  "github:publish-bundles:dry-run",
  "github:publish-bundles:apply",
  "publish-github-repository-bundles.ps1",
  "validated public-safe GitHub bundles"
];

const requiredPackageScripts = [
  "github:publish-bundles:dry-run",
  "github:publish-bundles:apply",
  "validate:github-bundle-publisher"
];

const forbiddenText = [
  "GITHUB_TOKEN=",
  "GH_TOKEN=",
  "CF_API_TOKEN=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "-----BEGIN PRIVATE KEY-----"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing ${path.relative(root, file)}.`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

const script = read(scriptPath);
for (const expected of requiredScriptText) {
  if (!includesNormalized(script, expected)) {
    fail(`GitHub bundle publisher is missing expected text: ${expected}`);
  }
}

for (const forbidden of forbiddenText) {
  if (script.includes(forbidden)) {
    fail(`GitHub bundle publisher must not include secret material marker: ${forbidden}`);
  }
}

const packageJson = JSON.parse(read(packagePath));
for (const scriptName of requiredPackageScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    fail(`package.json is missing script: ${scriptName}`);
  }
}
if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:github-bundle-publisher")) {
  fail("validate:release must include validate:github-bundle-publisher.");
}

const docs = `${read(docsPath)}\n${read(helperPath)}`;
for (const expected of requiredDocsText) {
  if (!includesNormalized(docs, expected)) {
    fail(`GitHub publication docs/helper are missing expected text: ${expected}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("GitHub bundle publisher checks passed.");

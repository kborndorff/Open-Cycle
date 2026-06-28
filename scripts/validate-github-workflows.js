const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function requireIncludes(file, values) {
  const contents = read(file);
  for (const value of values) {
    if (!contents.includes(value)) {
      fail(`${file} is missing required workflow content: ${value}`);
    }
  }
  return contents;
}

function requireExcludes(file, values) {
  const contents = read(file);
  for (const value of values) {
    if (contents.includes(value)) {
      fail(`${file} must not include: ${value}`);
    }
  }
}

const ci = requireIncludes(".github/workflows/ci.yml", [
  "permissions:",
  "contents: read",
  "npm run validate:proof-product-repository",
  "npm run build:site",
  "npm run validate:site"
]);

const android = requireIncludes(".github/workflows/android-aab.yml", [
  "permissions:",
  "contents: read",
  "Validate public Play evidence",
  "npm run validate:proof-product-repository"
]);

const deploySite = requireIncludes(".github/workflows/deploy-site.yml", [
  "workflow_dispatch:",
  "permissions:",
  "contents: read",
  "npm run build:site",
  "npm run validate:license",
  "npm run validate:site",
  "npm run validate:custom-domain:live",
  "cloudflare/wrangler-action@v3",
  "secrets.CF_API_TOKEN",
  "secrets.CF_ACCOUNT_ID",
  "pages deploy site/dist",
  "open-cycle-site",
  "Skip deploy without Cloudflare secrets"
]);

const deployWorker = requireIncludes(".github/workflows/deploy-redirect-worker.yml", [
  "workflow_dispatch:",
  "permissions:",
  "contents: read",
  "cloudflare/wrangler-action@v3",
  "secrets.CF_API_TOKEN",
  "secrets.CF_ACCOUNT_ID",
  "deploy deploy/cloudflare/redirect-worker.js"
]);

for (const [file, contents] of [
  [".github/workflows/ci.yml", ci],
  [".github/workflows/android-aab.yml", android],
  [".github/workflows/deploy-site.yml", deploySite],
  [".github/workflows/deploy-redirect-worker.yml", deployWorker]
]) {
  if (!contents.includes("actions/checkout@v4")) {
    fail(`${file} must check out the repository.`);
  }
}

requireExcludes(".github/workflows/ci.yml", ["secrets.", "ANDROID_KEYSTORE_PASSWORD", "CF_API_TOKEN"]);
requireExcludes(".github/workflows/android-aab.yml", [
  "ANDROID_KEYSTORE_BASE64",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
  "mobile:sign:aab",
  "app-release-signed.aab",
  "open-cycle-signed-aab",
  "actions/upload-artifact@v4",
  "apps/mobile/android/gradlew",
  "validate:play-store-public",
  "r0adkll/upload-google-play",
  "CF_API_TOKEN"
]);
requireExcludes(".github/workflows/deploy-redirect-worker.yml", ["wrangler deploy deploy/cloudflare/redirect-worker.js"]);

const packageJson = JSON.parse(read("package.json"));
for (const scriptName of ["generate:workflow-provenance", "validate:workflow-provenance"]) {
  if (!packageJson.scripts?.[scriptName]) {
    fail(`package.json is missing workflow provenance script: ${scriptName}`);
  }
}
for (const file of ["generate-workflow-provenance-report.js", "validate-workflow-provenance-report.js"]) {
  if (!fs.existsSync(path.join(root, "scripts", file))) {
    fail(`Missing scripts/${file}.`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("GitHub workflow checks passed.");

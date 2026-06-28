const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const guidePath = path.join(root, "docs", "owner-tooling.md");

const requiredText = [
  "Owner tooling setup",
  "npm run validate:owner-tools",
  "reports/owner-release-tools.json",
  "Safe owner helper suite",
  "npm run release:support-now",
  "npm run validate:owner-support-now",
  "npm run generate:release-blockers",
  "npm run validate:release-blockers",
  "npm run owner-tools:cloudflare-domain-help",
  "npm run validate:cloudflare-domain-help",
  "npm run owner-tools:publish-help",
  "npm run validate:github-publication-helper",
  "npm run github:publish-bundles:dry-run",
  "npm run validate:github-bundle-publisher",
  "npm run owner-tools:android-signing-help",
  "npm run validate:android-signing-helper",
  "npm run owner-tools:android-tooling-help",
  "npm run validate:android-tooling-helper",
  "npm run owner-tools:runtime-qa-help",
  "npm run validate:runtime-qa-helper",
  "npm run owner-tools:play-upload-help",
  "npm run validate:play-upload-helper",
  "They do not upload files, push Git commits, attach Cloudflare domains, read keystores, read Play credentials, or print secret values",
  "Cloudflare, GitHub, Android signing, signed runtime QA, and Play Console upload",
  "npm run owner-tools:gh-help",
  "npm run owner-tools:env-help",
  "npm run owner-tools:wrangler-help",
  "npm run mobile:release:android:prompted"
];

const forbiddenText = [
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "GOOGLE_APPLICATION_CREDENTIALS=",
  "gh secret set CF_API_TOKEN --body",
  "gh secret set CF_ACCOUNT_ID --body",
  "service-account.json"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(guidePath)) {
  fail("Missing docs/owner-tooling.md.");
} else {
  const guide = fs.readFileSync(guidePath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(guide, expected)) {
      fail(`Owner tooling guide is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (guide.includes(forbidden)) {
      fail(`Owner tooling guide must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Owner tooling docs checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const supportPath = path.join(root, "scripts", "print-owner-support-now.js");

const requiredText = [
  "OpenCycle owner support now",
  "Safe rule: never paste API tokens, keystore passwords, service account JSON, or signed artifacts",
  "Current evidence:",
  "Current blocker report: npm run generate:release-blockers && npm run validate:release-blockers",
  "npm run generate:release-blockers",
  "npm run validate:release-blockers",
  "npm run owner-tools:cloudflare-domain-help",
  "npm run owner-tools:publish-help",
  "npm run owner-tools:android-signing-help",
  "npm run owner-tools:runtime-qa-help",
  "npm run owner-tools:play-upload-help",
  "npm run github:setup-deploy-secrets -- -DryRun",
  "gh secret set CF_API_TOKEN --repo kborndorff/Open-Cycle",
  "gh secret set CF_ACCOUNT_ID --repo kborndorff/Open-Cycle",
  "do not add --body for secret values",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "npm run validate:public-push",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "npm run mobile:release:android:prompted -- -DryRun",
  "npm run mobile:release:android:prompted",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run mobile:signed-aab:sync-evidence",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run validate:play-upload-confirmation -- --require-complete",
  "npm run validate:play-store-complete",
  "npm run release:next",
  "npm run release:handoff"
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
  "service-account.json",
  "app-release-signed.aab --upload"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(supportPath)) {
  fail("Missing scripts/print-owner-support-now.js.");
} else {
  const helper = fs.readFileSync(supportPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Owner support helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Owner support helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Owner support helper checks passed.");

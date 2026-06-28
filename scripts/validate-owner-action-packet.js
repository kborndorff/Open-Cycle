const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "owner-action-packet.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(packetPath)) {
  fail("Missing reports/owner-action-packet.md. Run npm run generate:owner-action-packet.");
} else {
  const packet = fs.readFileSync(packetPath, "utf8");
  for (const expected of [
    "Owner action packet",
    "This packet is public-safe.",
    "npm run validate:release",
    "npm run validate:play-store-public",
    "npm run validate:custom-domain",
    "npm run release:handoff",
    "npm run release:owner-dry-run",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run cloudflare:attach-domains",
    "npm run validate:play-upload-helper",
    "npm run owner-tools:play-upload-help",
    "npm run validate:runtime-qa-helper",
    "npm run owner-tools:runtime-qa-help",
    "npm run validate:android-signing-helper",
    "npm run owner-tools:android-signing-help",
    "npm run validate:github-publication-helper",
    "npm run owner-tools:cloudflare-domain-help",
    "npm run validate:owner-support-now",
    "npm run release:support-now",
    "npm run owner-tools:publish-help",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run owner-tools:wrangler-help",
    "Compact blocker report",
    "reports/release-blocker-report.md",
    "Optional local Wrangler deploy",
    "npm run deploy:site:local",
    "npm run deploy:site:local:npx",
    "npm run deploy:site:local:safe",
    "npm run deploy:site:local:safe:npx",
    "Live validation evidence",
    "Latest Wrangler deployment",
    "Cloudflare Pages domains",
    "Custom-domain attachment status",
    "reports/cloudflare-pages-deployment.json",
    "reports/cloudflare-pages-domain-attach-api.json",
    "reports/live-custom-domain-publication.json",
    "reports/cloudflare-pages-domain-attachment.json",
    "reports/live-github-publication.json",
    "reports/live-github-actions.json",
    "docs/cloudflare-pages-domain-diagnostics.md",
    "open-cycle-site` Pages project",
    "npm run validate:cloudflare-pages-domains:live",
    "npm run owner-tools:cloudflare-domain-help",
    "npm run cloudflare:attach-domains:apply",
    "npm run mobile:release:android:prompted -- -DryRun",
    "npm run validate:custom-domain:live",
    "npm run validate:github:live",
    "npm run owner-tools:publish-help",
    "npm run validate:github:actions",
    "npm run mobile:release:android:prompted",
    "npm run owner-tools:android-signing-help",
    "npm run validate:runtime-qa-report -- --require-complete",
    "npm run owner-tools:runtime-qa-help",
    "npm run validate:play-upload-confirmation -- --require-complete",
    "npm run owner-tools:play-upload-help",
    "Private Play upload confirmation fields",
    "reports/play-console-upload-confirmation.json",
    "`uploaded`: set to `true`",
    "`privacyPolicyUrl`: use `https://open-cycle.com/privacy`",
    "`signedAabSha256` and `signedAabSizeBytes`",
    "`dataSafetySubmitted`: set to `true`",
    "`dataSafetyDataCollected`: keep as `None`",
    "`dataSafetyDataSharedWithThirdParties`: keep as `false`",
    "`noAdsOrAdvertisingIdConfirmed`: set to `true`",
    "`noAccountCreationConfirmed`: set to `true`",
    "`noInternetPermissionConfirmed`: set to `true`",
    "`signedRuntimeQaComplete`: set to `true`",
    "npm run github:setup-deploy-secrets",
    "npm run validate:play-store-complete",
    "Do not paste Cloudflare API tokens"
  ]) {
    if (!packet.includes(expected)) {
      fail(`Owner action packet is missing expected content: ${expected}`);
    }
  }

  if (packet.includes("`open-cycle` Pages project") || packet.includes("Pages project open-cycle.")) {
    fail("Owner action packet must reference the open-cycle-site Pages project, not open-cycle.");
  }

  for (const forbidden of [
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    "ANDROID_KEYSTORE_PASSWORD=",
    "ANDROID_KEY_PASSWORD=",
    "ANDROID_KEYSTORE_PATH=",
    "PLAY_CONSOLE",
    ".jks",
    ".keystore"
  ]) {
    if (packet.includes(forbidden)) {
      fail(`Owner action packet must not include sensitive material: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Owner action packet checks passed.");

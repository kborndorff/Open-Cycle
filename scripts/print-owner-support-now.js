const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");

function readJson(name) {
  const file = path.join(reportsDir, name);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function statusLine(label, report, passStatus = "pass") {
  if (!report) {
    console.log(`- ${label}: no report yet`);
    return;
  }
  const status = report.status || "unknown";
  const marker = status === passStatus ? "ready" : "needs owner action";
  console.log(`- ${label}: ${marker} (${status})`);
}

function auditStatusLine(label, check) {
  if (!check) {
    console.log(`- ${label}: no audit check yet`);
    return;
  }
  const status = check.status || "unknown";
  const marker = status === "pass" ? "ready" : "needs attention";
  console.log(`- ${label}: ${marker} (${status})`);
}

function main() {
  const audit = readJson("final-release-audit.json");
  const liveSite = readJson("live-site-publication.json");
  const customDomain = readJson("live-custom-domain-publication.json");
  const pagesDomains = readJson("cloudflare-pages-domain-attachment.json");
  const githubPublication = readJson("live-github-publication.json");
  const githubActions = readJson("live-github-actions.json");
  const unsignedAab = readJson("unsigned-aab-evidence.json");
  const signedAab = readJson("signed-aab-evidence.json");

  console.log("OpenCycle owner support now");
  console.log("");
  console.log("Safe rule: never paste API tokens, keystore passwords, service account JSON, or signed artifacts into chat, commits, issues, or docs.");
  console.log("");

  if (audit) {
    console.log(`Audit status: ${audit.status || "unknown"}`);
    if (Array.isArray(audit.pendingChecks) && audit.pendingChecks.length > 0) {
      console.log(`Pending checks: ${audit.pendingChecks.join(", ")}`);
    }
    console.log("");
  }

  console.log("Current evidence:");
  statusLine("Cloudflare Pages live site", liveSite);
  statusLine("Cloudflare Pages domain attachment", pagesDomains);
  statusLine("Custom domain", customDomain);
  statusLine("Public GitHub contents", githubPublication);
  statusLine("Public GitHub Actions", githubActions);
  statusLine("Unsigned Android AAB evidence", unsignedAab);
  statusLine("Signed Android AAB evidence", signedAab);
  auditStatusLine("Public artifact policy", audit?.checks?.publicArtifactPolicy);
  auditStatusLine("Local-only runtime", audit?.checks?.localOnlyRuntime);
  console.log("");

  console.log("Safe helper commands:");
  console.log("- Current blocker report: npm run generate:release-blockers && npm run validate:release-blockers");
  console.log("- Cloudflare domains: npm run owner-tools:cloudflare-domain-help");
  console.log("- GitHub publication: npm run owner-tools:publish-help");
  console.log("- Android signing: npm run owner-tools:android-signing-help");
  console.log("- Signed runtime QA: npm run owner-tools:runtime-qa-help");
  console.log("- Play upload: npm run owner-tools:play-upload-help");
  console.log("");

  console.log("1. Attach the Cloudflare custom domains");
  console.log("- In Cloudflare Pages, attach both domains to project: open-cycle");
  console.log("- Domains: open-cycle.com, www.open-cycle.com");
  console.log("- Helper: npm run owner-tools:cloudflare-domain-help");
  console.log("- After Cloudflare provisions them, run:");
  console.log("  npm run validate:cloudflare-pages-domains:live");
  console.log("  npm run validate:custom-domain:live");
  console.log("");

  console.log("2. Set GitHub deploy secrets without exposing values");
  console.log("- Recommended prompt-only helper:");
  console.log("  npm run github:setup-deploy-secrets -- -DryRun");
  console.log("  npm run github:setup-deploy-secrets");
  console.log("- Direct GitHub CLI prompt commands if you prefer:");
  console.log("  gh secret set CF_API_TOKEN --repo kborndorff/Open-Cycle");
  console.log("  gh secret set CF_ACCOUNT_ID --repo kborndorff/Open-Cycle");
  console.log("  gh variable set CF_PAGES_PROJECT_NAME --body open-cycle-site --repo kborndorff/Open-Cycle");
  console.log("- These commands prompt securely; do not add --body for secret values.");
  console.log("");

  console.log("3. Publish the public repository");
  console.log("- Push the current worktree to the public default branch for:");
  console.log("  https://github.com/kborndorff/Open-Cycle");
  console.log("- Helper: npm run owner-tools:publish-help");
  console.log("- Preflight before push:");
  console.log("  npm run generate:public-repo-manifest");
  console.log("  npm run validate:public-repo-manifest");
  console.log("  npm run validate:public-push");
  console.log("- Then validate the public surface:");
  console.log("  npm run validate:github:live");
  console.log("  npm run validate:github:actions");
  console.log("");

  console.log("4. Create and verify the private signed Android App Bundle");
  console.log("- Signed AAB files should stay private and should not be uploaded as public GitHub Actions artifacts.");
  console.log("- If you need a local upload keystore:");
  console.log("  npm run mobile:create-upload-keystore -- -DryRun");
  console.log("  npm run mobile:create-upload-keystore");
  console.log("- Helper: npm run owner-tools:android-signing-help");
  console.log("- Then sign the AAB locally:");
  console.log("  npm run mobile:release:android:prompted -- -DryRun");
  console.log("  npm run mobile:release:android:prompted");
  console.log("  npm run mobile:signed-aab:evidence -- --require-signed");
  console.log("");

  console.log("5. Complete signed runtime QA");
  console.log("- Helper: npm run owner-tools:runtime-qa-help");
  console.log("- Fill the generated private QA report after testing the signed candidate:");
  console.log("  npm run mobile:signed-aab:sync-evidence");
  console.log("  npm run validate:runtime-qa-report -- --require-complete");
  console.log("");

  console.log("6. Finish Play Console proof");
  console.log("- Helper: npm run owner-tools:play-upload-help");
  console.log("- Fill the generated private upload confirmation after upload:");
  console.log("  npm run generate:play-upload-confirmation");
  console.log("- In reports/play-console-upload-confirmation.json, confirm these public-safe fields:");
  console.log("  uploaded=true");
  console.log("  privacyPolicyUrl=https://open-cycle.com/privacy");
  console.log("  dataSafetySubmitted=true");
  console.log("  dataSafetyDataCollected=None");
  console.log("  dataSafetyDataSharedWithThirdParties=false");
  console.log("  noAdsOrAdvertisingIdConfirmed=true");
  console.log("  noAccountCreationConfirmed=true");
  console.log("  noInternetPermissionConfirmed=true");
  console.log("  signedRuntimeQaComplete=true");
  console.log("  npm run validate:play-upload-confirmation -- --require-complete");
  console.log("  npm run validate:play-store-complete");
  console.log("");

  console.log("For the detailed checklist, run:");
  console.log("  npm run generate:release-blockers");
  console.log("  npm run validate:release-blockers");
  console.log("  npm run release:next");
  console.log("  npm run release:handoff");
}

main();

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "owner-action-packet.md");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const releaseStatusPath = path.join(reportsDir, "release-status.json");
const ownerToolsPath = path.join(reportsDir, "owner-release-tools.json");
const cloudflareDeploymentPath = path.join(reportsDir, "cloudflare-pages-deployment.json");

function readJson(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function checkbox(done, text) {
  return `- [${done ? "x" : " "}] ${text}`;
}

function main() {
  const audit = readJson(auditPath);
  const releaseStatus = readJson(releaseStatusPath);
  const ownerTools = readJson(ownerToolsPath);
  const cloudflareDeployment = readJson(cloudflareDeploymentPath);
  const pendingChecks = Array.isArray(audit?.pendingChecks) ? audit.pendingChecks : [];
  const missingRecommended = Array.isArray(ownerTools?.missingRecommended) ? ownerTools.missingRecommended : [];
  const cloudflareDomains = Array.isArray(cloudflareDeployment?.project?.domains)
    ? cloudflareDeployment.project.domains.join(", ")
    : "unknown";
  const missingCustomDomains = Array.isArray(cloudflareDeployment?.missingCustomDomains)
    ? cloudflareDeployment.missingCustomDomains.join(", ")
    : "unknown";

  const packet = [
    "# Owner action packet",
    "",
    "This packet is public-safe. It does not include Cloudflare tokens, Android keystores, signing passwords, Play Console credentials, or signed artifacts.",
    "",
    "## Current release state",
    "",
    `- Audit status: ${audit?.status || "unknown"}`,
    `- Release status: ${releaseStatus?.publicReadinessStatus || "unknown"}`,
    `- Repository: ${audit?.repository || "https://github.com/kborndorff/Open-Cycle"}`,
    `- Live site: ${audit?.liveSiteUrl || "https://open-cycle-site.pages.dev"}`,
    `- Custom domain: ${releaseStatus?.customDomainUrl || "https://open-cycle.com"}`,
    `- Latest Wrangler deployment: ${cloudflareDeployment?.latestDeployment?.deploymentUrl || "not recorded"}`,
    `- Cloudflare Pages domains: ${cloudflareDomains}`,
    `- Custom-domain attachment status: ${cloudflareDeployment?.customDomainStatus || "unknown"}${missingCustomDomains && missingCustomDomains !== "unknown" ? `; missing ${missingCustomDomains}` : ""}`,
    `- Missing recommended local tools: ${missingRecommended.length > 0 ? missingRecommended.join(", ") : "none"}`,
    "",
    "## Safe pre-owner checks",
    "",
    "Run these before entering secrets or touching private signing material:",
    "",
    "```powershell",
    "npm run validate:release",
    "npm run validate:play-store-public",
    "npm run validate:custom-domain",
    "npm run release:handoff",
    "npm run release:owner-dry-run",
    "npm run release:support-now",
    "npm run validate:owner-support-now",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run cloudflare:attach-domains",
    "npm run owner-tools:cloudflare-domain-help",
    "npm run owner-tools:publish-help",
    "npm run validate:github-publication-helper",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run owner-tools:wrangler-help",
    "npm run owner-tools:android-signing-help",
    "npm run validate:android-signing-helper",
    "npm run owner-tools:runtime-qa-help",
    "npm run validate:runtime-qa-helper",
    "npm run owner-tools:play-upload-help",
    "npm run validate:play-upload-helper",
    "npm run mobile:release:android:prompted -- -DryRun",
    "```",
    "",
    "## Compact blocker report",
    "",
    "For the shortest owner go/no-go list, regenerate the blocker report after each audit:",
    "",
    "```powershell",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "```",
    "",
    "Open `reports/release-blocker-report.md` for the current owner-only gates, helper commands, proof commands, and private-material boundaries.",
    "",
    "## Optional local Wrangler deploy",
    "",
    "If you want to deploy from this computer before or instead of waiting for GitHub Actions, use the root `wrangler.toml` config and deploy the built Pages output:",
    "",
    "```powershell",
    "npm run build:site",
    "npm run deploy:site:local",
    "```",
    "",
    "If Wrangler is not globally installed, use:",
    "",
    "```powershell",
    "npm run build:site",
    "npm run deploy:site:local:npx",
    "```",
    "",
    "If OneDrive or another permissioned workspace path causes local Wrangler file access issues, use the temp-staged deploy helper:",
    "",
    "```powershell",
    "npm run build:site",
    "npm run deploy:site:local:safe",
    "```",
    "",
    "Without a global Wrangler install, use the temp-staged npx fallback:",
    "",
    "```powershell",
    "npm run build:site",
    "npm run deploy:site:local:safe:npx",
    "```",
    "",
    "Do not put Cloudflare API tokens on the command line; use local Wrangler auth or GitHub encrypted secrets.",
    "",
    "After deploying with Wrangler, refresh and validate the public-safe deployment evidence:",
    "",
    "```powershell",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "```",
    "",
    "## Live validation evidence",
    "",
    "When live checks fail, review these public-safe diagnostic reports before repeating owner-side setup:",
    "",
    "- `reports/live-custom-domain-publication.json` records `open-cycle.com` status, missing pages, missing redirects, and missing security headers.",
    "- `reports/cloudflare-pages-deployment.json` records the latest Wrangler Pages deployment, stable Pages domain, and custom-domain attachment status.",
    "- `reports/cloudflare-pages-domain-attach-api.json` records the custom-domain API helper dry-run or apply status without storing token values.",
    "- `reports/cloudflare-pages-domain-attachment.json` records whether `open-cycle.com` and `www.open-cycle.com` are attached to the Pages project.",
    "- `reports/live-github-publication.json` records public repository visibility, default branch, and expected public file checks.",
    "- `reports/live-github-actions.json` records expected public workflow availability and latest run status.",
    "- `docs/cloudflare-pages-domain-diagnostics.md` explains how to confirm whether `open-cycle.com` is attached to the `open-cycle-site` Pages project.",
    "",
    "## Remaining owner actions",
    "",
    "Use the consolidated support command first when you need the shortest safe next-step list:",
    "",
    "```powershell",
    "npm run release:support-now",
    "```",
    "",
    checkbox(!pendingChecks.includes("liveCloudflarePagesDomainAttachment") && !pendingChecks.includes("liveCustomDomainPublication"), "Run `npm run owner-tools:cloudflare-domain-help`, rehearse `npm run cloudflare:attach-domains`, attach `open-cycle.com` and `www.open-cycle.com` in Cloudflare Pages or run `npm run cloudflare:attach-domains:apply` from a private owner shell, run `npm run validate:cloudflare-pages-domains:live`, then run `npm run validate:custom-domain:live`."),
    checkbox(!pendingChecks.includes("liveGithubPublication"), "Run `npm run owner-tools:publish-help`, publish this worktree to the public GitHub repository, and run `npm run validate:github:live`."),
    checkbox(!pendingChecks.includes("liveGithubActions"), "Wait for GitHub Actions to complete and run `npm run validate:github:actions`."),
    checkbox(!pendingChecks.includes("liveGithubPublication"), "Set Cloudflare GitHub secrets with `npm run github:setup-deploy-secrets` after rehearsing with `npm run github:setup-deploy-secrets -- -DryRun`."),
    checkbox(!pendingChecks.includes("signedAab"), "Run `npm run owner-tools:android-signing-help`, then create the private signed Android App Bundle with `npm run mobile:release:android:prompted`."),
    checkbox(!pendingChecks.includes("signedRuntimeQa"), "Run `npm run owner-tools:runtime-qa-help`, complete `reports/runtime-qa-report.md` on the signed candidate, and run `npm run validate:runtime-qa-report -- --require-complete`."),
    checkbox(!pendingChecks.includes("playConsoleUpload"), "Run `npm run owner-tools:play-upload-help`, upload the signed candidate in Play Console, fill `reports/play-console-upload-confirmation.json`, and run `npm run validate:play-upload-confirmation -- --require-complete`."),
    "",
    "## Private Play upload confirmation fields",
    "",
    "After Play Console upload, fill only public-safe release evidence in `reports/play-console-upload-confirmation.json`:",
    "",
    "- `uploaded`: set to `true` only after the signed AAB is uploaded.",
    "- `privacyPolicyUrl`: use `https://open-cycle.com/privacy` after `npm run validate:custom-domain:live` passes.",
    "- `signedAabSha256` and `signedAabSizeBytes`: keep matched to `reports/signed-aab-evidence.json` and the uploaded signed AAB.",
    "- `dataSafetySubmitted`: set to `true` after submitting the Play Data safety form.",
    "- `dataSafetyDataCollected`: keep as `None`.",
    "- `dataSafetyDataSharedWithThirdParties`: keep as `false`.",
    "- `noAdsOrAdvertisingIdConfirmed`: set to `true` after confirming ads and Advertising ID are not used.",
    "- `noAccountCreationConfirmed`: set to `true` after confirming the app creates no accounts.",
    "- `noInternetPermissionConfirmed`: set to `true` after confirming Play lists no Internet permission for the signed candidate.",
    "- `signedRuntimeQaComplete`: set to `true` only after `npm run validate:runtime-qa-report -- --require-complete` passes.",
    "- Do not include Play Console credentials, keystore paths, passwords, tokens, screenshots with private account data, or signed artifacts.",
    "",
    "## Secret handling boundaries",
    "",
    "- Do not paste Cloudflare API tokens, keystore passwords, upload keystores, Play Console credentials, or signed artifacts into chat.",
    "- Put Cloudflare values only into GitHub Actions secrets with `npm run github:setup-deploy-secrets` or the GitHub web UI.",
    "- Keep the Android upload keystore outside the repository.",
    "- Keep signed `.aab` artifacts local unless uploading them directly to Play Console.",
    "",
    "## Final completion command",
    "",
    "After custom-domain validation, GitHub publication/actions, and Play upload are complete:",
    "",
    "```powershell",
    "npm run validate:play-store-complete",
    "```",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, `${packet}\n`, "utf8");
  console.log(`Owner action packet written to ${packetPath}`);
}

main();

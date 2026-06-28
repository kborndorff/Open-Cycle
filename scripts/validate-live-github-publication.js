const fs = require("node:fs");
const path = require("node:path");

const repoArg = process.argv.find((arg) => arg.startsWith("--repo="));
const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const isDryRun = process.argv.includes("--dry-run");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "live-github-publication.json");
const repository = repoArg ? repoArg.split("=").slice(1).join("=") : "kborndorff/Open-Cycle";
const requestedBranch = branchArg ? branchArg.split("=").slice(1).join("=") : "";
const apiUrl = `https://api.github.com/repos/${repository}`;
const rawBase = (repo, branch) => `https://raw.githubusercontent.com/${repo}/${branch}`;

const files = {
  "README.md": ["open-cycle", "free", "local-only", "source-available, not open source", "app store redistribution by others", "store cycle entries in browser/device storage only", "clear all local cycle entries", "npm run validate:owner-tools", "npm run release:support-now", "npm run generate:release-blockers", "npm run validate:release-blockers", "npm run owner-tools:cloudflare-domain-help", "npm run owner-tools:publish-help", "npm run owner-tools:android-signing-help", "npm run owner-tools:runtime-qa-help", "npm run owner-tools:play-upload-help", "npm run validate:owner-support-now", "npm run validate:owner-tooling-docs", "npm run validate:signing-readiness", "npm run owner-tools:gh-help", "npm run owner-tools:env-help", "docs/owner-tooling.md", "npm run validate:functions", "npm run release:next", "npm run release:handoff", "npm run validate:release-handoff", "LICENSE.md"],
  "LICENSE.md": ["This is a source-available license, not an open-source license.", "public so people can inspect", "not published as an open-source license grant", "Public visibility does not grant permission to profit from this work", "Google Play, the Apple App Store, F-Droid, Microsoft Store"],
  "SECURITY.md": ["Cloudflare API tokens", "Android upload keystores", "No Android internet permission", "User cycle data"],
  "package.json": ["LicenseRef-OpenCycle-Source-Available", "https://github.com/kborndorff/open-cycle-source", "github:setup-deploy-secrets", "validate:license", "validate:owner-tools", "validate:signing-readiness", "validate:custom-domain", "validate:cloudflare-pages-domains:live", "validate:release-artifacts", "validate:public-artifacts", "validate:proof-product-repository", "validate:local-only-runtime", "validate:workflow-provenance", "validate:privacy-parity", "validate:android-permissions", "release:owner-dry-run", "owner-tools:gh-help", "owner-tools:publish-help", "owner-tools:env-help", "generate:play-data-safety", "validate:play-data-safety", "release:next", "release:handoff", "validate:release-handoff", "deploy:site:local:safe", "deploy:site:local:safe:npx"],
  "docs/deployment-secrets.md": ["npm run github:setup-deploy-secrets", "npm run github:setup-deploy-secrets -- -DryRun", "docs/custom-domain-cloudflare.md", "gh secret set CF_API_TOKEN", "Do not commit Cloudflare API tokens", "Keep the Android upload keystore local by default", "workflow_dispatch", "wrangler.toml", "deploy:site:local:safe", "deploy:site:local:safe:npx", "--commit-dirty=true"],
  "docs/custom-domain-cloudflare.md": ["https://open-cycle.com", "https://www.open-cycle.com", "open-cycle", "npm run validate:site:live -- --url=https://open-cycle.com", "npm run validate:custom-domain:live", "Keep DNS API tokens"],
  "docs/cloudflare-pages-domain-diagnostics.md": ["Cloudflare Pages domain diagnostics", "npm run validate:cloudflare-pages-domains:live", "reports/cloudflare-pages-domain-attachment.json", "npx.cmd wrangler pages project list", "open-cycle-site.pages.dev", "open-cycle.com", "www.open-cycle.com", "reports/live-custom-domain-publication.json"],
  "docs/release-owner-checklist.md": ["npm run github:setup-deploy-secrets", "npm run github:setup-deploy-secrets -- -DryRun", "npm run validate:custom-domain", "docs/custom-domain-cloudflare.md", "npm run validate:cloudflare-pages-domains:live", "--skip-live-cloudflare-domains", "npm run release:public-ready", "npm run generate:release-blockers", "npm run validate:release-blockers", "reports/release-blocker-report.md", "npm run release:next", "npm run release:handoff", "npm run owner-tools:publish-help", "npm run mobile:release:android:prompted", "npm run mobile:release:android:prompted -- -DryRun", "npm run validate:play-store-complete", "Keep secret values, keystore files, Play Console credentials, and signed artifacts out of GitHub"],
  "docs/owner-tooling.md": ["npm run validate:owner-tools", "Safe owner helper suite", "npm run release:support-now", "npm run owner-tools:cloudflare-domain-help", "npm run owner-tools:publish-help", "npm run owner-tools:android-signing-help", "npm run owner-tools:runtime-qa-help", "npm run owner-tools:play-upload-help", "gh auth login", "jarsigner -help", "keytool -help", "ANDROID_HOME", "wrangler --version", "does not read, print, or store secret values"],
  "docs/github-web-publication.md": ["https://github.com/kborndorff/Open-Cycle/settings/secrets/actions", "CF_API_TOKEN", "CF_ACCOUNT_ID", "CF_PAGES_PROJECT_NAME = open-cycle-site", "kborndorff/Open-Cycle", "this worktree is pushed to the public repository default branch", "npm run validate:github:live", "Do not paste Cloudflare API tokens"],
  "docs/validation-matrix.md": ["Create cycle entry locally", "Clear all local cycle entries", "Clear all standalone local API cycle records", "Avoid network in local mode", "Signed Play upload bundle", "Full public release gate"],
  "docs/release-evidence.md": ["Release evidence guide", "open-cycle is public for scrutiny", "npm run release:handoff", "npm run validate:workflow-provenance", "npm run validate:privacy-parity", "npm run validate:android-permissions", "reports/release-evidence-index.md", "Never paste or commit secret values"],
  "docs/play-store-release.md": ["Play Store release checklist", "Data safety draft", "clear all local entries", "npm run generate:play-data-safety", "npm run validate:play-data-safety", "npm run validate:signing-readiness", "npm run validate:play-store-complete"],
  "docs/runtime-qa.md": ["Runtime QA checklist", "Launch app with airplane mode enabled", "Confirm the cycle entry remains visible", "clear all local entries", "npm run validate:runtime-qa-report -- --require-complete"],
  "docs/mobile-release.md": ["Mobile release playbook", "npm run mobile:release:android:prompted", "Do not commit the keystore or passwords", "jarsigner"],
  "docs/android-keystore-handling.md": ["Android upload keystore handling", "Do not commit upload keystores", "npm run mobile:create-upload-keystore -- -DryRun", "npm run validate:signing-readiness", "encrypted backup", "upload-key reset"],
  "site/license.html": ["source-available, not open source", "public so people can inspect, audit, learn from, and verify", "Public visibility does not grant permission to profit from this work", "commercial reuse", "third-party app store redistribution", "https://github.com/kborndorff/open-cycle-source/blob/main/LICENSE.md"],
  "scripts/validate-function-coverage.js": ["function-coverage.json", "Core local tracking", "Avoid network in local mode", "Signed Play upload bundle"],
  "scripts/validate-license-policy.js": ["license-policy.json", "source-available for scrutiny", "no commercial reuse", "LicenseRef-OpenCycle-Source-Available"],
  "scripts/validate-signing-readiness.js": ["ready-for-private-keystore", "keystoreCreator", "does not read, print, or store", "keystore passwords", "jarsigner", "keytool"],
  "scripts/deploy-site-local-safe.ps1": ["OpenCycle safe local Cloudflare Pages deploy", "site\\dist", "GetTempPath", "does not read, print, or store", "--commit-dirty=true", "wranglerArgs"],
  "scripts/generate-play-data-safety-packet.js": ["Play Console data safety packet", "Data collected", "Does the app create accounts?", "clear all local cycle entries", "does not include Play Console credentials"],
  "scripts/validate-play-data-safety-packet.js": ["Play data safety packet checks passed", "Data collected: None", "Data shared with third parties: No", "clear all local cycle entries", "must not include sensitive material"],
  "scripts/build-aab.js": ["bundleRelease", "ANDROID_HOME", "JAVA_HOME", "App Bundle generated at:"],
  "scripts/sign-aab.js": ["ANDROID_KEYSTORE_PATH", "jarsigner", "-storepass:env", "Signed AAB written to"],
  "scripts/validate-android-release.js": ["android.permission.INTERNET", "allowBackup=\"false\"", "requireSigned", "Android release checks passed."],
  "scripts/android-local-release.js": ["Android local Play release", "mobile:signed-aab:evidence", "mobile:signed-aab:sync-evidence", "Signed Android release candidate is ready"],
  "scripts/play-store-public-readiness.js": ["Play Store public readiness", "mobile:unsigned-aab:evidence", "ready-for-private-signing", "Only private signing remains"],
  "scripts/play-store-private-readiness.js": ["Play Store private readiness", "mobile:signed-aab:sync-evidence", "validate:runtime-qa-report", "ready-for-play-upload"],
  "scripts/play-store-complete-readiness.js": ["Play Store completion readiness", "validate:play-store-private-ready", "play-upload-confirmed", "Play Store completion checks passed"],
  "scripts/print-unsigned-aab-evidence.js": ["Unsigned AAB evidence", "unsigned-aab-evidence.json", "does not read signing keys", "unsignedAabSha256"],
  "scripts/print-signed-aab-evidence.js": ["Signed AAB evidence", "signed-aab-evidence.json", "does not read keystores", "signedAabSha256"],
  "scripts/sync-signed-aab-evidence.js": ["Sync signed AAB evidence into private release reports", "signed-aab-evidence.json", "does not read keystores", "signedAabSha256"],
  "scripts/validate-release-artifact-hygiene.js": ["Release artifact hygiene validation", "release-artifact-hygiene.json", "does not read keystores", "privateArtifacts"],
  "scripts/validate-public-artifact-policy.js": ["Public artifact policy validation", "public-artifact-policy.json", "unsigned Android AAB build evidence", "signed Android AAB files"],
  "scripts/validate-proof-product-repository.js": ["OpenCycle proof/product repository validation", "public-safe-play-console-submit-bundle", "validate:proof-product-repository", "site/llms.txt", "product-uploads/play-console-submit"],
  "scripts/validate-local-only-runtime.js": ["Local-only runtime validation", "local-only-runtime.json", "network", "analytics", "cloud sync"],
  "scripts/generate-workflow-provenance-report.js": ["workflow-provenance.json", "signedArtifactsPublished", "playUploadAutomation", "site/dist"],
  "scripts/validate-workflow-provenance-report.js": ["Workflow provenance checks passed", "signedArtifactsPublished", "playUploadAutomation", "validate:workflow-provenance"],
  "scripts/generate-privacy-parity-report.js": ["privacy-parity.json", "Free cycle tracking", "no hidden tracking", "dataSharedWithThirdParties", "androidInternetPermissionRequested"],
  "scripts/validate-privacy-parity-report.js": ["Privacy parity checks passed", "dataCollected", "dataSharedWithThirdParties", "validate:privacy-parity"],
  "scripts/generate-android-permissions-report.js": ["android-permissions.json", "requestedPermissions", "internetPermissionRequested", "allowBackup"],
  "scripts/validate-android-permissions-report.js": ["Android permissions checks passed", "requestedPermissions", "internetPermissionRequested", "validate:android-permissions"],
  "scripts/generate-release-evidence-index.js": ["release-evidence-index.md", "workflow-provenance.json", "privacy-parity.json", "android-permissions.json"],
  "scripts/validate-release-evidence-index.js": ["Release evidence index checks passed", "reports/workflow-provenance.json", "reports/privacy-parity.json", "reports/android-permissions.json"],
  "scripts/generate-release-completion-matrix.js": ["release-completion-matrix.json", "release-completion-matrix.md", "Release completion matrix", "pendingOwnerOnlyGates"],
  "scripts/validate-release-completion-matrix.js": ["Release completion matrix checks passed", "release-completion-matrix.json", "release-completion-matrix.md", "expectedPendingGates"],
  "scripts/generate-release-blocker-report.js": ["release-blocker-report.json", "release-blocker-report.md", "BLOCKER_GUIDANCE", "validate:play-store-complete"],
  "scripts/validate-release-blocker-report.js": ["Release blocker report checks passed", "expectedOwnerOnlyGates", "requiredCommands", "forbiddenText"],
  "scripts/validate-release-evidence-docs.js": ["Release evidence docs checks passed", "docs/release-evidence.md", "validate:release-evidence-docs"],
  "scripts/generate-public-repository-publication-manifest.js": ["public-repository-publication-manifest.md", "Private material that must stay out of GitHub", "Do not push until the owner explicitly approves publication"],
  "scripts/validate-public-repository-publication-manifest.js": ["Public repository publication manifest checks passed", "validate:public-repo-manifest", "Perform Android signing privately"],
  "scripts/validate-custom-domain-readiness.js": ["Custom domain readiness", "custom-domain-readiness.json", "https://open-cycle.com", "does not read DNS records"],
  "scripts/validate-cloudflare-pages-domain-attachment.js": ["cloudflare-pages-domain-attachment.json", "npx.cmd", "wrangler", "open-cycle.com", "www.open-cycle.com", "does not read"],
  "scripts/validate-live-custom-domain.js": ["Custom domain live checks passed", "live-custom-domain-publication.json", "https://open-cycle.com", "Custom domain URL must use HTTPS"],
  "scripts/public-release-readiness.js": ["Public release readiness", "validate:cloudflare-pages-domains:live", "--skip-live-cloudflare-domains", "Live Cloudflare Pages domain-attachment"],
  "scripts/owner-release-dry-run.js": ["Owner release dry run", "owner-release-dry-run.json", "keystoreCreationDryRun", "does not read, prompt for, print, or store", "--skip-live-cloudflare-domains", "release:public-ready"],
  "scripts/generate-owner-action-packet.js": ["Owner action packet", "This packet is public-safe.", "liveCustomDomainPublication", "npm run validate:custom-domain:live", "pendingChecks", "npm run validate:play-store-complete", "Do not paste Cloudflare API tokens"],
  "scripts/validate-owner-action-packet.js": ["Owner action packet checks passed.", "must not include sensitive material", "npm run validate:custom-domain:live", "npm run validate:github:live", "npm run validate:play-upload-confirmation -- --require-complete", "Do not paste Cloudflare API tokens"],
  "scripts/print-github-cli-help.ps1": ["gh auth login", "gh auth status", "winget install --id GitHub.cli", "does not read, print, or store"],
  "scripts/print-github-publication-help.ps1": ["OpenCycle GitHub publication helper", "does not run git", "kborndorff/Open-Cycle", "publish this worktree to the default branch", "git push -u origin", "npm run validate:github:live", "No secret values are printed"],
  "scripts/validate-github-publication-helper.js": ["GitHub publication helper checks passed", "print-github-publication-help.ps1", "No secret values are printed by this helper"],
  "scripts/print-owner-tool-env.ps1": ["ApplyToUser", "jarsigner.exe", "keytool.exe", "ANDROID_HOME", "does not read, print, or store"],
  "scripts/print-cloudflare-domain-attach-help.ps1": ["OpenCycle Cloudflare custom-domain attach helper", "npm run validate:cloudflare-pages-domains:live", "npm run validate:custom-domain:live", "does not read, print, prompt for, or store Cloudflare API tokens"],
  "scripts/validate-cloudflare-domain-attach-helper.js": ["Cloudflare domain attach helper checks passed", "print-cloudflare-domain-attach-help.ps1", "OpenCycle Cloudflare custom-domain attach helper"],
  "scripts/print-android-signing-help.ps1": ["OpenCycle Android signing helper", "npm run validate:signing-readiness", "npm run mobile:release:android:prompted", "Keep the upload keystore, passwords, signed AAB, completed private QA, and Play upload confirmation out of public GitHub"],
  "scripts/validate-android-signing-helper.js": ["Android signing helper checks passed", "print-android-signing-help.ps1", "OpenCycle Android signing helper"],
  "scripts/print-play-upload-help.ps1": ["OpenCycle Play Console upload helper", "npm run validate:play-store-private-ready", "npm run validate:play-upload-confirmation -- --require-complete", "Do not commit or upload Play service-account JSON"],
  "scripts/validate-play-upload-helper.js": ["Play upload helper checks passed", "print-play-upload-help.ps1", "OpenCycle Play Console upload helper"],
  "scripts/print-runtime-qa-help.ps1": ["OpenCycle signed runtime QA helper", "npm run validate:runtime-qa-report -- --require-complete", "Keep screenshots, tester identity, device notes, and signed artifacts out of public GitHub"],
  "scripts/validate-runtime-qa-helper.js": ["Runtime QA helper checks passed", "print-runtime-qa-help.ps1", "OpenCycle signed runtime QA helper"],
  "scripts/print-owner-support-now.js": ["OpenCycle owner support now", "npm run owner-tools:cloudflare-domain-help", "npm run owner-tools:publish-help", "npm run owner-tools:android-signing-help", "npm run owner-tools:runtime-qa-help", "npm run owner-tools:play-upload-help", "Safe rule: never paste API tokens"],
  "scripts/validate-owner-support-now.js": ["Owner support helper checks passed", "print-owner-support-now.js", "OpenCycle owner support now"],
  "scripts/validate-owner-tooling-docs.js": ["Owner tooling docs checks passed", "docs", "owner-tooling.md", "owner-tools:play-upload-help"],
  "scripts/print-next-release-steps.js": ["OpenCycle release next steps", "Owner-safe rehearsal:", "Latest live diagnostic reports", "reports/live-custom-domain-publication.json", "reports/cloudflare-pages-domain-attachment.json", "reports/live-github-publication.json", "reports/live-github-actions.json", "Attach Cloudflare Pages custom domains", "Use the helper for dashboard steps, attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages, then run npm run validate:custom-domain:live.", "Likely owner action: attach open-cycle.com to the Cloudflare Pages project that serves site/dist.", "docs/cloudflare-pages-domain-diagnostics.md", "npm run validate:cloudflare-pages-domains:live", "Likely owner action: attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages.", "Likely owner action: push this worktree to the public repository default branch.", "Likely owner action: publish the workflow files, then wait for Actions to run.", "OneDrive-safe local Wrangler deploy", "OneDrive-safe deploy fallback", "npm run validate:custom-domain:live", "npm run release:owner-dry-run", "npm run github:setup-deploy-secrets -- -DryRun", "npm run mobile:create-upload-keystore -- -DryRun", "Pending checks:", "Recommended next actions:", "docs/release-owner-checklist.md", "Public repository manifest"],
  "scripts/setup-github-deployment-secrets.ps1": ["Set-GitHubSecretFromPrompt -Name \"CF_API_TOKEN\"", "Set-GitHubSecretFromPrompt -Name \"CF_ACCOUNT_ID\"", "gh variable set CF_PAGES_PROJECT_NAME", "open-cycle-site"],
  ".github/workflows/ci.yml": ["npm run validate:proof-product-repository", "npm run build:site", "npm run validate:site", "contents: read"],
  ".github/workflows/android-aab.yml": ["Validate public Play evidence", "npm run validate:proof-product-repository"],
  "wrangler.toml": ["name = \"open-cycle-site\"", "pages_build_output_dir = \"site/dist\""],
  ".github/workflows/deploy-site.yml": ["workflow_dispatch:", "pages deploy site/dist", "open-cycle-site", "Skip deploy without Cloudflare secrets", "npm run validate:license", "npm run validate:custom-domain:live"]
};

const forbiddenAssignedSecrets = [
  "CF_API_TOKEN",
  "CF_ACCOUNT_ID",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_PATH",
  "API_KEY",
  "VITE_API_KEY"
];

let activeReport = null;

function fail(message) {
  if (activeReport && !activeReport.failures.includes(message)) {
    activeReport.failures.push(message);
  }
  console.error(message);
  process.exitCode = 1;
}

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function fetchText(url, expectedStatus = 200) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "OpenCycle-publication-validator"
    }
  });
  const body = await response.text();
  if (response.status !== expectedStatus) {
    fail(`${url} returned ${response.status}; expected ${expectedStatus}.`);
  }
  return { response, body };
}

function checkNoAssignedSecrets(label, contents) {
  const lines = contents.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#") || line.startsWith("//") || line.startsWith("*")) {
      continue;
    }

    for (const name of forbiddenAssignedSecrets) {
      const match = new RegExp(`^(?:export\\s+|\\$env:)?${name}\\s*=\\s*([^\\s#]+)`).exec(line);
      if (match && !isPlaceholderSecretValue(match[1])) {
        fail(`${label} appears to include an assigned secret value on line ${index + 1}: ${name}`);
      }
    }
  }
}

function isPlaceholderSecretValue(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, "");
  return (
    normalized === "" ||
    normalized === "..." ||
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized.toLowerCase().includes("\\path\\") ||
    normalized.toLowerCase().includes("/path/") ||
    normalized.toLowerCase().includes("placeholder") ||
    normalized.toLowerCase().includes("optional")
  );
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

async function main() {
  console.log("Live GitHub publication validation");
  console.log(`Repository: ${repository}`);
  console.log(`Branch: ${requestedBranch || "<repository-default-branch>"}`);

  if (isDryRun) {
    console.log("Dry run only. No network requests are executed.");
    console.log(apiUrl);
    const dryRunBranch = requestedBranch || "<repository-default-branch>";
    for (const file of Object.keys(files)) {
      console.log(`${rawBase(repository, dryRunBranch)}/${file}`);
    }
    return;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    repository,
    branch: requestedBranch || "",
    requestedBranch: requestedBranch || null,
    url: `https://github.com/${repository}`,
    status: "pending",
    checkedFiles: Object.keys(files),
    failures: []
  };
  activeReport = report;

  const repoResult = await fetchText(apiUrl);
  let repo;
  try {
    repo = JSON.parse(repoResult.body);
  } catch {
    fail("GitHub repository API response is not valid JSON.");
    repo = {};
  }

  const canonicalRepository = repo.full_name || repository;
  const resolvedBranch = requestedBranch || repo.default_branch || "main";
  report.branch = resolvedBranch;
  report.resolvedBranch = resolvedBranch;
  report.github = {
    fullName: repo.full_name,
    requestedFullName: repository,
    private: repo.private,
    archived: repo.archived,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url
  };
  if (String(canonicalRepository).toLowerCase() !== repository.toLowerCase()) {
    const message = `GitHub API returned unexpected repository: ${repo.full_name || "unknown"}`;
    report.failures.push(message);
    fail(message);
  }
  if (repo.private !== false) {
    const message = "GitHub repository must be public.";
    report.failures.push(message);
    fail(message);
  }
  if (repo.archived === true) {
    const message = "GitHub repository must not be archived.";
    report.failures.push(message);
    fail(message);
  }
  if (String(repo.html_url || "").toLowerCase() !== `https://github.com/${repository}`.toLowerCase()) {
    const message = "GitHub repository URL does not match expected public URL.";
    report.failures.push(message);
    fail(message);
  }

  for (const [file, expectedValues] of Object.entries(files)) {
    const { body } = await fetchText(`${rawBase(canonicalRepository, resolvedBranch)}/${file}`);
    checkNoAssignedSecrets(file, body);
    for (const expected of expectedValues) {
      if (!includesNormalized(body, expected)) {
        const message = `${file} is missing expected public content: ${expected}`;
        report.failures.push(message);
        fail(message);
      }
    }
  }

  if (process.exitCode) {
    report.status = "fail";
    writeReport(report);
    process.exit(process.exitCode);
  }

  report.status = "pass";
  writeReport(report);
  console.log(`Live GitHub publication checks passed for https://github.com/${repository}@${resolvedBranch}.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
  const report = activeReport || {
    generatedAt: new Date().toISOString(),
    repository,
    branch: requestedBranch || "",
    requestedBranch: requestedBranch || null,
    url: `https://github.com/${repository}`,
    status: "fail",
    checkedFiles: Object.keys(files),
    failures: []
  };
  report.status = "fail";
  if (!report.failures.includes(message)) {
    report.failures.push(message);
  }
  writeReport(report);
  process.exit(1);
});

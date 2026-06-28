const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "public-push-readiness.json");

const requiredFiles = {
  "README.md": [
    "open-cycle",
    "free",
    "local-only",
    "source-available, not open source",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "npm run release:handoff"
  ],
  "LICENSE.md": [
    "This is a source-available license, not an open-source license.",
    "Public visibility does not grant permission to profit from this work"
  ],
  "SECURITY.md": [
    "Cloudflare API tokens",
    "Android upload keystores",
    "No Android internet permission",
    "User cycle data"
  ],
  "package.json": [
    "LicenseRef-OpenCycle-Source-Available",
    "https://github.com/kborndorff/open-cycle-source",
    "validate:license",
    "validate:custom-domain",
    "validate:cloudflare-pages-domains:live",
    "validate:release-artifacts",
    "validate:public-push",
    "validate:proof-product-repository",
    "owner-tools:publish-help",
    "release:owner-dry-run",
    "generate:release-completion-matrix",
    "validate:release-completion-matrix",
    "generate:release-blockers",
    "validate:release-blockers",
    "generate:play-data-safety",
    "validate:play-data-safety",
    "generate:github-repository-bundles",
    "validate:github-repository-bundles",
    "release:handoff",
    "deploy:site:local:safe",
    "deploy:site:local:safe:npx"
  ],
  "docs/deployment-secrets.md": [
    "npm run github:setup-deploy-secrets",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "docs/custom-domain-cloudflare.md",
    "Do not commit Cloudflare API tokens",
    "workflow_dispatch",
    "wrangler.toml",
    "deploy:site:local:safe",
    "deploy:site:local:safe:npx",
    "--commit-dirty=true"
  ],
  "docs/custom-domain-cloudflare.md": [
    "https://open-cycle.com",
    "https://www.open-cycle.com",
    "open-cycle",
    "npm run validate:site:live -- --url=https://open-cycle.com",
    "npm run validate:custom-domain:live",
    "Keep DNS API tokens"
  ],
  "docs/cloudflare-pages-domain-diagnostics.md": [
    "Cloudflare Pages domain diagnostics",
    "npm run validate:cloudflare-pages-domains:live",
    "reports/cloudflare-pages-domain-attachment.json",
    "npx.cmd wrangler pages project list",
    "open-cycle-site.pages.dev",
    "open-cycle.com",
    "www.open-cycle.com",
    "reports/live-custom-domain-publication.json"
  ],
  "docs/release-owner-checklist.md": [
    "npm run validate:public-push",
    "npm run validate:custom-domain",
    "docs/custom-domain-cloudflare.md",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run validate:cloudflare-pages-domains:live",
    "--skip-live-cloudflare-domains",
    "npm run mobile:release:android:prompted -- -DryRun",
    "npm run owner-tools:publish-help",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "reports/release-blocker-report.md",
    "npm run release:public-ready",
    "Keep secret values, keystore files, Play Console credentials, and signed artifacts out of GitHub"
  ],
  "docs/owner-tooling.md": [
    "npm run validate:owner-tools",
    "does not read, print, or store secret values"
  ],
  "docs/github-web-publication.md": [
    "CF_API_TOKEN",
    "CF_ACCOUNT_ID",
    "Homepage target after custom-domain validation: `https://open-cycle.com`",
    "kborndorff/Open-Cycle",
    "kborndorff/open-cycle-source",
    "Proof/product repository target",
    "Full source repository target",
    "SEO/blog pages",
    "llms.txt",
    "this worktree is pushed to the public repository default branch",
    "npm run validate:github:live",
    "npm run validate:custom-domain:live",
    "Do not paste Cloudflare API tokens"
  ],
  "docs/validation-matrix.md": [
    "Create cycle entry locally",
    "Clear all local cycle entries",
    "Clear all standalone local API cycle records",
    "Avoid network in local mode",
    "Signed Play upload bundle"
  ],
  "docs/play-store-release.md": [
    "Play Store release checklist",
    "clear all local entries",
    "npm run generate:play-data-safety",
    "npm run validate:play-data-safety",
    "npm run validate:play-store-complete"
  ],
  "docs/runtime-qa.md": [
    "Runtime QA checklist",
    "clear all local entries",
    "npm run validate:runtime-qa-report -- --require-complete"
  ],
  "docs/mobile-release.md": [
    "Mobile release playbook",
    "npm run mobile:release:android:prompted"
  ],
  "docs/android-keystore-handling.md": [
    "Android upload keystore handling",
    "npm run mobile:create-upload-keystore -- -DryRun",
    "Do not commit upload keystores"
  ],
  "apps/web/src/App.tsx": [
    "Your privacy",
    "https://open-cycle.com/privacy",
    "https://open-cycle.com/license.html",
    "https://github.com/kborndorff/open-cycle-source",
    "no ads",
    "no required cloud sync"
  ],
  "site/index.html": [
    "privacy-first period tracking app",
    "/blog/",
    "Privacy notes",
    "local phone-only",
    "/blog/local-only-period-tracker.html",
    "/blog/health-app-data-sharing.html",
    "/blog/period-tracker-privacy-questions.html",
    "/blog/no-account-period-tracker.html",
    "/blog/period-tracker-without-internet.html"
  ],
  "site/styles.css": [
    "blog-shell",
    "blog-article",
    "source-list"
  ],
  "site/robots.txt": [
    "User-agent: *",
    "Sitemap: https://open-cycle.com/sitemap.xml"
  ],
  "site/sitemap.xml": [
    "https://open-cycle.com/",
    "https://open-cycle.com/blog/",
    "https://open-cycle.com/blog/local-only-period-tracker.html",
    "https://open-cycle.com/blog/health-app-data-sharing.html",
    "https://open-cycle.com/blog/period-tracker-privacy-questions.html",
    "https://open-cycle.com/blog/no-account-period-tracker.html",
    "https://open-cycle.com/blog/period-tracker-without-internet.html"
  ],
  "site/llms.txt": [
    "privacy-first period tracking app",
    "phone or browser",
    "https://open-cycle.com/blog/",
    "https://open-cycle.com/blog/no-account-period-tracker.html",
    "https://open-cycle.com/blog/period-tracker-without-internet.html",
    "https://github.com/kborndorff/open-cycle-source",
    "https://github.com/kborndorff/Open-Cycle"
  ],
  "site/blog/index.html": [
    "Period tracking privacy, in normal words",
    "privacy-first period",
    "local phone-only storage",
    "/blog/local-only-period-tracker.html",
    "/blog/health-app-data-sharing.html",
    "/blog/period-tracker-privacy-questions.html",
    "/blog/no-account-period-tracker.html",
    "/blog/period-tracker-without-internet.html"
  ],
  "site/blog/local-only-period-tracker.html": [
    "local-only period tracking",
    "phone or browser",
    "Local phone-only cycle tracking",
    "privacy-first period tracking app"
  ],
  "site/blog/health-app-data-sharing.html": [
    "Why people keep worrying about health app data",
    "Flo Health",
    "GoodRx",
    "BetterHelp",
    "local phone-only period tracker",
    "https://www.ftc.gov"
  ],
  "site/blog/period-tracker-privacy-questions.html": [
    "Questions to ask before using a cycle tracking app",
    "privacy-first period tracking app",
    "local phone-only tracker",
    "reproductive health privacy",
    "where your notes go"
  ],
  "site/blog/no-account-period-tracker.html": [
    "A period tracker should not need your email",
    "no-account period tracker",
    "There are no ads",
    "Local Cycle",
    "https://www.ftc.gov"
  ],
  "site/blog/period-tracker-without-internet.html": [
    "Why a period tracker may not need internet access",
    "local phone-only period tracker",
    "Android build does not request the internet permission",
    "fewer places your period data can go",
    "https://www.hhs.gov"
  ],
  "site/license.html": [
    "source-available, not open source",
    "public so people can inspect, audit, learn from, and verify",
    "Public visibility does not grant permission to profit from this work",
    "third-party app store redistribution"
  ],
  "scripts/validate-function-coverage.js": [
    "function-coverage.json",
    "Core local tracking",
    "Avoid network in local mode"
  ],
  "scripts/validate-signing-readiness.js": [
    "ready-for-private-keystore",
    "keystoreCreator",
    "does not read, print, or store"
  ],
  "scripts/deploy-site-local-safe.ps1": [
    "OpenCycle safe local Cloudflare Pages deploy",
    "site\\dist",
    "GetTempPath",
    "does not read, print, or store",
    "--commit-dirty=true",
    "wranglerArgs"
  ],
  "scripts/generate-play-data-safety-packet.js": [
    "Play Console data safety packet",
    "Data collected",
    "Does the app create accounts?",
    "clear all local cycle entries",
    "does not include Play Console credentials"
  ],
  "scripts/validate-play-data-safety-packet.js": [
    "Play data safety packet checks passed",
    "Data collected: None",
    "Data shared with third parties: No",
    "clear all local cycle entries",
    "must not include sensitive material"
  ],
  "scripts/build-aab.js": [
    "bundleRelease",
    "OPEN_CYCLE_ANDROID_BUILD_ROOT",
    "open-cycle-android-build",
    "--rerun-tasks",
    "fs.copyFileSync(candidate, canonicalOutput)",
    "ANDROID_HOME",
    "JAVA_HOME",
    "App Bundle generated at:"
  ],
  "apps/mobile/android/build.gradle": [
    "OPEN_CYCLE_ANDROID_BUILD_ROOT",
    "externalBuildRoot",
    "buildDir = externalBuildRoot"
  ],
  "scripts/sign-aab.js": [
    "ANDROID_KEYSTORE_PATH",
    "jarsigner",
    "-storepass:env",
    "Signed AAB written to"
  ],
  "scripts/validate-android-release.js": [
    "android.permission.INTERNET",
    "allowBackup=\"false\"",
    "requireSigned",
    "Android release checks passed."
  ],
  "scripts/android-local-release.js": [
    "Android local Play release",
    "mobile:signed-aab:evidence",
    "mobile:signed-aab:sync-evidence",
    "Signed Android release candidate is ready"
  ],
  "scripts/play-store-public-readiness.js": [
    "Play Store public readiness",
    "mobile:unsigned-aab:evidence",
    "ready-for-private-signing",
    "Only private signing remains"
  ],
  "scripts/play-store-private-readiness.js": [
    "Play Store private readiness",
    "mobile:signed-aab:sync-evidence",
    "validate:runtime-qa-report",
    "ready-for-play-upload"
  ],
  "scripts/play-store-complete-readiness.js": [
    "Play Store completion readiness",
    "validate:play-store-private-ready",
    "play-upload-confirmed",
    "Play Store completion checks passed"
  ],
  "scripts/print-unsigned-aab-evidence.js": [
    "Unsigned AAB evidence",
    "unsigned-aab-evidence.json",
    "does not read signing keys",
    "unsignedAabSha256"
  ],
  "scripts/print-signed-aab-evidence.js": [
    "Signed AAB evidence",
    "signed-aab-evidence.json",
    "does not read keystores",
    "signedAabSha256"
  ],
  "scripts/sync-signed-aab-evidence.js": [
    "Sync signed AAB evidence into private release reports",
    "signed-aab-evidence.json",
    "does not read keystores",
    "signedAabSha256"
  ],
  "scripts/generate-owner-action-packet.js": [
    "Owner action packet",
    "This packet is public-safe.",
    "liveCustomDomainPublication",
    "npm run validate:custom-domain:live",
    "pendingChecks",
    "Compact blocker report",
    "npm run generate:release-blockers",
    "npm run validate:play-store-complete",
    "Do not paste Cloudflare API tokens"
  ],
  "scripts/validate-owner-action-packet.js": [
    "Owner action packet checks passed.",
    "must not include sensitive material",
    "npm run validate:custom-domain:live",
    "npm run validate:github:live",
    "reports/release-blocker-report.md",
    "npm run validate:play-upload-confirmation -- --require-complete",
    "Do not paste Cloudflare API tokens"
  ],
  "scripts/generate-release-completion-matrix.js": [
    "release-completion-matrix.json",
    "release-completion-matrix.md",
    "pendingOwnerOnlyGates",
    "Secret boundary"
  ],
  "scripts/validate-release-completion-matrix.js": [
    "Release completion matrix checks passed.",
    "expectedPendingGates",
    "forbiddenSecretTerms",
    "Play Store"
  ],
  "scripts/generate-release-blocker-report.js": [
    "release-blocker-report.json",
    "release-blocker-report.md",
    "BLOCKER_GUIDANCE",
    "validate:play-store-complete"
  ],
  "scripts/validate-release-blocker-report.js": [
    "Release blocker report checks passed.",
    "expectedOwnerOnlyGates",
    "requiredCommands",
    "forbiddenText"
  ],
  "scripts/validate-public-push-readiness.js": [
    "public-push-readiness.json",
    "without reading secrets",
    "requiredFiles"
  ],
  "scripts/validate-proof-product-repository.js": [
    "OpenCycle proof/product repository validation",
    "public-safe-play-console-submit-bundle",
    "validate:proof-product-repository",
    "site/llms.txt",
    "product-uploads/play-console-submit"
  ],
  "scripts/validate-license-policy.js": [
    "license-policy.json",
    "source-available for scrutiny",
    "no commercial reuse"
  ],
  "scripts/validate-release-artifact-hygiene.js": [
    "Release artifact hygiene validation",
    "release-artifact-hygiene.json",
    "does not read keystores",
    "privateArtifacts"
  ],
  "scripts/validate-custom-domain-readiness.js": [
    "Custom domain readiness",
    "custom-domain-readiness.json",
    "https://open-cycle.com",
    "does not read DNS records"
  ],
  "scripts/validate-cloudflare-pages-domain-attachment.js": [
    "cloudflare-pages-domain-attachment.json",
    "npx.cmd",
    "wrangler",
    "open-cycle.com",
    "www.open-cycle.com",
    "does not read"
  ],
  "scripts/validate-live-custom-domain.js": [
    "Custom domain live checks passed",
    "live-custom-domain-publication.json",
    "https://open-cycle.com",
    "Custom domain URL must use HTTPS",
    "/license.html",
    "third-party app store redistribution"
  ],
  "scripts/validate-live-github-publication.js": [
    "site/license.html",
    "scripts/validate-license-policy.js",
    "validate:license",
    "npm run validate:site:live"
  ],
  "scripts/generate-github-repository-bundles.js": [
    "github-repositories",
    "Open-Cycle",
    "open-cycle-source",
    "product-uploads",
    "play-console-submit",
    "privateMaterialIncluded: false",
    "signedAabIncluded: false"
  ],
  "scripts/validate-github-repository-bundles.js": [
    "GitHub repository staging bundle checks passed",
    "https://github.com/kborndorff/Open-Cycle",
    "https://github.com/kborndorff/open-cycle-source",
    "product-uploads/play-console-submit/manifest.json",
    "privateMaterialIncluded",
    "signedAabIncluded"
  ],
  "scripts/owner-release-dry-run.js": [
    "Owner release dry run",
    "owner-release-dry-run.json",
    "keystoreCreationDryRun",
    "does not read, prompt for, print, or store",
    "--skip-live-cloudflare-domains",
    "release:public-ready"
  ],
  "scripts/public-release-readiness.js": [
    "Public release readiness",
    "validate:cloudflare-pages-domains:live",
    "--skip-live-cloudflare-domains",
    "Live Cloudflare Pages domain-attachment"
  ],
  "scripts/print-github-cli-help.ps1": [
    "gh auth login",
    "does not read, print, or store"
  ],
  "scripts/print-github-publication-help.ps1": [
    "OpenCycle GitHub publication helper",
    "does not run git",
    "kborndorff/Open-Cycle",
    "publish this worktree to the default branch",
    "git push -u origin",
    "npm run validate:github:live",
    "No secret values are printed"
  ],
  "scripts/print-owner-tool-env.ps1": [
    "jarsigner.exe",
    "ANDROID_HOME",
    "does not read, print, or store"
  ],
  "scripts/print-next-release-steps.js": [
    "OpenCycle release next steps",
    "Release blocker report: passed",
    "Owner go/no-go blocker report:",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "reports/release-blocker-report.md",
    "Owner-safe rehearsal:",
    "Latest live diagnostic reports",
    "reports/live-custom-domain-publication.json",
    "reports/cloudflare-pages-domain-attachment.json",
    "reports/live-github-publication.json",
    "reports/live-github-actions.json",
    "Attach Cloudflare Pages custom domains",
    "Use the helper for dashboard steps, attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages, then run npm run validate:custom-domain:live.",
    "npm run owner-tools:cloudflare-domain-help",
    "npm run owner-tools:publish-help",
    "npm run owner-tools:android-signing-help",
    "npm run owner-tools:runtime-qa-help",
    "npm run owner-tools:play-upload-help",
    "Likely owner action: attach open-cycle.com to the Cloudflare Pages project that serves site/dist.",
    "docs/cloudflare-pages-domain-diagnostics.md",
    "npm run validate:cloudflare-pages-domains:live",
    "Likely owner action: attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages.",
    "Likely owner action: push this worktree to the public repository default branch.",
    "Likely owner action: publish the workflow files, then wait for Actions to run.",
    "OneDrive-safe local Wrangler deploy",
    "OneDrive-safe deploy fallback",
    "npm run validate:custom-domain:live",
    "npm run release:owner-dry-run",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run mobile:create-upload-keystore -- -DryRun",
    "Recommended next actions:"
  ],
  "scripts/setup-github-deployment-secrets.ps1": [
    "Read-Host $Prompt -AsSecureString",
    "Set-GitHubSecretFromPrompt -Name \"CF_API_TOKEN\"",
    "Set-GitHubSecretFromPrompt -Name \"CF_ACCOUNT_ID\""
  ],
  ".github/workflows/ci.yml": [
    "npm run validate:proof-product-repository",
    "npm run build:site",
    "npm run validate:site",
    "contents: read"
  ],
  ".github/workflows/android-aab.yml": [
    "Validate public Play evidence",
    "npm run validate:proof-product-repository"
  ],
  "wrangler.toml": [
    "name = \"open-cycle-site\"",
    "pages_build_output_dir = \"site/dist\""
  ],
  ".github/workflows/deploy-site.yml": [
    "workflow_dispatch:",
    "pages deploy site/dist",
    "open-cycle-site",
    "Skip deploy without Cloudflare secrets",
    "npm run validate:license",
    "npm run validate:custom-domain:live"
  ]
};

const sensitiveNames = [
  "CF_API_TOKEN",
  "CF_ACCOUNT_ID",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_PATH",
  "API_KEY",
  "VITE_API_KEY"
];

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function isPlaceholder(value) {
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

function checkNoAssignedSecrets(relativePath, contents) {
  const lines = contents.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#") || line.startsWith("//") || line.startsWith("*")) {
      continue;
    }

    for (const name of sensitiveNames) {
      const match = new RegExp(`^(?:export\\s+|\\$env:)?${name}\\s*=\\s*([^\\s#]+)`).exec(line);
      if (match && !isPlaceholder(match[1])) {
        fail(`Possible committed secret in ${relativePath}:${index + 1} (${name}).`);
      }
    }
  }
}

function checkFile(relativePath, expectedValues) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`${relativePath} is missing from the local public-push set.`);
    return { path: relativePath, exists: false, bytes: 0 };
  }

  const contents = read(relativePath);
  checkNoAssignedSecrets(relativePath, contents);
  for (const expected of expectedValues) {
    if (!includesNormalized(contents, expected)) {
      fail(`${relativePath} is missing expected public-push content: ${expected}`);
    }
  }

  return {
    path: relativePath,
    exists: true,
    bytes: fs.statSync(absolutePath).size
  };
}

function main() {
  console.log("Local public GitHub push readiness");
  console.log("This check validates local publishable files without reading secrets, using Git, or making network requests.");

  const files = Object.entries(requiredFiles).map(([relativePath, expectedValues]) =>
    checkFile(relativePath, expectedValues)
  );

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    repository: "https://github.com/kborndorff/Open-Cycle",
    requiredFileCount: Object.keys(requiredFiles).length,
    files,
    secretSafe: true,
    networkUsed: false,
    gitUsed: false,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Public push readiness failed. Report written to ${reportPath}`);
    process.exit(process.exitCode || 1);
  }

  console.log(`Public push readiness checks passed. Report written to ${reportPath}`);
}

main();

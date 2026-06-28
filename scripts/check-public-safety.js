const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const ignoredDirs = new Set([
  ".git",
  ".npm-cache",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "ios"
]);
const publicExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".toml",
  ".html",
  ".css",
  ".svg",
  ".txt",
  ".ps1",
  ".sh",
  ".example"
]);
const sensitiveNames = [
  "CF_API_TOKEN",
  "CF_ACCOUNT_ID",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_PATH",
  "API_KEY",
  "VITE_API_KEY"
];
const requiredGitignoreEntries = [
  ".env",
  ".env.local",
  "*.jks",
  "*.keystore",
  "*.keystore.*",
  "*.aab",
  "*.apk",
  "*.p12",
  "*.pfx",
  "*.pem",
  "*.key",
  "*.mobileprovision",
  "*.cer",
  "apps/mobile/*.jks",
  "apps/mobile/**/*.jks",
  "apps/mobile/*.keystore",
  "apps/mobile/**/*.keystore",
  "apps/mobile/android/.gradle/",
  "apps/mobile/android/local.properties",
  "apps/mobile/android/app/build/",
  "apps/mobile/ios/",
  "reports/"
];
const requiredLicenseTerms = [
  "This is a source-available license, not an open-source license.",
  "public so people can inspect, audit, learn from, and verify",
  "Public visibility does not grant permission to profit from this work",
  "Publish, submit, distribute, or make available builds of this software through",
  "Google Play, the Apple App Store, F-Droid, Microsoft Store",
  "hosted service, mobile app, paid app, subscription product, or competing product",
  "Security researchers, privacy reviewers, journalists, educators, and users are welcome to inspect"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
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

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (publicExtensions.has(ext) || entry.name.endsWith(".env.example")) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkLicense() {
  if (!fs.existsSync(path.join(root, "LICENSE.md"))) {
    fail("Missing LICENSE.md.");
    return;
  }

  const license = read("LICENSE.md");
  for (const expected of requiredLicenseTerms) {
    if (!includesNormalized(license, expected)) {
      fail(`LICENSE.md is missing expected source-available restriction: ${expected}`);
    }
  }

  const packageJson = JSON.parse(read("package.json"));
  if (packageJson.license !== "LicenseRef-OpenCycle-Source-Available") {
    fail("package.json must use LicenseRef-OpenCycle-Source-Available.");
  }
  if (!packageJson.scripts?.["validate:license"]) {
    fail("package.json must expose validate:license for dedicated license policy validation.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-license-policy.js"))) {
    fail("Missing scripts/validate-license-policy.js.");
  }

  const readme = read("README.md");
  for (const expected of [
    "source-available, not open source",
    "app store redistribution by others",
    "commercial reuse",
    "npm run release:next",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "npm run release:handoff"
  ]) {
    if (!includesNormalized(readme, expected)) {
      fail(`README.md is missing expected license notice: ${expected}`);
    }
  }
}

function checkSecurityPolicy() {
  const securityPath = path.join(root, "SECURITY.md");
  if (!fs.existsSync(securityPath)) {
    fail("Missing SECURITY.md for public vulnerability reporting.");
    return;
  }

  const security = read("SECURITY.md");
  for (const expected of ["Cloudflare API tokens", "Android upload keystores", "No Android internet permission"]) {
    if (!security.includes(expected)) {
      fail(`SECURITY.md is missing expected guidance: ${expected}`);
    }
  }
}

function checkGitignore() {
  const gitignore = read(".gitignore");
  for (const entry of requiredGitignoreEntries) {
    if (!gitignore.includes(entry)) {
      fail(`.gitignore is missing required sensitive/generated entry: ${entry}`);
    }
  }
}

function checkSecretAssignments() {
  const files = walk(root);
  for (const file of files) {
    const relative = path.relative(root, file);
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line || line.startsWith("#") || line.startsWith("//") || line.startsWith("*")) {
        continue;
      }

      for (const name of sensitiveNames) {
        const match = new RegExp(`^(?:export\\s+|\\$env:)?${name}\\s*=\\s*([^\\s#]+)`).exec(line);
        if (match && !isPlaceholder(match[1])) {
          fail(`Possible committed secret in ${relative}:${index + 1} (${name}).`);
        }
      }
    }
  }
}

function checkMobileDefault() {
  const webEnvExample = read("apps/web/.env.example");
  if (webEnvExample.includes("VITE_API_BASE") || webEnvExample.includes("VITE_API_KEY")) {
    fail("apps/web/.env.example must not expose remote API configuration for the local-only app.");
  }
}

function checkCycleTrackingTerminology() {
  const allowedLegacyMigrationFile = path.join(root, "scripts", "generate-runtime-qa-report.js");
  const selfFile = path.join(root, "scripts", "check-public-safety.js");
  const forbiddenSignals = [
    "routeName",
    "distanceKm",
    "durationMinutes",
    "Ride Log",
    "Save ride",
    "ride tracking",
    "ride data",
    "ride logging",
    "ride history",
    "ride log",
    "route planning",
    "team workflows",
    "cycling tracker",
    "cycling app",
    "ride analytics",
    "coaching and team",
    "route names, distances, durations",
    "route name, distance, duration"
  ];

  for (const file of walk(root)) {
    if (file === allowedLegacyMigrationFile || file === selfFile) {
      continue;
    }

    const relative = path.relative(root, file);
    const contents = fs.readFileSync(file, "utf8");
    for (const signal of forbiddenSignals) {
      if (contents.toLowerCase().includes(signal.toLowerCase())) {
        fail(`${relative} contains stale ride/route tracking language or fields: ${signal}`);
      }
    }
  }

  const webTypes = read("apps/web/src/types.ts");
  const apiTypes = read("apps/api/src/types.ts");
  for (const [label, contents] of [
    ["apps/web/src/types.ts", webTypes],
    ["apps/api/src/types.ts", apiTypes]
  ]) {
    for (const expected of ["flow: string", "symptoms: string", "mood: string"]) {
      if (!contents.includes(expected)) {
        fail(`${label} must expose the local cycle-entry field: ${expected}`);
      }
    }
  }
}

function checkPrivacyPolicy() {
  const privacySource = path.join(root, "site", "privacy.html");
  if (!fs.existsSync(privacySource)) {
    fail("site/privacy.html is required for Play Store privacy policy hosting.");
  }
  const sitePackage = JSON.parse(read("site/package.json"));
  if (!String(sitePackage.scripts?.build || "").includes("copy-site-static-pages")) {
    fail("site build must copy privacy.html into site/dist.");
  }
  const packageJson = JSON.parse(read("package.json"));
  if (!packageJson.scripts?.["validate:site:live"]) {
    fail("Missing validate:site:live script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-live-site.js"))) {
    fail("Missing scripts/validate-live-site.js.");
  }
  const app = read("apps/web/src/App.tsx");
  for (const expected of [
    "Your privacy",
    "https://open-cycle.com/privacy",
    "https://open-cycle.com/license.html",
    "https://github.com/kborndorff/open-cycle-source",
    "no ads",
    "no required cloud sync"
  ]) {
    if (!includesNormalized(app, expected)) {
      fail(`App must expose public privacy/source/license link or notice: ${expected}`);
    }
  }
}

function checkKeystoreHelpers() {
  const windowsHelper = read("scripts/create-android-upload-keystore.ps1");
  const bashHelper = read("scripts/create-android-upload-keystore.sh");
  if (!windowsHelper.includes("$HOME\\.opencycle\\keys\\upload-keystore.jks")) {
    fail("Windows upload-keystore helper must default outside the repository.");
  }
  if (!windowsHelper.includes("[switch]$DryRun") || !windowsHelper.includes("No keystore will be created and no passwords will be requested.")) {
    fail("Windows upload-keystore helper must support a no-secret dry run.");
  }
  if (!bashHelper.includes("$HOME/.opencycle/keys/upload-keystore.jks")) {
    fail("Bash upload-keystore helper must default outside the repository.");
  }
  if (!bashHelper.includes("ANDROID_UPLOAD_KEY_DRY_RUN") || !bashHelper.includes("No keystore will be created and no passwords will be requested.")) {
    fail("Bash upload-keystore helper must support a no-secret dry run.");
  }
}

function checkAndroidWorkflow() {
  const workflowPath = path.join(root, ".github", "workflows", "android-aab.yml");
  if (!fs.existsSync(workflowPath)) {
    fail("Missing .github/workflows/android-aab.yml for public unsigned AAB validation.");
    return;
  }

  const workflow = read(".github/workflows/android-aab.yml");
  for (const expected of [
    "Validate public Play evidence",
    "npm run validate:proof-product-repository"
  ]) {
    if (!workflow.includes(expected)) {
      fail(`Android AAB workflow is missing expected step: ${expected}`);
    }
  }
  if (
    workflow.includes("ANDROID_KEYSTORE_PASSWORD") ||
    workflow.includes("CF_API_TOKEN") ||
    workflow.includes("actions/upload-artifact@v4") ||
    workflow.includes("apps/mobile/android/gradlew")
  ) {
    fail("Android AAB workflow must not reference signing or Cloudflare secrets.");
  }

  const androidValidator = read("scripts/validate-android-release.js");
  for (const expected of ["checkStoreIdentity", "capacitor.config.ts", "versionCode", "versionName", "listing.json"]) {
    if (!androidValidator.includes(expected)) {
      fail(`Android release validator is missing store identity check: ${expected}`);
    }
  }
}

function checkDeploymentSecretsDocs() {
  const docsPath = path.join(root, "docs", "deployment-secrets.md");
  if (!fs.existsSync(docsPath)) {
    fail("Missing docs/deployment-secrets.md for public-safe deployment secret setup.");
    return;
  }
  const ownerChecklistPath = path.join(root, "docs", "release-owner-checklist.md");
  if (!fs.existsSync(ownerChecklistPath)) {
    fail("Missing docs/release-owner-checklist.md for account-side release handoff.");
    return;
  }
  const ownerToolingPath = path.join(root, "docs", "owner-tooling.md");
  if (!fs.existsSync(ownerToolingPath)) {
    fail("Missing docs/owner-tooling.md for owner-side release tool setup.");
    return;
  }
  const releaseEvidencePath = path.join(root, "docs", "release-evidence.md");
  if (!fs.existsSync(releaseEvidencePath)) {
    fail("Missing docs/release-evidence.md for public-safe evidence review.");
    return;
  }
  const githubWebPublicationPath = path.join(root, "docs", "github-web-publication.md");
  if (!fs.existsSync(githubWebPublicationPath)) {
    fail("Missing docs/github-web-publication.md for no-gh public publication fallback.");
    return;
  }

  const docs = read("docs/deployment-secrets.md");
  for (const expected of [
    "npm run github:setup-deploy-secrets",
    "npm run deploy:site:local",
    "npm run deploy:site:local:npx",
    "wrangler.toml",
    "gh secret set CF_API_TOKEN",
    "gh secret set CF_ACCOUNT_ID",
    "CF_PAGES_PROJECT_NAME",
    "Do not commit Cloudflare API tokens",
    "Keep the Android upload keystore local by default"
  ]) {
    if (!docs.includes(expected)) {
      fail(`docs/deployment-secrets.md is missing expected guidance: ${expected}`);
    }
  }
  const ownerChecklist = read("docs/release-owner-checklist.md");
  for (const expected of [
    "npm run github:setup-deploy-secrets",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run validate:custom-domain",
    "docs/custom-domain-cloudflare.md",
    "npm run release:public-ready",
    "npm run mobile:release:android:prompted",
    "npm run mobile:release:android:prompted -- -DryRun",
    "npm run validate:runtime-qa-report -- --require-complete",
    "npm run validate:play-upload-confirmation -- --require-complete",
    "npm run validate:play-store-complete",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "reports/release-blocker-report.md",
    "npm run release:next",
    "npm run release:handoff",
    "npm run validate:owner-tools",
    "npm run release:owner-dry-run",
    "npm run validate:signing-readiness",
    "npm run validate:cloudflare-readiness",
    "npm run owner-tools:gh-help",
    "npm run owner-tools:env-help",
    "npm run owner-tools:wrangler-help",
    "workflow_dispatch",
    "docs/owner-tooling.md",
    "docs/release-evidence.md",
    "npm run validate:release-evidence-docs",
    "docs/github-web-publication.md",
    "Keep secret values, keystore files, Play Console credentials, and signed artifacts out of GitHub"
  ]) {
    if (!includesNormalized(ownerChecklist, expected)) {
      fail(`docs/release-owner-checklist.md is missing expected release-owner step: ${expected}`);
    }
  }
  const ownerTooling = read("docs/owner-tooling.md");
  for (const expected of [
    "npm run validate:owner-tools",
    "npm run owner-tools:gh-help",
    "npm run owner-tools:env-help",
    "npm run owner-tools:wrangler-help",
    "gh auth login",
    "jarsigner -help",
    "keytool -help",
    "ANDROID_HOME",
    "wrangler --version",
    "npm run mobile:release:android:prompted",
    "docs/github-web-publication.md",
    "does not read, print, or store secret values",
    "Do not paste Cloudflare tokens, Play Console credentials, upload keystore passwords, or signed artifacts"
  ]) {
    if (!includesNormalized(ownerTooling, expected)) {
      fail(`docs/owner-tooling.md is missing expected setup guidance: ${expected}`);
    }
  }
  const githubWebPublication = read("docs/github-web-publication.md");
  for (const expected of [
    "https://github.com/kborndorff/Open-Cycle/settings/secrets/actions",
    "https://github.com/kborndorff/Open-Cycle/settings/variables/actions",
    "CF_API_TOKEN",
    "CF_ACCOUNT_ID",
    "CF_PAGES_PROJECT_NAME = open-cycle-site",
    "CF_WORKER_NAME = open-cycle-legacy-redirect",
    "npm run validate:github:live",
    "npm run validate:github:actions",
    "Do not paste Cloudflare API tokens"
  ]) {
    if (!includesNormalized(githubWebPublication, expected)) {
      fail(`docs/github-web-publication.md is missing expected public-safe fallback guidance: ${expected}`);
    }
  }
  const releaseEvidence = read("docs/release-evidence.md");
  for (const expected of [
    "open-cycle is public for scrutiny",
    "npm run release:handoff",
    "npm run generate:release-evidence-index",
    "npm run validate:release-evidence-index",
    "npm run validate:release-evidence-docs",
    "reports/release-evidence-index.md",
    "Never paste or commit secret values",
    "npm run validate:play-store-complete"
  ]) {
    if (!includesNormalized(releaseEvidence, expected)) {
      fail(`docs/release-evidence.md is missing expected evidence guidance: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "setup-github-deployment-secrets.ps1"))) {
    fail("Missing scripts/setup-github-deployment-secrets.ps1.");
  }
  const packageJson = JSON.parse(read("package.json"));
  if (!packageJson.scripts?.["github:setup-deploy-secrets"]) {
    fail("Missing github:setup-deploy-secrets script.");
  }

  const deploySiteWorkflow = read(".github/workflows/deploy-site.yml");
  for (const expected of ["workflow_dispatch:", "secrets.CF_API_TOKEN", "secrets.CF_ACCOUNT_ID", "pages deploy site/dist", "open-cycle-site", "Skip deploy without Cloudflare secrets", "npm run validate:license", "npm run validate:custom-domain:live"]) {
    if (!deploySiteWorkflow.includes(expected)) {
      fail(`deploy-site workflow is missing expected deployment setting: ${expected}`);
    }
  }
  const deployRedirectWorkerWorkflow = read(".github/workflows/deploy-redirect-worker.yml");
  if (!deployRedirectWorkerWorkflow.includes("workflow_dispatch:")) {
    fail("deploy-redirect-worker workflow must support manual workflow_dispatch reruns.");
  }
  const wranglerConfigPath = path.join(root, "wrangler.toml");
  if (!fs.existsSync(wranglerConfigPath)) {
    fail("Missing wrangler.toml for optional local Cloudflare Pages deployment.");
  } else {
    const wranglerConfig = read("wrangler.toml");
    for (const expected of ['name = "open-cycle-site"', 'pages_build_output_dir = "site/dist"']) {
      if (!wranglerConfig.includes(expected)) {
        fail(`wrangler.toml is missing expected Pages setting: ${expected}`);
      }
    }
  }
  for (const expectedScript of ["deploy:site:local", "deploy:site:local:npx"]) {
    if (!packageJson.scripts?.[expectedScript]) {
      fail(`Missing ${expectedScript} script for optional local Wrangler Pages deployment.`);
    }
    if (!String(packageJson.scripts?.[expectedScript] || "").includes("wrangler pages deploy site/dist")) {
      fail(`${expectedScript} must deploy site/dist through Wrangler Pages.`);
    }
  }
}

function checkPlayAssetPipeline() {
  const packageJson = JSON.parse(read("package.json"));
  const releaseScript = String(packageJson.scripts?.["validate:release"] || "");
  for (const expected of [
    "validate:functions",
    "validate:release-handoff",
    "validate:release-artifacts",
    "validate:workflows",
    "generate:workflow-provenance",
    "validate:workflow-provenance",
    "validate:local-only-deps",
    "validate:local-only-runtime",
    "generate:privacy-parity",
    "validate:privacy-parity",
    "generate:android-permissions",
    "validate:android-permissions",
    "generate:play-assets",
    "export:play-assets",
    "validate:play-assets",
    "generate:play-metadata",
    "validate:play-metadata",
    "generate:play-release-notes",
    "validate:play-release-notes"
  ]) {
    if (!releaseScript.includes(expected)) {
      fail(`validate:release must include ${expected}.`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "export-play-assets.js"))) {
    fail("Missing scripts/export-play-assets.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-store-metadata.js"))) {
    fail("Missing scripts/generate-play-store-metadata.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-store-metadata.js"))) {
    fail("Missing scripts/validate-play-store-metadata.js.");
  }
  if (!packageJson.scripts?.["generate:play-data-safety"]) {
    fail("Missing generate:play-data-safety script.");
  }
  if (!packageJson.scripts?.["validate:play-data-safety"]) {
    fail("Missing validate:play-data-safety script.");
  }
  if (!packageJson.scripts?.["generate:play-content-rating"]) {
    fail("Missing generate:play-content-rating script.");
  }
  if (!packageJson.scripts?.["validate:play-content-rating"]) {
    fail("Missing validate:play-content-rating script.");
  }
  if (!packageJson.scripts?.["generate:play-health-declaration"]) {
    fail("Missing generate:play-health-declaration script.");
  }
  if (!packageJson.scripts?.["validate:play-health-declaration"]) {
    fail("Missing validate:play-health-declaration script.");
  }
  if (!packageJson.scripts?.["generate:play-app-access"]) {
    fail("Missing generate:play-app-access script.");
  }
  if (!packageJson.scripts?.["validate:play-app-access"]) {
    fail("Missing validate:play-app-access script.");
  }
  if (!packageJson.scripts?.["generate:play-ads-declaration"]) {
    fail("Missing generate:play-ads-declaration script.");
  }
  if (!packageJson.scripts?.["validate:play-ads-declaration"]) {
    fail("Missing validate:play-ads-declaration script.");
  }
  if (!packageJson.scripts?.["generate:play-target-audience"]) {
    fail("Missing generate:play-target-audience script.");
  }
  if (!packageJson.scripts?.["validate:play-target-audience"]) {
    fail("Missing validate:play-target-audience script.");
  }
  if (!packageJson.scripts?.["generate:play-testing-rollout"]) {
    fail("Missing generate:play-testing-rollout script.");
  }
  if (!packageJson.scripts?.["validate:play-testing-rollout"]) {
    fail("Missing validate:play-testing-rollout script.");
  }
  if (!packageJson.scripts?.["generate:play-app-content"]) {
    fail("Missing generate:play-app-content script.");
  }
  if (!packageJson.scripts?.["validate:play-app-content"]) {
    fail("Missing validate:play-app-content script.");
  }
  if (!packageJson.scripts?.["generate:android-signing-handoff"]) {
    fail("Missing generate:android-signing-handoff script.");
  }
  if (!packageJson.scripts?.["validate:android-signing-handoff"]) {
    fail("Missing validate:android-signing-handoff script.");
  }
  if (!packageJson.scripts?.["generate:play-production-readiness"]) {
    fail("Missing generate:play-production-readiness script.");
  }
  if (!packageJson.scripts?.["validate:play-production-readiness"]) {
    fail("Missing validate:play-production-readiness script.");
  }
  if (!packageJson.scripts?.["generate:play-release-candidate"]) {
    fail("Missing generate:play-release-candidate script.");
  }
  if (!packageJson.scripts?.["validate:play-release-candidate"]) {
    fail("Missing validate:play-release-candidate script.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-data-safety")) {
    fail("validate:release must include generate:play-data-safety.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-data-safety")) {
    fail("validate:release must include validate:play-data-safety.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-content-rating")) {
    fail("validate:release must include generate:play-content-rating.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-content-rating")) {
    fail("validate:release must include validate:play-content-rating.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-health-declaration")) {
    fail("validate:release must include generate:play-health-declaration.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-health-declaration")) {
    fail("validate:release must include validate:play-health-declaration.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-app-access")) {
    fail("validate:release must include generate:play-app-access.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-app-access")) {
    fail("validate:release must include validate:play-app-access.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-ads-declaration")) {
    fail("validate:release must include generate:play-ads-declaration.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-ads-declaration")) {
    fail("validate:release must include validate:play-ads-declaration.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-target-audience")) {
    fail("validate:release must include generate:play-target-audience.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-target-audience")) {
    fail("validate:release must include validate:play-target-audience.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-testing-rollout")) {
    fail("validate:release must include generate:play-testing-rollout.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-testing-rollout")) {
    fail("validate:release must include validate:play-testing-rollout.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("generate:play-app-content")) {
    fail("validate:release must include generate:play-app-content.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:play-app-content")) {
    fail("validate:release must include validate:play-app-content.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-release-candidate")) {
    fail("release:handoff must generate the Play release candidate packet after Play preflight.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-release-candidate")) {
    fail("release:handoff must validate the Play release candidate packet after Play preflight.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:android-signing-handoff")) {
    fail("release:handoff must generate the Android signing handoff packet after signing readiness.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:android-signing-handoff")) {
    fail("release:handoff must validate the Android signing handoff packet after signing readiness.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-production-readiness")) {
    fail("release:handoff must generate the Play production readiness packet before owner action packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-production-readiness")) {
    fail("release:handoff must validate the Play production readiness packet before owner action packet.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-data-safety-packet.js"))) {
    fail("Missing scripts/generate-play-data-safety-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-data-safety-packet.js"))) {
    fail("Missing scripts/validate-play-data-safety-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-content-rating-packet.js"))) {
    fail("Missing scripts/generate-play-content-rating-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-content-rating-packet.js"))) {
    fail("Missing scripts/validate-play-content-rating-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-health-declaration-packet.js"))) {
    fail("Missing scripts/generate-play-health-declaration-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-health-declaration-packet.js"))) {
    fail("Missing scripts/validate-play-health-declaration-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-app-access-packet.js"))) {
    fail("Missing scripts/generate-play-app-access-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-app-access-packet.js"))) {
    fail("Missing scripts/validate-play-app-access-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-ads-declaration-packet.js"))) {
    fail("Missing scripts/generate-play-ads-declaration-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-ads-declaration-packet.js"))) {
    fail("Missing scripts/validate-play-ads-declaration-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-target-audience-packet.js"))) {
    fail("Missing scripts/generate-play-target-audience-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-target-audience-packet.js"))) {
    fail("Missing scripts/validate-play-target-audience-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-testing-rollout-packet.js"))) {
    fail("Missing scripts/generate-play-testing-rollout-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-testing-rollout-packet.js"))) {
    fail("Missing scripts/validate-play-testing-rollout-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-app-content-packet.js"))) {
    fail("Missing scripts/generate-play-app-content-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-app-content-packet.js"))) {
    fail("Missing scripts/validate-play-app-content-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-release-candidate-packet.js"))) {
    fail("Missing scripts/generate-play-release-candidate-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-release-candidate-packet.js"))) {
    fail("Missing scripts/validate-play-release-candidate-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-android-signing-handoff-packet.js"))) {
    fail("Missing scripts/generate-android-signing-handoff-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-android-signing-handoff-packet.js"))) {
    fail("Missing scripts/validate-android-signing-handoff-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-production-readiness-packet.js"))) {
    fail("Missing scripts/generate-play-production-readiness-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-production-readiness-packet.js"))) {
    fail("Missing scripts/validate-play-production-readiness-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-release-notes.js"))) {
    fail("Missing scripts/generate-play-release-notes.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-release-notes.js"))) {
    fail("Missing scripts/validate-play-release-notes.js.");
  }
  if (!packageJson.scripts?.["preflight:play-store"]) {
    fail("Missing preflight:play-store script.");
  }
  if (!packageJson.scripts?.["generate:play-console-packet"]) {
    fail("Missing generate:play-console-packet script.");
  }
  if (!packageJson.scripts?.["validate:play-console-packet"]) {
    fail("Missing validate:play-console-packet script.");
  }
  if (!packageJson.scripts?.["generate:play-console-field-map"]) {
    fail("Missing generate:play-console-field-map script.");
  }
  if (!packageJson.scripts?.["validate:play-console-field-map"]) {
    fail("Missing validate:play-console-field-map script.");
  }
  if (!packageJson.scripts?.["generate:play-console-submit-bundle"]) {
    fail("Missing generate:play-console-submit-bundle script.");
  }
  if (!packageJson.scripts?.["validate:play-console-submit-bundle"]) {
    fail("Missing validate:play-console-submit-bundle script.");
  }
  if (!packageJson.scripts?.["generate:play-upload-confirmation"]) {
    fail("Missing generate:play-upload-confirmation script.");
  }
  if (!packageJson.scripts?.["validate:play-upload-confirmation"]) {
    fail("Missing validate:play-upload-confirmation script.");
  }
  if (!packageJson.scripts?.["generate:runtime-qa-report"]) {
    fail("Missing generate:runtime-qa-report script.");
  }
  if (!packageJson.scripts?.["validate:runtime-qa-report"]) {
    fail("Missing validate:runtime-qa-report script.");
  }
  if (!packageJson.scripts?.["generate:github-publication-packet"]) {
    fail("Missing generate:github-publication-packet script.");
  }
  if (!packageJson.scripts?.["validate:github-publication-packet"]) {
    fail("Missing validate:github-publication-packet script.");
  }
  if (!packageJson.scripts?.["validate:github:live"]) {
    fail("Missing validate:github:live script.");
  }
  if (!packageJson.scripts?.["validate:github:actions"]) {
    fail("Missing validate:github:actions script.");
  }
  if (!packageJson.scripts?.["release:status"]) {
    fail("Missing release:status script.");
  }
  if (!packageJson.scripts?.["validate:release-status"]) {
    fail("Missing validate:release-status script.");
  }
  if (!packageJson.scripts?.["release:audit"]) {
    fail("Missing release:audit script.");
  }
  if (!packageJson.scripts?.["validate:release-audit"]) {
    fail("Missing validate:release-audit script.");
  }
  if (!packageJson.scripts?.["generate:owner-action-packet"]) {
    fail("Missing generate:owner-action-packet script.");
  }
  if (!packageJson.scripts?.["validate:owner-action-packet"]) {
    fail("Missing validate:owner-action-packet script.");
  }
  if (!packageJson.scripts?.["release:public-ready"]) {
    fail("Missing release:public-ready script.");
  }
  if (!packageJson.scripts?.["release:next"]) {
    fail("Missing release:next script.");
  }
  if (!packageJson.scripts?.["release:owner-dry-run"]) {
    fail("Missing release:owner-dry-run script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "owner-release-dry-run.js"))) {
    fail("Missing scripts/owner-release-dry-run.js.");
  }
  const ownerDryRun = read("scripts/owner-release-dry-run.js");
  for (const expected of [
    "Owner release dry run",
    "github:setup-deploy-secrets",
    "-DryRun",
    "mobile:create-upload-keystore",
    "mobile:release:android:prompted",
    "release:public-ready",
    "--dry-run",
    "does not read, prompt for, print, or store"
  ]) {
    if (!includesNormalized(ownerDryRun, expected)) {
      fail(`Owner dry-run helper is missing expected safe rehearsal content: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["validate:owner-tools"]) {
    fail("Missing validate:owner-tools script.");
  }
  if (!packageJson.scripts?.["validate:signing-readiness"]) {
    fail("Missing validate:signing-readiness script.");
  }
  if (!packageJson.scripts?.["validate:cloudflare-readiness"]) {
    fail("Missing validate:cloudflare-readiness script.");
  }
  if (!packageJson.scripts?.["validate:custom-domain"]) {
    fail("Missing validate:custom-domain script.");
  }
  if (!packageJson.scripts?.["generate:custom-domain-dns"]) {
    fail("Missing generate:custom-domain-dns script.");
  }
  if (!packageJson.scripts?.["validate:custom-domain-dns"]) {
    fail("Missing validate:custom-domain-dns script.");
  }
  if (!packageJson.scripts?.["validate:custom-domain:live"]) {
    fail("Missing validate:custom-domain:live script.");
  }
  if (!packageJson.scripts?.["validate:public-push"]) {
    fail("Missing validate:public-push script.");
  }
  if (!packageJson.scripts?.["validate:release-artifacts"]) {
    fail("Missing validate:release-artifacts script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-public-push-readiness.js"))) {
    fail("Missing scripts/validate-public-push-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-release-artifact-hygiene.js"))) {
    fail("Missing scripts/validate-release-artifact-hygiene.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-signing-readiness.js"))) {
    fail("Missing scripts/validate-signing-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-cloudflare-readiness.js"))) {
    fail("Missing scripts/validate-cloudflare-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-custom-domain-readiness.js"))) {
    fail("Missing scripts/validate-custom-domain-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-custom-domain-dns-diagnostics.js"))) {
    fail("Missing scripts/generate-custom-domain-dns-diagnostics.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-custom-domain-dns-diagnostics.js"))) {
    fail("Missing scripts/validate-custom-domain-dns-diagnostics.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-live-custom-domain.js"))) {
    fail("Missing scripts/validate-live-custom-domain.js.");
  }
  const cloudflareReadiness = read("scripts/validate-cloudflare-readiness.js");
  for (const expected of ["ready-for-cloudflare-secrets", "Cloudflare deployment readiness", "without reading or printing Cloudflare tokens", "pages deploy site/dist"]) {
    if (!includesNormalized(cloudflareReadiness, expected)) {
      fail(`Cloudflare readiness validator is missing expected safety/setup content: ${expected}`);
    }
  }
  const customDomainReadiness = read("scripts/validate-custom-domain-readiness.js");
  for (const expected of ["Custom domain readiness", "https://open-cycle.com", "custom-domain-readiness.json", "does not read DNS records"]) {
    if (!includesNormalized(customDomainReadiness, expected)) {
      fail(`Custom domain readiness validator is missing expected public-safe content: ${expected}`);
    }
  }
  const liveCustomDomainValidator = read("scripts/validate-live-custom-domain.js");
  for (const expected of ["Custom domain live checks passed", "live-custom-domain-publication.json", "https://open-cycle.com", "Custom domain URL must use HTTPS", "/license.html", "third-party app store redistribution"]) {
    if (!includesNormalized(liveCustomDomainValidator, expected)) {
      fail(`Live custom domain validator is missing expected content: ${expected}`);
    }
  }
  const customDomainDnsDiagnostics = read("scripts/generate-custom-domain-dns-diagnostics.js");
  for (const expected of ["custom-domain-dns-diagnostics.json", "open-cycle.com", "www.open-cycle.com", "checkedWithoutSecrets", "npm run validate:custom-domain:live"]) {
    if (!includesNormalized(customDomainDnsDiagnostics, expected)) {
      fail(`Custom domain DNS diagnostics generator is missing expected content: ${expected}`);
    }
  }
  const signingReadiness = read("scripts/validate-signing-readiness.js");
  for (const expected of ["ready-for-private-keystore", "does not read, print, or store", "keystore passwords", "jarsigner", "keytool"]) {
    if (!includesNormalized(signingReadiness, expected)) {
      fail(`Signing readiness validator is missing expected safety/setup content: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["owner-tools:gh-help"]) {
    fail("Missing owner-tools:gh-help script.");
  }
  if (!packageJson.scripts?.["owner-tools:publish-help"]) {
    fail("Missing owner-tools:publish-help script.");
  }
  if (!packageJson.scripts?.["owner-tools:env-help"]) {
    fail("Missing owner-tools:env-help script.");
  }
  if (!packageJson.scripts?.["owner-tools:wrangler-help"]) {
    fail("Missing owner-tools:wrangler-help script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-owner-release-tools.js"))) {
    fail("Missing scripts/validate-owner-release-tools.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-github-cli-help.ps1"))) {
    fail("Missing scripts/print-github-cli-help.ps1.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-github-publication-help.ps1"))) {
    fail("Missing scripts/print-github-publication-help.ps1.");
  }
  const githubCliHelper = read("scripts/print-github-cli-help.ps1");
  for (const expected of ["gh auth login", "gh auth status", "winget install --id GitHub.cli", "GitHub CLI appears to be installed but is not on PATH", "does not read, print, or store"]) {
    if (!includesNormalized(githubCliHelper, expected)) {
      fail(`GitHub CLI helper is missing expected setup/safety content: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-owner-tool-env.ps1"))) {
    fail("Missing scripts/print-owner-tool-env.ps1.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-wrangler-help.ps1"))) {
    fail("Missing scripts/print-wrangler-help.ps1.");
  }
  const wranglerHelper = read("scripts/print-wrangler-help.ps1");
  for (const expected of ["wrangler --version", "npm install -g wrangler", "cloudflare/wrangler-action", "npm run deploy:site:local", "does not read, print, or store"]) {
    if (!includesNormalized(wranglerHelper, expected)) {
      fail(`Wrangler helper is missing expected setup/safety content: ${expected}`);
    }
  }
  const ownerToolEnvHelper = read("scripts/print-owner-tool-env.ps1");
  for (const expected of ["ApplyToUser", "jarsigner.exe", "keytool.exe", "ANDROID_HOME", "does not read, print, or store"]) {
    if (!includesNormalized(ownerToolEnvHelper, expected)) {
      fail(`Owner tooling environment helper is missing expected safety/setup content: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["release:handoff"]) {
    fail("Missing release:handoff script.");
  }
  if (!packageJson.scripts?.["validate:release-handoff"]) {
    fail("Missing validate:release-handoff script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-release-handoff.js"))) {
    fail("Missing scripts/validate-release-handoff.js.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("preflight:play-store")) {
    fail("release:handoff must refresh Play preflight before release status and audit reports.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-status")) {
    fail("release:handoff must validate release status before generating the final audit.");
  }
  if (!packageJson.scripts?.["generate:workflow-provenance"]) {
    fail("Missing generate:workflow-provenance script.");
  }
  if (!packageJson.scripts?.["validate:workflow-provenance"]) {
    fail("Missing validate:workflow-provenance script.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:workflow-provenance")) {
    fail("release:handoff must generate workflow provenance before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:workflow-provenance")) {
    fail("release:handoff must validate workflow provenance before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:workflow-provenance")) {
    fail("validate:release must include validate:workflow-provenance.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-workflow-provenance-report.js"))) {
    fail("Missing scripts/generate-workflow-provenance-report.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-workflow-provenance-report.js"))) {
    fail("Missing scripts/validate-workflow-provenance-report.js.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:github-publication-packet")) {
    fail("release:handoff must refresh the GitHub publication packet before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:github-publication-packet")) {
    fail("release:handoff must validate the GitHub publication packet before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-console-packet")) {
    fail("release:handoff must refresh the Play Console packet before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-console-packet")) {
    fail("release:handoff must validate the Play Console packet before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-console-field-map")) {
    fail("release:handoff must refresh the Play Console field map before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-console-field-map")) {
    fail("release:handoff must validate the Play Console field map before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:runtime-qa-report")) {
    fail("release:handoff must create-or-preserve the runtime QA report template before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:runtime-qa-report")) {
    fail("release:handoff must validate the runtime QA report structure before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-upload-confirmation")) {
    fail("release:handoff must create-or-preserve the Play upload confirmation template before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-upload-confirmation")) {
    fail("release:handoff must validate the Play upload confirmation structure before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:public")) {
    fail("release:handoff must validate public repository safety before printing next steps.");
  }
  if (!packageJson.scripts?.["generate:release-evidence-index"]) {
    fail("Missing generate:release-evidence-index script.");
  }
  if (!packageJson.scripts?.["validate:release-evidence-index"]) {
    fail("Missing validate:release-evidence-index script.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:release-evidence-index")) {
    fail("release:handoff must generate the public-safe release evidence index before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-evidence-index")) {
    fail("release:handoff must validate the public-safe release evidence index before printing next steps.");
  }
  if (!packageJson.scripts?.["validate:release-evidence-docs"]) {
    fail("Missing validate:release-evidence-docs script.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-evidence-docs")) {
    fail("release:handoff must validate the public release evidence guide before printing next steps.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:release-evidence-index")) {
    fail("validate:release must include validate:release-evidence-index.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:release-evidence-docs")) {
    fail("validate:release must include validate:release-evidence-docs.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-release-evidence-index.js"))) {
    fail("Missing scripts/generate-release-evidence-index.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-release-evidence-index.js"))) {
    fail("Missing scripts/validate-release-evidence-index.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-release-evidence-docs.js"))) {
    fail("Missing scripts/validate-release-evidence-docs.js.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:public-push")) {
    fail("release:handoff must validate local public-push readiness before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:license")) {
    fail("release:handoff must validate source-available license policy before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-artifacts")) {
    fail("release:handoff must validate release artifact hygiene before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:custom-domain")) {
    fail("release:handoff must validate custom-domain readiness before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("release:owner-dry-run")) {
    fail("release:handoff must run the owner dry-run rehearsal before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-data-safety")) {
    fail("release:handoff must generate the Play data-safety packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-data-safety")) {
    fail("release:handoff must validate the Play data-safety packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-content-rating")) {
    fail("release:handoff must generate the Play content rating packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-content-rating")) {
    fail("release:handoff must validate the Play content rating packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-health-declaration")) {
    fail("release:handoff must generate the Play Health declaration packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-health-declaration")) {
    fail("release:handoff must validate the Play Health declaration packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-app-access")) {
    fail("release:handoff must generate the Play App access packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-app-access")) {
    fail("release:handoff must validate the Play App access packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-ads-declaration")) {
    fail("release:handoff must generate the Play ads declaration packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-ads-declaration")) {
    fail("release:handoff must validate the Play ads declaration packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-target-audience")) {
    fail("release:handoff must generate the Play target audience packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-target-audience")) {
    fail("release:handoff must validate the Play target audience packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-testing-rollout")) {
    fail("release:handoff must generate the Play testing rollout packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-testing-rollout")) {
    fail("release:handoff must validate the Play testing rollout packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:play-app-content")) {
    fail("release:handoff must generate the aggregate Play App content packet before the Play Console packet.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:play-app-content")) {
    fail("release:handoff must validate the aggregate Play App content packet before the Play Console packet.");
  }
  if (!packageJson.scripts?.["generate:privacy-parity"]) {
    fail("Missing generate:privacy-parity script.");
  }
  if (!packageJson.scripts?.["validate:privacy-parity"]) {
    fail("Missing validate:privacy-parity script.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:privacy-parity")) {
    fail("release:handoff must generate privacy parity evidence before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:privacy-parity")) {
    fail("release:handoff must validate privacy parity before generating the final audit.");
  }
  if (!packageJson.scripts?.["generate:android-permissions"]) {
    fail("Missing generate:android-permissions script.");
  }
  if (!packageJson.scripts?.["validate:android-permissions"]) {
    fail("Missing validate:android-permissions script.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:android-permissions")) {
    fail("release:handoff must generate Android permissions evidence before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:android-permissions")) {
    fail("release:handoff must validate Android permissions evidence before generating the final audit.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:android-permissions")) {
    fail("validate:release must include validate:android-permissions.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-android-permissions-report.js"))) {
    fail("Missing scripts/generate-android-permissions-report.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-android-permissions-report.js"))) {
    fail("Missing scripts/validate-android-permissions-report.js.");
  }
  if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:privacy-parity")) {
    fail("validate:release must include validate:privacy-parity.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-privacy-parity-report.js"))) {
    fail("Missing scripts/generate-privacy-parity-report.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-privacy-parity-report.js"))) {
    fail("Missing scripts/validate-privacy-parity-report.js.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("generate:owner-action-packet")) {
    fail("release:handoff must generate the owner action packet before printing next steps.");
  }
  if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:owner-action-packet")) {
    fail("release:handoff must validate the owner action packet before printing next steps.");
  }
  for (const forbidden of [
    "github:setup-deploy-secrets",
    "mobile:create-upload-keystore",
    "mobile:sign:aab",
    "mobile:release:android",
    "validate:play-store-private-ready",
    "validate:play-store-complete",
    "--require-complete"
  ]) {
    if (String(packageJson.scripts?.["release:handoff"] || "").includes(forbidden)) {
      fail(`release:handoff must stay public-safe and must not include: ${forbidden}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-next-release-steps.js"))) {
    fail("Missing scripts/print-next-release-steps.js.");
  }
  const nextReleaseSteps = read("scripts/print-next-release-steps.js");
  for (const expected of [
    "Owner-safe rehearsal:",
    "npm run release:owner-dry-run",
    "npm run build:site && npm run deploy:site:local",
    "npm run validate:custom-domain:live",
    "npm run github:setup-deploy-secrets -- -DryRun",
    "npm run mobile:create-upload-keystore -- -DryRun",
    "npm run mobile:release:android:prompted -- -DryRun"
  ]) {
    if (!includesNormalized(nextReleaseSteps, expected)) {
      fail(`release:next helper is missing expected rehearsal guidance: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["validate:play-store-public"]) {
    fail("Missing validate:play-store-public script.");
  }
  if (!packageJson.scripts?.["validate:play-store-private-ready"]) {
    fail("Missing validate:play-store-private-ready script.");
  }
  if (!packageJson.scripts?.["validate:play-store-complete"]) {
    fail("Missing validate:play-store-complete script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "play-store-preflight.js"))) {
    fail("Missing scripts/play-store-preflight.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "play-store-public-readiness.js"))) {
    fail("Missing scripts/play-store-public-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "play-store-private-readiness.js"))) {
    fail("Missing scripts/play-store-private-readiness.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "play-store-complete-readiness.js"))) {
    fail("Missing scripts/play-store-complete-readiness.js.");
  }
  const playStorePrivateReadiness = read("scripts/play-store-private-readiness.js");
  for (const expected of [
    "validate:custom-domain:live",
    "validate:android",
    "--require-signed",
    "mobile:signed-aab:evidence",
    "validate:runtime-qa-report",
    "--require-complete",
    "validate:play-console-packet",
    "ready-for-play-upload"
  ]) {
    if (!includesNormalized(playStorePrivateReadiness, expected)) {
      fail(`Play Store private readiness gate is missing final upload requirement: ${expected}`);
    }
  }
  const playStoreCompleteReadiness = read("scripts/play-store-complete-readiness.js");
  for (const expected of [
    "validate:custom-domain:live",
    "validate:github:live",
    "validate:github:actions",
    "validate:play-store-private-ready",
    "validate:play-upload-confirmation",
    "--require-complete",
    "play-upload-confirmed"
  ]) {
    if (!includesNormalized(playStoreCompleteReadiness, expected)) {
      fail(`Play Store completion gate is missing final release requirement: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-console-packet.js"))) {
    fail("Missing scripts/generate-play-console-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-console-packet.js"))) {
    fail("Missing scripts/validate-play-console-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-console-field-map.js"))) {
    fail("Missing scripts/generate-play-console-field-map.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-console-field-map.js"))) {
    fail("Missing scripts/validate-play-console-field-map.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-console-submit-bundle.js"))) {
    fail("Missing scripts/generate-play-console-submit-bundle.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-console-submit-bundle.js"))) {
    fail("Missing scripts/validate-play-console-submit-bundle.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-play-upload-confirmation.js"))) {
    fail("Missing scripts/generate-play-upload-confirmation.js.");
  }
  const playUploadConfirmationGenerator = read("scripts/generate-play-upload-confirmation.js");
  if (!playUploadConfirmationGenerator.includes("--force") || !playUploadConfirmationGenerator.includes("Not overwriting")) {
    fail("Play upload confirmation generator must preserve existing private reports unless --force is used.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-play-upload-confirmation.js"))) {
    fail("Missing scripts/validate-play-upload-confirmation.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-runtime-qa-report.js"))) {
    fail("Missing scripts/generate-runtime-qa-report.js.");
  }
  const runtimeQaGenerator = read("scripts/generate-runtime-qa-report.js");
  if (!runtimeQaGenerator.includes("--force") || !runtimeQaGenerator.includes("Not overwriting")) {
    fail("Runtime QA report generator must preserve existing private reports unless --force is used.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-runtime-qa-report.js"))) {
    fail("Missing scripts/validate-runtime-qa-report.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-github-publication-packet.js"))) {
    fail("Missing scripts/generate-github-publication-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-github-publication-packet.js"))) {
    fail("Missing scripts/validate-github-publication-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-live-github-publication.js"))) {
    fail("Missing scripts/validate-live-github-publication.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-live-github-actions.js"))) {
    fail("Missing scripts/validate-live-github-actions.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-release-status.js"))) {
    fail("Missing scripts/generate-release-status.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-release-status.js"))) {
    fail("Missing scripts/validate-release-status.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-final-release-audit.js"))) {
    fail("Missing scripts/generate-final-release-audit.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-final-release-audit.js"))) {
    fail("Missing scripts/validate-final-release-audit.js.");
  }
  const finalReleaseAuditGenerator = read("scripts/generate-final-release-audit.js");
  for (const expected of [
    "https://open-cycle.com/privacy",
    "https://open-cycle-site.pages.dev/privacy",
    "npm run validate:custom-domain:live",
    "liveCustomDomainPublication",
    "liveGithubPublication",
    "liveGithubActions",
    "play-upload-confirmed"
  ]) {
    if (!includesNormalized(finalReleaseAuditGenerator, expected)) {
      fail(`Final release audit generator is missing completion evidence requirement: ${expected}`);
    }
  }
  const finalReleaseAuditValidator = read("scripts/validate-final-release-audit.js");
  for (const expected of [
    "liveCustomDomainPublication",
    "liveGithubPublication",
    "liveGithubActions",
    "signedAab",
    "signedRuntimeQa",
    "playConsoleUpload",
    "play-upload-confirmed"
  ]) {
    if (!includesNormalized(finalReleaseAuditValidator, expected)) {
      fail(`Final release audit validator is missing completion guard: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "generate-owner-action-packet.js"))) {
    fail("Missing scripts/generate-owner-action-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-owner-action-packet.js"))) {
    fail("Missing scripts/validate-owner-action-packet.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "public-release-readiness.js"))) {
    fail("Missing scripts/public-release-readiness.js.");
  }
  const publicReleaseReadiness = read("scripts/public-release-readiness.js");
  if (!publicReleaseReadiness.includes("release:next")) {
    fail("public-release-readiness.js must print release:next after generating the final audit.");
  }
  for (const expected of [
    "generate:release-completion-matrix",
    "validate:release-completion-matrix",
    "generate:release-blockers",
    "validate:release-blockers",
    "generate:release-evidence-index",
    "validate:release-evidence-index",
    "validate:release-evidence-docs"
  ]) {
    if (!publicReleaseReadiness.includes(expected)) {
      fail(`public-release-readiness.js must include public evidence step: ${expected}`);
    }
  }
  for (const forbidden of [
    "github:setup-deploy-secrets",
    "mobile:create-upload-keystore",
    "mobile:sign:aab",
    "mobile:release:android",
    "validate:play-store-private-ready",
    "validate:play-store-complete",
    "--require-complete"
  ]) {
    if (publicReleaseReadiness.includes(forbidden)) {
      fail(`public-release-readiness.js must stay public-safe and must not include: ${forbidden}`);
    }
  }
  const preflight = read("scripts/play-store-preflight.js");
  for (const expected of ["playMetadata", "listing.json", "verifyPlayMetadata", "playReleaseNotes", "release-notes.txt"]) {
    if (!preflight.includes(expected)) {
      fail(`Play Store preflight must include metadata evidence: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["mobile:release:android"]) {
    fail("Missing mobile:release:android script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "android-local-release.js"))) {
    fail("Missing scripts/android-local-release.js.");
  }
  if (!packageJson.scripts?.["mobile:release:android:prompted"]) {
    fail("Missing mobile:release:android:prompted script.");
  }
  if (!packageJson.scripts?.["mobile:unsigned-aab:evidence"]) {
    fail("Missing mobile:unsigned-aab:evidence script.");
  }
  const aabBuilder = read("scripts/build-aab.js");
  for (const expected of [
    "OPEN_CYCLE_ANDROID_BUILD_ROOT",
    "open-cycle-android-build",
    "--rerun-tasks",
    "fs.copyFileSync(candidate, canonicalOutput)"
  ]) {
    if (!aabBuilder.includes(expected)) {
      fail(`Android AAB builder must preserve fresh temp-root build behavior: ${expected}`);
    }
  }
  const androidBuildGradle = read("apps/mobile/android/build.gradle");
  for (const expected of [
    "OPEN_CYCLE_ANDROID_BUILD_ROOT",
    "externalBuildRoot",
    "buildDir = externalBuildRoot"
  ]) {
    if (!androidBuildGradle.includes(expected)) {
      fail(`Android Gradle config must support temp build roots: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-unsigned-aab-evidence.js"))) {
    fail("Missing scripts/print-unsigned-aab-evidence.js.");
  }
  if (!packageJson.scripts?.["mobile:signed-aab:evidence"]) {
    fail("Missing mobile:signed-aab:evidence script.");
  }
  if (!packageJson.scripts?.["mobile:signed-aab:sync-evidence"]) {
    fail("Missing mobile:signed-aab:sync-evidence script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "print-signed-aab-evidence.js"))) {
    fail("Missing scripts/print-signed-aab-evidence.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "sync-signed-aab-evidence.js"))) {
    fail("Missing scripts/sync-signed-aab-evidence.js.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "run-android-private-release.ps1"))) {
    fail("Missing scripts/run-android-private-release.ps1.");
  }
  if (!packageJson.scripts?.["validate:functions"]) {
    fail("Missing validate:functions script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-function-coverage.js"))) {
    fail("Missing scripts/validate-function-coverage.js.");
  }
  if (!fs.existsSync(path.join(root, "docs", "validation-matrix.md"))) {
    fail("Missing docs/validation-matrix.md.");
  }
  for (const doc of ["docs/play-store-release.md", "docs/runtime-qa.md", "docs/mobile-release.md"]) {
    if (!fs.existsSync(path.join(root, doc))) {
      fail(`Missing public release documentation: ${doc}.`);
    }
  }
  const playStoreReleaseDocs = read("docs/play-store-release.md");
  for (const expected of [
    "https://open-cycle.com/privacy",
    "npm run validate:custom-domain:live",
    "npm run validate:github:live",
    "npm run validate:github:actions",
    "npm run validate:play-store-complete",
    "private signing, signed runtime QA, and Play Console upload confirmation"
  ]) {
    if (!includesNormalized(playStoreReleaseDocs, expected)) {
      fail(`docs/play-store-release.md is missing final release guidance: ${expected}`);
    }
  }
  if (!fs.existsSync(path.join(root, "docs", "android-keystore-handling.md"))) {
    fail("Missing docs/android-keystore-handling.md.");
  }
  const keystoreHandling = read("docs/android-keystore-handling.md");
  for (const expected of [
    "Do not commit upload keystores",
    "%USERPROFILE%\\.opencycle\\keys\\upload-keystore.jks",
    "npm run validate:signing-readiness",
    "npm run mobile:release:android:prompted",
    "encrypted backup",
    "upload-key reset",
    ".gitignore"
  ]) {
    if (!includesNormalized(keystoreHandling, expected)) {
      fail(`docs/android-keystore-handling.md is missing expected keystore guidance: ${expected}`);
    }
  }
  if (!packageJson.scripts?.["validate:workflows"]) {
    fail("Missing validate:workflows script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-github-workflows.js"))) {
    fail("Missing scripts/validate-github-workflows.js.");
  }
  if (!packageJson.scripts?.["validate:local-only-deps"]) {
    fail("Missing validate:local-only-deps script.");
  }
  if (!fs.existsSync(path.join(root, "scripts", "validate-local-only-dependencies.js"))) {
    fail("Missing scripts/validate-local-only-dependencies.js.");
  }
}

checkLicense();
checkSecurityPolicy();
checkGitignore();
checkSecretAssignments();
checkMobileDefault();
checkCycleTrackingTerminology();
checkPrivacyPolicy();
checkKeystoreHelpers();
checkAndroidWorkflow();
checkDeploymentSecretsDocs();
checkPlayAssetPipeline();

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Public safety checks passed.");

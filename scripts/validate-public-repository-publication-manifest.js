const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const manifestPath = path.join(root, "reports", "public-repository-publication-manifest.md");

const requiredPublicFiles = [
  "README.md",
  "LICENSE.md",
  "SECURITY.md",
  "package.json",
  ".env.example",
  "wrangler.toml",
  ".github/workflows/ci.yml",
  ".github/workflows/android-aab.yml",
  ".github/workflows/deploy-site.yml",
  "docs/release-evidence.md",
  "docs/github-web-publication.md",
  "docs/deployment-secrets.md",
  "docs/cloudflare-pages-domain-diagnostics.md",
  "docs/release-owner-checklist.md",
  "docs/owner-tooling.md",
  "docs/play-store-release.md",
  "docs/runtime-qa.md",
  "docs/mobile-release.md",
  "docs/android-keystore-handling.md",
  "docs/validation-matrix.md",
  "apps/web/src/api.ts",
  "apps/web/src/App.tsx",
  "apps/mobile/android/app/src/main/AndroidManifest.xml",
  "site/index.html",
  "site/styles.css",
  "site/logo.svg",
  "site/privacy.html",
  "site/license.html",
  "site/open-cycle.html",
  "site/script.js",
  "site/upgrade.js",
  "site/robots.txt",
  "site/sitemap.xml",
  "site/llms.txt",
  "site/blog/index.html",
  "site/blog/local-only-period-tracker.html",
  "site/blog/health-app-data-sharing.html",
  "site/blog/period-tracker-privacy-questions.html",
  "site/blog/no-account-period-tracker.html",
  "site/blog/period-tracker-without-internet.html",
  "scripts/validate-release-artifact-hygiene.js",
  "scripts/generate-release-completion-matrix.js",
  "scripts/validate-release-completion-matrix.js",
  "scripts/generate-release-blocker-report.js",
  "scripts/validate-release-blocker-report.js",
  "scripts/generate-public-repository-publication-manifest.js",
  "scripts/validate-public-repository-publication-manifest.js",
  "scripts/generate-github-repository-bundles.js",
  "scripts/validate-github-repository-bundles.js",
  "scripts/print-cloudflare-domain-attach-help.ps1",
  "scripts/print-github-publication-help.ps1",
  "scripts/validate-github-publication-helper.js",
  "scripts/print-android-signing-help.ps1",
  "scripts/validate-android-signing-helper.js",
  "scripts/print-play-upload-help.ps1",
  "scripts/validate-play-upload-helper.js",
  "scripts/print-runtime-qa-help.ps1",
  "scripts/validate-runtime-qa-helper.js",
  "scripts/print-owner-support-now.js",
  "scripts/validate-owner-support-now.js",
  "scripts/validate-owner-tooling-docs.js",
  "scripts/validate-cloudflare-domain-attach-helper.js"
];

const requiredText = [
  "Public repository publication manifest",
  "public-safe by design",
  "https://github.com/kborndorff/Open-Cycle",
  "https://github.com/kborndorff/open-cycle-source",
  "Proof/product upload repo: `kborndorff/Open-Cycle`",
  "Full source repo: `kborndorff/open-cycle-source`",
  "public scrutiny, source review, and personal non-commercial local use",
  "not for resale, rebranding, hosted competing products, third-party app store distribution, or paid forks",
  "truly free and truly local cycle tracking",
  "no accounts, analytics, ads, cloud sync, or remote API dependency",
  "Public-safe source groups",
  "SEO discovery files and plain-language privacy blog pages",
  "Required public files",
  "Private material that must stay out of GitHub",
  "Cloudflare API tokens and account-scoped secrets",
  "Android upload keystores, keystore passwords, key passwords, and signing property files",
  "Signed Android App Bundles and private signed-AAB checksum reports",
  "Play Console service-account JSON, tester email lists, and private Play upload confirmations",
  "Generated reports in reports/",
  "npm run validate:public",
  "npm run validate:public-push",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "npm run generate:github-publication-packet",
  "npm run validate:github-publication-packet",
  "npm run generate:github-repository-bundles",
  "npm run validate:github-repository-bundles",
  "npm run release:handoff",
  "npm run validate:release-handoff",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "Do not push until the owner explicitly approves publication",
  "Set Cloudflare values through encrypted GitHub Actions secrets or the Cloudflare dashboard only",
  "Perform Android signing privately"
];

const forbiddenPatterns = [
  /CF_API_TOKEN\s*=/,
  /CF_ACCOUNT_ID\s*=/,
  /ANDROID_KEYSTORE_PASSWORD\s*=/,
  /ANDROID_KEY_PASSWORD\s*=/,
  /PLAY_SERVICE_ACCOUNT\s*=/,
  /VITE_API_KEY\s*=/,
  /API_KEY\s*=/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing reports/public-repository-publication-manifest.md. Run npm run generate:public-repo-manifest.");
} else {
  const manifest = fs.readFileSync(manifestPath, "utf8");

  for (const expected of requiredText) {
    if (!includesNormalized(manifest, expected)) {
      fail(`Public repository publication manifest is missing expected text: ${expected}`);
    }
  }

  for (const file of requiredPublicFiles) {
    if (!fs.existsSync(path.join(root, file))) {
      fail(`Required public file is missing locally: ${file}`);
    }
    if (!manifest.includes(`\`${file}\``)) {
      fail(`Manifest is missing required public file: ${file}`);
    }
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(manifest)) {
      fail(`Manifest contains assigned secret or private-key-like material matching ${pattern}.`);
    }
  }

  if (!manifest.includes("| File | Local status |") || !manifest.includes("| --- | --- |")) {
    fail("Manifest must include the public file status table.");
  }

  if (manifest.includes("missing")) {
    fail("Manifest has missing required public files.");
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Public repository publication manifest checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const manifestPath = path.join(reportsDir, "public-repository-publication-manifest.md");

const publicTargets = [
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
  "scripts/validate-public-push-readiness.js",
  "scripts/validate-release-artifact-hygiene.js",
  "scripts/validate-public-artifact-policy.js",
  "scripts/validate-local-only-runtime.js",
  "scripts/generate-public-repository-publication-manifest.js",
  "scripts/validate-public-repository-publication-manifest.js",
  "scripts/generate-github-publication-packet.js",
  "scripts/validate-github-publication-packet.js",
  "scripts/generate-github-repository-bundles.js",
  "scripts/validate-github-repository-bundles.js",
  "scripts/generate-release-evidence-index.js",
  "scripts/validate-release-evidence-index.js",
  "scripts/generate-release-completion-matrix.js",
  "scripts/validate-release-completion-matrix.js",
  "scripts/generate-release-blocker-report.js",
  "scripts/validate-release-blocker-report.js",
  "scripts/validate-release-evidence-docs.js",
  "scripts/generate-final-release-audit.js",
  "scripts/validate-final-release-audit.js",
  "scripts/generate-release-status.js",
  "scripts/validate-release-status.js",
  "scripts/print-next-release-steps.js",
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
  "scripts/print-cloudflare-domain-attach-help.ps1",
  "scripts/validate-cloudflare-domain-attach-helper.js"
];

const publicGroups = [
  "Local-only app source for cycle tracking, local storage, and clear-all deletion.",
  "Website source for privacy, license, source visibility, and gentle paid-app redirection.",
  "Public GitHub workflows that validate source, build unsigned Android evidence, and deploy site/dist.",
  "Public-safe release validators, generators, owner guides, and evidence indexes.",
  "Store listing metadata and static marketing assets that do not contain credentials or tester identities.",
  "SEO discovery files and plain-language privacy blog pages for period tracking app, privacy-first, and local phone-only search intent."
];

const privateBoundaries = [
  "Cloudflare API tokens and account-scoped secrets.",
  "GitHub Actions secret values and any pasted credential material.",
  "Android upload keystores, keystore passwords, key passwords, and signing property files.",
  "Signed Android App Bundles and private signed-AAB checksum reports.",
  "Play Console service-account JSON, tester email lists, and private Play upload confirmations.",
  "Generated reports in reports/ unless a maintainer intentionally redacts and publishes a specific file."
];

const validationCommands = [
  "npm run validate:public",
  "npm run validate:public-push",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "npm run generate:github-publication-packet",
  "npm run validate:github-publication-packet",
  "npm run generate:github-repository-bundles",
  "npm run validate:github-repository-bundles",
  "npm run generate:release-evidence-index",
  "npm run validate:release-evidence-index",
  "npm run validate:release-evidence-docs",
  "npm run release:handoff",
  "npm run validate:release-handoff",
  "npm run validate:github:live",
  "npm run validate:github:actions"
];

function statusFor(relativePath) {
  return fs.existsSync(path.join(root, relativePath)) ? "present" : "missing";
}

function buildMarkdown() {
  const lines = [
    "# Public repository publication manifest",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This manifest is public-safe by design. It defines what may be visible in the public GitHub repository for scrutiny while keeping private signing, Cloudflare, GitHub Actions, and Play Console material outside the repository.",
    "",
    "## Repository target",
    "",
    "- Owner: `kborndorff`",
    "- Repository: `Open-Cycle`",
    "- Public URL: `https://github.com/kborndorff/Open-Cycle`",
    "- Full source URL: `https://github.com/kborndorff/open-cycle-source`",
    "- Proof/product upload repo: `kborndorff/Open-Cycle` contains public proof, store-facing materials, security/privacy docs, release helpers, and product upload evidence.",
    "- Full source repo: `kborndorff/open-cycle-source` contains the complete inspectable source tree.",
    "- Visibility purpose: public scrutiny, source review, and personal non-commercial local use.",
    "- Commercial boundary: not for resale, rebranding, hosted competing products, third-party app store distribution, or paid forks.",
    "- Privacy promise: truly free and truly local cycle tracking; no accounts, analytics, ads, cloud sync, or remote API dependency.",
    "",
    "## Public-safe source groups",
    ""
  ];

  for (const group of publicGroups) {
    lines.push(`- ${group}`);
  }

  lines.push(
    "",
    "## Required public files",
    "",
    "| File | Local status |",
    "| --- | --- |"
  );
  for (const target of publicTargets) {
    lines.push(`| \`${target}\` | ${statusFor(target)} |`);
  }

  lines.push(
    "",
    "## Private material that must stay out of GitHub",
    ""
  );
  for (const boundary of privateBoundaries) {
    lines.push(`- ${boundary}`);
  }

  lines.push(
    "",
    "## Required validation commands",
    "",
    "```powershell"
  );
  for (const command of validationCommands) {
    lines.push(command);
  }
  lines.push(
    "```",
    "",
    "## Owner action boundary",
    "",
    "- Do not push until the owner explicitly approves publication.",
    "- Do not paste secret values into source files, Markdown, issues, pull requests, terminal transcripts intended for publication, or generated reports committed to Git.",
    "- Set Cloudflare values through encrypted GitHub Actions secrets or the Cloudflare dashboard only.",
    "- Perform Android signing privately, then upload the signed bundle through Play Console owner-side workflows.",
    "- Keep the public repository useful for scrutiny without making the private release chain public."
  );

  return `${lines.join("\n")}\n`;
}

function main() {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(manifestPath, buildMarkdown(), "utf8");
  console.log(`Public repository publication manifest written to ${manifestPath}`);
}

main();

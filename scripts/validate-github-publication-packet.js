const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "github-publication-packet.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(packetPath)) {
  fail("Missing reports/github-publication-packet.md. Run npm run generate:github-publication-packet.");
} else {
  const packet = fs.readFileSync(packetPath, "utf8");
  for (const expected of [
    "https://github.com/kborndorff/Open-Cycle",
    "https://github.com/kborndorff/open-cycle-source",
    "https://open-cycle.com",
    "Stable Pages fallback",
    "Visibility target: Public",
    "kborndorff/Open-Cycle",
    "proof and upload materials belong in `kborndorff/Open-Cycle`",
    "full source code belongs in `kborndorff/open-cycle-source`",
    "npm run release:handoff",
    "npm run validate:release-handoff",
    "npm run release:next",
    "npm run validate:owner-tools",
    "npm run validate:signing-readiness",
    "npm run owner-tools:gh-help",
    "npm run owner-tools:publish-help",
    "npm run validate:github-publication-helper",
    "npm run owner-tools:env-help",
    "npm run validate:functions",
    "npm run validate:release-artifacts",
    "npm run validate:public-artifacts",
    "npm run validate:local-only-runtime",
    "npm run generate:public-repo-manifest",
    "npm run validate:public-repo-manifest",
    "npm run validate:workflow-provenance",
    "npm run validate:privacy-parity",
    "npm run validate:android-permissions",
    "npm run generate:release-evidence-index",
    "npm run validate:release-evidence-index",
    "npm run validate:release-evidence-docs",
    "npm run validate:release",
    "npm run validate:license",
    "npm run validate:custom-domain",
    "npm run validate:play-store-public",
    "npm run validate:site:live -- --url=https://open-cycle-site.pages.dev",
    "npm run validate:cloudflare-pages-domains:live",
    "reports/cloudflare-pages-domain-attachment.json",
    "npm run validate:custom-domain:live",
    "reports/live-site-publication.json",
    "npm run validate:github:live",
    "npm run validate:github:actions",
    "npm run generate:play-data-safety",
    "npm run validate:play-data-safety",
    "npm run generate:play-console-submit-bundle",
    "npm run validate:play-console-submit-bundle",
    "npm run generate:github-repository-bundles",
    "npm run validate:github-repository-bundles",
    "dist/github-repositories/Open-Cycle",
    "dist/github-repositories/open-cycle-source",
    "product-uploads/play-console-submit",
    "complete inspectable source tree with generated/private outputs filtered out",
    "npm run github:setup-deploy-secrets",
    "gh secret set CF_API_TOKEN --repo kborndorff/Open-Cycle",
    "gh secret set CF_ACCOUNT_ID --repo kborndorff/Open-Cycle",
    "gh variable set CF_PAGES_PROJECT_NAME --repo kborndorff/Open-Cycle --body open-cycle-site",
    "docs/custom-domain-cloudflare.md",
    "npm run owner-tools:cloudflare-domain-help",
    "npm run deploy:site:local",
    "npm run deploy:site:local:safe",
    "npm run deploy:site:local:safe:npx",
    "temp-staged copy of `site/dist`",
    "Preferred CLI path",
    "No-`gh` web fallback",
    "set Cloudflare GitHub Actions secrets",
    "OpenCycle Local CI",
    "Android AAB Check",
    "Deploy Site to Cloudflare Pages",
    "workflow_dispatch",
    "wrangler.toml",
    "site/dist",
    "Validation matrix",
    "Release evidence guide",
    "Public repository publication manifest",
    "Workflow provenance",
    "Privacy parity",
    "Android permissions",
    "reports/function-coverage.json",
    "validates the live Pages URL",
    "source-available for scrutiny and personal non-commercial local use",
    "not resale, rebranding, hosted competing products, or third-party app store distribution",
    "truly free, local-only cycle entries with clear-all local deletion",
    "source-available, not open source",
    "docs/release-owner-checklist.md",
    "docs/owner-tooling.md",
    "docs/github-web-publication.md",
    "Custom domain setup guide",
    "docs/cloudflare-pages-domain-diagnostics.md",
    "Public release evidence guide",
    "docs/play-store-release.md",
    "Play data-safety packet",
    "docs/runtime-qa.md",
    "Clear-all local cycle entry deletion",
    "docs/mobile-release.md",
    "docs/android-keystore-handling.md",
    "GitHub CLI setup",
    "publishing or setting secrets without `gh`",
    "visible for public scrutiny",
    "reviewed before creating or using the upload keystore",
    "safe Java/Android setup commands",
    "Release owner checklist is reviewed before private signing and Play upload",
    "reviewed local owner tooling without printing secrets",
    "confirmed non-secret signing prerequisites are ready",
    "reviewed before GitHub publication and private signing",
    "reviewed the current audit and next steps",
    "confirmed the handoff command stays public-safe",
    "supports manual `workflow_dispatch`",
    "reports/license-policy.json",
    "site/license.html",
    "scripts/validate-license-policy.js",
    "docs/release-evidence.md",
    "public evidence validators",
    "open-cycle.com",
    "confirms no data collection or sharing answers",
    "shows only expected external/private pending checks",
    "Play upload keystore and passwords"
  ]) {
    if (!packet.includes(expected)) {
      fail(`GitHub publication packet is missing expected content: ${expected}`);
    }
  }

  for (const forbidden of [
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    "ANDROID_KEYSTORE_PASSWORD=",
    "ANDROID_KEY_PASSWORD=",
    "VITE_API_KEY=",
    "API_KEY="
  ]) {
    if (packet.includes(forbidden)) {
      fail(`GitHub publication packet must not include assigned secret values: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("GitHub publication packet checks passed.");

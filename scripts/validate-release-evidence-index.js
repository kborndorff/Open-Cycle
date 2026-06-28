const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "release-evidence-index.md");

const requiredEvidence = [
  "reports/final-release-audit.json",
  "reports/release-completion-matrix.md",
  "reports/release-blocker-report.md",
  "reports/release-status.json",
  "reports/public-push-readiness.json",
  "reports/public-repository-publication-manifest.md",
  "reports/release-artifact-hygiene.json",
  "reports/public-artifact-policy.json",
  "reports/local-only-runtime.json",
  "reports/privacy-parity.json",
  "reports/function-coverage.json",
  "reports/workflow-provenance.json",
  "reports/live-site-publication.json",
  "reports/cloudflare-pages-deployment.json",
  "reports/cloudflare-pages-domain-attach-api.json",
  "reports/cloudflare-pages-domain-attachment.json",
  "reports/live-custom-domain-publication.json",
  "reports/live-github-publication.json",
  "reports/live-github-actions.json",
  "reports/unsigned-aab-evidence.json",
  "reports/android-permissions.json",
  "reports/visual-test-report.json",
  "reports/visual-evidence-manifest.json",
  "reports/play-data-safety-packet.md",
  "reports/play-content-rating-packet.md",
  "reports/play-health-declaration-packet.md",
  "reports/play-app-access-packet.md",
  "reports/play-ads-declaration-packet.md",
  "reports/play-target-audience-packet.md",
  "reports/play-testing-rollout-packet.md",
  "reports/play-app-content-packet.md",
  "reports/play-release-candidate-packet.md",
  "reports/play-console-upload-packet.md",
  "reports/play-console-field-map.md",
  "reports/github-publication-packet.md",
  "reports/owner-action-packet.md",
  "reports/android-signing-handoff-packet.md",
  "reports/play-production-readiness-packet.md",
  "reports/signed-runtime-qa-preflight.json",
  "reports/runtime-qa-report.md",
  "reports/signed-aab-evidence.json",
  "reports/play-console-upload-confirmation.json"
];

const requiredCommands = [
  "npm run generate:release-evidence-index",
  "npm run validate:release-evidence-index",
  "npm run generate:release-completion-matrix",
  "npm run validate:release-completion-matrix",
  "npm run generate:release-blockers",
  "npm run validate:release-blockers",
  "npm run validate:public-artifacts",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "npm run validate:local-only-runtime",
  "npm run generate:privacy-parity",
  "npm run validate:privacy-parity",
  "npm run generate:workflow-provenance",
  "npm run validate:workflow-provenance",
  "npm run generate:cloudflare-pages-deployment",
  "npm run validate:cloudflare-pages-deployment",
  "npm run cloudflare:attach-domains",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "npm run validate:custom-domain:live",
  "npm run mobile:unsigned-aab:evidence -- --require-aab",
  "npm run generate:android-permissions",
  "npm run validate:android-permissions",
  "npm run test:visual",
  "npm run validate:visual-test-report",
  "npm run generate:visual-evidence",
  "npm run validate:visual-evidence",
  "npm run generate:play-content-rating",
  "npm run validate:play-content-rating",
  "npm run generate:play-health-declaration",
  "npm run validate:play-health-declaration",
  "npm run generate:play-app-access",
  "npm run validate:play-app-access",
  "npm run generate:play-ads-declaration",
  "npm run validate:play-ads-declaration",
  "npm run generate:play-target-audience",
  "npm run validate:play-target-audience",
  "npm run generate:play-testing-rollout",
  "npm run validate:play-testing-rollout",
  "npm run generate:play-app-content",
  "npm run validate:play-app-content",
  "npm run generate:play-release-candidate",
  "npm run validate:play-release-candidate",
  "npm run generate:play-console-field-map",
  "npm run validate:play-console-field-map",
  "npm run generate:android-signing-handoff",
  "npm run validate:android-signing-handoff",
  "npm run generate:play-production-readiness",
  "npm run validate:play-production-readiness",
  "npm run generate:signed-runtime-qa-preflight",
  "npm run validate:signed-runtime-qa-preflight",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run validate:play-upload-confirmation"
];

const requiredSafetyText = [
  "public-safe by design",
  "reports/` directory is intentionally ignored by Git",
  "Private owner-side evidence",
  "Never paste or commit secret values",
  "Public GitHub Actions should validate or publish unsigned build evidence only"
];

const forbiddenPatterns = [
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[A-Za-z0-9+/]{80,}={0,2}\b/
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/release-evidence-index.md. Run npm run generate:release-evidence-index.");
} else {
  const report = fs.readFileSync(reportPath, "utf8");

  for (const file of requiredEvidence) {
    if (!report.includes(`\`${file}\``)) {
      fail(`Release evidence index is missing evidence file: ${file}`);
    }
  }

  for (const command of requiredCommands) {
    if (!report.includes(command)) {
      fail(`Release evidence index is missing validation command: ${command}`);
    }
  }

  for (const text of requiredSafetyText) {
    if (!includesNormalized(report, text)) {
      fail(`Release evidence index is missing public/private safety text: ${text}`);
    }
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(report)) {
      fail(`Release evidence index contains secret-like material matching ${pattern}.`);
    }
  }

  if (!report.includes("private owner-side")) {
    fail("Release evidence index must distinguish private owner-side evidence.");
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Release evidence index checks passed.");

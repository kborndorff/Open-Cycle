const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const files = {
  guide: "docs/release-evidence.md",
  readme: "README.md",
  matrix: "docs/validation-matrix.md",
  ownerChecklist: "docs/release-owner-checklist.md",
  packageJson: "package.json"
};

const requiredGuideText = [
  "open-cycle is public for scrutiny",
  "npm run release:handoff",
  "npm run release:support-now",
  "npm run validate:owner-support-now",
  "npm run validate:owner-tooling-docs",
  "npm run generate:release-evidence-index",
  "npm run validate:release-evidence-index",
  "npm run generate:release-completion-matrix",
  "npm run validate:release-completion-matrix",
  "npm run generate:release-blockers",
  "npm run validate:release-blockers",
  "npm run generate:visual-evidence",
  "npm run validate:visual-test-report",
  "reports/visual-test-report.json",
  "npm run validate:visual-evidence",
  "reports/visual-evidence-manifest.json",
  "npm run generate:signed-runtime-qa-preflight",
  "npm run validate:signed-runtime-qa-preflight",
  "reports/signed-runtime-qa-preflight.json",
  "npm run generate:cloudflare-pages-deployment",
  "npm run validate:cloudflare-pages-deployment",
  "reports/cloudflare-pages-deployment.json",
  "npm run validate:release-evidence-docs",
  "reports/release-evidence-index.md",
  "reports/release-completion-matrix.md",
  "reports/release-blocker-report.md",
  "reports/` is ignored by Git",
  "npm run validate:local-only-runtime",
  "npm run generate:privacy-parity",
  "npm run validate:privacy-parity",
  "npm run validate:workflows",
  "npm run owner-tools:cloudflare-domain-help",
  "npm run validate:cloudflare-domain-help",
  "npm run generate:workflow-provenance",
  "npm run validate:workflow-provenance",
  "npm run validate:public-artifacts",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "reports/public-repository-publication-manifest.md",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "npm run owner-tools:publish-help",
  "npm run validate:github-publication-helper",
  "npm run validate:cloudflare-pages-domains:live",
  "npm run validate:custom-domain:live",
  "npm run mobile:unsigned-aab:evidence -- --require-aab",
  "npm run generate:android-permissions",
  "npm run owner-tools:android-signing-help",
  "npm run validate:android-signing-helper",
  "npm run validate:android-permissions",
  "npm run generate:play-content-rating",
  "npm run validate:play-content-rating",
  "reports/play-content-rating-packet.md",
  "npm run generate:play-health-declaration",
  "npm run validate:play-health-declaration",
  "reports/play-health-declaration-packet.md",
  "npm run generate:play-app-access",
  "npm run validate:play-app-access",
  "reports/play-app-access-packet.md",
  "npm run generate:play-ads-declaration",
  "npm run validate:play-ads-declaration",
  "reports/play-ads-declaration-packet.md",
  "npm run generate:play-target-audience",
  "npm run validate:play-target-audience",
  "reports/play-target-audience-packet.md",
  "npm run generate:play-testing-rollout",
  "npm run validate:play-testing-rollout",
  "reports/play-testing-rollout-packet.md",
  "npm run generate:play-app-content",
  "npm run validate:play-app-content",
  "reports/play-app-content-packet.md",
  "npm run generate:play-release-candidate",
  "npm run validate:play-release-candidate",
  "reports/play-release-candidate-packet.md",
  "npm run generate:android-signing-handoff",
  "npm run validate:android-signing-handoff",
  "reports/android-signing-handoff-packet.md",
  "npm run generate:play-production-readiness",
  "npm run validate:play-production-readiness",
  "reports/play-production-readiness-packet.md",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run owner-tools:runtime-qa-help",
  "npm run validate:runtime-qa-helper",
  "npm run validate:play-upload-confirmation -- --require-complete",
  "npm run owner-tools:play-upload-help",
  "npm run validate:play-upload-helper",
  "npm run validate:play-store-complete",
  "Never paste or commit secret values",
  "Signed `.aab` files"
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

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    fail(`Missing ${relativePath}.`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

const guide = read(files.guide);
const readme = read(files.readme);
const matrix = read(files.matrix);
const ownerChecklist = read(files.ownerChecklist);
const packageJson = JSON.parse(read(files.packageJson) || "{}");

for (const expected of requiredGuideText) {
  if (!includesNormalized(guide, expected)) {
    fail(`${files.guide} is missing expected release evidence guidance: ${expected}`);
  }
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(guide)) {
    fail(`${files.guide} contains secret-like material matching ${pattern}.`);
  }
}

for (const [label, contents] of [
  [files.readme, readme],
  [files.matrix, matrix],
  [files.ownerChecklist, ownerChecklist]
]) {
  if (!contents.includes("docs/release-evidence.md")) {
    fail(`${label} must reference docs/release-evidence.md.`);
  }
}

if (!packageJson.scripts?.["validate:release-evidence-docs"]) {
  fail("package.json must expose validate:release-evidence-docs.");
}

if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-evidence-docs")) {
  fail("release:handoff must validate release evidence docs.");
}

if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-completion-matrix")) {
  fail("release:handoff must validate the release completion matrix.");
}

if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:release-blockers")) {
  fail("release:handoff must validate the release blocker report.");
}

if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:release-evidence-docs")) {
  fail("validate:release must validate release evidence docs.");
}

if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:release-completion-matrix")) {
  fail("validate:release must validate the release completion matrix.");
}

if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:release-blockers")) {
  fail("validate:release must validate the release blocker report.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Release evidence docs checks passed.");

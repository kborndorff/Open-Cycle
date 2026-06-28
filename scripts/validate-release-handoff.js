const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");

const requiredSteps = [
  "validate:release-handoff",
  "validate:owner-tools",
  "validate:owner-support-now",
  "validate:owner-tooling-docs",
  "validate:functions",
  "validate:workflows",
  "generate:workflow-provenance",
  "validate:workflow-provenance",
  "validate:cloudflare-readiness",
  "validate:cloudflare-domain-help",
  "validate:custom-domain",
  "validate:release-artifacts",
  "validate:public-artifacts",
  "validate:local-only-runtime",
  "generate:privacy-parity",
  "validate:privacy-parity",
  "generate:android-permissions",
  "validate:android-permissions",
  "validate:public-push",
  "generate:public-repo-manifest",
  "validate:public-repo-manifest",
  "mobile:unsigned-aab:evidence",
  "generate:play-data-safety",
  "validate:play-data-safety",
  "generate:play-content-rating",
  "validate:play-content-rating",
  "generate:play-health-declaration",
  "validate:play-health-declaration",
  "generate:play-app-access",
  "validate:play-app-access",
  "generate:play-ads-declaration",
  "validate:play-ads-declaration",
  "generate:play-target-audience",
  "validate:play-target-audience",
  "generate:play-testing-rollout",
  "validate:play-testing-rollout",
  "generate:play-app-content",
  "validate:play-app-content",
  "preflight:play-store",
  "generate:play-release-candidate",
  "validate:play-release-candidate",
  "validate:visual-test-report",
  "generate:visual-evidence",
  "validate:visual-evidence",
  "generate:cloudflare-pages-deployment",
  "validate:cloudflare-pages-deployment",
  "release:status",
  "validate:release-status",
  "generate:github-publication-packet",
  "validate:github-publication-packet",
  "validate:github-publication-helper",
  "generate:play-console-packet",
  "validate:play-console-packet",
  "generate:play-console-field-map",
  "validate:play-console-field-map",
  "generate:runtime-qa-report",
  "validate:runtime-qa-report",
  "validate:runtime-qa-helper",
  "generate:play-upload-confirmation",
  "validate:play-upload-confirmation",
  "validate:play-upload-helper",
  "validate:signing-readiness",
  "validate:android-signing-helper",
  "generate:android-signing-handoff",
  "validate:android-signing-handoff",
  "generate:play-production-readiness",
  "validate:play-production-readiness",
  "generate:owner-action-packet",
  "validate:owner-action-packet",
  "release:owner-dry-run",
  "release:audit",
  "validate:release-audit",
  "generate:release-completion-matrix",
  "validate:release-completion-matrix",
  "generate:release-blockers",
  "validate:release-blockers",
  "generate:owner-action-packet",
  "validate:owner-action-packet",
  "generate:release-evidence-index",
  "validate:release-evidence-index",
  "validate:release-evidence-docs",
  "validate:public",
  "release:next"
];

const forbiddenSteps = [
  "github:setup-deploy-secrets",
  "mobile:create-upload-keystore",
  "mobile:sign:aab",
  "mobile:release:android",
  "validate:play-store-private-ready",
  "validate:play-store-complete",
  "--require-complete"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function stepIndex(handoff, step, startIndex = 0) {
  const needle = `npm run ${step}`;
  let index = handoff.indexOf(needle, startIndex);
  while (index !== -1) {
    const nextChar = handoff[index + needle.length];
    if (!nextChar || /\s|&/.test(nextChar)) {
      return index;
    }
    index = handoff.indexOf(needle, index + 1);
  }
  return -1;
}

function requireStepBefore(handoff, before, after) {
  const beforeIndex = stepIndex(handoff, before);
  const afterIndex = stepIndex(handoff, after);
  if (beforeIndex === -1 || afterIndex === -1) {
    return;
  }
  if (beforeIndex > afterIndex) {
    fail(`release:handoff must run ${before} before ${after}.`);
  }
}

if (!fs.existsSync(packageJsonPath)) {
  fail("Missing package.json.");
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const handoff = String(packageJson.scripts?.["release:handoff"] || "");

  if (!handoff) {
    fail("Missing release:handoff script.");
  }

  for (const required of requiredSteps) {
    if (!handoff.includes(required)) {
      fail(`release:handoff is missing required public-safe step: ${required}`);
    }
  }

  for (const forbidden of forbiddenSteps) {
    if (handoff.includes(forbidden)) {
      fail(`release:handoff must stay public-safe and must not include: ${forbidden}`);
    }
  }

  requireStepBefore(handoff, "generate:owner-action-packet", "release:audit");
  requireStepBefore(handoff, "validate:owner-action-packet", "release:audit");
  requireStepBefore(handoff, "release:owner-dry-run", "release:audit");
  requireStepBefore(handoff, "validate:workflows", "generate:workflow-provenance");
  requireStepBefore(handoff, "validate:owner-tools", "validate:owner-support-now");
  requireStepBefore(handoff, "validate:owner-support-now", "validate:owner-tooling-docs");
  requireStepBefore(handoff, "validate:owner-tooling-docs", "validate:functions");
  requireStepBefore(handoff, "validate:owner-support-now", "validate:functions");
  requireStepBefore(handoff, "validate:cloudflare-readiness", "validate:cloudflare-domain-help");
  requireStepBefore(handoff, "validate:cloudflare-domain-help", "validate:custom-domain");
  requireStepBefore(handoff, "generate:workflow-provenance", "validate:workflow-provenance");
  requireStepBefore(handoff, "validate:workflow-provenance", "release:audit");
  requireStepBefore(handoff, "validate:local-only-runtime", "generate:privacy-parity");
  requireStepBefore(handoff, "generate:privacy-parity", "validate:privacy-parity");
  requireStepBefore(handoff, "validate:privacy-parity", "release:audit");
  requireStepBefore(handoff, "validate:privacy-parity", "generate:android-permissions");
  requireStepBefore(handoff, "generate:android-permissions", "validate:android-permissions");
  requireStepBefore(handoff, "validate:android-permissions", "release:audit");
  requireStepBefore(handoff, "validate:signing-readiness", "validate:android-signing-helper");
  requireStepBefore(handoff, "validate:android-signing-helper", "generate:android-signing-handoff");
  requireStepBefore(handoff, "validate:play-upload-confirmation", "validate:play-upload-helper");
  requireStepBefore(handoff, "validate:play-upload-helper", "generate:play-production-readiness");
  requireStepBefore(handoff, "validate:runtime-qa-report", "validate:runtime-qa-helper");
  requireStepBefore(handoff, "validate:runtime-qa-helper", "validate:play-upload-confirmation");
  requireStepBefore(handoff, "validate:public-push", "generate:public-repo-manifest");
  requireStepBefore(handoff, "generate:public-repo-manifest", "validate:public-repo-manifest");
  requireStepBefore(handoff, "validate:public-repo-manifest", "generate:github-publication-packet");
  requireStepBefore(handoff, "validate:public-repo-manifest", "validate:github-publication-helper");
  requireStepBefore(handoff, "validate:github-publication-helper", "generate:github-publication-packet");
  requireStepBefore(handoff, "validate:public-repo-manifest", "release:audit");
  requireStepBefore(handoff, "generate:play-console-packet", "validate:play-console-packet");
  requireStepBefore(handoff, "validate:play-console-packet", "generate:play-console-field-map");
  requireStepBefore(handoff, "generate:play-console-field-map", "validate:play-console-field-map");
  requireStepBefore(handoff, "validate:play-console-field-map", "generate:runtime-qa-report");
  requireStepBefore(handoff, "validate:visual-test-report", "generate:visual-evidence");
  requireStepBefore(handoff, "generate:visual-evidence", "validate:visual-evidence");
  requireStepBefore(handoff, "validate:visual-evidence", "generate:cloudflare-pages-deployment");
  requireStepBefore(handoff, "generate:cloudflare-pages-deployment", "validate:cloudflare-pages-deployment");
  requireStepBefore(handoff, "validate:cloudflare-pages-deployment", "release:status");

  const auditIndex = stepIndex(handoff, "release:audit");
  const postAuditGenerateIndex = stepIndex(handoff, "generate:owner-action-packet", auditIndex + 1);
  const postAuditValidateIndex = stepIndex(handoff, "validate:owner-action-packet", auditIndex + 1);
  if (postAuditGenerateIndex === -1) {
    fail("release:handoff must regenerate owner-action-packet after release:audit.");
  }
  if (postAuditValidateIndex === -1) {
    fail("release:handoff must revalidate owner-action-packet after release:audit.");
  }
  requireStepBefore(handoff, "generate:release-evidence-index", "validate:release-evidence-index");
  requireStepBefore(handoff, "release:audit", "generate:release-completion-matrix");
  requireStepBefore(handoff, "generate:release-completion-matrix", "validate:release-completion-matrix");
  requireStepBefore(handoff, "validate:release-completion-matrix", "generate:release-blockers");
  requireStepBefore(handoff, "generate:release-blockers", "validate:release-blockers");
  requireStepBefore(handoff, "validate:release-blockers", "validate:release-audit");
  requireStepBefore(handoff, "validate:release-audit", "generate:release-evidence-index");
  requireStepBefore(handoff, "validate:release-evidence-index", "validate:release-evidence-docs");
  requireStepBefore(handoff, "validate:release-evidence-docs", "validate:public");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Release handoff checks passed.");

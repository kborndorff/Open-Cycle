const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const statusPath = path.join(root, "reports", "release-status.json");
const runtimeQaReportPath = path.join(root, "reports", "runtime-qa-report.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function runtimeQaComplete() {
  if (!fs.existsSync(runtimeQaReportPath)) {
    return false;
  }
  const contents = fs.readFileSync(runtimeQaReportPath, "utf8");
  return (
    contents.includes("Runtime QA report") &&
    contents.includes("Signed AAB SHA-256:") &&
    contents.includes("Signed AAB size bytes:") &&
    contents.includes("Confirmed `npm run validate:android -- --require-signed` passed for this signed candidate.") &&
    contents.includes("Captured at least two phone screenshots") &&
    !contents.includes("- [ ]") &&
    !contents.includes("TODO") &&
    !contents.includes("pending-signed-aab")
  );
}

if (!fs.existsSync(statusPath)) {
  fail("Missing reports/release-status.json. Run npm run release:status first.");
} else {
  const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));

  if (!["ready-for-private-signing", "ready-for-play-upload"].includes(status.publicReadinessStatus)) {
    fail("Release status must be ready-for-private-signing or ready-for-play-upload.");
  }
  if (status.repository !== "https://github.com/kborndorff/Open-Cycle") {
    fail("Release status must reference the public repository.");
  }
  if (status.liveSiteUrl !== "https://open-cycle-site.pages.dev") {
    fail("Release status must reference the stable Cloudflare Pages URL.");
  }
  if (status.customDomainUrl !== "https://open-cycle.com") {
    fail("Release status must reference the open-cycle.com custom domain.");
  }
  if (!/^https:\/\/.+\/privacy(?:\.html)?$/.test(status.privacyPolicyUrl || "")) {
    fail("Release status must include a valid hosted privacy URL.");
  }
  if (status.artifacts?.unsignedAab?.exists !== true) {
    fail("Release status must include an unsigned AAB artifact.");
  }
  if (
    status.publicReadinessStatus === "ready-for-private-signing" &&
    status.artifacts?.signedAab?.exists === true &&
    !status.privateRemainingSteps?.some((step) => step.id === "signedAab")
  ) {
    fail("Release status has a signed AAB artifact but does not keep signedAab in private remaining steps.");
  }
  if (status.publicReadinessStatus === "ready-for-private-signing") {
    if (status.artifacts?.signedAab?.currentCandidateReady === true) {
      fail("Release status must not mark a signed AAB current while private signing remains.");
    }
    if (!String(status.artifacts?.signedAab?.releaseUse || "").includes("do not upload until")) {
      fail("Release status must warn that a non-current signed AAB must not be uploaded.");
    }
  }
  if (status.publicReadinessStatus === "ready-for-play-upload" && status.artifacts?.signedAab?.currentCandidateReady !== true) {
    fail("Release status must mark the signed AAB current when ready for Play upload.");
  }
  const runtimeQaDone = runtimeQaComplete();
  const expectedPrivateSteps = [
    ...(status.publicReadinessStatus === "ready-for-play-upload" ? [] : ["signedAab"]),
    ...(runtimeQaDone ? [] : ["signedRuntimeQa"]),
    "playConsoleUpload"
  ];
  for (const expected of expectedPrivateSteps) {
    if (!status.privateRemainingSteps?.some((step) => step.id === expected)) {
      fail(`Release status is missing private remaining step: ${expected}`);
    }
  }
  if (status.publicReadinessStatus === "ready-for-play-upload" && status.privateRemainingSteps?.some((step) => step.id === "signedAab")) {
    fail("Release status should not list signedAab as remaining after signed preflight passes.");
  }
  if (runtimeQaDone && status.privateRemainingSteps?.some((step) => step.id === "signedRuntimeQa")) {
    fail("Release status should not list signedRuntimeQa as remaining after runtime QA completion passes.");
  }
  if (!Array.isArray(status.publicRemainingSteps)) {
    fail("Release status must include publicRemainingSteps.");
  }
  const expectedEvidence = [
    ["releaseArtifactHygiene", "npm run validate:release-artifacts"],
    ["cloudflarePagesDeployment", "npm run validate:cloudflare-pages-deployment"],
    ["publicArtifactPolicy", "npm run validate:public-artifacts"],
    ["publicRepositoryPublicationManifest", "npm run validate:public-repo-manifest"],
    ["localOnlyRuntime", "npm run validate:local-only-runtime"],
    ["workflowProvenance", "npm run validate:workflow-provenance"],
    ["privacyParity", "npm run validate:privacy-parity"],
    ["androidPermissions", "npm run validate:android-permissions"],
    ["playContentRating", "npm run validate:play-content-rating"],
    ["playHealthDeclaration", "npm run validate:play-health-declaration"],
    ["playAppAccess", "npm run validate:play-app-access"],
    ["playAdsDeclaration", "npm run validate:play-ads-declaration"],
    ["playTargetAudience", "npm run validate:play-target-audience"],
    ["playTestingRollout", "npm run validate:play-testing-rollout"],
    ["playAppContent", "npm run validate:play-app-content"],
    ["playReleaseCandidate", "npm run validate:play-release-candidate"],
    ["playConsoleFieldMap", "npm run validate:play-console-field-map"],
    ["visualTestReport", "npm run validate:visual-test-report"],
    ["visualEvidenceManifest", "npm run validate:visual-evidence"],
    ["signedRuntimeQaPreflight", "npm run validate:signed-runtime-qa-preflight"],
    ["androidSigningHandoff", "npm run validate:android-signing-handoff"],
    ["playProductionReadiness", "npm run validate:play-production-readiness"]
  ];
  for (const [key, command] of expectedEvidence) {
    const evidence = status.publicEvidence?.[key];
    if (!evidence) {
      fail(`Release status is missing publicEvidence.${key}.`);
      continue;
    }
    if (evidence.status !== "pass") {
      fail(`Release status publicEvidence.${key} must pass.`);
    }
    if (evidence.command !== command) {
      fail(`Release status publicEvidence.${key} must include command: ${command}`);
    }
    if (evidence.secretSafe !== true) {
      fail(`Release status publicEvidence.${key} must be secret-safe.`);
    }
    if (!Array.isArray(evidence.failures) || evidence.failures.length !== 0) {
      fail(`Release status publicEvidence.${key} must have no failures.`);
    }
    if (status.artifacts?.[key]?.exists !== true) {
      fail(`Release status artifact must exist: ${key}`);
    }
  }
  for (const expected of ["liveCloudflarePagesDomainAttachment", "liveCustomDomainPublication", "liveGithubPublication", "liveGithubActions"]) {
    if (!status.publicRemainingSteps?.some((step) => step.id === expected) && status.publicReadinessStatus === "ready-for-private-signing") {
      continue;
    }
  }
  for (const command of [
    "npm run validate:release",
    "npm run validate:play-store-public",
    "npm run validate:custom-domain",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run generate:custom-domain-dns",
    "npm run validate:custom-domain-dns",
    "npm run validate:release-artifacts",
    "npm run validate:public-artifacts",
    "npm run generate:public-repo-manifest",
    "npm run validate:public-repo-manifest",
    "npm run validate:local-only-runtime",
    "npm run validate:workflow-provenance",
    "npm run validate:privacy-parity",
    "npm run validate:android-permissions",
    "npm run validate:play-content-rating",
    "npm run validate:play-health-declaration",
    "npm run validate:play-app-access",
    "npm run validate:play-ads-declaration",
    "npm run validate:play-target-audience",
    "npm run validate:play-testing-rollout",
    "npm run validate:play-app-content",
    "npm run validate:play-release-candidate",
    "npm run generate:play-console-field-map",
    "npm run validate:play-console-field-map",
    "npm run validate:visual-test-report",
    "npm run generate:visual-evidence",
    "npm run validate:visual-evidence",
    "npm run generate:signed-runtime-qa-preflight",
    "npm run validate:signed-runtime-qa-preflight",
    "npm run validate:android-signing-handoff",
    "npm run validate:play-production-readiness",
    "npm run validate:site:live -- --url=https://open-cycle-site.pages.dev",
    "npm run validate:cloudflare-pages-domains:live",
    "npm run validate:custom-domain:live",
    "npm run validate:github:live",
    "npm run validate:github:actions",
    "npm run validate:release-handoff",
    "npm run release:handoff",
    "npm run release:public-ready"
  ]) {
    if (!status.publicValidationCommands?.includes(command)) {
      fail(`Release status is missing public validation command: ${command}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Release status checks passed.");

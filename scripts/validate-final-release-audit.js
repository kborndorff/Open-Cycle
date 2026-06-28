const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const auditPath = path.join(root, "reports", "final-release-audit.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(auditPath)) {
  fail("Missing reports/final-release-audit.json. Run npm run release:audit first.");
} else {
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

  if (!["public-ready-private-actions-remaining", "ready-for-play-upload", "play-upload-confirmed"].includes(audit.status)) {
    fail("Final release audit must be public-ready, ready for Play upload, or Play-upload confirmed.");
  }
  if (audit.repository !== "https://github.com/kborndorff/Open-Cycle") {
    fail("Final release audit must reference the public GitHub repository.");
  }
  if (audit.liveSiteUrl !== "https://open-cycle-site.pages.dev") {
    fail("Final release audit must reference the stable Cloudflare Pages URL.");
  }
  if (audit.failedChecks?.length) {
    fail(`Final release audit has failed public checks: ${audit.failedChecks.join(", ")}`);
  }
  for (const expected of [
    "sourceAvailableLicense",
    "securityDisclosure",
    "publicRepositoryLinks",
    "publicPushReadiness",
    "publicRepositoryPublicationManifest",
    "releaseArtifactHygiene",
    "publicArtifactPolicy",
    "localOnlyRuntime",
    "workflowProvenance",
    "privacyParity",
    "androidPermissions",
    "visualTestReport",
    "visualEvidenceManifest",
    "ownerDryRun",
    "cloudflarePagesWorkflow",
    "customDomainReadiness",
    "androidPublicWorkflow",
    "playPublicReadiness",
    "releaseStatus",
    "releaseCompletionMatrix",
    "releaseBlockerReport",
    "functionCoverage",
    "liveSitePublication",
    "cloudflarePagesDeployment",
    "liveCloudflarePagesDomainAttachment",
    "liveCustomDomainPublication",
    "liveGithubPublication",
    "liveGithubActions",
    "githubPublicationPacket",
    "playConsolePacket",
    "playDataSafetyPacket",
    "playContentRatingPacket",
    "playHealthDeclarationPacket",
    "playAppAccessPacket",
    "playAdsDeclarationPacket",
    "playTargetAudiencePacket",
    "playTestingRolloutPacket",
    "playAppContentPacket",
    "playReleaseCandidatePacket",
    "androidSigningHandoffPacket",
    "playProductionReadinessPacket",
    "ownerActionPacket",
    "unsignedAab",
    "signedAab",
    "signedRuntimeQa",
    "playConsoleUpload"
  ]) {
    if (!audit.checks?.[expected]) {
      fail(`Final release audit is missing check: ${expected}`);
    }
  }
  if (audit.checks?.signedAab?.status !== "pending" && audit.checks?.signedAab?.status !== "pass") {
    fail("Signed AAB check must be pending or pass.");
  }
  for (const expected of ["signedRuntimeQa", "playConsoleUpload"]) {
    if (audit.checks?.[expected]?.status !== "pending" && audit.checks?.[expected]?.status !== "pass") {
      fail(`${expected} check must be pending or pass.`);
    }
  }
  if (audit.status === "play-upload-confirmed") {
    for (const expected of ["liveCloudflarePagesDomainAttachment", "liveCustomDomainPublication", "liveGithubPublication", "liveGithubActions", "signedAab", "signedRuntimeQa", "playConsoleUpload"]) {
      if (audit.checks?.[expected]?.status !== "pass") {
        fail(`Final release audit cannot be play-upload-confirmed until ${expected} passes.`);
      }
    }
    if (audit.pendingChecks?.length) {
      fail("Final release audit cannot be play-upload-confirmed with pending checks.");
    }
  }
  if (audit.checks?.liveGithubPublication?.status !== "pending" && audit.checks?.liveGithubPublication?.status !== "pass") {
    fail("Live GitHub publication check must be pending or pass.");
  }
  if (audit.checks?.liveSitePublication?.status !== "pending" && audit.checks?.liveSitePublication?.status !== "pass") {
    fail("Live site publication check must be pending or pass.");
  }
  if (audit.checks?.liveCloudflarePagesDomainAttachment?.status !== "pending" && audit.checks?.liveCloudflarePagesDomainAttachment?.status !== "pass") {
    fail("Live Cloudflare Pages domain attachment check must be pending or pass.");
  }
  if (audit.checks?.liveCustomDomainPublication?.status !== "pending" && audit.checks?.liveCustomDomainPublication?.status !== "pass") {
    fail("Live custom domain publication check must be pending or pass.");
  }
  if (audit.checks?.liveGithubActions?.status !== "pending" && audit.checks?.liveGithubActions?.status !== "pass") {
    fail("Live GitHub Actions check must be pending or pass.");
  }
  if (!audit.advisoryChecks?.ownerToolReadiness) {
    fail("Final release audit is missing advisory owner tool readiness check.");
  } else {
    const ownerToolReadiness = audit.advisoryChecks.ownerToolReadiness;
    if (!["pending", "pass"].includes(ownerToolReadiness.status)) {
      fail("Owner tool readiness advisory check must be pending or pass.");
    }
    if (!Array.isArray(ownerToolReadiness.missingRequired)) {
      fail("Owner tool readiness advisory check must include missingRequired.");
    }
    if (!Array.isArray(ownerToolReadiness.missingRecommended)) {
      fail("Owner tool readiness advisory check must include missingRecommended.");
    }
  }
  if (!audit.advisoryChecks?.signingReadiness) {
    fail("Final release audit is missing advisory signing readiness check.");
  } else {
    const signingReadiness = audit.advisoryChecks.signingReadiness;
    if (!["pending", "pass"].includes(signingReadiness.status)) {
      fail("Signing readiness advisory check must be pending or pass.");
    }
    if (!Array.isArray(signingReadiness.failedChecks)) {
      fail("Signing readiness advisory check must include failedChecks.");
    }
  }
  if (!audit.advisoryChecks?.cloudflareReadiness) {
    fail("Final release audit is missing advisory Cloudflare readiness check.");
  } else {
    const cloudflareReadiness = audit.advisoryChecks.cloudflareReadiness;
    if (!["pending", "pass"].includes(cloudflareReadiness.status)) {
      fail("Cloudflare readiness advisory check must be pending or pass.");
    }
    if (!Array.isArray(cloudflareReadiness.failedChecks)) {
      fail("Cloudflare readiness advisory check must include failedChecks.");
    }
  }
  if (!audit.advisoryChecks?.signedAabEvidence) {
    fail("Final release audit is missing advisory signed AAB evidence check.");
  } else {
    const signedAabEvidence = audit.advisoryChecks.signedAabEvidence;
    if (!["pending", "pass"].includes(signedAabEvidence.status)) {
      fail("Signed AAB evidence advisory check must be pending or pass.");
    }
    if (!Array.isArray(signedAabEvidence.failures)) {
      fail("Signed AAB evidence advisory check must include failures.");
    }
  }
  for (const command of [
    "npm run validate:release",
    "npm run validate:play-store-public",
    "npm run validate:functions",
    "npm run validate:custom-domain",
    "npm run validate:public-push",
    "npm run generate:public-repo-manifest",
    "npm run validate:public-repo-manifest",
    "npm run validate:release-artifacts",
    "npm run validate:public-artifacts",
    "npm run validate:local-only-runtime",
    "npm run generate:workflow-provenance",
    "npm run validate:workflow-provenance",
    "npm run generate:privacy-parity",
    "npm run validate:privacy-parity",
    "npm run generate:android-permissions",
    "npm run validate:android-permissions",
    "npm run test:visual",
    "npm run validate:visual-test-report",
    "npm run generate:visual-evidence",
    "npm run validate:visual-evidence",
    "npm run release:owner-dry-run",
    "npm run mobile:unsigned-aab:evidence -- --require-aab",
    "npm run validate:signing-readiness",
    "npm run validate:site:live -- --url=https://open-cycle-site.pages.dev",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-domains:live",
    "npm run validate:custom-domain:live",
    "npm run validate:github:live",
    "npm run validate:github:actions",
    "npm run release:status",
    "npm run validate:release-status",
    "npm run generate:release-completion-matrix",
    "npm run validate:release-completion-matrix",
    "npm run generate:release-blockers",
    "npm run validate:release-blockers",
    "npm run generate:github-publication-packet",
    "npm run validate:github-publication-packet",
    "npm run generate:play-console-packet",
    "npm run validate:play-console-packet",
    "npm run generate:play-data-safety",
    "npm run validate:play-data-safety",
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
    "npm run generate:android-signing-handoff",
    "npm run validate:android-signing-handoff",
    "npm run generate:play-production-readiness",
    "npm run validate:play-production-readiness",
    "npm run generate:owner-action-packet",
    "npm run validate:owner-action-packet",
    "npm run validate:release-handoff",
    "npm run release:handoff",
    "npm run release:public-ready"
  ]) {
    if (!audit.requiredPublicCommands?.includes(command)) {
      fail(`Final release audit is missing public command: ${command}`);
    }
  }
  const signedAabPassed = audit.checks?.signedAab?.status === "pass";
  const signedRuntimeQaPassed = audit.checks?.signedRuntimeQa?.status === "pass";
  const expectedPrivateSteps = [
    ...(signedAabPassed ? [] : ["signedAab"]),
    ...(signedRuntimeQaPassed ? [] : ["signedRuntimeQa"]),
    "playConsoleUpload"
  ];
  for (const expected of expectedPrivateSteps) {
    if (!audit.privateRemainingSteps?.some((step) => step.id === expected)) {
      fail(`Final release audit is missing private remaining step: ${expected}`);
    }
  }
  if (signedAabPassed && audit.privateRemainingSteps?.some((step) => step.id === "signedAab")) {
    fail("Final release audit should not list signedAab as remaining after the signed AAB check passes.");
  }
  if (signedRuntimeQaPassed && audit.privateRemainingSteps?.some((step) => step.id === "signedRuntimeQa")) {
    fail("Final release audit should not list signedRuntimeQa as remaining after runtime QA passes.");
  }
  for (const [name, artifact] of Object.entries(audit.artifacts || {})) {
    if (!["signedAab", "runtimeQaReport", "playUploadConfirmation", "liveGithubPublication", "liveSitePublication", "liveCloudflarePagesDomainAttachment", "liveCustomDomainPublication", "liveGithubActions", "signedAabEvidence"].includes(name) && artifact.exists !== true) {
      fail(`Final release audit artifact must exist: ${name}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Final release audit checks passed.");

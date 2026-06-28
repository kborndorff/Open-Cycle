const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");

const files = {
  packageJson: path.join(root, "package.json"),
  license: path.join(root, "LICENSE.md"),
  security: path.join(root, "SECURITY.md"),
  deploySiteWorkflow: path.join(root, ".github", "workflows", "deploy-site.yml"),
  androidWorkflow: path.join(root, ".github", "workflows", "android-aab.yml"),
  preflight: path.join(reportsDir, "play-store-preflight.json"),
  releaseStatus: path.join(reportsDir, "release-status.json"),
  releaseCompletionMatrixJson: path.join(reportsDir, "release-completion-matrix.json"),
  releaseCompletionMatrixMd: path.join(reportsDir, "release-completion-matrix.md"),
  releaseBlockerReportJson: path.join(reportsDir, "release-blocker-report.json"),
  releaseBlockerReportMd: path.join(reportsDir, "release-blocker-report.md"),
  ownerToolReadiness: path.join(reportsDir, "owner-release-tools.json"),
  cloudflareReadiness: path.join(reportsDir, "cloudflare-readiness.json"),
  customDomainReadiness: path.join(reportsDir, "custom-domain-readiness.json"),
  signingReadiness: path.join(reportsDir, "signing-readiness.json"),
  releaseArtifactHygiene: path.join(reportsDir, "release-artifact-hygiene.json"),
  publicArtifactPolicy: path.join(reportsDir, "public-artifact-policy.json"),
  localOnlyRuntime: path.join(reportsDir, "local-only-runtime.json"),
  workflowProvenance: path.join(reportsDir, "workflow-provenance.json"),
  privacyParity: path.join(reportsDir, "privacy-parity.json"),
  androidPermissions: path.join(reportsDir, "android-permissions.json"),
  visualTestReport: path.join(reportsDir, "visual-test-report.json"),
  visualEvidenceManifest: path.join(reportsDir, "visual-evidence-manifest.json"),
  ownerDryRun: path.join(reportsDir, "owner-release-dry-run.json"),
  publicPushReadiness: path.join(reportsDir, "public-push-readiness.json"),
  publicRepositoryPublicationManifest: path.join(reportsDir, "public-repository-publication-manifest.md"),
  functionCoverage: path.join(reportsDir, "function-coverage.json"),
  liveSitePublication: path.join(reportsDir, "live-site-publication.json"),
  cloudflarePagesDeployment: path.join(reportsDir, "cloudflare-pages-deployment.json"),
  liveCloudflarePagesDomainAttachment: path.join(reportsDir, "cloudflare-pages-domain-attachment.json"),
  liveCustomDomainPublication: path.join(reportsDir, "live-custom-domain-publication.json"),
  liveGithubPublication: path.join(reportsDir, "live-github-publication.json"),
  liveGithubActions: path.join(reportsDir, "live-github-actions.json"),
  githubPacket: path.join(reportsDir, "github-publication-packet.md"),
  playPacket: path.join(reportsDir, "play-console-upload-packet.md"),
  playDataSafetyPacket: path.join(reportsDir, "play-data-safety-packet.md"),
  playContentRatingPacket: path.join(reportsDir, "play-content-rating-packet.md"),
  playHealthDeclarationPacket: path.join(reportsDir, "play-health-declaration-packet.md"),
  playAppAccessPacket: path.join(reportsDir, "play-app-access-packet.md"),
  playAdsDeclarationPacket: path.join(reportsDir, "play-ads-declaration-packet.md"),
  playTargetAudiencePacket: path.join(reportsDir, "play-target-audience-packet.md"),
  playTestingRolloutPacket: path.join(reportsDir, "play-testing-rollout-packet.md"),
  playAppContentPacket: path.join(reportsDir, "play-app-content-packet.md"),
  playReleaseCandidatePacket: path.join(reportsDir, "play-release-candidate-packet.md"),
  androidSigningHandoffPacket: path.join(reportsDir, "android-signing-handoff-packet.md"),
  playProductionReadinessPacket: path.join(reportsDir, "play-production-readiness-packet.md"),
  ownerActionPacket: path.join(reportsDir, "owner-action-packet.md"),
  runtimeQaReport: path.join(reportsDir, "runtime-qa-report.md"),
  playUploadConfirmation: path.join(reportsDir, "play-console-upload-confirmation.json"),
  unsignedAabEvidence: path.join(reportsDir, "unsigned-aab-evidence.json"),
  signedAabEvidence: path.join(reportsDir, "signed-aab-evidence.json"),
  unsignedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  signedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab")
};

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  return JSON.parse(read(file));
}

function status(pass, detail) {
  return { status: pass ? "pass" : "fail", detail };
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

function pending(detail) {
  return { status: "pending", detail };
}

function fileInfo(file) {
  if (!exists(file)) {
    return { exists: false };
  }
  const stat = fs.statSync(file);
  return { exists: true, bytes: stat.size };
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function extractReportValue(report, label) {
  const match = new RegExp(`^- ${label}:\\s*(.+)$`, "m").exec(report);
  return match ? match[1].trim() : "";
}

function runtimeQaComplete(report) {
  const signedAabExists = exists(files.signedAab);
  const signedAabHash = extractReportValue(report || "", "Signed AAB SHA-256");
  const signedAabSize = extractReportValue(report || "", "Signed AAB size bytes");
  const signedAabHashMatches = signedAabExists
    ? signedAabHash.toLowerCase() === fileSha256(files.signedAab).toLowerCase()
    : false;
  const signedAabSizeMatches = signedAabExists
    ? signedAabSize === String(fs.statSync(files.signedAab).size)
    : false;

  return Boolean(
    report &&
      report.includes("Runtime QA report") &&
      report.includes("Signed AAB SHA-256:") &&
      report.includes("Signed AAB size bytes:") &&
      /^[a-f0-9]{64}$/i.test(signedAabHash) &&
      /^[1-9][0-9]*$/.test(signedAabSize) &&
      signedAabHashMatches &&
      signedAabSizeMatches &&
      !report.includes("- [ ]") &&
      !report.includes("pending-signed-aab") &&
      !report.includes("TODO")
  );
}

function playUploadConfirmed(confirmation) {
  if (!confirmation) {
    return false;
  }
  const signedAabExists = exists(files.signedAab);
  const signedAabHashMatches = signedAabExists
    ? String(confirmation.signedAabSha256 || "").toLowerCase() === fileSha256(files.signedAab).toLowerCase()
    : false;
  const signedAabSizeMatches = signedAabExists
    ? confirmation.signedAabSizeBytes === fs.statSync(files.signedAab).size
    : false;
  return Boolean(
    confirmation.uploaded === true &&
      confirmation.packageName === "com.opencycle.app" &&
      ["internal", "closed", "open", "production"].includes(confirmation.track) &&
      confirmation.releaseName &&
      confirmation.uploadedAt &&
      !Number.isNaN(Date.parse(confirmation.uploadedAt)) &&
      confirmation.privacyPolicyUrl === "https://open-cycle.com/privacy" &&
      confirmation.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation === "https://open-cycle-site.pages.dev/privacy" &&
      confirmation.customDomainValidationCommand === "npm run validate:custom-domain:live" &&
      /^[a-f0-9]{64}$/i.test(confirmation.signedAabSha256 || "") &&
      Number.isInteger(confirmation.signedAabSizeBytes) &&
      confirmation.signedAabSizeBytes > 0 &&
      signedAabHashMatches &&
      signedAabSizeMatches &&
      String(confirmation.playConsoleUrl || "").startsWith("https://play.google.com/console")
  );
}

function pendingCheckIds(checks) {
  return Object.entries(checks)
    .filter(([name, result]) => name !== "releaseBlockerReport" && result.status === "pending")
    .map(([name]) => name);
}

function sameItems(left, right) {
  return left.length === right.length && left.every((item) => right.includes(item));
}

function releaseBlockerReportCheck(reportJson, reportMd, checks) {
  if (!exists(files.releaseBlockerReportJson) || !exists(files.releaseBlockerReportMd)) {
    return pending("Release blocker report will be generated from the final audit and checked on the refreshed audit pass.");
  }

  const currentPending = pendingCheckIds(checks);
  const blockerIds = Array.isArray(reportJson.blockers) ? reportJson.blockers.map((blocker) => blocker.id) : [];

  if (
    reportMd.includes("CF_API_TOKEN=") ||
    reportMd.includes("ANDROID_KEYSTORE_PASSWORD=") ||
    JSON.stringify(reportJson).includes("CF_API_TOKEN=") ||
    JSON.stringify(reportJson).includes("ANDROID_KEYSTORE_PASSWORD=")
  ) {
    return status(false, "Release blocker report contains forbidden secret marker text.");
  }

  if (
    !reportMd.includes("Release blocker report") ||
    !reportMd.includes("Current blockers") ||
    !reportMd.includes("Safe sequence") ||
    !Array.isArray(reportJson.blockers) ||
    !Number.isInteger(reportJson.blockerCount) ||
    reportJson.blockerCount !== blockerIds.length ||
    !reportJson.blockers.every((blocker) => blocker.helper && blocker.proofCommand)
  ) {
    return status(false, "Release blocker report is malformed and must be regenerated.");
  }

  if (!sameItems(blockerIds, currentPending)) {
    return pending("Release blocker report is stale and must be regenerated from the current final audit.");
  }

  return status(true, "Release blocker report maps the current remaining owner-only gates to exact helper and proof commands without secrets.");
}

function liveGithubPublicationConfirmed(report) {
  if (!report) {
    return false;
  }
  return Boolean(
      report.status === "pass" &&
      report.repository === "kborndorff/Open-Cycle" &&
      typeof report.branch === "string" &&
      report.branch.length > 0 &&
      report.url === "https://github.com/kborndorff/Open-Cycle" &&
      Array.isArray(report.checkedFiles) &&
      report.checkedFiles.includes("README.md") &&
      report.checkedFiles.includes("LICENSE.md") &&
      report.checkedFiles.includes("SECURITY.md") &&
      report.checkedFiles.includes("docs/deployment-secrets.md") &&
      report.checkedFiles.includes("docs/cloudflare-pages-domain-diagnostics.md") &&
      report.checkedFiles.includes("docs/release-owner-checklist.md") &&
      report.checkedFiles.includes("docs/owner-tooling.md") &&
      report.checkedFiles.includes("docs/github-web-publication.md") &&
      report.checkedFiles.includes("docs/validation-matrix.md") &&
      report.checkedFiles.includes("docs/release-evidence.md") &&
      report.checkedFiles.includes("docs/play-store-release.md") &&
      report.checkedFiles.includes("docs/runtime-qa.md") &&
      report.checkedFiles.includes("docs/mobile-release.md") &&
      report.checkedFiles.includes("docs/android-keystore-handling.md") &&
      report.checkedFiles.includes("site/license.html") &&
      report.checkedFiles.includes("scripts/validate-function-coverage.js") &&
      report.checkedFiles.includes("scripts/validate-license-policy.js") &&
      report.checkedFiles.includes("scripts/validate-signing-readiness.js") &&
      report.checkedFiles.includes("scripts/validate-cloudflare-pages-domain-attachment.js") &&
      report.checkedFiles.includes("scripts/print-cloudflare-domain-attach-help.ps1") &&
      report.checkedFiles.includes("scripts/validate-cloudflare-domain-attach-helper.js") &&
      report.checkedFiles.includes("scripts/validate-public-artifact-policy.js") &&
      report.checkedFiles.includes("scripts/validate-local-only-runtime.js") &&
      report.checkedFiles.includes("scripts/generate-workflow-provenance-report.js") &&
      report.checkedFiles.includes("scripts/validate-workflow-provenance-report.js") &&
      report.checkedFiles.includes("scripts/generate-privacy-parity-report.js") &&
      report.checkedFiles.includes("scripts/validate-privacy-parity-report.js") &&
      report.checkedFiles.includes("scripts/generate-android-permissions-report.js") &&
      report.checkedFiles.includes("scripts/validate-android-permissions-report.js") &&
      report.checkedFiles.includes("scripts/generate-release-evidence-index.js") &&
      report.checkedFiles.includes("scripts/generate-release-completion-matrix.js") &&
      report.checkedFiles.includes("scripts/validate-release-evidence-index.js") &&
      report.checkedFiles.includes("scripts/validate-release-completion-matrix.js") &&
      report.checkedFiles.includes("scripts/generate-release-blocker-report.js") &&
      report.checkedFiles.includes("scripts/validate-release-blocker-report.js") &&
      report.checkedFiles.includes("scripts/validate-release-evidence-docs.js") &&
      report.checkedFiles.includes("scripts/generate-public-repository-publication-manifest.js") &&
      report.checkedFiles.includes("scripts/validate-public-repository-publication-manifest.js") &&
      report.checkedFiles.includes("scripts/generate-play-data-safety-packet.js") &&
      report.checkedFiles.includes("scripts/validate-play-data-safety-packet.js") &&
      report.checkedFiles.includes("scripts/build-aab.js") &&
      report.checkedFiles.includes("scripts/sign-aab.js") &&
      report.checkedFiles.includes("scripts/validate-android-release.js") &&
      report.checkedFiles.includes("scripts/android-local-release.js") &&
      report.checkedFiles.includes("scripts/play-store-public-readiness.js") &&
      report.checkedFiles.includes("scripts/play-store-private-readiness.js") &&
      report.checkedFiles.includes("scripts/play-store-complete-readiness.js") &&
      report.checkedFiles.includes("scripts/print-unsigned-aab-evidence.js") &&
      report.checkedFiles.includes("scripts/print-signed-aab-evidence.js") &&
      report.checkedFiles.includes("scripts/sync-signed-aab-evidence.js") &&
      report.checkedFiles.includes("scripts/public-release-readiness.js") &&
      report.checkedFiles.includes("scripts/generate-owner-action-packet.js") &&
      report.checkedFiles.includes("scripts/validate-owner-action-packet.js") &&
      report.checkedFiles.includes("scripts/print-github-cli-help.ps1") &&
      report.checkedFiles.includes("scripts/print-github-publication-help.ps1") &&
      report.checkedFiles.includes("scripts/print-owner-tool-env.ps1") &&
      report.checkedFiles.includes("scripts/print-next-release-steps.js") &&
      report.checkedFiles.includes("scripts/setup-github-deployment-secrets.ps1") &&
      report.checkedFiles.includes(".github/workflows/deploy-site.yml") &&
      report.checkedFiles.includes(".github/workflows/android-aab.yml") &&
      (!Array.isArray(report.failures) || report.failures.length === 0)
  );
}

function liveSitePublicationConfirmed(report) {
  if (!report) {
    return false;
  }
  const validatedUrls = new Set(Array.isArray(report.validatedUrls) ? report.validatedUrls : []);
  if (report.status === "pass" && typeof report.url === "string") {
    validatedUrls.add(report.url);
  }
  return Boolean(
    report.status === "pass" &&
      validatedUrls.has("https://open-cycle-site.pages.dev") &&
      Array.isArray(report.checkedPaths) &&
      report.checkedPaths.includes("/") &&
      report.checkedPaths.includes("/privacy.html") &&
      report.checkedPaths.includes("/license.html") &&
      report.checkedPaths.includes("/features") &&
      report.checkedPaths.includes("/open-cycle.html?next=/features") &&
      (!Array.isArray(report.failures) || report.failures.length === 0)
  );
}

function liveCustomDomainPublicationConfirmed(report) {
  if (!report) {
    return false;
  }
  return Boolean(
    report.status === "pass" &&
      ["https://open-cycle.com", "https://www.open-cycle.com"].includes(report.url) &&
      Array.isArray(report.checkedPaths) &&
      report.checkedPaths.includes("/") &&
      report.checkedPaths.includes("/privacy.html") &&
      report.checkedPaths.includes("/license.html") &&
      report.checkedPaths.includes("/features") &&
      report.checkedPaths.includes("/open-cycle.html?next=/features") &&
      (!Array.isArray(report.failures) || report.failures.length === 0)
  );
}

function liveCloudflarePagesDomainAttachmentConfirmed(report, deploymentReport) {
  const attachmentReportConfirmed = Boolean(
    report &&
      report.status === "pass" &&
      report.projectName === "open-cycle-site" &&
      Array.isArray(report.requiredDomains) &&
      report.requiredDomains.includes("open-cycle-site.pages.dev") &&
      report.requiredDomains.includes("open-cycle.com") &&
      report.requiredDomains.includes("www.open-cycle.com") &&
      Array.isArray(report.project?.projectDomains) &&
      report.project.projectDomains.includes("open-cycle-site.pages.dev") &&
      report.project.projectDomains.includes("open-cycle.com") &&
      report.project.projectDomains.includes("www.open-cycle.com") &&
      (!Array.isArray(report.failures) || report.failures.length === 0)
  );
  const deploymentReportConfirmed = Boolean(
    deploymentReport &&
      deploymentReport.status === "pass" &&
      deploymentReport.projectName === "open-cycle-site" &&
      deploymentReport.customDomainStatus === "attached" &&
      Array.isArray(deploymentReport.missingCustomDomains) &&
      deploymentReport.missingCustomDomains.length === 0 &&
      Array.isArray(deploymentReport.project?.domains) &&
      deploymentReport.project.domains.includes("open-cycle-site.pages.dev") &&
      deploymentReport.project.domains.includes("open-cycle.com") &&
      deploymentReport.project.domains.includes("www.open-cycle.com") &&
      (!Array.isArray(deploymentReport.failures) || deploymentReport.failures.length === 0)
  );
  return attachmentReportConfirmed || deploymentReportConfirmed;
}

function liveGithubActionsConfirmed(report) {
  if (!report) {
    return false;
  }
  const requiredFiles = ["ci.yml", "android-aab.yml", "deploy-site.yml"];
  const expectedNames = {
    "ci.yml": "OpenCycle Local CI",
    "android-aab.yml": "Android AAB Check",
    "deploy-site.yml": "Deploy Site to Cloudflare Pages"
  };
  return Boolean(
      report.status === "pass" &&
      report.repository === "kborndorff/Open-Cycle" &&
      typeof report.branch === "string" &&
      report.branch.length > 0 &&
      Array.isArray(report.workflows) &&
      requiredFiles.every((file) => report.workflows.some((workflow) =>
        workflow.file === file &&
        workflow.expectedName === expectedNames[file] &&
        workflow.workflowName === expectedNames[file] &&
        workflow.workflowState === "active" &&
        workflow.workflowPath === `.github/workflows/${file}` &&
        workflow.status === "completed" &&
        workflow.conclusion === "success"
      )) &&
      (!Array.isArray(report.failures) || report.failures.length === 0)
  );
}

function main() {
  const packageJson = exists(files.packageJson) ? readJson(files.packageJson) : {};
  const license = exists(files.license) ? read(files.license) : "";
  const security = exists(files.security) ? read(files.security) : "";
  const deploySiteWorkflow = exists(files.deploySiteWorkflow) ? read(files.deploySiteWorkflow) : "";
  const androidWorkflow = exists(files.androidWorkflow) ? read(files.androidWorkflow) : "";
  const preflight = exists(files.preflight) ? readJson(files.preflight) : {};
  const releaseStatus = exists(files.releaseStatus) ? readJson(files.releaseStatus) : {};
  const releaseCompletionMatrixJson = exists(files.releaseCompletionMatrixJson) ? readJson(files.releaseCompletionMatrixJson) : {};
  const releaseCompletionMatrixMd = exists(files.releaseCompletionMatrixMd) ? read(files.releaseCompletionMatrixMd) : "";
  const releaseBlockerReportJson = exists(files.releaseBlockerReportJson) ? readJson(files.releaseBlockerReportJson) : {};
  const releaseBlockerReportMd = exists(files.releaseBlockerReportMd) ? read(files.releaseBlockerReportMd) : "";
  const ownerToolReadiness = exists(files.ownerToolReadiness) ? readJson(files.ownerToolReadiness) : {};
  const cloudflareReadiness = exists(files.cloudflareReadiness) ? readJson(files.cloudflareReadiness) : {};
  const customDomainReadiness = exists(files.customDomainReadiness) ? readJson(files.customDomainReadiness) : {};
  const signingReadiness = exists(files.signingReadiness) ? readJson(files.signingReadiness) : {};
  const releaseArtifactHygiene = exists(files.releaseArtifactHygiene) ? readJson(files.releaseArtifactHygiene) : {};
  const publicArtifactPolicy = exists(files.publicArtifactPolicy) ? readJson(files.publicArtifactPolicy) : {};
  const localOnlyRuntime = exists(files.localOnlyRuntime) ? readJson(files.localOnlyRuntime) : {};
  const workflowProvenance = exists(files.workflowProvenance) ? readJson(files.workflowProvenance) : {};
  const privacyParity = exists(files.privacyParity) ? readJson(files.privacyParity) : {};
  const androidPermissions = exists(files.androidPermissions) ? readJson(files.androidPermissions) : {};
  const visualTestReport = exists(files.visualTestReport) ? readJson(files.visualTestReport) : {};
  const visualEvidenceManifest = exists(files.visualEvidenceManifest) ? readJson(files.visualEvidenceManifest) : {};
  const ownerDryRun = exists(files.ownerDryRun) ? readJson(files.ownerDryRun) : {};
  const publicPushReadiness = exists(files.publicPushReadiness) ? readJson(files.publicPushReadiness) : {};
  const publicRepositoryPublicationManifest = exists(files.publicRepositoryPublicationManifest) ? read(files.publicRepositoryPublicationManifest) : "";
  const functionCoverage = exists(files.functionCoverage) ? readJson(files.functionCoverage) : {};
  const liveSitePublication = exists(files.liveSitePublication) ? readJson(files.liveSitePublication) : null;
  const cloudflarePagesDeployment = exists(files.cloudflarePagesDeployment) ? readJson(files.cloudflarePagesDeployment) : {};
  const liveCloudflarePagesDomainAttachment = exists(files.liveCloudflarePagesDomainAttachment) ? readJson(files.liveCloudflarePagesDomainAttachment) : null;
  const liveCustomDomainPublication = exists(files.liveCustomDomainPublication) ? readJson(files.liveCustomDomainPublication) : null;
  const liveGithubPublication = exists(files.liveGithubPublication) ? readJson(files.liveGithubPublication) : null;
  const liveGithubActions = exists(files.liveGithubActions) ? readJson(files.liveGithubActions) : null;
  const githubPacket = exists(files.githubPacket) ? read(files.githubPacket) : "";
  const playPacket = exists(files.playPacket) ? read(files.playPacket) : "";
  const playDataSafetyPacket = exists(files.playDataSafetyPacket) ? read(files.playDataSafetyPacket) : "";
  const playContentRatingPacket = exists(files.playContentRatingPacket) ? read(files.playContentRatingPacket) : "";
  const playHealthDeclarationPacket = exists(files.playHealthDeclarationPacket) ? read(files.playHealthDeclarationPacket) : "";
  const playAppAccessPacket = exists(files.playAppAccessPacket) ? read(files.playAppAccessPacket) : "";
  const playAdsDeclarationPacket = exists(files.playAdsDeclarationPacket) ? read(files.playAdsDeclarationPacket) : "";
  const playTargetAudiencePacket = exists(files.playTargetAudiencePacket) ? read(files.playTargetAudiencePacket) : "";
  const playTestingRolloutPacket = exists(files.playTestingRolloutPacket) ? read(files.playTestingRolloutPacket) : "";
  const playAppContentPacket = exists(files.playAppContentPacket) ? read(files.playAppContentPacket) : "";
  const playReleaseCandidatePacket = exists(files.playReleaseCandidatePacket) ? read(files.playReleaseCandidatePacket) : "";
  const androidSigningHandoffPacket = exists(files.androidSigningHandoffPacket) ? read(files.androidSigningHandoffPacket) : "";
  const playProductionReadinessPacket = exists(files.playProductionReadinessPacket) ? read(files.playProductionReadinessPacket) : "";
  const ownerActionPacket = exists(files.ownerActionPacket) ? read(files.ownerActionPacket) : "";
  const runtimeQaReport = exists(files.runtimeQaReport) ? read(files.runtimeQaReport) : "";
  const playUploadConfirmation = exists(files.playUploadConfirmation) ? readJson(files.playUploadConfirmation) : null;
  const unsignedAabEvidence = exists(files.unsignedAabEvidence) ? readJson(files.unsignedAabEvidence) : {};
  const signedAabEvidence = exists(files.signedAabEvidence) ? readJson(files.signedAabEvidence) : {};

  const onlySignedAabPending =
    Array.isArray(preflight.pendingPrivateSteps) &&
    preflight.pendingPrivateSteps.length === 1 &&
    preflight.pendingPrivateSteps[0] === "signedAab";
  const signedPreflightReady =
    preflight.status === "ready-for-play-upload" &&
    preflight.checks?.signedAab?.status === "pass" &&
    signedAabEvidence.status === "pass" &&
    Array.isArray(signedAabEvidence.failures) &&
    signedAabEvidence.failures.length === 0 &&
    Array.isArray(preflight.pendingPrivateSteps) &&
    preflight.pendingPrivateSteps.length === 0 &&
    Array.isArray(preflight.blockingFailures) &&
    preflight.blockingFailures.length === 0;

  const checks = {
    sourceAvailableLicense: status(
      packageJson.license === "LicenseRef-OpenCycle-Source-Available" &&
        includesNormalized(license, "This is a source-available license, not an open-source license.") &&
        includesNormalized(license, "public so people can inspect, audit, learn from, and verify") &&
        includesNormalized(license, "not published as an open-source license grant for commercial reuse") &&
        includesNormalized(license, "Public visibility does not grant permission to profit from this work") &&
        includesNormalized(license, "Google Play, the Apple App Store, F-Droid, Microsoft Store") &&
        includesNormalized(license, "hosted service, mobile app, paid app, subscription product, or competing product"),
      "LICENSE.md and package metadata preserve scrutiny-only, non-commercial source-available terms."
    ),
    securityDisclosure: status(
      security.includes("Cloudflare API tokens") &&
        security.includes("Android upload keystores") &&
        security.includes("No Android internet permission"),
      "SECURITY.md covers secret handling, keystores, and local-only Android expectations."
    ),
    publicRepositoryLinks: status(
      packageJson.repository?.url === "https://github.com/kborndorff/open-cycle-source.git" &&
        packageJson.homepage === "https://github.com/kborndorff/open-cycle-source",
      "Package metadata points at the full source GitHub repository."
    ),
    publicPushReadiness: status(
      publicPushReadiness.status === "pass" &&
        publicPushReadiness.repository === "https://github.com/kborndorff/Open-Cycle" &&
        publicPushReadiness.secretSafe === true &&
        publicPushReadiness.networkUsed === false &&
        publicPushReadiness.gitUsed === false &&
        Array.isArray(publicPushReadiness.failures) &&
        publicPushReadiness.failures.length === 0,
      "Local public-push file set is ready for GitHub publication without using secrets, Git, or network access."
    ),
    publicRepositoryPublicationManifest: status(
      publicRepositoryPublicationManifest.includes("Public repository publication manifest") &&
        publicRepositoryPublicationManifest.includes("public-safe by design") &&
        publicRepositoryPublicationManifest.includes("Private material that must stay out of GitHub") &&
        publicRepositoryPublicationManifest.includes("Do not push until the owner explicitly approves publication") &&
        publicRepositoryPublicationManifest.includes("Perform Android signing privately") &&
        !publicRepositoryPublicationManifest.includes("CF_API_TOKEN="),
      "Public repository publication manifest defines the GitHub-visible file set and the private release boundary."
    ),
    releaseArtifactHygiene: status(
      releaseArtifactHygiene.status === "pass" &&
        releaseArtifactHygiene.secretSafe === true &&
        releaseArtifactHygiene.gitUsed === false &&
        releaseArtifactHygiene.networkUsed === false &&
        Array.isArray(releaseArtifactHygiene.failures) &&
        releaseArtifactHygiene.failures.length === 0,
      "Release artifact hygiene confirms private signing files and generated bundles are ignored or kept out of publishable paths."
    ),
    publicArtifactPolicy: status(
      publicArtifactPolicy.status === "pass" &&
        publicArtifactPolicy.secretSafe === true &&
        publicArtifactPolicy.gitUsed === false &&
        publicArtifactPolicy.networkUsed === false &&
        Array.isArray(publicArtifactPolicy.failures) &&
        publicArtifactPolicy.failures.length === 0 &&
        Array.isArray(publicArtifactPolicy.policy?.publicArtifactsAllowed) &&
        publicArtifactPolicy.policy.publicArtifactsAllowed.includes("unsigned Android AAB build evidence") &&
        Array.isArray(publicArtifactPolicy.policy?.privateArtifactsForbiddenFromPublicAutomation) &&
        publicArtifactPolicy.policy.privateArtifactsForbiddenFromPublicAutomation.includes("signed Android AAB files"),
      "Public artifact policy confirms public automation can publish unsigned evidence only while signed release assets stay private."
    ),
    localOnlyRuntime: status(
      localOnlyRuntime.status === "pass" &&
        localOnlyRuntime.secretSafe === true &&
        localOnlyRuntime.gitUsed === false &&
        localOnlyRuntime.networkUsed === false &&
        Array.isArray(localOnlyRuntime.failures) &&
        localOnlyRuntime.failures.length === 0 &&
        Array.isArray(localOnlyRuntime.observedLocalSignals) &&
        localOnlyRuntime.observedLocalSignals.includes("localStorage") &&
        Array.isArray(localOnlyRuntime.bannedRuntimeSignals) &&
        localOnlyRuntime.bannedRuntimeSignals.includes("fetch") &&
        localOnlyRuntime.bannedRuntimeSignals.includes("Remote API env"),
      "Local-only runtime scan confirms the app/runtime source excludes network, analytics, cloud sync, ad, push, and remote API env paths."
    ),
    workflowProvenance: status(
      workflowProvenance.status === "pass" &&
        workflowProvenance.secretSafe === true &&
        workflowProvenance.signedArtifactsPublished === false &&
        workflowProvenance.playUploadAutomation === false &&
        workflowProvenance.siteDeploySource === "site/dist" &&
        Array.isArray(workflowProvenance.workflows) &&
        workflowProvenance.workflows.length >= 4 &&
        workflowProvenance.workflows.every((workflow) => workflow.status === "pass") &&
        Array.isArray(workflowProvenance.failures) &&
        workflowProvenance.failures.length === 0,
      "Workflow provenance confirms public GitHub Actions use read-only source permissions, deploy site/dist, and avoid signed artifacts or Play upload automation."
    ),
    privacyParity: status(
      privacyParity.status === "pass" &&
        privacyParity.secretSafe === true &&
        privacyParity.dataCollected === "None" &&
        privacyParity.dataSharedWithThirdParties === false &&
        privacyParity.androidInternetPermissionRequested === false &&
        Array.isArray(privacyParity.surfaces) &&
        privacyParity.surfaces.includes("store-assets/play/listing.json") &&
        privacyParity.surfaces.includes("site/privacy.html") &&
        privacyParity.surfaces.includes("apps/web/src/App.tsx") &&
        privacyParity.surfaces.includes("apps/mobile/android/app/src/main/AndroidManifest.xml") &&
        Array.isArray(privacyParity.failures) &&
        privacyParity.failures.length === 0,
      "Privacy parity confirms app, website, Android, and Play Store claims agree on free/local/no collection/no sharing/no internet-permission posture."
    ),
    androidPermissions: status(
      androidPermissions.status === "pass" &&
        androidPermissions.secretSafe === true &&
        androidPermissions.packageName === "com.opencycle.app" &&
        androidPermissions.applicationId === "com.opencycle.app" &&
        Array.isArray(androidPermissions.requestedPermissions) &&
        androidPermissions.requestedPermissions.length === 0 &&
        androidPermissions.internetPermissionRequested === false &&
        Array.isArray(androidPermissions.dangerousPermissionsRequested) &&
        androidPermissions.dangerousPermissionsRequested.length === 0 &&
        androidPermissions.allowBackup === false &&
        androidPermissions.fullBackupContentDisabled === true &&
        androidPermissions.launcherExported === true &&
        Array.isArray(androidPermissions.failures) &&
        androidPermissions.failures.length === 0,
      "Android permissions report confirms the public manifest requests zero permissions, omits internet access, disables backup, and matches Play identity."
    ),
    visualTestReport: status(
      visualTestReport.status === "pass" &&
        visualTestReport.runner === "playwright-api" &&
        visualTestReport.browserChannel === "chrome" &&
        Array.isArray(visualTestReport.results) &&
        visualTestReport.results.length === 6 &&
        visualTestReport.results.every((result) => result.status === "pass") &&
        Array.isArray(visualTestReport.failures) &&
        visualTestReport.failures.length === 0,
      "Playwright visual report proves desktop and phone website, blog, and app visual checks passed."
    ),
    visualEvidenceManifest: status(
      visualEvidenceManifest.status === "pass" &&
        visualEvidenceManifest.secretSafe === true &&
        visualEvidenceManifest.publicSafe === true &&
        visualEvidenceManifest.privateMaterialIncluded === false &&
        visualEvidenceManifest.signedAabIncluded === false &&
        visualEvidenceManifest.counts?.websiteVisualQa === 4 &&
        visualEvidenceManifest.counts?.appVisualQa === 2 &&
        visualEvidenceManifest.counts?.androidEmulatorQa === 5 &&
        visualEvidenceManifest.counts?.playStoreGraphic === 14 &&
        Array.isArray(visualEvidenceManifest.failures) &&
        visualEvidenceManifest.failures.length === 0,
      "Visual evidence manifest records website, app, Android emulator, and Play Store graphic evidence without private material."
    ),
    ownerDryRun: status(
      ownerDryRun.status === "pass" &&
        ownerDryRun.secretSafe === true &&
        ownerDryRun.networkUsed === false &&
        ownerDryRun.gitUsed === false &&
        Array.isArray(ownerDryRun.failures) &&
        ownerDryRun.failures.length === 0 &&
        Array.isArray(ownerDryRun.steps) &&
        ownerDryRun.steps.some((step) => step.id === "cloudflareSecretDryRun" && step.status === "pass") &&
        ownerDryRun.steps.some((step) => step.id === "keystoreCreationDryRun" && step.status === "pass") &&
        ownerDryRun.steps.some((step) => step.id === "androidSigningDryRun" && step.status === "pass") &&
        ownerDryRun.steps.some((step) => step.id === "publicReadyDryRun" && step.status === "pass"),
      "Owner dry-run rehearsal proves Cloudflare, Android signing, and public-release owner commands can be rehearsed without secrets."
    ),
    cloudflarePagesWorkflow: status(
      deploySiteWorkflow.includes("pages deploy site/dist") &&
        deploySiteWorkflow.includes("secrets.CF_API_TOKEN") &&
        deploySiteWorkflow.includes("secrets.CF_ACCOUNT_ID") &&
        deploySiteWorkflow.includes("open-cycle-site") &&
        deploySiteWorkflow.includes("Skip deploy without Cloudflare secrets") &&
        deploySiteWorkflow.includes("npm run validate:custom-domain:live"),
      "Cloudflare Pages deploys site/dist when GitHub secrets are available and validates the live custom domain."
    ),
    customDomainReadiness: status(
      customDomainReadiness.status === "ready-for-owner-domain-setup" &&
        customDomainReadiness.secretSafe === true &&
        customDomainReadiness.networkUsed === false &&
        customDomainReadiness.gitUsed === false &&
        customDomainReadiness.liveSiteUrl === "https://open-cycle.com" &&
        customDomainReadiness.pagesProject === "open-cycle-site" &&
        Array.isArray(customDomainReadiness.failedChecks) &&
        customDomainReadiness.failedChecks.length === 0,
      "Custom-domain readiness documents owner-side open-cycle.com setup without exposing DNS or Cloudflare secrets."
    ),
    androidPublicWorkflow: status(
      androidWorkflow.includes("Validate public Play evidence") &&
        androidWorkflow.includes("npm run validate:proof-product-repository") &&
        !androidWorkflow.includes("actions/upload-artifact@v4") &&
        !androidWorkflow.includes("apps/mobile/android/gradlew") &&
        !androidWorkflow.includes("ANDROID_KEYSTORE_PASSWORD"),
      "Public Android workflow validates public Play and Android evidence without source-build or signing secrets."
    ),
    playPublicReadiness: status(
      (
        preflight.status === "ready-for-private-signing" &&
          onlySignedAabPending &&
          Array.isArray(preflight.blockingFailures) &&
          preflight.blockingFailures.length === 0
      ) || signedPreflightReady,
      signedPreflightReady
        ? "Play preflight has a verified signed AAB and is ready for Play upload."
        : "Play preflight is ready for private signing with only signedAab pending."
    ),
    releaseStatus: status(
      ["ready-for-private-signing", "ready-for-play-upload"].includes(releaseStatus.publicReadinessStatus) &&
        releaseStatus.liveSiteUrl === "https://open-cycle-site.pages.dev" &&
        releaseStatus.customDomainUrl === "https://open-cycle.com" &&
        Array.isArray(releaseStatus.publicRemainingSteps) &&
        Array.isArray(releaseStatus.privateRemainingSteps),
      "Release status records public readiness, stable site URL, custom domain URL, public remaining steps, and private remaining steps."
    ),
    releaseCompletionMatrix: exists(files.releaseCompletionMatrixJson) && exists(files.releaseCompletionMatrixMd)
      ? status(
          releaseCompletionMatrixMd.includes("Release completion matrix") &&
            releaseCompletionMatrixMd.includes("Mobile app") &&
            releaseCompletionMatrixMd.includes("Website") &&
            releaseCompletionMatrixMd.includes("Public GitHub") &&
            releaseCompletionMatrixMd.includes("Security and privacy") &&
            releaseCompletionMatrixMd.includes("Play Store") &&
            Array.isArray(releaseCompletionMatrixJson.rows) &&
            releaseCompletionMatrixJson.rows.some((row) => row.area === "Mobile app") &&
            releaseCompletionMatrixJson.rows.some((row) => row.area === "Website") &&
            releaseCompletionMatrixJson.rows.some((row) => row.area === "Public GitHub") &&
            releaseCompletionMatrixJson.rows.some((row) => row.area === "Security and privacy") &&
            releaseCompletionMatrixJson.rows.some((row) => row.area === "Play Store") &&
            !releaseCompletionMatrixMd.includes("CF_API_TOKEN=") &&
            !releaseCompletionMatrixMd.includes("ANDROID_KEYSTORE_PASSWORD=") &&
            !JSON.stringify(releaseCompletionMatrixJson).includes("CF_API_TOKEN=") &&
            !JSON.stringify(releaseCompletionMatrixJson).includes("ANDROID_KEYSTORE_PASSWORD="),
          "Release completion matrix maps app, website, public GitHub, security/privacy, and Play Store gates to concrete proof without secrets."
        )
      : pending("Release completion matrix will be generated from the base final audit and checked on the refreshed audit pass."),
    releaseBlockerReport: pending("Release blocker report will be generated from the final audit and checked on the refreshed audit pass."),
    functionCoverage: status(
      functionCoverage.status === "pass" &&
        functionCoverage.secretSafe === true &&
        functionCoverage.totalChecks >= 20 &&
        Array.isArray(functionCoverage.failedChecks) &&
        functionCoverage.failedChecks.length === 0 &&
        Array.isArray(functionCoverage.checks) &&
        functionCoverage.checks.some((check) => check.expected === "Create cycle entry locally") &&
        functionCoverage.checks.some((check) => check.expected === "Avoid network in local mode") &&
        functionCoverage.checks.some((check) => check.expected === "Signed Play upload bundle"),
      "Function coverage report maps local tracking, API, release, and private Play checks to public-safe evidence."
    ),
    liveSitePublication: liveSitePublicationConfirmed(liveSitePublication)
      ? status(true, "Live Cloudflare Pages site serves expected public behavior.")
      : pending("Live Cloudflare Pages site still needs to be confirmed after deploy."),
    cloudflarePagesDeployment: status(
      cloudflarePagesDeployment.status === "pass" &&
        cloudflarePagesDeployment.secretSafe === true &&
        cloudflarePagesDeployment.publicSafe === true &&
        cloudflarePagesDeployment.privateMaterialIncluded === false &&
        cloudflarePagesDeployment.projectName === "open-cycle-site" &&
        cloudflarePagesDeployment.stablePagesUrl === "https://open-cycle-site.pages.dev" &&
        cloudflarePagesDeployment.project?.domains?.includes("open-cycle-site.pages.dev") &&
        cloudflarePagesDeployment.latestDeployment?.deploymentUrl?.includes(".open-cycle-site.pages.dev") &&
        cloudflarePagesDeployment.liveSiteValidation?.validatedStablePagesUrl === true,
      "Wrangler-backed Cloudflare Pages deployment evidence records the latest deployment and stable Pages domain without account IDs or dashboard URLs."
    ),
    liveCloudflarePagesDomainAttachment: liveCloudflarePagesDomainAttachmentConfirmed(liveCloudflarePagesDomainAttachment, cloudflarePagesDeployment)
      ? status(true, "Cloudflare Pages project has the stable Pages domain and both custom domains attached.")
      : pending("Cloudflare Pages project still needs open-cycle.com and www.open-cycle.com attached."),
    liveCustomDomainPublication: liveCustomDomainPublicationConfirmed(liveCustomDomainPublication)
      ? status(true, "Live open-cycle.com custom domain serves expected public behavior.")
      : pending("Live open-cycle.com custom domain still needs Cloudflare attachment and validation."),
    liveGithubPublication: liveGithubPublicationConfirmed(liveGithubPublication)
      ? status(true, "Live GitHub publication is public and exposes expected scrutiny files.")
      : pending("Live GitHub publication still needs to be confirmed after the public push."),
    liveGithubActions: liveGithubActionsConfirmed(liveGithubActions)
      ? status(true, "Live GitHub Actions checks have passed on the public branch.")
      : pending("Live GitHub Actions still need to pass on the public branch."),
    githubPublicationPacket: status(
      githubPacket.includes("Visibility target: Public") &&
        githubPacket.includes("gh secret set CF_API_TOKEN --repo kborndorff/Open-Cycle") &&
        githubPacket.includes("npm run validate:owner-tools") &&
        githubPacket.includes("npm run validate:public-repo-manifest") &&
        githubPacket.includes("docs/owner-tooling.md") &&
        githubPacket.includes("validates the live Pages URL") &&
        !githubPacket.includes("CF_API_TOKEN="),
      "GitHub publication packet is public-safe and includes Cloudflare secret setup commands."
    ),
    playConsolePacket: status(
      playPacket.includes("Play Console upload packet") &&
        playPacket.includes("open-cycle") &&
        playPacket.includes("Privacy policy") &&
        playPacket.includes("reports/play-data-safety-packet.md") &&
        playPacket.includes("reports/play-content-rating-packet.md") &&
        playPacket.includes("reports/play-health-declaration-packet.md") &&
        playPacket.includes("reports/play-app-access-packet.md") &&
        playPacket.includes("reports/play-ads-declaration-packet.md") &&
        playPacket.includes("reports/play-target-audience-packet.md") &&
        playPacket.includes("reports/play-testing-rollout-packet.md") &&
        playPacket.includes("reports/play-app-content-packet.md") &&
        playPacket.includes("reports/play-release-candidate-packet.md") &&
        !playPacket.includes("ANDROID_KEYSTORE_PASSWORD="),
      "Play Console packet exists and does not include signing secrets."
    ),
    playDataSafetyPacket: status(
      playDataSafetyPacket.includes("Play Console data safety packet") &&
        playDataSafetyPacket.includes("Data collected: None") &&
        playDataSafetyPacket.includes("Data shared with third parties: No") &&
        playDataSafetyPacket.includes("Is core cycle tracking usable without network access? Yes.") &&
        !playDataSafetyPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playDataSafetyPacket.includes("CF_API_TOKEN="),
      "Play data-safety packet records local-only no-collection answers without secrets."
    ),
    playContentRatingPacket: status(
      playContentRatingPacket.includes("Play Console content rating and app content packet") &&
        playContentRatingPacket.includes("Contains ads: No") &&
        playContentRatingPacket.includes("User-generated content or social sharing: No") &&
        playContentRatingPacket.includes("Android internet permission requested: No") &&
        playContentRatingPacket.includes("personal wellness log, not medical advice, diagnosis, or treatment") &&
        !playContentRatingPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playContentRatingPacket.includes("CF_API_TOKEN="),
      "Play content rating packet records app content answers without secrets."
    ),
    playHealthDeclarationPacket: status(
      playHealthDeclarationPacket.includes("Play Health apps declaration packet") &&
        playHealthDeclarationPacket.includes("Health declaration category: Health and fitness > Period Tracking") &&
        playHealthDeclarationPacket.includes("Is the app a regulated medical device app? No.") &&
        playHealthDeclarationPacket.includes("Does the app access Health Connect data? No.") &&
        playHealthDeclarationPacket.includes("Does the app request health-related Android permissions? No.") &&
        playHealthDeclarationPacket.includes("not a medical device and does not diagnose, treat, cure, or prevent any medical condition") &&
        !playHealthDeclarationPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playHealthDeclarationPacket.includes("CF_API_TOKEN="),
      "Play Health declaration packet records Period Tracking and non-medical-device answers without secrets."
    ),
    playAppAccessPacket: status(
      playAppAccessPacket.includes("Play App access packet") &&
        playAppAccessPacket.includes("Login required: No") &&
        playAppAccessPacket.includes("Test account credentials required: No") &&
        playAppAccessPacket.includes("Network access required for core review path: No") &&
        playAppAccessPacket.includes("Android internet permission requested: No") &&
        !playAppAccessPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playAppAccessPacket.includes("CF_API_TOKEN="),
      "Play App access packet records no-login review access without secrets."
    ),
    playAdsDeclarationPacket: status(
      playAdsDeclarationPacket.includes("Play ads declaration packet") &&
        playAdsDeclarationPacket.includes("Contains ads: No") &&
        playAdsDeclarationPacket.includes("Uses Advertising ID: No") &&
        playAdsDeclarationPacket.includes("Uses ad SDKs: No") &&
        playAdsDeclarationPacket.includes("Monetization through ads: No") &&
        !playAdsDeclarationPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playAdsDeclarationPacket.includes("CF_API_TOKEN="),
      "Play ads declaration packet records no-ads and no-Advertising-ID answers without secrets."
    ),
    playTargetAudiencePacket: status(
      playTargetAudiencePacket.includes("Play target audience and children declaration packet") &&
        playTargetAudiencePacket.includes("Recommended target age group: 18 and over") &&
        playTargetAudiencePacket.includes("Designed for children: No") &&
        playTargetAudiencePacket.includes("Includes children in target audience: No") &&
        playTargetAudiencePacket.includes("Restrict Minor Access recommended: Yes") &&
        !playTargetAudiencePacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playTargetAudiencePacket.includes("CF_API_TOKEN="),
      "Play target audience packet records adult-only and not-child-directed answers without secrets."
    ),
    playTestingRolloutPacket: status(
      playTestingRolloutPacket.includes("Play testing and production access packet") &&
        playTestingRolloutPacket.includes("Minimum testers for affected new personal accounts: 12 opted-in testers.") &&
        playTestingRolloutPacket.includes("Minimum continuous opt-in duration for affected new personal accounts: 14 days.") &&
        playTestingRolloutPacket.includes("Do not commit tester email lists") &&
        playTestingRolloutPacket.includes("Keep signed AAB evidence private owner-side.") &&
        !playTestingRolloutPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playTestingRolloutPacket.includes("CF_API_TOKEN="),
      "Play testing rollout packet records owner-side testing and production-access plan without secrets."
    ),
    playAppContentPacket: status(
      playAppContentPacket.includes("Play App content packet") &&
        playAppContentPacket.includes("Data safety: no collection and no sharing.") &&
        playAppContentPacket.includes("App access: no login, no account, no test credentials") &&
        playAppContentPacket.includes("Ads: no ads, no ad SDKs, no Advertising ID") &&
        playAppContentPacket.includes("Health declaration: Period Tracking") &&
        !playAppContentPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playAppContentPacket.includes("CF_API_TOKEN="),
      "Aggregate Play App content packet indexes all public-safe App content declarations without secrets."
    ),
    playReleaseCandidatePacket: status(
      playReleaseCandidatePacket.includes("Play release candidate packet") &&
        playReleaseCandidatePacket.includes(`Preflight status: ${preflight.status}`) &&
        (
          signedPreflightReady
            ? playReleaseCandidatePacket.includes("Preflight pending private steps: none")
            : playReleaseCandidatePacket.includes("Preflight pending private steps: signedAab")
        ) &&
        playReleaseCandidatePacket.includes("Unsigned AAB evidence matches preflight: Yes") &&
        playReleaseCandidatePacket.includes("Signed AAB boundary: private owner-side artifact only.") &&
        playReleaseCandidatePacket.includes("Do not upload the unsigned AAB to production.") &&
        !playReleaseCandidatePacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playReleaseCandidatePacket.includes("CF_API_TOKEN="),
      "Play release candidate packet ties current unsigned evidence and preflight status together without secrets."
    ),
    androidSigningHandoffPacket: status(
      androidSigningHandoffPacket.includes("Android signing handoff packet") &&
        androidSigningHandoffPacket.includes("Signing readiness status: ready-for-private-keystore") &&
        androidSigningHandoffPacket.includes("Unsigned AAB evidence status: pass") &&
        androidSigningHandoffPacket.includes("npm run mobile:release:android:prompted") &&
        androidSigningHandoffPacket.includes("Only upload the signed AAB to Play Console.") &&
        !androidSigningHandoffPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !androidSigningHandoffPacket.includes("CF_API_TOKEN="),
      "Android signing handoff packet gives private signing steps without exposing secrets."
    ),
    playProductionReadinessPacket: status(
      playProductionReadinessPacket.includes("Play production readiness packet") &&
        playProductionReadinessPacket.includes(`Release status: ${releaseStatus.publicReadinessStatus}`) &&
        (
          signedPreflightReady && signedAabEvidence.status === "pass"
            ? playProductionReadinessPacket.includes("Signed AAB evidence status: pass")
            : playProductionReadinessPacket.includes("Signed AAB evidence status: pending-signed-aab")
        ) &&
        playProductionReadinessPacket.includes("Play upload confirmed: no") &&
        playProductionReadinessPacket.includes("Do not mark production complete from this packet alone.") &&
        !playProductionReadinessPacket.includes("ANDROID_KEYSTORE_PASSWORD=") &&
        !playProductionReadinessPacket.includes("CF_API_TOKEN="),
      "Play production readiness packet separates public-ready evidence from private completion gates without secrets."
    ),
    ownerActionPacket: status(
      ownerActionPacket.includes("Owner action packet") &&
        ownerActionPacket.includes("This packet is public-safe.") &&
        ownerActionPacket.includes("npm run validate:github:live") &&
        ownerActionPacket.includes("npm run validate:github:actions") &&
        ownerActionPacket.includes("npm run mobile:release:android:prompted") &&
        ownerActionPacket.includes("npm run validate:play-store-complete") &&
        !ownerActionPacket.includes("CF_API_TOKEN=") &&
        !ownerActionPacket.includes("ANDROID_KEYSTORE_PASSWORD="),
      "Owner action packet exists and gives account-side release steps without exposing secrets."
    ),
    unsignedAab: status(
      exists(files.unsignedAab) &&
        unsignedAabEvidence.status === "pass" &&
        unsignedAabEvidence.secretSafe === true &&
        /^[a-f0-9]{64}$/i.test(unsignedAabEvidence.unsignedAabSha256 || "") &&
        Number.isInteger(unsignedAabEvidence.unsignedAabSizeBytes) &&
        unsignedAabEvidence.unsignedAabSizeBytes > 0 &&
        Array.isArray(unsignedAabEvidence.failures) &&
        unsignedAabEvidence.failures.length === 0,
      "Unsigned AAB exists and has public-safe SHA-256/size evidence."
    ),
    signedAab: signedPreflightReady
      ? status(true, "Signed AAB exists locally and passes jarsigner verification.")
      : pending(
          exists(files.signedAab)
            ? "Signed AAB exists locally but still needs valid jarsigner verification."
            : "Signed AAB is intentionally private and still needs the real upload keystore."
        ),
    signedRuntimeQa: runtimeQaComplete(runtimeQaReport)
      ? status(true, "Signed runtime QA report is complete.")
      : pending("Signed runtime QA still needs to be completed on the signed candidate."),
    playConsoleUpload: playUploadConfirmed(playUploadConfirmation)
      ? status(true, "Play Console upload confirmation exists.")
      : pending("Play Console upload still needs private account-side confirmation.")
  };

  checks.releaseBlockerReport = releaseBlockerReportCheck(releaseBlockerReportJson, releaseBlockerReportMd, checks);

  const failedChecks = Object.entries(checks)
    .filter(([, result]) => result.status === "fail")
    .map(([name]) => name);
  const pendingChecks = Object.entries(checks)
    .filter(([, result]) => result.status === "pending")
    .map(([name]) => name);
  const hasPlayUploadConfirmation = checks.playConsoleUpload.status === "pass";

  const audit = {
    generatedAt: new Date().toISOString(),
    status: failedChecks.length > 0
      ? "needs-public-work"
      : hasPlayUploadConfirmation && pendingChecks.length === 0
        ? "play-upload-confirmed"
        : pendingChecks.length > 0
        ? "public-ready-private-actions-remaining"
        : "ready-for-play-upload",
    repository: "https://github.com/kborndorff/Open-Cycle",
    liveSiteUrl: "https://open-cycle-site.pages.dev",
    requiredPublicCommands: [
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
    ],
    privateRemainingSteps: releaseStatus.privateRemainingSteps || [
      { id: "signedAab", description: "Sign the Android App Bundle with the private Play upload keystore." },
      { id: "signedRuntimeQa", description: "Complete signed runtime QA on device or emulator." },
      { id: "playConsoleUpload", description: "Upload the signed candidate and listing assets in Play Console." }
    ],
    advisoryChecks: {
      ownerToolReadiness: {
        status: ownerToolReadiness.status === "ready-or-owner-action-only" ? "pass" : "pending",
        detail: ownerToolReadiness.secretSafe === true
          ? "Owner release tool readiness was checked without reading or printing secrets."
          : "Owner release tool readiness still needs to be checked with npm run validate:owner-tools.",
        missingRequired: Array.isArray(ownerToolReadiness.missingRequired) ? ownerToolReadiness.missingRequired : [],
        missingRecommended: Array.isArray(ownerToolReadiness.missingRecommended) ? ownerToolReadiness.missingRecommended : []
      },
      cloudflareReadiness: {
        status: cloudflareReadiness.status === "ready-for-cloudflare-secrets" ? "pass" : "pending",
        detail: cloudflareReadiness.secretSafe === true
          ? "Cloudflare Pages readiness was checked without reading or printing Cloudflare credentials."
          : "Cloudflare readiness still needs to be checked with npm run validate:cloudflare-readiness.",
        failedChecks: Array.isArray(cloudflareReadiness.failedChecks) ? cloudflareReadiness.failedChecks : []
      },
      signingReadiness: {
        status: signingReadiness.status === "ready-for-private-keystore" ? "pass" : "pending",
        detail: signingReadiness.secretSafe === true
          ? "Non-secret signing prerequisites were checked without reading or printing private keystore values."
          : "Signing readiness still needs to be checked with npm run validate:signing-readiness.",
        failedChecks: Array.isArray(signingReadiness.failedChecks) ? signingReadiness.failedChecks : []
      },
      signedAabEvidence: {
        status: signedAabEvidence.status === "pass"
          ? "pass"
          : signedAabEvidence.status === "pending-signed-aab"
          ? "pending"
          : "pending",
        detail: signedAabEvidence.status === "pass"
          ? "Signed AAB SHA-256 and byte size evidence has been recorded without reading keystore material."
          : "Signed AAB checksum evidence still needs to be generated after private signing.",
        signedAabSha256: signedAabEvidence.signedAabSha256 || null,
        signedAabSizeBytes: signedAabEvidence.signedAabSizeBytes || null,
        failures: Array.isArray(signedAabEvidence.failures) ? signedAabEvidence.failures : []
      }
    },
    failedChecks,
    pendingChecks,
    checks,
    artifacts: {
      unsignedAab: fileInfo(files.unsignedAab),
      signedAab: fileInfo(files.signedAab),
      releaseStatus: fileInfo(files.releaseStatus),
      releaseCompletionMatrixJson: fileInfo(files.releaseCompletionMatrixJson),
      releaseCompletionMatrixMd: fileInfo(files.releaseCompletionMatrixMd),
      releaseBlockerReportJson: fileInfo(files.releaseBlockerReportJson),
      releaseBlockerReportMd: fileInfo(files.releaseBlockerReportMd),
      ownerToolReadiness: fileInfo(files.ownerToolReadiness),
      cloudflareReadiness: fileInfo(files.cloudflareReadiness),
      customDomainReadiness: fileInfo(files.customDomainReadiness),
      signingReadiness: fileInfo(files.signingReadiness),
      releaseArtifactHygiene: fileInfo(files.releaseArtifactHygiene),
      publicArtifactPolicy: fileInfo(files.publicArtifactPolicy),
      localOnlyRuntime: fileInfo(files.localOnlyRuntime),
      workflowProvenance: fileInfo(files.workflowProvenance),
      privacyParity: fileInfo(files.privacyParity),
      androidPermissions: fileInfo(files.androidPermissions),
      visualTestReport: fileInfo(files.visualTestReport),
      visualEvidenceManifest: fileInfo(files.visualEvidenceManifest),
      ownerDryRun: fileInfo(files.ownerDryRun),
      publicPushReadiness: fileInfo(files.publicPushReadiness),
      publicRepositoryPublicationManifest: fileInfo(files.publicRepositoryPublicationManifest),
      functionCoverage: fileInfo(files.functionCoverage),
      unsignedAabEvidence: fileInfo(files.unsignedAabEvidence),
      liveSitePublication: fileInfo(files.liveSitePublication),
      cloudflarePagesDeployment: fileInfo(files.cloudflarePagesDeployment),
      liveCloudflarePagesDomainAttachment: fileInfo(files.liveCloudflarePagesDomainAttachment),
      liveCustomDomainPublication: fileInfo(files.liveCustomDomainPublication),
      liveGithubPublication: fileInfo(files.liveGithubPublication),
      liveGithubActions: fileInfo(files.liveGithubActions),
      playPreflight: fileInfo(files.preflight),
      githubPublicationPacket: fileInfo(files.githubPacket),
      playConsolePacket: fileInfo(files.playPacket),
      playDataSafetyPacket: fileInfo(files.playDataSafetyPacket),
      playContentRatingPacket: fileInfo(files.playContentRatingPacket),
      playHealthDeclarationPacket: fileInfo(files.playHealthDeclarationPacket),
      playAppAccessPacket: fileInfo(files.playAppAccessPacket),
      playAdsDeclarationPacket: fileInfo(files.playAdsDeclarationPacket),
      playTargetAudiencePacket: fileInfo(files.playTargetAudiencePacket),
      playTestingRolloutPacket: fileInfo(files.playTestingRolloutPacket),
      playAppContentPacket: fileInfo(files.playAppContentPacket),
      playReleaseCandidatePacket: fileInfo(files.playReleaseCandidatePacket),
      androidSigningHandoffPacket: fileInfo(files.androidSigningHandoffPacket),
      playProductionReadinessPacket: fileInfo(files.playProductionReadinessPacket),
      ownerActionPacket: fileInfo(files.ownerActionPacket),
      runtimeQaReport: fileInfo(files.runtimeQaReport),
      playUploadConfirmation: fileInfo(files.playUploadConfirmation),
      signedAabEvidence: fileInfo(files.signedAabEvidence)
    }
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

  console.log(`Final release audit written to ${auditPath}`);
  console.log(`Status: ${audit.status}`);
  if (failedChecks.length > 0) {
    console.error(`Failed public checks: ${failedChecks.join(", ")}`);
    process.exit(1);
  }
  if (pendingChecks.length > 0) {
    console.log(`Pending checks: ${pendingChecks.join(", ")}`);
  }
}

main();

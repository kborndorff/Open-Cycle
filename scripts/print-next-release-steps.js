const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const statusPath = path.join(reportsDir, "release-status.json");
const ownerToolsPath = path.join(reportsDir, "owner-release-tools.json");
const cloudflareReadinessPath = path.join(reportsDir, "cloudflare-readiness.json");
const signingReadinessPath = path.join(reportsDir, "signing-readiness.json");
const liveSitePublicationPath = path.join(reportsDir, "live-site-publication.json");
const liveCustomDomainPublicationPath = path.join(reportsDir, "live-custom-domain-publication.json");
const cloudflarePagesDomainAttachmentPath = path.join(reportsDir, "cloudflare-pages-domain-attachment.json");
const liveGithubPublicationPath = path.join(reportsDir, "live-github-publication.json");
const liveGithubActionsPath = path.join(reportsDir, "live-github-actions.json");
const publicRepositoryPublicationManifestPath = path.join(reportsDir, "public-repository-publication-manifest.md");
const unsignedAabEvidencePath = path.join(reportsDir, "unsigned-aab-evidence.json");
const signedAabEvidencePath = path.join(reportsDir, "signed-aab-evidence.json");
const playDataSafetyPacketPath = path.join(reportsDir, "play-data-safety-packet.md");
const playContentRatingPacketPath = path.join(reportsDir, "play-content-rating-packet.md");
const playHealthDeclarationPacketPath = path.join(reportsDir, "play-health-declaration-packet.md");
const playAppAccessPacketPath = path.join(reportsDir, "play-app-access-packet.md");
const playAdsDeclarationPacketPath = path.join(reportsDir, "play-ads-declaration-packet.md");
const playTargetAudiencePacketPath = path.join(reportsDir, "play-target-audience-packet.md");
const playTestingRolloutPacketPath = path.join(reportsDir, "play-testing-rollout-packet.md");
const playAppContentPacketPath = path.join(reportsDir, "play-app-content-packet.md");
const playReleaseCandidatePacketPath = path.join(reportsDir, "play-release-candidate-packet.md");
const androidSigningHandoffPacketPath = path.join(reportsDir, "android-signing-handoff-packet.md");
const playProductionReadinessPacketPath = path.join(reportsDir, "play-production-readiness-packet.md");
const releaseBlockerReportPath = path.join(reportsDir, "release-blocker-report.md");

function printLiveDiagnostics() {
  const diagnostics = [
    {
      label: "Custom domain",
      file: liveCustomDomainPublicationPath,
      displayPath: "reports/live-custom-domain-publication.json",
      command: "npm run validate:custom-domain:live"
    },
    {
      label: "Cloudflare Pages domains",
      file: cloudflarePagesDomainAttachmentPath,
      displayPath: "reports/cloudflare-pages-domain-attachment.json",
      command: "npm run validate:cloudflare-pages-domains:live"
    },
    {
      label: "GitHub publication",
      file: liveGithubPublicationPath,
      displayPath: "reports/live-github-publication.json",
      command: "npm run validate:github:live"
    },
    {
      label: "GitHub Actions",
      file: liveGithubActionsPath,
      displayPath: "reports/live-github-actions.json",
      command: "npm run validate:github:actions"
    }
  ];

  const available = diagnostics
    .map((diagnostic) => ({ ...diagnostic, report: readJson(diagnostic.file) }))
    .filter((diagnostic) => diagnostic.report);

  if (available.length === 0) {
    return;
  }

  console.log("");
  console.log("Latest live diagnostic reports:");
  for (const diagnostic of available) {
    const status = diagnostic.report.status || "unknown";
    console.log(`- ${diagnostic.label}: ${status} (${diagnostic.displayPath})`);
    if (diagnostic.report.github?.fullName) {
      console.log(`  Observed repository: ${diagnostic.report.github.fullName}`);
    }
    if (diagnostic.label === "Custom domain" && status !== "pass") {
      console.log("  Likely owner action: attach open-cycle.com to the Cloudflare Pages project that serves site/dist.");
      console.log("  Helper: npm run owner-tools:cloudflare-domain-help");
      console.log("  Help: docs/cloudflare-pages-domain-diagnostics.md");
      console.log("  Domain attachment check: npm run validate:cloudflare-pages-domains:live");
    }
    if (diagnostic.label === "Cloudflare Pages domains" && status !== "pass") {
      console.log("  Likely owner action: attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages.");
      console.log("  Helper: npm run owner-tools:cloudflare-domain-help");
      console.log("  Help: docs/cloudflare-pages-domain-diagnostics.md");
    }
    if (diagnostic.label === "GitHub publication" && status !== "pass") {
      console.log("  Likely owner action: push this worktree to the public repository default branch.");
      console.log("  Helper: npm run owner-tools:publish-help");
      console.log("  ZIP fallback: npm run package:github-repository-bundles && npm run validate:github-repository-archives");
      console.log("  Upload archives: dist/github-repositories/Open-Cycle.zip and dist/github-repositories/open-cycle-source.zip");
      console.log("  Publisher dry run: npm run github:publish-bundles:dry-run");
      console.log("  Publisher apply: npm run github:publish-bundles:apply");
    }
    if (diagnostic.label === "GitHub Actions" && status !== "pass") {
      console.log("  Likely owner action: publish the workflow files, then wait for Actions to run.");
      console.log("  Helper: npm run owner-tools:publish-help");
    }
    if (status !== "pass") {
      console.log(`  Command: ${diagnostic.command}`);
      const failures = Array.isArray(diagnostic.report.failures) ? diagnostic.report.failures.slice(0, 3) : [];
      for (const failure of failures) {
        console.log(`  Evidence: ${failure}`);
      }
      if (Array.isArray(diagnostic.report.failures) && diagnostic.report.failures.length > failures.length) {
        console.log(`  More: ${diagnostic.report.failures.length - failures.length} additional issue(s) in ${diagnostic.displayPath}`);
      }
    }
  }
}

const nextSteps = {
  liveGithubPublication: {
    title: "Publish and validate the public GitHub repository",
    command: "npm run validate:github:live",
    detail: "Run after the current worktree is pushed and the repository is public. The validator uses public GitHub HTTP checks."
  },
  liveCloudflarePagesDomainAttachment: {
    title: "Attach Cloudflare Pages custom domains",
    command: "npm run validate:cloudflare-pages-domains:live",
    helper: "npm run owner-tools:cloudflare-domain-help",
    detail: "Use the helper for dashboard steps, attach open-cycle.com and www.open-cycle.com to open-cycle-site in Cloudflare Pages, then run npm run validate:custom-domain:live."
  },
  liveCustomDomainPublication: {
    title: "Attach and validate the open-cycle.com custom domain",
    command: "npm run validate:custom-domain:live",
    helper: "npm run owner-tools:cloudflare-domain-help",
    detail: "Use the helper if the domain is not attached yet, then run after Cloudflare Pages provisions open-cycle.com for the open-cycle project."
  },
  liveGithubActions: {
    title: "Wait for public GitHub Actions and validate them",
    command: "npm run validate:github:actions",
    detail: "Run after GitHub Actions completes on the public branch. The validator checks public workflow state."
  },
  signedAab: {
    title: "Create the private signed Android App Bundle",
    command: "npm run mobile:release:android:prompted",
    helper: "npm run owner-tools:android-signing-help",
    detail: "Use the helper for the private signing sequence, and keep the upload keystore and passwords outside GitHub."
  },
  signedRuntimeQa: {
    title: "Complete signed runtime QA",
    command: "npm run validate:runtime-qa-report -- --require-complete",
    helper: "npm run owner-tools:runtime-qa-help",
    detail: "Use the helper for signed-candidate testing, then fill reports/runtime-qa-report.md after testing."
  },
  playConsoleUpload: {
    title: "Confirm Play Console upload",
    command: "npm run validate:play-upload-confirmation -- --require-complete",
    helper: "npm run owner-tools:play-upload-help",
    detail: "Use the helper for manual Play Console steps, then fill reports/play-console-upload-confirmation.json after uploading."
  }
};

function readJson(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  if (!fs.existsSync(file)) {
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function printAuditCheck(label, check) {
  if (!check) {
    console.log(`${label}: missing`);
    return;
  }
  console.log(`${label}: ${check.status || "unknown"}`);
}

function printStatusEvidence(label, evidence) {
  if (!evidence) {
    console.log(`${label}: missing`);
    return;
  }
  const suffix = evidence.secretSafe === true ? "secret-safe" : "secret-safety unknown";
  console.log(`${label}: ${evidence.status || "unknown"} (${suffix})`);
}

function main() {
  const audit = readJson(auditPath);
  const status = readJson(statusPath);
  const ownerTools = readJson(ownerToolsPath);
  const cloudflareReadiness = readJson(cloudflareReadinessPath);
  const signingReadiness = readJson(signingReadinessPath);
  const liveSitePublication = readJson(liveSitePublicationPath);
  const liveCustomDomainPublication = readJson(liveCustomDomainPublicationPath);
  const unsignedAabEvidence = readJson(unsignedAabEvidencePath);
  const signedAabEvidence = readJson(signedAabEvidencePath);
  const publicRepositoryPublicationManifest = readText(publicRepositoryPublicationManifestPath);
  const playDataSafetyPacket = readText(playDataSafetyPacketPath);
  const playContentRatingPacket = readText(playContentRatingPacketPath);
  const playHealthDeclarationPacket = readText(playHealthDeclarationPacketPath);
  const playAppAccessPacket = readText(playAppAccessPacketPath);
  const playAdsDeclarationPacket = readText(playAdsDeclarationPacketPath);
  const playTargetAudiencePacket = readText(playTargetAudiencePacketPath);
  const playTestingRolloutPacket = readText(playTestingRolloutPacketPath);
  const playAppContentPacket = readText(playAppContentPacketPath);
  const playReleaseCandidatePacket = readText(playReleaseCandidatePacketPath);
  const androidSigningHandoffPacket = readText(androidSigningHandoffPacketPath);
  const playProductionReadinessPacket = readText(playProductionReadinessPacketPath);
  const releaseBlockerReport = readText(releaseBlockerReportPath);

  console.log("OpenCycle release next steps");
  console.log("");

  if (!audit) {
    console.log("Missing final release audit. Start with:");
    console.log("npm run release:audit");
    return;
  }

  console.log(`Audit status: ${audit.status}`);
  if (status?.publicReadinessStatus) {
    console.log(`Release status: ${status.publicReadinessStatus}`);
  }
  console.log(`Repository: ${audit.repository || "unknown"}`);
  console.log(`Live site: ${audit.liveSiteUrl || "unknown"}`);
  if (liveSitePublication?.status === "pass") {
    console.log(`Live site validation: passed (${liveSitePublication.url || audit.liveSiteUrl || "unknown"})`);
  } else {
    console.log("Live site validation: pending");
    console.log("Command: npm run validate:site:live -- --url=https://open-cycle-site.pages.dev");
  }
  if (liveCustomDomainPublication?.status === "pass") {
    console.log(`Custom domain validation: passed (${liveCustomDomainPublication.url || "https://open-cycle.com"})`);
  } else {
    console.log("Custom domain validation: pending");
    console.log("Command: npm run validate:custom-domain:live");
  }
  if (unsignedAabEvidence?.status === "pass") {
    console.log(`Unsigned AAB evidence: passed (${unsignedAabEvidence.unsignedAabSizeBytes} bytes, ${unsignedAabEvidence.unsignedAabSha256})`);
  } else {
    console.log("Unsigned AAB evidence: pending");
    console.log("Command: npm run mobile:unsigned-aab:evidence -- --require-aab");
  }
  if (publicRepositoryPublicationManifest.includes("Public repository publication manifest") && publicRepositoryPublicationManifest.includes("Private material that must stay out of GitHub")) {
    console.log("Public repository manifest: passed (publication boundary documented)");
  } else {
    console.log("Public repository manifest: pending");
    console.log("Command: npm run generate:public-repo-manifest && npm run validate:public-repo-manifest");
  }
  if (signedAabEvidence?.status === "pass") {
    console.log(`Signed AAB evidence: passed (${signedAabEvidence.signedAabSizeBytes} bytes, ${signedAabEvidence.signedAabSha256})`);
  } else {
    console.log("Signed AAB evidence: pending private signing");
    console.log("Command: npm run mobile:signed-aab:evidence -- --require-signed");
  }
  if (
    playDataSafetyPacket.includes("Play Console data safety packet") &&
    playDataSafetyPacket.includes("Data collected: None") &&
    playDataSafetyPacket.includes("Data shared with third parties: No")
  ) {
    console.log("Play data safety packet: passed (no collection, no sharing)");
  } else {
    console.log("Play data safety packet: pending");
    console.log("Command: npm run generate:play-data-safety && npm run validate:play-data-safety");
  }
  if (
    playContentRatingPacket.includes("Play Console content rating and app content packet") &&
    playContentRatingPacket.includes("Contains ads: No") &&
    playContentRatingPacket.includes("User-generated content or social sharing: No") &&
    playContentRatingPacket.includes("Android internet permission requested: No")
  ) {
    console.log("Play content rating packet: passed (no ads, no UGC, no internet permission)");
  } else {
    console.log("Play content rating packet: pending");
    console.log("Command: npm run generate:play-content-rating && npm run validate:play-content-rating");
  }
  if (
    playHealthDeclarationPacket.includes("Play Health apps declaration packet") &&
    playHealthDeclarationPacket.includes("Health declaration category: Health and fitness > Period Tracking") &&
    playHealthDeclarationPacket.includes("Is the app a regulated medical device app? No.") &&
    playHealthDeclarationPacket.includes("Does the app access Health Connect data? No.")
  ) {
    console.log("Play Health declaration packet: passed (Period Tracking, not medical device)");
  } else {
    console.log("Play Health declaration packet: pending");
    console.log("Command: npm run generate:play-health-declaration && npm run validate:play-health-declaration");
  }
  if (
    playAppAccessPacket.includes("Play App access packet") &&
    playAppAccessPacket.includes("Login required: No") &&
    playAppAccessPacket.includes("Test account credentials required: No")
  ) {
    console.log("Play App access packet: passed (no login or test credentials)");
  } else {
    console.log("Play App access packet: pending");
    console.log("Command: npm run generate:play-app-access && npm run validate:play-app-access");
  }
  if (
    playAdsDeclarationPacket.includes("Play ads declaration packet") &&
    playAdsDeclarationPacket.includes("Contains ads: No") &&
    playAdsDeclarationPacket.includes("Uses Advertising ID: No")
  ) {
    console.log("Play ads declaration packet: passed (no ads or Advertising ID)");
  } else {
    console.log("Play ads declaration packet: pending");
    console.log("Command: npm run generate:play-ads-declaration && npm run validate:play-ads-declaration");
  }
  if (
    playTargetAudiencePacket.includes("Play target audience and children declaration packet") &&
    playTargetAudiencePacket.includes("Recommended target age group: 18 and over") &&
    playTargetAudiencePacket.includes("Designed for children: No") &&
    playTargetAudiencePacket.includes("Restrict Minor Access recommended: Yes")
  ) {
    console.log("Play target audience packet: passed (18+, not child-directed)");
  } else {
    console.log("Play target audience packet: pending");
    console.log("Command: npm run generate:play-target-audience && npm run validate:play-target-audience");
  }
  if (
    playTestingRolloutPacket.includes("Play testing and production access packet") &&
    playTestingRolloutPacket.includes("Minimum testers for affected new personal accounts: 12 opted-in testers.") &&
    playTestingRolloutPacket.includes("Minimum continuous opt-in duration for affected new personal accounts: 14 days.")
  ) {
    console.log("Play testing rollout packet: passed (closed-test plan documented)");
  } else {
    console.log("Play testing rollout packet: pending");
    console.log("Command: npm run generate:play-testing-rollout && npm run validate:play-testing-rollout");
  }
  if (
    playAppContentPacket.includes("Play App content packet") &&
    playAppContentPacket.includes("Data safety: no collection and no sharing.") &&
    playAppContentPacket.includes("Ads: no ads, no ad SDKs, no Advertising ID")
  ) {
    console.log("Play App content packet: passed (all declarations indexed)");
  } else {
    console.log("Play App content packet: pending");
    console.log("Command: npm run generate:play-app-content && npm run validate:play-app-content");
  }
  if (
    playReleaseCandidatePacket.includes("Play release candidate packet") &&
    playReleaseCandidatePacket.includes("Unsigned AAB evidence matches preflight: Yes")
  ) {
    console.log("Play release candidate packet: passed (unsigned evidence aligned)");
  } else {
    console.log("Play release candidate packet: pending");
    console.log("Command: npm run generate:play-release-candidate && npm run validate:play-release-candidate");
  }
  if (
    androidSigningHandoffPacket.includes("Android signing handoff packet") &&
    androidSigningHandoffPacket.includes("Signing readiness status: ready-for-private-keystore") &&
    androidSigningHandoffPacket.includes("Unsigned AAB evidence status: pass")
  ) {
    console.log("Android signing handoff packet: passed (private signing path documented)");
  } else {
    console.log("Android signing handoff packet: pending");
    console.log("Command: npm run generate:android-signing-handoff && npm run validate:android-signing-handoff");
  }
  if (
    playProductionReadinessPacket.includes("Play production readiness packet") &&
    playProductionReadinessPacket.includes("Do not mark production complete from this packet alone.")
  ) {
    console.log("Play production readiness packet: passed (private gates separated)");
  } else {
    console.log("Play production readiness packet: pending");
    console.log("Command: npm run generate:play-production-readiness && npm run validate:play-production-readiness");
  }
  if (
    releaseBlockerReport.includes("Release blocker report") &&
    releaseBlockerReport.includes("Current blockers") &&
    releaseBlockerReport.includes("Safe sequence")
  ) {
    console.log("Release blocker report: passed (owner go/no-go commands indexed)");
  } else {
    console.log("Release blocker report: pending");
    console.log("Command: npm run generate:release-blockers && npm run validate:release-blockers");
  }
  console.log("");
  console.log("Public guardrails:");
  printAuditCheck("- Public artifact policy", audit.checks?.publicArtifactPolicy);
  printAuditCheck("- Public repository manifest", audit.checks?.publicRepositoryPublicationManifest);
  printAuditCheck("- Local-only runtime", audit.checks?.localOnlyRuntime);
  printAuditCheck("- Release artifact hygiene", audit.checks?.releaseArtifactHygiene);
  printAuditCheck("- Workflow provenance", audit.checks?.workflowProvenance);
  printAuditCheck("- Privacy parity", audit.checks?.privacyParity);
  printAuditCheck("- Android permissions", audit.checks?.androidPermissions);
  printAuditCheck("- Play content rating", audit.checks?.playContentRatingPacket);
  printAuditCheck("- Play Health declaration", audit.checks?.playHealthDeclarationPacket);
  printAuditCheck("- Play App access", audit.checks?.playAppAccessPacket);
  printAuditCheck("- Play ads declaration", audit.checks?.playAdsDeclarationPacket);
  printAuditCheck("- Play target audience", audit.checks?.playTargetAudiencePacket);
  printAuditCheck("- Play testing rollout", audit.checks?.playTestingRolloutPacket);
  printAuditCheck("- Play App content", audit.checks?.playAppContentPacket);
  printAuditCheck("- Play release candidate", audit.checks?.playReleaseCandidatePacket);
  printAuditCheck("- Android signing handoff", audit.checks?.androidSigningHandoffPacket);
  printAuditCheck("- Play production readiness", audit.checks?.playProductionReadinessPacket);
  if (status?.publicEvidence) {
    console.log("");
    console.log("Release status evidence:");
    printStatusEvidence("- Release artifact hygiene", status.publicEvidence.releaseArtifactHygiene);
    printStatusEvidence("- Public artifact policy", status.publicEvidence.publicArtifactPolicy);
    printStatusEvidence("- Public repository manifest", status.publicEvidence.publicRepositoryPublicationManifest);
    printStatusEvidence("- Local-only runtime", status.publicEvidence.localOnlyRuntime);
    printStatusEvidence("- Workflow provenance", status.publicEvidence.workflowProvenance);
    printStatusEvidence("- Privacy parity", status.publicEvidence.privacyParity);
    printStatusEvidence("- Android permissions", status.publicEvidence.androidPermissions);
    printStatusEvidence("- Play content rating", status.publicEvidence.playContentRating);
    printStatusEvidence("- Play Health declaration", status.publicEvidence.playHealthDeclaration);
    printStatusEvidence("- Play App access", status.publicEvidence.playAppAccess);
    printStatusEvidence("- Play ads declaration", status.publicEvidence.playAdsDeclaration);
    printStatusEvidence("- Play target audience", status.publicEvidence.playTargetAudience);
    printStatusEvidence("- Play testing rollout", status.publicEvidence.playTestingRollout);
    printStatusEvidence("- Play App content", status.publicEvidence.playAppContent);
    printStatusEvidence("- Play release candidate", status.publicEvidence.playReleaseCandidate);
    printStatusEvidence("- Android signing handoff", status.publicEvidence.androidSigningHandoff);
    printStatusEvidence("- Play production readiness", status.publicEvidence.playProductionReadiness);
  }
  console.log("");

  printLiveDiagnostics();

  console.log("Owner go/no-go blocker report:");
  console.log("- Generate: npm run generate:release-blockers");
  console.log("- Validate: npm run validate:release-blockers");
  console.log("- Report: reports/release-blocker-report.md");
  console.log("  Note: This report maps each remaining owner-only gate to a helper command, proof command, and private-material boundary.");
  console.log("");

  console.log("Owner-safe rehearsal:");
  console.log("- Full owner dry run: npm run release:owner-dry-run");
  console.log("- Cloudflare secret setup dry run: npm run github:setup-deploy-secrets -- -DryRun");
  console.log("- Optional local Wrangler site deploy: npm run build:site && npm run deploy:site:local");
  console.log("- OneDrive-safe local Wrangler deploy: npm run build:site && npm run deploy:site:local:safe");
  console.log("- Keystore creation dry run: npm run mobile:create-upload-keystore -- -DryRun");
  console.log("- Android signing dry run: npm run mobile:release:android:prompted -- -DryRun");
  console.log("- Android signing helper: npm run owner-tools:android-signing-help");
  console.log("- Runtime QA helper: npm run owner-tools:runtime-qa-help");
  console.log("- Play upload helper: npm run owner-tools:play-upload-help");
  console.log("  Note: These rehearsals do not read, prompt for, print, or store secrets.");
  console.log("");

  const missingRequiredOwnerTools = Array.isArray(ownerTools?.missingRequired) ? ownerTools.missingRequired : [];
  const missingRecommendedOwnerTools = Array.isArray(ownerTools?.missingRecommended) ? ownerTools.missingRecommended : [];
  const githubCliMissing = missingRequiredOwnerTools.includes("gh") || missingRecommendedOwnerTools.includes("gh");
  if (!ownerTools) {
    console.log("Owner tool readiness: not checked yet.");
    console.log("Command: npm run validate:owner-tools");
    console.log("");
  } else if (missingRequiredOwnerTools.length > 0 || missingRecommendedOwnerTools.length > 0) {
    console.log("Owner tool readiness:");
    if (missingRequiredOwnerTools.length > 0) {
      console.log(`- Missing before GitHub/signing work: ${missingRequiredOwnerTools.join(", ")}`);
    }
    if (missingRecommendedOwnerTools.length > 0) {
      console.log(`- Recommended local setup: ${missingRecommendedOwnerTools.join(", ")}`);
    }
    console.log("  Command: npm run validate:owner-tools");
    if (githubCliMissing) {
      console.log("  GitHub CLI help: npm run owner-tools:gh-help");
      console.log("  Web fallback: docs/github-web-publication.md");
    }
    if (missingRecommendedOwnerTools.includes("wrangler")) {
      console.log("  Optional Wrangler help: npm run owner-tools:wrangler-help");
      console.log("  Local deploy fallback: npm run deploy:site:local:npx");
      console.log("  OneDrive-safe deploy fallback: npm run deploy:site:local:safe:npx");
    }
    if (
      missingRequiredOwnerTools.includes("jarsigner") ||
      missingRequiredOwnerTools.includes("keytool") ||
      missingRecommendedOwnerTools.includes("JAVA_HOME") ||
      missingRecommendedOwnerTools.includes("ANDROID_HOME")
    ) {
      console.log("  Java/Android help: npm run owner-tools:env-help");
    }
    console.log("  Note: This check records tool presence only and does not read or print secrets.");
    console.log("");
  }

  if (signingReadiness?.status && signingReadiness.status !== "ready-for-private-keystore") {
    console.log("Signing readiness:");
    console.log(`- Status: ${signingReadiness.status}`);
    if (Array.isArray(signingReadiness.failedChecks) && signingReadiness.failedChecks.length > 0) {
      console.log(`- Failed non-secret checks: ${signingReadiness.failedChecks.join(", ")}`);
    }
    console.log("  Command: npm run validate:signing-readiness");
    console.log("");
  }

  if (cloudflareReadiness?.status && cloudflareReadiness.status !== "ready-for-cloudflare-secrets") {
    console.log("Cloudflare readiness:");
    console.log(`- Status: ${cloudflareReadiness.status}`);
    if (Array.isArray(cloudflareReadiness.failedChecks) && cloudflareReadiness.failedChecks.length > 0) {
      console.log(`- Failed non-secret checks: ${cloudflareReadiness.failedChecks.join(", ")}`);
    }
    console.log("  Command: npm run validate:cloudflare-readiness");
    console.log("");
  }

  const pendingChecks = Array.isArray(audit.pendingChecks) ? audit.pendingChecks : [];
  const failedChecks = Array.isArray(audit.failedChecks) ? audit.failedChecks : [];

  if (failedChecks.length > 0) {
    console.log("Failed checks:");
    for (const check of failedChecks) {
      console.log(`- ${check}`);
    }
    console.log("");
  }

  if (pendingChecks.length === 0 && failedChecks.length === 0) {
    console.log("No pending or failed checks are recorded.");
    console.log("If Play upload is complete, run:");
    console.log("npm run validate:play-store-complete");
    return;
  }

  console.log("Pending checks:");
  for (const check of pendingChecks) {
    console.log(`- ${check}`);
  }
  console.log("");

  console.log("Recommended next actions:");
  for (const check of pendingChecks) {
    const step = nextSteps[check];
    if (!step) {
      continue;
    }
    console.log(`- ${step.title}`);
    if (step.helper) {
      console.log(`  Helper: ${step.helper}`);
    }
    console.log(`  Command: ${step.command}`);
    console.log(`  Note: ${step.detail}`);
    if ((check === "liveGithubPublication" || check === "liveGithubActions") && githubCliMissing) {
      console.log("  Publication: use GitHub CLI (`gh`) or the web fallback to publish/set secrets.");
      console.log("  Rehearsal: npm run github:setup-deploy-secrets -- -DryRun");
      console.log("  Helper: npm run owner-tools:gh-help");
      console.log("  Publish helper: npm run owner-tools:publish-help");
      console.log("  ZIP fallback: dist/github-repositories/Open-Cycle.zip and dist/github-repositories/open-cycle-source.zip");
      console.log("  ZIP validation: npm run validate:github-repository-archives");
      console.log("  Bundle publisher dry run: npm run github:publish-bundles:dry-run");
      console.log("  Bundle publisher apply: npm run github:publish-bundles:apply");
      console.log("  Web fallback: docs/github-web-publication.md");
    }
    if (check === "signedAab" && (missingRequiredOwnerTools.includes("jarsigner") || missingRequiredOwnerTools.includes("keytool") || missingRecommendedOwnerTools.includes("JAVA_HOME") || missingRecommendedOwnerTools.includes("ANDROID_HOME"))) {
      if (missingRequiredOwnerTools.includes("jarsigner") || missingRequiredOwnerTools.includes("keytool") || missingRecommendedOwnerTools.includes("JAVA_HOME")) {
        console.log("  Tooling: make Java signing tools visible before signing the AAB.");
      }
      if (missingRecommendedOwnerTools.includes("ANDROID_HOME")) {
        console.log("  Tooling: set ANDROID_HOME if you need to rebuild the AAB before signing.");
      }
      console.log("  Helper: npm run owner-tools:env-help");
    }
    if (check === "signedAab") {
      console.log("  Rehearsal: npm run mobile:create-upload-keystore -- -DryRun");
      console.log("  Rehearsal: npm run mobile:release:android:prompted -- -DryRun");
      console.log("  Evidence: after signing, run npm run mobile:signed-aab:evidence -- --require-signed");
    }
  }
  console.log("");
  console.log("For the full owner-side checklist, see docs/release-owner-checklist.md.");
}

main();

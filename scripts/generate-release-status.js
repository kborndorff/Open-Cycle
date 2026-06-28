const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const preflightPath = path.join(reportsDir, "play-store-preflight.json");
const statusPath = path.join(reportsDir, "release-status.json");

const paths = {
  unsignedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  signedAab: path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab"),
  signedAabEvidence: path.join(reportsDir, "signed-aab-evidence.json"),
  cloudflarePagesDeployment: path.join(reportsDir, "cloudflare-pages-deployment.json"),
  cloudflarePagesDomainAttachment: path.join(reportsDir, "cloudflare-pages-domain-attachment.json"),
  customDomainDnsDiagnostics: path.join(reportsDir, "custom-domain-dns-diagnostics.json"),
  liveCustomDomainPublication: path.join(reportsDir, "live-custom-domain-publication.json"),
  liveGithubPublication: path.join(reportsDir, "live-github-publication.json"),
  liveGithubActions: path.join(reportsDir, "live-github-actions.json"),
  releaseArtifactHygiene: path.join(reportsDir, "release-artifact-hygiene.json"),
  publicArtifactPolicy: path.join(reportsDir, "public-artifact-policy.json"),
  publicRepositoryPublicationManifest: path.join(reportsDir, "public-repository-publication-manifest.md"),
  localOnlyRuntime: path.join(reportsDir, "local-only-runtime.json"),
  workflowProvenance: path.join(reportsDir, "workflow-provenance.json"),
  privacyParity: path.join(reportsDir, "privacy-parity.json"),
  androidPermissions: path.join(reportsDir, "android-permissions.json"),
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
  playConsoleFieldMap: path.join(reportsDir, "play-console-field-map.json"),
  playConsoleFieldMapMarkdown: path.join(reportsDir, "play-console-field-map.md"),
  visualTestReport: path.join(reportsDir, "visual-test-report.json"),
  visualEvidenceManifest: path.join(reportsDir, "visual-evidence-manifest.json"),
  signedRuntimeQaPreflight: path.join(reportsDir, "signed-runtime-qa-preflight.json"),
  runtimeQaReport: path.join(reportsDir, "runtime-qa-report.md"),
  playConsoleSubmitBundleManifest: path.join(root, "dist", "play-console-submit", "manifest.json"),
  playMetadata: path.join(root, "store-assets", "play", "listing.json"),
  playReleaseNotes: path.join(root, "store-assets", "play", "release-notes.txt")
};

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileInfo(file) {
  if (!fs.existsSync(file)) {
    return { exists: false };
  }
  const stat = fs.statSync(file);
  return {
    exists: true,
    bytes: stat.size,
    sha256: sha256(file)
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function reportPassed(file) {
  if (!fs.existsSync(file)) {
    return false;
  }
  try {
    const report = readJson(file);
    return report.status === "pass" && (!Array.isArray(report.failures) || report.failures.length === 0);
  } catch {
    return false;
  }
}

function cloudflarePagesDomainAttachmentPassed() {
  if (reportPassed(paths.cloudflarePagesDomainAttachment)) {
    return true;
  }
  if (!fs.existsSync(paths.cloudflarePagesDeployment)) {
    return false;
  }
  try {
    const report = readJson(paths.cloudflarePagesDeployment);
    return Boolean(
      report.status === "pass" &&
        report.projectName === "open-cycle-site" &&
        report.customDomainStatus === "attached" &&
        Array.isArray(report.missingCustomDomains) &&
        report.missingCustomDomains.length === 0 &&
        Array.isArray(report.project?.domains) &&
        report.project.domains.includes("open-cycle-site.pages.dev") &&
        report.project.domains.includes("open-cycle.com") &&
        report.project.domains.includes("www.open-cycle.com") &&
        (!Array.isArray(report.failures) || report.failures.length === 0)
    );
  } catch {
    return false;
  }
}

function reportSummary(file, command) {
  if (!fs.existsSync(file)) {
    return {
      status: "missing",
      command
    };
  }
  try {
    const report = readJson(file);
    const failures = Array.isArray(report.failures) ? report.failures : [];
    return {
      status: report.status || "unknown",
      command,
      failures,
      secretSafe: report.secretSafe === true
    };
  } catch (error) {
    return {
      status: "invalid",
      command,
      failures: [error.message],
      secretSafe: false
    };
  }
}

function signedRuntimeQaPreflightSummary(file, command) {
  if (!fs.existsSync(file)) {
    return {
      status: "missing",
      command,
      failures: ["Evidence file is missing."],
      secretSafe: false
    };
  }
  try {
    const report = readJson(file);
    const failures = [];
    if (report.status !== "pass") {
      failures.push("Signed runtime QA preflight status is not pass.");
    }
    if (report.secretSafe !== true || report.publicSafe !== true || report.privateMaterialIncluded !== false) {
      failures.push("Signed runtime QA preflight is not public-safe and secret-safe.");
    }
    return {
      status: failures.length === 0 ? "pass" : "fail",
      command,
      failures,
      secretSafe: failures.length === 0
    };
  } catch (error) {
    return {
      status: "invalid",
      command,
      failures: [error.message],
      secretSafe: false
    };
  }
}

function markdownEvidenceSummary(file, command, requiredText) {
  if (!fs.existsSync(file)) {
    return {
      status: "missing",
      command,
      secretSafe: false,
      failures: ["Evidence file is missing."]
    };
  }
  const contents = fs.readFileSync(file, "utf8");
  const failures = [];
  for (const expected of requiredText) {
    if (!contents.includes(expected)) {
      failures.push(`Missing expected text: ${expected}`);
    }
  }
  for (const forbidden of ["ANDROID_KEYSTORE_PASSWORD=", "ANDROID_KEY_PASSWORD=", "CF_API_TOKEN=", "CF_ACCOUNT_ID=", ".jks", ".keystore"]) {
    if (contents.includes(forbidden)) {
      failures.push(`Contains forbidden sensitive marker: ${forbidden}`);
    }
  }
  return {
    status: failures.length === 0 ? "pass" : "fail",
    command,
    secretSafe: failures.length === 0,
    failures
  };
}

function playConsoleFieldMapSummary(file, command) {
  if (!fs.existsSync(file)) {
    return {
      status: "missing",
      command,
      failures: ["Evidence file is missing."],
      secretSafe: false
    };
  }
  try {
    const report = readJson(file);
    const failures = [];
    if (report.status !== "public-safe-play-console-field-map") {
      failures.push("Field map status is not public-safe-play-console-field-map.");
    }
    if (report.appName !== "open-cycle") {
      failures.push("Field map appName is not open-cycle.");
    }
    if (report.packageName !== "com.opencycle.app") {
      failures.push("Field map packageName is not com.opencycle.app.");
    }
    if (!Array.isArray(report.fields) || report.fields.length < 40) {
      failures.push("Field map does not include enough Play Console fields.");
    }
    if (report.privateMaterialIncluded !== false) {
      failures.push("Field map must not include private material.");
    }
    return {
      status: failures.length === 0 ? "pass" : "fail",
      command,
      failures,
      secretSafe: failures.length === 0
    };
  } catch (error) {
    return {
      status: "invalid",
      command,
      failures: [error.message],
      secretSafe: false
    };
  }
}

function runtimeQaComplete(file) {
  if (!fs.existsSync(file)) {
    return false;
  }
  const contents = fs.readFileSync(file, "utf8");
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

function main() {
  if (!fs.existsSync(preflightPath)) {
    console.error("Missing reports/play-store-preflight.json. Run npm run preflight:play-store first.");
    process.exit(1);
  }

  const preflight = readJson(preflightPath);
  const signedAabEvidence = fs.existsSync(paths.signedAabEvidence) ? readJson(paths.signedAabEvidence) : {};
  const signedAabReady = signedAabEvidence.status === "pass";
  const signedAabFreshnessStatus = signedAabEvidence.freshness?.status || (signedAabReady ? "pass" : "unknown");
  const signedAabCandidateReady = signedAabReady && signedAabFreshnessStatus === "pass";
  const playMetadata = fs.existsSync(paths.playMetadata) ? readJson(paths.playMetadata) : {};
  const onlySignedAabPending =
    Array.isArray(preflight.pendingPrivateSteps) &&
    preflight.pendingPrivateSteps.length === 1 &&
    preflight.pendingPrivateSteps[0] === "signedAab";
  const noPrivatePreflightPending =
    Array.isArray(preflight.pendingPrivateSteps) &&
    preflight.pendingPrivateSteps.length === 0;
  const noBlockingFailures =
    Array.isArray(preflight.blockingFailures) &&
    preflight.blockingFailures.length === 0;

  const publicReadinessStatus =
    preflight.status === "ready-for-private-signing" && onlySignedAabPending && noBlockingFailures
      ? "ready-for-private-signing"
      : preflight.status === "ready-for-play-upload" && noPrivatePreflightPending && noBlockingFailures && signedAabReady
      ? "ready-for-play-upload"
      : preflight.status === "ready-for-play-upload" && noPrivatePreflightPending && noBlockingFailures && !signedAabReady
      ? "ready-for-private-signing"
      : "needs-public-work";
  const publicRemainingSteps = [
    ...(cloudflarePagesDomainAttachmentPassed()
      ? []
      : [{
          id: "liveCloudflarePagesDomainAttachment",
          description: "Attach open-cycle.com and www.open-cycle.com to the open-cycle-site Cloudflare Pages project.",
          command: "npm run validate:cloudflare-pages-domains:live"
        }]),
    ...(reportPassed(paths.liveCustomDomainPublication)
      ? []
      : [{
          id: "liveCustomDomainPublication",
          description: "Attach open-cycle.com to Cloudflare Pages and validate the live custom domain.",
          command: "npm run validate:custom-domain:live"
        }]),
    ...(reportPassed(paths.liveGithubPublication)
      ? []
      : [{
          id: "liveGithubPublication",
          description: "Publish the public GitHub repository and validate expected public files.",
          command: "npm run validate:github:live"
        }]),
    ...(reportPassed(paths.liveGithubActions)
      ? []
      : [{
          id: "liveGithubActions",
          description: "Wait for public GitHub Actions to finish and validate workflow success.",
          command: "npm run validate:github:actions"
        }])
  ];
  const runtimeQaDone = runtimeQaComplete(paths.runtimeQaReport);
  const privateRemainingSteps = [
    ...(publicReadinessStatus === "ready-for-play-upload"
      ? []
      : [{
          id: "signedAab",
          description: "Sign the Android App Bundle with the private Play upload keystore.",
          command: "npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate"
        }]),
    ...(runtimeQaDone
      ? []
      : [{
          id: "signedRuntimeQa",
          description: "Install the signed candidate and complete docs/runtime-qa.md."
        }]),
    {
      id: "playConsoleUpload",
      description: "Upload the signed AAB, store listing, graphics, privacy URL, and release notes in Play Console."
    }
  ];

  const status = {
    generatedAt: new Date().toISOString(),
    publicReadinessStatus,
    repository: "https://github.com/kborndorff/Open-Cycle",
    liveSiteUrl: "https://open-cycle-site.pages.dev",
    customDomainUrl: "https://open-cycle.com",
    privacyPolicyUrl: playMetadata.privacyPolicyUrl || "https://open-cycle-site.pages.dev/privacy",
    publicValidationCommands: [
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
    ],
    publicRemainingSteps,
    privateRemainingSteps,
    publicEvidence: {
      releaseArtifactHygiene: reportSummary(paths.releaseArtifactHygiene, "npm run validate:release-artifacts"),
      cloudflarePagesDeployment: reportSummary(paths.cloudflarePagesDeployment, "npm run validate:cloudflare-pages-deployment"),
      publicArtifactPolicy: reportSummary(paths.publicArtifactPolicy, "npm run validate:public-artifacts"),
      publicRepositoryPublicationManifest: markdownEvidenceSummary(paths.publicRepositoryPublicationManifest, "npm run validate:public-repo-manifest", [
        "Public repository publication manifest",
        "public-safe by design",
        "Private material that must stay out of GitHub",
        "Do not push until the owner explicitly approves publication",
        "Perform Android signing privately"
      ]),
      localOnlyRuntime: reportSummary(paths.localOnlyRuntime, "npm run validate:local-only-runtime"),
      workflowProvenance: reportSummary(paths.workflowProvenance, "npm run validate:workflow-provenance"),
      privacyParity: reportSummary(paths.privacyParity, "npm run validate:privacy-parity"),
      androidPermissions: reportSummary(paths.androidPermissions, "npm run validate:android-permissions"),
      playContentRating: markdownEvidenceSummary(paths.playContentRatingPacket, "npm run validate:play-content-rating", [
        "Play Console content rating and app content packet",
        "Contains ads: No",
        "User-generated content or social sharing: No",
        "Android internet permission requested: No",
        "Data collected: None"
      ]),
      playHealthDeclaration: markdownEvidenceSummary(paths.playHealthDeclarationPacket, "npm run validate:play-health-declaration", [
        "Play Health apps declaration packet",
        "Health declaration category: Health and fitness > Period Tracking",
        "Is the app a regulated medical device app? No.",
        "Does the app access Health Connect data? No.",
        "Does the app request health-related Android permissions? No."
      ]),
      playAppAccess: markdownEvidenceSummary(paths.playAppAccessPacket, "npm run validate:play-app-access", [
        "Play App access packet",
        "Login required: No",
        "Test account credentials required: No",
        "Network access required for core review path: No"
      ]),
      playAdsDeclaration: markdownEvidenceSummary(paths.playAdsDeclarationPacket, "npm run validate:play-ads-declaration", [
        "Play ads declaration packet",
        "Contains ads: No",
        "Uses Advertising ID: No",
        "Uses ad SDKs: No"
      ]),
      playTargetAudience: markdownEvidenceSummary(paths.playTargetAudiencePacket, "npm run validate:play-target-audience", [
        "Play target audience and children declaration packet",
        "Recommended target age group: 18 and over",
        "Designed for children: No",
        "Includes children in target audience: No",
        "Restrict Minor Access recommended: Yes"
      ]),
      playTestingRollout: markdownEvidenceSummary(paths.playTestingRolloutPacket, "npm run validate:play-testing-rollout", [
        "Play testing and production access packet",
        "Minimum testers for affected new personal accounts: 12 opted-in testers.",
        "Minimum continuous opt-in duration for affected new personal accounts: 14 days.",
        "Do not commit tester email lists"
      ]),
      playAppContent: markdownEvidenceSummary(paths.playAppContentPacket, "npm run validate:play-app-content", [
        "Play App content packet",
        "Data safety: no collection and no sharing.",
        "App access: no login, no account, no test credentials",
        "Ads: no ads, no ad SDKs, no Advertising ID"
      ]),
      playReleaseCandidate: markdownEvidenceSummary(paths.playReleaseCandidatePacket, "npm run validate:play-release-candidate", [
        "Play release candidate packet",
        "Unsigned AAB evidence matches preflight: Yes",
        "Signed AAB boundary: private owner-side artifact only."
      ]),
      playConsoleFieldMap: playConsoleFieldMapSummary(paths.playConsoleFieldMap, "npm run validate:play-console-field-map"),
      visualTestReport: reportSummary(paths.visualTestReport, "npm run validate:visual-test-report"),
      visualEvidenceManifest: reportSummary(paths.visualEvidenceManifest, "npm run validate:visual-evidence"),
      signedRuntimeQaPreflight: signedRuntimeQaPreflightSummary(paths.signedRuntimeQaPreflight, "npm run validate:signed-runtime-qa-preflight"),
      androidSigningHandoff: markdownEvidenceSummary(paths.androidSigningHandoffPacket, "npm run validate:android-signing-handoff", [
        "Android signing handoff packet",
        "Signing readiness status: ready-for-private-keystore",
        "Unsigned AAB evidence status: pass"
      ]),
      playProductionReadiness: markdownEvidenceSummary(paths.playProductionReadinessPacket, "npm run validate:play-production-readiness", [
        "Play production readiness packet",
        `Release status: ${publicReadinessStatus}`,
        "Do not mark production complete from this packet alone."
      ])
    },
    artifacts: {
      unsignedAab: fileInfo(paths.unsignedAab),
      signedAab: {
        ...fileInfo(paths.signedAab),
        currentCandidateReady: signedAabCandidateReady,
        evidenceStatus: signedAabEvidence.status || "missing",
        freshnessStatus: signedAabFreshnessStatus,
        releaseUse: signedAabCandidateReady
          ? "current signed release candidate"
          : "do not upload until npm run mobile:signed-aab:evidence -- --require-signed passes for the current unsigned AAB"
      },
      signedAabEvidence: fileInfo(paths.signedAabEvidence),
      cloudflarePagesDeployment: fileInfo(paths.cloudflarePagesDeployment),
      releaseArtifactHygiene: fileInfo(paths.releaseArtifactHygiene),
      publicArtifactPolicy: fileInfo(paths.publicArtifactPolicy),
      publicRepositoryPublicationManifest: fileInfo(paths.publicRepositoryPublicationManifest),
      customDomainDnsDiagnostics: fileInfo(paths.customDomainDnsDiagnostics),
      localOnlyRuntime: fileInfo(paths.localOnlyRuntime),
      workflowProvenance: fileInfo(paths.workflowProvenance),
      privacyParity: fileInfo(paths.privacyParity),
      androidPermissions: fileInfo(paths.androidPermissions),
      playContentRating: fileInfo(paths.playContentRatingPacket),
      playHealthDeclaration: fileInfo(paths.playHealthDeclarationPacket),
      playAppAccess: fileInfo(paths.playAppAccessPacket),
      playAdsDeclaration: fileInfo(paths.playAdsDeclarationPacket),
      playTargetAudience: fileInfo(paths.playTargetAudiencePacket),
      playTestingRollout: fileInfo(paths.playTestingRolloutPacket),
      playAppContent: fileInfo(paths.playAppContentPacket),
      playReleaseCandidate: fileInfo(paths.playReleaseCandidatePacket),
      playConsoleFieldMap: fileInfo(paths.playConsoleFieldMap),
      playConsoleFieldMapMarkdown: fileInfo(paths.playConsoleFieldMapMarkdown),
      visualTestReport: fileInfo(paths.visualTestReport),
      visualEvidenceManifest: fileInfo(paths.visualEvidenceManifest),
      signedRuntimeQaPreflight: fileInfo(paths.signedRuntimeQaPreflight),
      runtimeQaReport: fileInfo(paths.runtimeQaReport),
      androidSigningHandoff: fileInfo(paths.androidSigningHandoffPacket),
      playProductionReadiness: fileInfo(paths.playProductionReadinessPacket),
      playConsoleSubmitBundleManifest: fileInfo(paths.playConsoleSubmitBundleManifest),
      playMetadata: fileInfo(paths.playMetadata),
      playReleaseNotes: fileInfo(paths.playReleaseNotes)
    },
    preflight: {
      status: preflight.status,
      blockingFailures: preflight.blockingFailures || [],
      pendingPrivateSteps: preflight.pendingPrivateSteps || []
    }
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");

  console.log(`Release status report written to ${statusPath}`);
  console.log(`Status: ${status.publicReadinessStatus}`);
  console.log(`Remaining private steps: ${status.privateRemainingSteps.map((step) => step.id).join(", ")}`);

  if (!["ready-for-private-signing", "ready-for-play-upload"].includes(publicReadinessStatus)) {
    process.exit(1);
  }
}

main();

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const confirmationPath = path.join(reportsDir, "play-console-upload-confirmation.json");
const signedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");
const unsignedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const temporaryPrivacyPolicyUrl = "https://open-cycle-site.pages.dev/privacy";
const preferredPrivacyPolicyUrl = "https://open-cycle.com/privacy";
const customDomainValidationCommand = "npm run validate:custom-domain:live";
const force = process.argv.includes("--force");

function signedAabSha256() {
  if (!fs.existsSync(signedAabPath)) {
    return "";
  }
  return crypto.createHash("sha256").update(fs.readFileSync(signedAabPath)).digest("hex");
}

function signedAabSize() {
  if (!fs.existsSync(signedAabPath)) {
    return "";
  }
  return fs.statSync(signedAabPath).size;
}

function unsignedAabSha256() {
  if (!fs.existsSync(unsignedAabPath)) {
    return "";
  }
  return crypto.createHash("sha256").update(fs.readFileSync(unsignedAabPath)).digest("hex");
}

function unsignedAabSize() {
  if (!fs.existsSync(unsignedAabPath)) {
    return "";
  }
  return fs.statSync(unsignedAabPath).size;
}

const confirmation = {
  uploaded: false,
  appName: "open-cycle",
  packageName: "com.opencycle.app",
  track: "internal",
  releaseName: "",
  releaseStatus: "draft",
  uploadedAt: "",
  privacyPolicyUrl: temporaryPrivacyPolicyUrl,
  temporaryPrivacyPolicyUrlBeforeCustomDomainValidation: temporaryPrivacyPolicyUrl,
  preferredPrivacyPolicyUrlAfterCustomDomainValidation: preferredPrivacyPolicyUrl,
  customDomainValidationCommand,
  dataSafetySubmitted: false,
  dataSafetyDataCollected: "None",
  dataSafetyDataSharedWithThirdParties: false,
  noAdsOrAdvertisingIdConfirmed: false,
  noAccountCreationConfirmed: false,
  noInternetPermissionConfirmed: false,
  signedRuntimeQaComplete: false,
  signedRuntimeQaValidationCommand: "npm run validate:runtime-qa-report -- --require-complete",
  signedAabSha256: signedAabSha256(),
  signedAabSizeBytes: signedAabSize(),
  unsignedAabSha256: unsignedAabSha256(),
  unsignedAabSizeBytes: unsignedAabSize(),
  playConsoleUrl: "",
  notes: "Fill this after Play Console upload. Prefer https://open-cycle.com/privacy after npm run validate:custom-domain:live passes; use the Pages privacy URL only as the temporary fallback. Confirm Data safety says no collection/no sharing, no ads/Advertising ID, no accounts, no Internet permission, and completed signed runtime QA. Keep signedAabSha256/signedAabSizeBytes and unsignedAabSha256/unsignedAabSizeBytes matched to reports/signed-aab-evidence.json. Do not include Play credentials, keystore paths, passwords, tokens, or screenshots containing private account data."
};

fs.mkdirSync(reportsDir, { recursive: true });
if (fs.existsSync(confirmationPath) && !force) {
  const existing = JSON.parse(fs.readFileSync(confirmationPath, "utf8"));
  const merged = {
    ...confirmation,
    ...existing,
    appName: confirmation.appName,
    packageName: confirmation.packageName,
    privacyPolicyUrl: existing.privacyPolicyUrl || temporaryPrivacyPolicyUrl,
    temporaryPrivacyPolicyUrlBeforeCustomDomainValidation: temporaryPrivacyPolicyUrl,
    preferredPrivacyPolicyUrlAfterCustomDomainValidation: preferredPrivacyPolicyUrl,
    customDomainValidationCommand,
    dataSafetySubmitted: existing.dataSafetySubmitted === true,
    dataSafetyDataCollected: existing.dataSafetyDataCollected || confirmation.dataSafetyDataCollected,
    dataSafetyDataSharedWithThirdParties: existing.dataSafetyDataSharedWithThirdParties === true,
    noAdsOrAdvertisingIdConfirmed: existing.noAdsOrAdvertisingIdConfirmed === true,
    noAccountCreationConfirmed: existing.noAccountCreationConfirmed === true,
    noInternetPermissionConfirmed: existing.noInternetPermissionConfirmed === true,
    signedRuntimeQaComplete: existing.signedRuntimeQaComplete === true,
    signedRuntimeQaValidationCommand: confirmation.signedRuntimeQaValidationCommand,
    signedAabSha256: existing.uploaded === true ? existing.signedAabSha256 : confirmation.signedAabSha256,
    signedAabSizeBytes: existing.uploaded === true ? existing.signedAabSizeBytes : confirmation.signedAabSizeBytes,
    unsignedAabSha256: existing.uploaded === true ? existing.unsignedAabSha256 : confirmation.unsignedAabSha256,
    unsignedAabSizeBytes: existing.uploaded === true ? existing.unsignedAabSizeBytes : confirmation.unsignedAabSizeBytes,
    notes: existing.notes || confirmation.notes
  };

  if (![temporaryPrivacyPolicyUrl, preferredPrivacyPolicyUrl].includes(merged.privacyPolicyUrl)) {
    merged.privacyPolicyUrl = preferredPrivacyPolicyUrl;
  }

  if (JSON.stringify(existing) !== JSON.stringify(merged)) {
    fs.writeFileSync(confirmationPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    console.log(`Play Console upload confirmation updated with public-safe custom-domain guidance at ${confirmationPath}.`);
    process.exit(0);
  }

  console.log(`Play Console upload confirmation already exists at ${confirmationPath}. Not overwriting private release fields; pass --force to regenerate the template.`);
  process.exit(0);
}
fs.writeFileSync(confirmationPath, `${JSON.stringify(confirmation, null, 2)}\n`, "utf8");
console.log(`Play Console upload confirmation template written to ${confirmationPath}`);

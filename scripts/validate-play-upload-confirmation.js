const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const requireComplete = process.argv.includes("--require-complete");
const confirmationPath = path.join(root, "reports", "play-console-upload-confirmation.json");
const signedAabEvidencePath = path.join(root, "reports", "signed-aab-evidence.json");
const signedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");
const unsignedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const temporaryPrivacyPolicyUrl = "https://open-cycle-site.pages.dev/privacy";
const preferredPrivacyPolicyUrl = "https://open-cycle.com/privacy";
const customDomainValidationCommand = "npm run validate:custom-domain:live";
const signedRuntimeQaValidationCommand = "npm run validate:runtime-qa-report -- --require-complete";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isIsoDate(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isPlaceholder(value) {
  return typeof value !== "string" || value.trim() === "" || value.includes("<") || value.includes(">") || value.toLowerCase().includes("todo");
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readSignedAabEvidence() {
  if (!fs.existsSync(signedAabEvidencePath)) {
    fail("Missing reports/signed-aab-evidence.json. Run npm run mobile:signed-aab:evidence -- --require-signed.");
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(signedAabEvidencePath, "utf8"));
  } catch (error) {
    fail(`Signed AAB evidence report could not be parsed: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}

function validateNoSensitiveMaterial(value, pathLabel = "confirmation") {
  if (typeof value === "string") {
    for (const forbidden of [
      "ANDROID_KEYSTORE_PASSWORD=",
      "ANDROID_KEY_PASSWORD=",
      "ANDROID_KEYSTORE_PATH=",
      "CF_API_TOKEN=",
      "CF_ACCOUNT_ID=",
      "PLAY_CONSOLE",
      ".jks",
      ".keystore"
    ]) {
      if (value.includes(forbidden)) {
        fail(`Play upload confirmation must not include sensitive material at ${pathLabel}: ${forbidden}`);
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoSensitiveMaterial(entry, `${pathLabel}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      validateNoSensitiveMaterial(entry, `${pathLabel}.${key}`);
    }
  }
}

if (!fs.existsSync(confirmationPath)) {
  fail("Missing reports/play-console-upload-confirmation.json. Run npm run generate:play-upload-confirmation.");
} else {
  const confirmation = JSON.parse(fs.readFileSync(confirmationPath, "utf8"));
  validateNoSensitiveMaterial(confirmation);

  if (typeof confirmation.uploaded !== "boolean") {
    fail("Play upload confirmation must include uploaded boolean.");
  }
  if (confirmation.appName !== "open-cycle") {
    fail("Play upload confirmation must use appName open-cycle.");
  }
  if (confirmation.packageName !== "com.opencycle.app") {
    fail("Play upload confirmation must use packageName com.opencycle.app.");
  }
  if (!["internal", "closed", "open", "production"].includes(confirmation.track)) {
    fail("Play upload confirmation track must be internal, closed, open, or production.");
  }
  if (!/^https:\/\/.+\/privacy(?:\.html)?$/.test(confirmation.privacyPolicyUrl || "")) {
    fail("Play upload confirmation must include the hosted privacy policy URL.");
  }
  if (confirmation.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation !== temporaryPrivacyPolicyUrl) {
    fail(`Play upload confirmation must include temporaryPrivacyPolicyUrlBeforeCustomDomainValidation as ${temporaryPrivacyPolicyUrl}.`);
  }
  if (confirmation.preferredPrivacyPolicyUrlAfterCustomDomainValidation !== preferredPrivacyPolicyUrl) {
    fail(`Play upload confirmation must include preferredPrivacyPolicyUrlAfterCustomDomainValidation as ${preferredPrivacyPolicyUrl}.`);
  }
  if (confirmation.customDomainValidationCommand !== customDomainValidationCommand) {
    fail(`Play upload confirmation must include customDomainValidationCommand as ${customDomainValidationCommand}.`);
  }
  if (confirmation.dataSafetyDataCollected !== "None") {
    fail("Play upload confirmation must record dataSafetyDataCollected as None.");
  }
  if (confirmation.dataSafetyDataSharedWithThirdParties !== false) {
    fail("Play upload confirmation must record dataSafetyDataSharedWithThirdParties as false.");
  }
  if (confirmation.signedRuntimeQaValidationCommand !== signedRuntimeQaValidationCommand) {
    fail(`Play upload confirmation must include signedRuntimeQaValidationCommand as ${signedRuntimeQaValidationCommand}.`);
  }
  if (![temporaryPrivacyPolicyUrl, preferredPrivacyPolicyUrl].includes(confirmation.privacyPolicyUrl)) {
    fail(`Play upload confirmation privacyPolicyUrl must be ${preferredPrivacyPolicyUrl} after custom-domain validation, or ${temporaryPrivacyPolicyUrl} as the temporary fallback.`);
  }
  if (confirmation.unsignedAabSha256 && !/^[a-f0-9]{64}$/i.test(confirmation.unsignedAabSha256)) {
    fail("Play upload confirmation unsignedAabSha256 must be a SHA-256 hash when present.");
  }
  if (confirmation.unsignedAabSizeBytes && (!Number.isInteger(confirmation.unsignedAabSizeBytes) || confirmation.unsignedAabSizeBytes <= 0)) {
    fail("Play upload confirmation unsignedAabSizeBytes must be a positive integer when present.");
  }

  if (requireComplete) {
    if (confirmation.uploaded !== true) {
      fail("Play upload confirmation must set uploaded to true when --require-complete is used.");
    }
    for (const [field, description] of [
      ["dataSafetySubmitted", "Play Data safety form submitted"],
      ["noAdsOrAdvertisingIdConfirmed", "no ads or Advertising ID confirmed"],
      ["noAccountCreationConfirmed", "no account creation confirmed"],
      ["noInternetPermissionConfirmed", "no Internet permission confirmed"],
      ["signedRuntimeQaComplete", "signed runtime QA completed"]
    ]) {
      if (confirmation[field] !== true) {
        fail(`Play upload confirmation must set ${field} to true when --require-complete is used (${description}).`);
      }
    }
    if (isPlaceholder(confirmation.releaseName)) {
      fail("Play upload confirmation must include a real releaseName.");
    }
    if (!["draft", "inReview", "rolledOut", "halted"].includes(confirmation.releaseStatus)) {
      fail("Play upload confirmation releaseStatus must be draft, inReview, rolledOut, or halted.");
    }
    if (!isIsoDate(confirmation.uploadedAt)) {
      fail("Play upload confirmation must include uploadedAt as an ISO date/time.");
    }
    if (!/^[a-f0-9]{64}$/i.test(confirmation.signedAabSha256 || "")) {
      fail("Play upload confirmation must include the signed AAB SHA-256.");
    }
    if (!Number.isInteger(confirmation.signedAabSizeBytes) || confirmation.signedAabSizeBytes <= 0) {
      fail("Play upload confirmation must include signedAabSizeBytes as a positive integer.");
    }
    const signedAabEvidence = readSignedAabEvidence();
    if (signedAabEvidence) {
      if (signedAabEvidence.status !== "pass") {
        fail("Signed AAB evidence report must have status pass before Play upload can be confirmed.");
      }
      if (String(signedAabEvidence.signedAabSha256 || "").toLowerCase() !== String(confirmation.signedAabSha256 || "").toLowerCase()) {
        fail("Play upload confirmation signedAabSha256 does not match reports/signed-aab-evidence.json.");
      }
      if (signedAabEvidence.signedAabSizeBytes !== confirmation.signedAabSizeBytes) {
        fail("Play upload confirmation signedAabSizeBytes does not match reports/signed-aab-evidence.json.");
      }
      if (!signedAabEvidence.unsignedAab || !/^[a-f0-9]{64}$/i.test(signedAabEvidence.unsignedAab.sha256 || "")) {
        fail("Signed AAB evidence must record the unsigned AAB SHA-256 used for the signed candidate.");
      } else if (String(signedAabEvidence.unsignedAab.sha256).toLowerCase() !== String(confirmation.unsignedAabSha256 || "").toLowerCase()) {
        fail("Play upload confirmation unsignedAabSha256 does not match reports/signed-aab-evidence.json.");
      }
      if (!signedAabEvidence.unsignedAab || signedAabEvidence.unsignedAab.sizeBytes !== confirmation.unsignedAabSizeBytes) {
        fail("Play upload confirmation unsignedAabSizeBytes does not match reports/signed-aab-evidence.json.");
      }
    }
    if (!fs.existsSync(signedAabPath)) {
      fail("Signed AAB file must exist locally before Play upload can be confirmed.");
    } else {
      const actualHash = fileSha256(signedAabPath);
      const actualSize = fs.statSync(signedAabPath).size;
      if (String(confirmation.signedAabSha256).toLowerCase() !== actualHash.toLowerCase()) {
        fail("Play upload confirmation signedAabSha256 does not match the current signed AAB.");
      }
      if (confirmation.signedAabSizeBytes !== actualSize) {
        fail("Play upload confirmation signedAabSizeBytes does not match the current signed AAB.");
      }
    }
    if (!fs.existsSync(unsignedAabPath)) {
      fail("Unsigned AAB file must exist locally so the signed Play upload can be tied to the current release build.");
    } else {
      const actualUnsignedHash = fileSha256(unsignedAabPath);
      const actualUnsignedSize = fs.statSync(unsignedAabPath).size;
      if (String(confirmation.unsignedAabSha256 || "").toLowerCase() !== actualUnsignedHash.toLowerCase()) {
        fail("Play upload confirmation unsignedAabSha256 does not match the current unsigned AAB.");
      }
      if (confirmation.unsignedAabSizeBytes !== actualUnsignedSize) {
        fail("Play upload confirmation unsignedAabSizeBytes does not match the current unsigned AAB.");
      }
    }
    if (isPlaceholder(confirmation.playConsoleUrl) || !String(confirmation.playConsoleUrl).startsWith("https://play.google.com/console")) {
      fail("Play upload confirmation must include a Play Console URL.");
    }
    if (confirmation.privacyPolicyUrl !== preferredPrivacyPolicyUrl) {
      fail(`Completed Play upload confirmation must use ${preferredPrivacyPolicyUrl}; run ${customDomainValidationCommand} before final Play upload confirmation.`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(requireComplete ? "Completed Play upload confirmation checks passed." : "Play upload confirmation structure checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const preferredPrivacyPolicyUrl = "https://open-cycle.com/privacy";
const temporaryPrivacyPolicyUrl = "https://open-cycle-site.pages.dev/privacy";
const customDomainValidationCommand = "npm run validate:custom-domain:live";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function relativeExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

if (!fs.existsSync(metadataPath)) {
  fail("Missing store-assets/play/listing.json. Run npm run generate:play-metadata.");
} else {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  if (metadata.appName !== "open-cycle") {
    fail("Play metadata appName must be open-cycle.");
  }
  if (metadata.packageName !== "com.opencycle.app") {
    fail("Play metadata packageName must match Android applicationId.");
  }
  if (metadata.appName.length > 30) {
    fail("Play app name must be 30 characters or fewer.");
  }
  if (!metadata.shortDescription || metadata.shortDescription.length > 80) {
    fail("Play short description must be present and 80 characters or fewer.");
  }
  if (!metadata.fullDescription || metadata.fullDescription.length > 4000) {
    fail("Play full description must be present and 4000 characters or fewer.");
  }
  if (metadata.privacyPolicyUrl !== preferredPrivacyPolicyUrl) {
    fail(`Play metadata privacyPolicyUrl must be the final custom-domain URL: ${preferredPrivacyPolicyUrl}.`);
  }
  if (metadata.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation !== temporaryPrivacyPolicyUrl) {
    fail(`Play metadata must preserve the temporary Pages fallback URL: ${temporaryPrivacyPolicyUrl}.`);
  }
  if (metadata.customDomainValidationCommand !== customDomainValidationCommand) {
    fail(`Play metadata must include the custom-domain validation command: ${customDomainValidationCommand}.`);
  }
  if (metadata.price !== "Free" || metadata.containsAds !== false || metadata.inAppPurchases !== false) {
    fail("Play metadata must describe a free app with no ads and no in-app purchases.");
  }
  if (metadata.accountRequired !== false || metadata.internetRequiredForCoreTracking !== false) {
    fail("Play metadata must preserve no-account and no-internet-required core behavior.");
  }
  for (const expected of [
    "privacy-first period tracker",
    "Your saved entries stay on your phone",
    "personal wellness log",
    "not medical advice, diagnosis, or treatment",
    "doctor or qualified clinician"
  ]) {
    if (!String(metadata.fullDescription || "").includes(expected)) {
      fail(`Play full description must include wellness disclosure: ${expected}`);
    }
  }

  const dataSafety = metadata.dataSafety || {};
  const expectedFalseClaims = [
    "dataSharedWithThirdParties",
    "accountDeletionRequired",
    "locationDataCollected",
    "healthDataCollected",
    "financialInfoCollected",
    "contactsCollected",
    "photosVideosAudioFilesCollected",
    "deviceIdentifiersCollectedByAppCode",
    "advertisingIdUsed"
  ];
  if (dataSafety.dataCollected !== "None") {
    fail("Data safety metadata must state dataCollected as None.");
  }
  for (const key of expectedFalseClaims) {
    if (dataSafety[key] !== false) {
      fail(`Data safety metadata must set ${key} to false.`);
    }
  }
  if (!String(dataSafety.userDataDeletion || "").includes("clear all entries saved on this device")) {
    fail("Data safety metadata must mention the in-app clear-all entries-saved-on-this-device control.");
  }

  const adsDeclaration = metadata.adsDeclaration || {};
  for (const [key, expected] of [
    ["containsAds", false],
    ["usesAdvertisingId", false],
    ["usesAdSdks", false],
    ["servesAdsToChildren", false],
    ["usesLocationDataForAds", false],
    ["usesAnalyticsForAdsMeasurement", false],
    ["monetizesThroughAds", false],
    ["madeForAdsBehavior", false]
  ]) {
    if (adsDeclaration[key] !== expected) {
      fail(`Ads declaration metadata must set ${key} to ${expected}.`);
    }
  }

  const appAccess = metadata.appAccess || {};
  for (const [key, expected] of [
    ["loginRequired", false],
    ["accountCreationAvailable", false],
    ["specialAccessInstructionsRequired", false],
    ["testAccountCredentialsRequired", false],
    ["paidFeatureGateBlocksReview", false],
    ["networkRequiredForCoreReviewPath", false]
  ]) {
    if (appAccess[key] !== expected) {
      fail(`App access metadata must set ${key} to ${expected}.`);
    }
  }
  if (!String(appAccess.reviewerInstructions || "").includes("No login, account, test credentials, subscription, purchase, or internet access is required")) {
    fail("App access metadata must explain that no login, credentials, purchase, or internet access is required.");
  }

  const targetAudience = metadata.targetAudience || {};
  if (!Array.isArray(targetAudience.targetAgeGroups) || targetAudience.targetAgeGroups.length !== 1 || targetAudience.targetAgeGroups[0] !== "18 and over") {
    fail("Target audience metadata must recommend exactly 18 and over.");
  }
  for (const [key, expected] of [
    ["designedForChildren", false],
    ["includesChildrenInTargetAudience", false],
    ["familiesPolicyApplies", false],
    ["restrictMinorAccessRecommended", true],
    ["neutralAgeScreenRequired", false],
    ["childDirectedMarketing", false],
    ["adsServedToChildren", false],
    ["ownerReviewRequired", true]
  ]) {
    if (targetAudience[key] !== expected) {
      fail(`Target audience metadata must set ${key} to ${expected}.`);
    }
  }
  if (!String(targetAudience.rationale || "").includes("conservative adult-only target audience")) {
    fail("Target audience metadata must explain the conservative adult-only recommendation.");
  }

  const assets = metadata.assets || {};
  if (assets.appIcon !== "store-assets/play/app-icon.png") {
    fail("Play metadata must reference the 512x512 app icon PNG.");
  }
  if (!Array.isArray(assets.phoneScreenshots) || assets.phoneScreenshots.length < 4) {
    fail("Play metadata must reference at least four phone screenshots for app discovery eligibility.");
  }
  if (!Array.isArray(assets.tablet7Screenshots) || assets.tablet7Screenshots.length < 4) {
    fail("Play metadata must reference at least four 7-inch tablet screenshots for large-screen listing readiness.");
  }
  if (!Array.isArray(assets.tablet10Screenshots) || assets.tablet10Screenshots.length < 4) {
    fail("Play metadata must reference at least four 10-inch tablet screenshots for large-screen listing readiness.");
  }
  const requiredAssets = [
    assets.appIcon,
    assets.featureGraphic,
    ...(assets.phoneScreenshots || []),
    ...(assets.tablet7Screenshots || []),
    ...(assets.tablet10Screenshots || []),
    ...(assets.editableSources || [])
  ].filter(Boolean);
  for (const asset of requiredAssets) {
    if (!relativeExists(asset)) {
      fail(`Play metadata references missing asset: ${asset}`);
    }
  }
  const uploadAssets = [
    assets.appIcon,
    assets.featureGraphic,
    ...(assets.phoneScreenshots || []),
    ...(assets.tablet7Screenshots || []),
    ...(assets.tablet10Screenshots || [])
  ].filter(Boolean);
  const assetAltText = metadata.assetAltText || {};
  for (const asset of uploadAssets) {
    const altText = assetAltText[asset];
    if (!altText) {
      fail(`Play metadata must include alt text for upload asset: ${asset}`);
      continue;
    }
    if (altText.length > 140) {
      fail(`Play asset alt text must be 140 characters or fewer for ${asset}; got ${altText.length}.`);
    }
    if (/\b(?:photo|image)\s+of\b/i.test(altText)) {
      fail(`Play asset alt text should not start with generic photo/image wording for ${asset}.`);
    }
  }
  for (const asset of Object.keys(assetAltText)) {
    if (!uploadAssets.includes(asset)) {
      fail(`Play metadata has alt text for a non-upload asset: ${asset}`);
    }
  }

  for (const command of [
    "npm run validate:release",
    "npm run validate:android -- --require-aab",
    "npm run validate:android -- --require-signed"
  ]) {
    if (!metadata.releaseChecks?.includes(command)) {
      fail(`Play metadata releaseChecks must include: ${command}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Store metadata checks passed.");

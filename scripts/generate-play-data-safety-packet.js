const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-data-safety-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");

function requireFile(file, instruction) {
  if (!fs.existsSync(file)) {
    console.error(`${file} is missing. ${instruction}`);
    process.exit(1);
  }
}

function main() {
  requireFile(metadataPath, "Run npm run generate:play-metadata.");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const dataSafety = metadata.dataSafety || {};

  const packet = [
    "# Play Console data safety packet",
    "",
    "This packet is public-safe. It describes the local-only public build and does not include Play Console credentials, keystore paths, signing passwords, Cloudflare tokens, or private account data.",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Privacy policy URL: ${metadata.privacyPolicyUrl}`,
    `- Temporary privacy policy fallback before custom-domain validation: ${metadata.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation}`,
    `- Custom-domain validation command before final Play upload: \`${metadata.customDomainValidationCommand}\``,
    "",
    "## Data collection",
    "",
    `- Data collected: ${dataSafety.dataCollected}`,
    `- Location data collected: ${dataSafety.locationDataCollected ? "Yes" : "No"}`,
    `- Health data collected: ${dataSafety.healthDataCollected ? "Yes" : "No"}`,
    `- Financial info collected: ${dataSafety.financialInfoCollected ? "Yes" : "No"}`,
    `- Contacts collected: ${dataSafety.contactsCollected ? "Yes" : "No"}`,
    `- Photos, videos, audio, or files collected: ${dataSafety.photosVideosAudioFilesCollected ? "Yes" : "No"}`,
    `- Device identifiers collected by app code: ${dataSafety.deviceIdentifiersCollectedByAppCode ? "Yes" : "No"}`,
    `- Advertising ID used: ${dataSafety.advertisingIdUsed ? "Yes" : "No"}`,
    "",
    "## Sharing and security",
    "",
    `- Data shared with third parties: ${dataSafety.dataSharedWithThirdParties ? "Yes" : "No"}`,
    "- Data encrypted in transit: Not applicable for core tracking because the public local-only build does not transmit cycle data.",
    "- Android internet permission: Not requested by the public local-only build.",
    "- Runtime network and analytics scan: no fetch, XMLHttpRequest, WebSocket, analytics, ad, push, cloud sync, or remote API environment path is allowed.",
    "- Data deletion request URL: Not applicable because the app does not create accounts or store server-side user data.",
    `- Account deletion required: ${dataSafety.accountDeletionRequired ? "Yes" : "No"}`,
    `- Account deletion reason: ${dataSafety.accountDeletionReason}`,
    `- User data deletion: ${dataSafety.userDataDeletion}`,
    "- In-app local deletion controls: users can delete one cycle entry or clear all local cycle entries without an account.",
    "",
    "## Owner Play Console answers",
    "",
    "- Does the app collect or share any required user data types? No.",
    "- Does the app use advertising ID? No.",
    "- Does the app create accounts? No.",
    "- Does the app require a data deletion request mechanism? No, because there is no account and no server-side user data.",
    "- Is core cycle tracking usable without network access? Yes.",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-metadata`",
    "- `npm run validate:play-data-safety`",
    "- `npm run validate:local-only-deps`",
    "- `npm run validate:local-only-runtime`",
    "- `npm run validate:android -- --require-aab`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play data safety packet written to ${packetPath}`);
}

main();

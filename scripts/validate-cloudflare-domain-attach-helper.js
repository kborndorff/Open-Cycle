const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-cloudflare-domain-attach-help.ps1");

const requiredText = [
  "OpenCycle Cloudflare custom-domain attach helper",
  "does not read, print, prompt for, or store Cloudflare API tokens",
  "open-cycle",
  "open-cycle.com",
  "www.open-cycle.com",
  "wrangler pages project list",
  "Cloudflare Dashboard",
  "Custom domains",
  "$StepNumber = 5",
  "$StepNumber++",
  "npm run validate:cloudflare-pages-domains:live",
  "npm run validate:custom-domain:live",
  "npm run validate:site:live -- --url=https://open-cycle.com",
  "https://open-cycle.com/privacy",
  "docs/custom-domain-cloudflare.md",
  "docs/cloudflare-pages-domain-diagnostics.md"
];

const forbiddenText = [
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "gh secret set",
  "wrangler pages project create",
  "wrangler pages project delete"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(helperPath)) {
  fail("Missing scripts/print-cloudflare-domain-attach-help.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Cloudflare domain attach helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Cloudflare domain attach helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Cloudflare domain attach helper checks passed.");

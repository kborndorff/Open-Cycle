const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "attach-cloudflare-pages-domains.js");
const packageJsonPath = path.join(root, "package.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(helperPath)) {
  fail("Missing scripts/attach-cloudflare-pages-domains.js.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of [
    "Cloudflare Pages custom-domain API helper",
    "does not print or store Cloudflare API tokens",
    "POST /accounts/{account_id}/pages/projects/{project_name}/domains",
    "CF_ACCOUNT_ID",
    "CF_API_TOKEN",
    "--apply",
    "dry-run",
    "cloudflare-pages-domain-attach-api.json",
    "open-cycle.com",
    "www.open-cycle.com",
    "npm run validate:cloudflare-pages-domains:live",
    "npm run validate:custom-domain:live"
  ]) {
    if (!helper.includes(expected)) {
      fail(`Cloudflare API domain helper is missing expected text: ${expected}`);
    }
  }

  for (const forbidden of [
    "console.log(apiToken",
    "console.error(apiToken",
    "fs.writeFileSync(apiToken",
    "wrangler pages project create",
    "wrangler pages project delete"
  ]) {
    if (helper.includes(forbidden)) {
      fail(`Cloudflare API domain helper must not include: ${forbidden}`);
    }
  }
}

if (!fs.existsSync(packageJsonPath)) {
  fail("Missing package.json.");
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const script of [
    "cloudflare:attach-domains",
    "cloudflare:attach-domains:apply",
    "validate:cloudflare-domain-api-helper"
  ]) {
    if (!packageJson.scripts?.[script]) {
      fail(`Missing package script: ${script}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Cloudflare domain API helper checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "custom-domain-dns-diagnostics.json");
const requiredDomains = ["open-cycle.com", "www.open-cycle.com"];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/custom-domain-dns-diagnostics.json. Run npm run generate:custom-domain-dns.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (!["dns-resolves", "dns-unresolved"].includes(report.status)) {
    fail("Custom-domain DNS diagnostics report has an invalid status.");
  }
  if (report.cloudflarePagesProject !== "open-cycle") {
    fail("Custom-domain DNS diagnostics must reference the open-cycle Pages project.");
  }
  if (report.stablePagesUrl !== "https://open-cycle-site.pages.dev") {
    fail("Custom-domain DNS diagnostics must reference the stable Pages URL.");
  }
  if (report.finalPrivacyPolicyUrl !== "https://open-cycle.com/privacy") {
    fail("Custom-domain DNS diagnostics must reference the final Play privacy URL.");
  }
  if (report.checkedWithoutSecrets !== true) {
    fail("Custom-domain DNS diagnostics must be marked public-safe.");
  }
  for (const domain of requiredDomains) {
    if (!report.domains?.includes(domain)) {
      fail(`Custom-domain DNS diagnostics must include domain: ${domain}`);
    }
    const record = report.records?.find((entry) => entry.domain === domain);
    if (!record) {
      fail(`Custom-domain DNS diagnostics is missing record: ${domain}`);
      continue;
    }
    if (!["resolves", "unresolved"].includes(record.status)) {
      fail(`Custom-domain DNS record has invalid status for ${domain}.`);
    }
    if (!String(record.recommendation || "").includes("Cloudflare Pages") && !String(record.recommendation || "").includes("redirect")) {
      fail(`Custom-domain DNS record is missing owner recommendation for ${domain}.`);
    }
  }
  for (const command of [
    "npm run cloudflare:attach-domains",
    "npm run cloudflare:attach-domains:apply",
    "npm run validate:cloudflare-pages-domains:live",
    "npm run validate:custom-domain:live"
  ]) {
    if (!report.nextCommands?.includes(command)) {
      fail(`Custom-domain DNS diagnostics must include next command: ${command}`);
    }
  }
  const serialized = JSON.stringify(report);
  for (const forbidden of ["CF_API_TOKEN=", "CF_ACCOUNT_ID=", "ANDROID_KEYSTORE_PASSWORD=", "ANDROID_KEY_PASSWORD="]) {
    if (serialized.includes(forbidden)) {
      fail(`Custom-domain DNS diagnostics must not include secret assignment text: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Custom-domain DNS diagnostics checks passed.");

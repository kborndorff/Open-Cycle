const dns = require("node:dns").promises;
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "custom-domain-dns-diagnostics.json");
const domains = ["open-cycle.com", "www.open-cycle.com"];
const requireLive = process.argv.includes("--require-live");

async function resolveRecords(domain) {
  const result = {
    domain,
    status: "pending",
    addresses: [],
    cname: [],
    ns: [],
    errors: []
  };

  try {
    result.addresses = (await dns.lookup(domain, { all: true })).map((record) => ({
      address: record.address,
      family: record.family
    }));
  } catch (error) {
    result.errors.push({
      type: "lookup",
      code: error && error.code ? error.code : "unknown"
    });
  }

  try {
    result.cname = await dns.resolveCname(domain);
  } catch (error) {
    const code = error && error.code ? error.code : "unknown";
    if (!["ENODATA", "ENOTFOUND", "ENODOMAIN"].includes(code)) {
      result.errors.push({ type: "cname", code });
    }
  }

  if (domain === "open-cycle.com") {
    try {
      result.ns = await dns.resolveNs(domain);
    } catch (error) {
      result.errors.push({
        type: "ns",
        code: error && error.code ? error.code : "unknown"
      });
    }
  }

  const hasLookup = result.addresses.length > 0;
  const hasCname = result.cname.length > 0;
  result.status = hasLookup || hasCname ? "resolves" : "unresolved";
  return result;
}

function recommendationFor(record) {
  if (record.status === "resolves") {
    return `Run npm run validate:custom-domain:live after Cloudflare Pages shows ${record.domain} attached and certificate provisioning is complete.`;
  }
  if (record.domain === "open-cycle.com") {
    return "Attach open-cycle.com to the open-cycle-site Cloudflare Pages project, then confirm the apex DNS record is created in Cloudflare DNS.";
  }
  return "Attach www.open-cycle.com to the open-cycle-site Cloudflare Pages project, or configure www as a redirect to https://open-cycle.com.";
}

async function main() {
  const records = await Promise.all(domains.map(resolveRecords));
  const unresolved = records.filter((record) => record.status !== "resolves");
  const report = {
    generatedAt: new Date().toISOString(),
    status: unresolved.length === 0 ? "dns-resolves" : "dns-unresolved",
    domains,
    cloudflarePagesProject: "open-cycle-site",
    stablePagesUrl: "https://open-cycle-site.pages.dev",
    finalPrivacyPolicyUrl: "https://open-cycle.com/privacy",
    checkedWithoutSecrets: true,
    records: records.map((record) => ({
      ...record,
      recommendation: recommendationFor(record)
    })),
    nextCommands: [
      "npm run cloudflare:attach-domains",
      "npm run cloudflare:attach-domains:apply",
      "npm run validate:cloudflare-pages-domains:live",
      "npm run validate:custom-domain:live"
    ]
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Custom-domain DNS diagnostics written to ${reportPath}`);
  console.log(`Status: ${report.status}`);
  for (const record of report.records) {
    console.log(`${record.domain}: ${record.status}`);
    for (const error of record.errors) {
      console.log(`  ${error.type}: ${error.code}`);
    }
  }

  if (requireLive && report.status !== "dns-resolves") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

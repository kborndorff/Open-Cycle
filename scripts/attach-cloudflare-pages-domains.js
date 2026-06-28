const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "cloudflare-pages-domain-attach-api.json");
const apiBase = "https://api.cloudflare.com/client/v4";
const projectName = process.env.CF_PAGES_PROJECT_NAME || "open-cycle-site";
const defaultDomains = ["open-cycle.com", "www.open-cycle.com"];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const domains = args
  .filter((arg) => arg.startsWith("--domain="))
  .map((arg) => arg.slice("--domain=".length).trim())
  .filter(Boolean);
const targetDomains = domains.length > 0 ? domains : defaultDomains;
const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "";

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function endpoint(pathname) {
  return `${apiBase}/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}${pathname}`;
}

async function cloudflareFetch(pathname, options = {}) {
  const response = await fetch(endpoint(pathname), {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

function summarizeError(body) {
  if (!body || !Array.isArray(body.errors)) {
    return "Cloudflare API request failed.";
  }
  return body.errors.map((error) => error.message || error.code || "Unknown Cloudflare API error").join("; ");
}

async function main() {
  console.log("Cloudflare Pages custom-domain API helper");
  console.log("This helper does not print or store Cloudflare API tokens.");

  const report = {
    generatedAt: new Date().toISOString(),
    status: "pending",
    mode: apply ? "apply" : "dry-run",
    projectName,
    targetDomains,
    apiReference: "POST /accounts/{account_id}/pages/projects/{project_name}/domains",
    accountIdPresent: Boolean(accountId),
    apiTokenPresent: Boolean(apiToken),
    results: [],
    failures: []
  };

  if (!apply) {
    report.status = "dry-run";
    report.results = targetDomains.map((domain) => ({
      domain,
      action: "would-attach-if-missing"
    }));
    writeReport(report);
    console.log(`Dry run only. Add --apply with CF_ACCOUNT_ID and CF_API_TOKEN set to attach: ${targetDomains.join(", ")}`);
    console.log(`Report written to ${reportPath}`);
    return;
  }

  if (!accountId || !apiToken) {
    report.status = "missing-credentials";
    report.failures.push("Set CF_ACCOUNT_ID and CF_API_TOKEN in the owner shell before using --apply.");
    writeReport(report);
    console.error("Missing Cloudflare account credentials. Set CF_ACCOUNT_ID and CF_API_TOKEN in the owner shell.");
    process.exit(1);
  }

  const list = await cloudflareFetch("/domains");
  if (!list.response.ok || !list.body?.success) {
    report.status = "fail";
    report.failures.push(`Could not list existing Pages domains: ${summarizeError(list.body)}`);
    writeReport(report);
    console.error(report.failures[0]);
    process.exit(1);
  }

  const existing = new Set((list.body.result || []).map((domain) => domain.name).filter(Boolean));
  for (const domain of targetDomains) {
    if (existing.has(domain)) {
      report.results.push({ domain, action: "already-attached" });
      continue;
    }

    const created = await cloudflareFetch("/domains", {
      method: "POST",
      body: JSON.stringify({ name: domain })
    });

    if (!created.response.ok || !created.body?.success) {
      report.results.push({ domain, action: "attach-failed", statusCode: created.response.status });
      report.failures.push(`${domain}: ${summarizeError(created.body)}`);
      continue;
    }

    report.results.push({
      domain,
      action: "attach-requested",
      status: created.body.result?.status || "unknown"
    });
  }

  report.status = report.failures.length > 0 ? "fail" : "pass";
  writeReport(report);

  if (report.failures.length > 0) {
    console.error(`Cloudflare domain attachment failed for ${report.failures.length} domain(s). Report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`Cloudflare domain attachment requests complete. Report written to ${reportPath}`);
  console.log("After certificate provisioning, run npm run validate:cloudflare-pages-domains:live and npm run validate:custom-domain:live.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

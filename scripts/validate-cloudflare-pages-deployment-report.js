const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "cloudflare-pages-deployment.json");
const requiredProjectName = "open-cycle-site";
const stablePagesUrl = "https://open-cycle-site.pages.dev";
const stablePagesDomain = "open-cycle-site.pages.dev";
const requiredCustomDomains = ["open-cycle.com", "www.open-cycle.com"];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/cloudflare-pages-deployment.json. Run npm run generate:cloudflare-pages-deployment.");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

  if (report.status !== "pass") {
    fail("Cloudflare Pages deployment report status must be pass.");
  }
  if (report.secretSafe !== true || report.publicSafe !== true) {
    fail("Cloudflare Pages deployment report must be public-safe and secret-safe.");
  }
  if (report.privateMaterialIncluded !== false || report.accountIdsIncluded !== false || report.dashboardUrlsIncluded !== false) {
    fail("Cloudflare Pages deployment report must not include private material, account IDs, or dashboard URLs.");
  }
  if (report.projectName !== requiredProjectName || report.project?.name !== requiredProjectName) {
    fail("Cloudflare Pages deployment report must reference the open-cycle-site project.");
  }
  if (report.stablePagesUrl !== stablePagesUrl) {
    fail("Cloudflare Pages deployment report must reference the stable Pages URL.");
  }
  if (!Array.isArray(report.project?.domains) || !report.project.domains.includes(stablePagesDomain)) {
    fail("Cloudflare Pages deployment report must include the stable Pages domain.");
  }
  if (!report.latestDeployment?.deploymentUrl?.startsWith("https://")) {
    fail("Cloudflare Pages deployment report must include the latest HTTPS deployment URL.");
  }
  if (!report.latestDeployment?.deploymentUrl?.includes(`.${stablePagesDomain}`)) {
    fail("Latest deployment URL must be a open-cycle Pages URL.");
  }
  if (!Number.isInteger(report.deploymentCount) || report.deploymentCount < 1) {
    fail("Cloudflare Pages deployment report must include at least one deployment.");
  }
  if (report.liveSiteValidation?.status !== "pass" || report.liveSiteValidation?.validatedStablePagesUrl !== true) {
    fail("Cloudflare Pages deployment report must include passing live-site validation for the stable Pages URL.");
  }
  for (const domain of requiredCustomDomains) {
    if (!report.requiredCustomDomains?.includes(domain)) {
      fail(`Cloudflare Pages deployment report is missing required custom-domain target: ${domain}`);
    }
  }
  if (!["attached", "pending"].includes(report.customDomainStatus)) {
    fail("Cloudflare Pages deployment report customDomainStatus must be attached or pending.");
  }
  if (report.customDomainStatus === "pending") {
    for (const domain of requiredCustomDomains) {
      if (!report.missingCustomDomains?.includes(domain)) {
        fail(`Pending custom-domain status must list missing domain: ${domain}`);
      }
    }
  }
  const allowedPendingFailures = requiredCustomDomains.map((domain) => `Cloudflare Pages project is missing custom domain: ${domain}`);
  const failures = Array.isArray(report.failures) ? report.failures : [];
  const unexpectedFailures = failures.filter((failure) => !allowedPendingFailures.includes(failure));
  if (unexpectedFailures.length > 0) {
    fail(`Cloudflare Pages deployment report has unexpected failures: ${unexpectedFailures.join("; ")}`);
  }

  const text = JSON.stringify(report);
  for (const forbidden of [
    "CF_API_TOKEN",
    "CF_ACCOUNT_ID",
    "dash.cloudflare.com/",
    "-----BEGIN",
    "ANDROID_KEYSTORE_PASSWORD",
    "GOOGLE_APPLICATION_CREDENTIALS"
  ]) {
    if (text.includes(forbidden)) {
      fail(`Cloudflare Pages deployment report contains forbidden private marker: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Cloudflare Pages deployment report checks passed.");

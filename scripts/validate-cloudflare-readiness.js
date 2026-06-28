const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "cloudflare-readiness.json");

const files = {
  siteDist: path.join(root, "site", "dist"),
  index: path.join(root, "site", "dist", "index.html"),
  privacy: path.join(root, "site", "dist", "privacy.html"),
  headers: path.join(root, "site", "dist", "_headers"),
  redirects: path.join(root, "site", "dist", "_redirects"),
  wranglerConfig: path.join(root, "wrangler.toml"),
  deployWorkflow: path.join(root, ".github", "workflows", "deploy-site.yml"),
  deploymentSecrets: path.join(root, "docs", "deployment-secrets.md"),
  customDomainDocs: path.join(root, "docs", "custom-domain-cloudflare.md"),
  githubWebFallback: path.join(root, "docs", "github-web-publication.md"),
  liveSiteValidator: path.join(root, "scripts", "validate-live-site.js"),
  siteValidator: path.join(root, "scripts", "validate-site-dist.js")
};

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fileInfo(file) {
  if (!fs.existsSync(file)) {
    return { exists: false };
  }
  const stat = fs.statSync(file);
  return { exists: true, bytes: stat.size };
}

function check(condition, passDetail, failDetail) {
  return condition ? { status: "pass", detail: passDetail } : { status: "fail", detail: failDetail };
}

const deployWorkflow = fs.existsSync(files.deployWorkflow) ? read(files.deployWorkflow) : "";
const deploymentSecrets = fs.existsSync(files.deploymentSecrets) ? read(files.deploymentSecrets) : "";
const customDomainDocs = fs.existsSync(files.customDomainDocs) ? read(files.customDomainDocs) : "";
const githubWebFallback = fs.existsSync(files.githubWebFallback) ? read(files.githubWebFallback) : "";
const index = fs.existsSync(files.index) ? read(files.index) : "";
const privacy = fs.existsSync(files.privacy) ? read(files.privacy) : "";
const headers = fs.existsSync(files.headers) ? read(files.headers) : "";
const redirects = fs.existsSync(files.redirects) ? read(files.redirects) : "";
const wranglerConfig = fs.existsSync(files.wranglerConfig) ? read(files.wranglerConfig) : "";

const checks = {
  siteDist: check(fs.existsSync(files.siteDist), "site/dist exists.", "Run npm run build:site."),
  publicSiteFiles: check(
    [files.index, files.privacy, files.headers, files.redirects].every((file) => fs.existsSync(file)),
    "Required Cloudflare Pages files exist in site/dist.",
    "site/dist is missing required Pages files."
  ),
  publicSiteContent: check(
    index.includes("https://github.com/kborndorff/open-cycle-source") &&
      privacy.includes("does not collect, sell, share, transmit, or monetize personal data") &&
      headers.includes("X-Frame-Options") &&
      redirects.includes("/features /open-cycle.html?next=/features 302"),
    "Built site contains source link, privacy statement, security headers, and gentle redirects.",
    "Built site is missing required public-safe content."
  ),
  deployWorkflow: check(
    deployWorkflow.includes("cloudflare/wrangler-action@v3") &&
      deployWorkflow.includes("pages deploy site/dist") &&
      deployWorkflow.includes("secrets.CF_API_TOKEN") &&
      deployWorkflow.includes("secrets.CF_ACCOUNT_ID") &&
      deployWorkflow.includes("npm run validate:site:live"),
    "GitHub workflow deploys site/dist through Cloudflare Pages and validates the live site.",
    "Deploy workflow is missing Cloudflare Pages or live-site validation wiring."
  ),
  localWranglerConfig: check(
    wranglerConfig.includes('name = "open-cycle-site"') &&
      wranglerConfig.includes('pages_build_output_dir = "site/dist"') &&
      deploymentSecrets.includes("npm run deploy:site:local") &&
      deploymentSecrets.includes("npm run deploy:site:local:npx"),
    "Root Wrangler config and local deploy commands point at site/dist.",
    "Local Wrangler Pages deploy config is missing or incomplete."
  ),
  secretDocs: check(
    deploymentSecrets.includes("npm run github:setup-deploy-secrets") &&
      deploymentSecrets.includes("npm run github:setup-deploy-secrets -- -DryRun") &&
      deploymentSecrets.includes("docs/custom-domain-cloudflare.md") &&
      deploymentSecrets.includes("CF_API_TOKEN") &&
      deploymentSecrets.includes("CF_ACCOUNT_ID") &&
      deploymentSecrets.includes("Do not commit Cloudflare API tokens"),
    "Deployment secrets documentation explains prompt-only Cloudflare setup.",
    "Deployment secrets documentation is incomplete."
  ),
  customDomainDocs: check(
    customDomainDocs.includes("https://open-cycle.com") &&
      customDomainDocs.includes("open-cycle") &&
      customDomainDocs.includes("npm run validate:site:live -- --url=https://open-cycle.com") &&
      customDomainDocs.includes("Keep DNS API tokens"),
    "Custom domain documentation covers open-cycle.com setup without exposing secrets.",
    "Custom domain documentation is incomplete."
  ),
  webFallbackDocs: check(
    githubWebFallback.includes("settings/secrets/actions") &&
      githubWebFallback.includes("CF_API_TOKEN") &&
      githubWebFallback.includes("CF_ACCOUNT_ID") &&
      githubWebFallback.includes("settings/variables/actions"),
    "GitHub web fallback documents secret and variable setup without exposing values.",
    "GitHub web fallback documentation is incomplete."
  ),
  validators: check(
    fs.existsSync(files.siteValidator) &&
      fs.existsSync(files.liveSiteValidator),
    "Local and live site validators exist.",
    "Site validators are missing."
  )
};

const failedChecks = Object.entries(checks)
  .filter(([, result]) => result.status !== "pass")
  .map(([name]) => name);

const report = {
  generatedAt: new Date().toISOString(),
  status: failedChecks.length === 0 ? "ready-for-cloudflare-secrets" : "needs-cloudflare-prep",
  secretSafe: true,
  note: "This report checks Cloudflare deployment readiness without reading or printing Cloudflare tokens or account IDs.",
  liveSiteUrl: "https://open-cycle-site.pages.dev",
  failedChecks,
  checks,
  artifacts: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, fileInfo(file)])),
  privateRemaining: [
    "Set CF_API_TOKEN and CF_ACCOUNT_ID as GitHub Actions secrets.",
    "Set CF_PAGES_PROJECT_NAME if a non-default Pages project is used.",
    "Push to the public repository and wait for the Pages workflow.",
    "Run npm run validate:site:live -- --url=https://open-cycle-site.pages.dev after deployment."
  ]
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Cloudflare readiness report written to ${reportPath}`);
console.log(`Status: ${report.status}`);
if (failedChecks.length > 0) {
  console.error(`Failed checks: ${failedChecks.join(", ")}`);
  process.exit(1);
}

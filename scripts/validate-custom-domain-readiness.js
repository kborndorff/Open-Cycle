const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "custom-domain-readiness.json");

const files = {
  customDomainDocs: path.join(root, "docs", "custom-domain-cloudflare.md"),
  deployWorkflow: path.join(root, ".github", "workflows", "deploy-site.yml"),
  liveSiteValidator: path.join(root, "scripts", "validate-live-site.js"),
  deploymentSecrets: path.join(root, "docs", "deployment-secrets.md"),
  ownerChecklist: path.join(root, "docs", "release-owner-checklist.md")
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

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

const customDomainDocs = fs.existsSync(files.customDomainDocs) ? read(files.customDomainDocs) : "";
const deployWorkflow = fs.existsSync(files.deployWorkflow) ? read(files.deployWorkflow) : "";
const liveSiteValidator = fs.existsSync(files.liveSiteValidator) ? read(files.liveSiteValidator) : "";
const deploymentSecrets = fs.existsSync(files.deploymentSecrets) ? read(files.deploymentSecrets) : "";
const ownerChecklist = fs.existsSync(files.ownerChecklist) ? read(files.ownerChecklist) : "";

const checks = {
  docsExist: check(
    fs.existsSync(files.customDomainDocs),
    "Custom domain guide exists.",
    "Missing docs/custom-domain-cloudflare.md."
  ),
  domainTargets: check(
    customDomainDocs.includes("https://open-cycle.com") &&
      customDomainDocs.includes("https://www.open-cycle.com") &&
      customDomainDocs.includes("open-cycle-site") &&
      customDomainDocs.includes("site/dist"),
    "Custom domain guide names the primary host, www alias, Pages project, and build output.",
    "Custom domain guide is missing required target details."
  ),
  secretBoundary: check(
    includesNormalized(customDomainDocs, "Keep DNS API tokens") &&
      includesNormalized(customDomainDocs, "registrar access out of GitHub") &&
      includesNormalized(customDomainDocs, "npm run github:setup-deploy-secrets -- -DryRun"),
    "Custom domain guide keeps DNS and Cloudflare secrets owner-side.",
    "Custom domain guide is missing secret-boundary guidance."
  ),
  liveValidation: check(
      includesNormalized(customDomainDocs, "npm run validate:site:live -- --url=https://open-cycle.com") &&
      includesNormalized(customDomainDocs, "npm run validate:site:live -- --url=https://www.open-cycle.com") &&
      includesNormalized(customDomainDocs, "npm run validate:custom-domain:live") &&
      liveSiteValidator.includes("Live site checks passed"),
    "Custom domain guide points owners at the live-site validator.",
    "Custom domain guide is missing custom-domain validation commands."
  ),
  pagesWorkflow: check(
    deployWorkflow.includes("pages deploy site/dist") &&
      deployWorkflow.includes("cloudflare/wrangler-action@v3") &&
      deployWorkflow.includes("secrets.CF_API_TOKEN") &&
      deployWorkflow.includes("secrets.CF_ACCOUNT_ID"),
    "Cloudflare Pages workflow deploys site/dist with GitHub secrets.",
    "Cloudflare Pages workflow is missing required deployment wiring."
  ),
  ownerDocsLinked: check(
    deploymentSecrets.includes("docs/custom-domain-cloudflare.md") &&
      ownerChecklist.includes("docs/custom-domain-cloudflare.md"),
    "Owner release docs link to the custom domain guide.",
    "Owner release docs do not link to the custom domain guide."
  )
};

const failedChecks = Object.entries(checks)
  .filter(([, result]) => result.status !== "pass")
  .map(([name]) => name);

const report = {
  generatedAt: new Date().toISOString(),
  status: failedChecks.length === 0 ? "ready-for-owner-domain-setup" : "needs-custom-domain-prep",
  secretSafe: true,
  networkUsed: false,
  gitUsed: false,
  liveSiteUrl: "https://open-cycle.com",
  pagesProject: "open-cycle-site",
  note: "This report checks public-safe custom-domain readiness only. It does not read DNS records, Cloudflare credentials, API tokens, or registrar credentials.",
  failedChecks,
  checks,
  artifacts: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, fileInfo(file)])),
  privateRemaining: [
    "Attach open-cycle.com to the Cloudflare Pages project from the Cloudflare account.",
    "Optionally attach www.open-cycle.com and redirect it to the primary host.",
    "Run npm run validate:site:live -- --url=https://open-cycle.com after certificate provisioning.",
    "Use https://open-cycle.com/privacy as the Play Console privacy URL after the custom domain is live."
  ]
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Custom domain readiness report written to ${reportPath}`);
console.log(`Status: ${report.status}`);
if (failedChecks.length > 0) {
  console.error(`Failed checks: ${failedChecks.join(", ")}`);
  process.exit(1);
}

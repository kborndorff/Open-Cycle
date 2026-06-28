const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "workflow-provenance.json");

const workflows = [
  {
    file: ".github/workflows/ci.yml",
    name: "OpenCycle Local CI",
    purpose: "Validate the public proof/product repository and static site without secrets.",
    required: [
      "permissions:",
      "contents: read",
      "npm run validate:proof-product-repository",
      "npm run build:site",
      "npm run validate:site"
    ],
    allowedSecrets: [],
    forbidden: ["secrets.", "ANDROID_KEYSTORE_PASSWORD", "CF_API_TOKEN", "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"]
  },
  {
    file: ".github/workflows/android-aab.yml",
    name: "Android AAB Check",
    purpose: "Validate public Play Console and Android evidence only.",
    required: [
      "permissions:",
      "contents: read",
      "Validate public Play evidence",
      "npm run validate:proof-product-repository"
    ],
    allowedSecrets: [],
    forbidden: [
      "ANDROID_KEYSTORE_BASE64",
      "ANDROID_KEYSTORE_PASSWORD",
      "ANDROID_KEY_ALIAS",
      "ANDROID_KEY_PASSWORD",
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
      "mobile:sign:aab",
      "apps/mobile/android/gradlew",
      "actions/upload-artifact@v4",
      "validate:play-store-public",
      "app-release-signed.aab",
      "open-cycle-signed-aab",
      "r0adkll/upload-google-play",
      "CF_API_TOKEN"
    ]
  },
  {
    file: ".github/workflows/deploy-site.yml",
    name: "Deploy Site to Cloudflare Pages",
    purpose: "Build, validate, and deploy site/dist to Cloudflare Pages.",
    required: [
      "workflow_dispatch:",
      "permissions:",
      "contents: read",
      "npm run build:site",
      "npm run validate:site",
      "npm run validate:custom-domain:live",
      "cloudflare/wrangler-action@v3",
      "secrets.CF_API_TOKEN",
      "secrets.CF_ACCOUNT_ID",
      "pages deploy site/dist",
      "open-cycle-site",
      "Skip deploy without Cloudflare secrets"
    ],
    allowedSecrets: ["CF_API_TOKEN", "CF_ACCOUNT_ID"],
    forbidden: [
      "ANDROID_KEYSTORE_BASE64",
      "ANDROID_KEYSTORE_PASSWORD",
      "ANDROID_KEY_ALIAS",
      "ANDROID_KEY_PASSWORD",
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
      "mobile:sign:aab",
      "app-release-signed.aab",
      "r0adkll/upload-google-play"
    ]
  },
  {
    file: ".github/workflows/deploy-redirect-worker.yml",
    name: "Deploy Legacy Redirect Worker to Cloudflare",
    purpose: "Deploy the optional legacy-domain redirect worker through Cloudflare.",
    required: [
      "workflow_dispatch:",
      "permissions:",
      "contents: read",
      "cloudflare/wrangler-action@v3",
      "secrets.CF_API_TOKEN",
      "secrets.CF_ACCOUNT_ID",
      "deploy deploy/cloudflare/redirect-worker.js"
    ],
    allowedSecrets: ["CF_API_TOKEN", "CF_ACCOUNT_ID"],
    forbidden: [
      "ANDROID_KEYSTORE_BASE64",
      "ANDROID_KEYSTORE_PASSWORD",
      "ANDROID_KEY_ALIAS",
      "ANDROID_KEY_PASSWORD",
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
      "mobile:sign:aab",
      "r0adkll/upload-google-play",
      "wrangler deploy deploy/cloudflare/redirect-worker.js"
    ]
  }
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function evaluateWorkflow(workflow) {
  const contents = read(workflow.file);
  const requiredChecks = workflow.required.map((value) => ({
    value,
    present: contents.includes(value)
  }));
  const forbiddenChecks = workflow.forbidden.map((value) => ({
    value,
    absent: !contents.includes(value)
  }));
  const checkoutPresent = contents.includes("actions/checkout@v4");
  const contentsReadOnly = contents.includes("permissions:") && contents.includes("contents: read");
  const passed =
    requiredChecks.every((check) => check.present) &&
    forbiddenChecks.every((check) => check.absent) &&
    checkoutPresent &&
    contentsReadOnly;

  return {
    file: workflow.file,
    name: workflow.name,
    purpose: workflow.purpose,
    status: passed ? "pass" : "fail",
    permissions: {
      contentsReadOnly
    },
    checkoutPresent,
    allowedSecrets: workflow.allowedSecrets,
    requiredChecks,
    forbiddenChecks
  };
}

function main() {
  const workflowReports = workflows.map(evaluateWorkflow);
  const failures = workflowReports
    .filter((workflow) => workflow.status !== "pass")
    .map((workflow) => workflow.file);

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    signedArtifactsPublished: false,
    playUploadAutomation: false,
    siteDeploySource: "site/dist",
    validationCommands: [
      "npm run generate:workflow-provenance",
      "npm run validate:workflow-provenance",
      "npm run validate:workflows"
    ],
    workflows: workflowReports,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Workflow provenance failed. Report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`Workflow provenance report written to ${reportPath}`);
}

main();

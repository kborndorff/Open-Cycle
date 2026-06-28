const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const jsonPath = path.join(reportsDir, "release-blocker-report.json");
const mdPath = path.join(reportsDir, "release-blocker-report.md");

const expectedOwnerOnlyGates = [
  "liveCloudflarePagesDomainAttachment",
  "liveCustomDomainPublication",
  "liveGithubPublication",
  "liveGithubActions",
  "signedAab",
  "signedRuntimeQa",
  "playConsoleUpload"
];

const alwaysRequiredCommands = [
  "npm run release:support-now",
  "npm run validate:play-store-complete"
];

const commandsByGate = {
  liveCloudflarePagesDomainAttachment: [
    "npm run owner-tools:cloudflare-domain-help",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run generate:custom-domain-dns",
    "npm run validate:custom-domain-dns",
    "npm run cloudflare:attach-domains",
    "npm run cloudflare:attach-domains:apply",
    "npm run validate:cloudflare-pages-domains:live"
  ],
  liveCustomDomainPublication: [
    "npm run owner-tools:cloudflare-domain-help",
    "npm run generate:cloudflare-pages-deployment",
    "npm run validate:cloudflare-pages-deployment",
    "npm run generate:custom-domain-dns",
    "npm run validate:custom-domain-dns",
    "npm run cloudflare:attach-domains",
    "npm run cloudflare:attach-domains:apply",
    "npm run validate:custom-domain:live"
  ],
  liveGithubPublication: [
    "npm run owner-tools:publish-help",
    "npm run validate:github:live"
  ],
  liveGithubActions: [
    "npm run owner-tools:publish-help",
    "npm run validate:github:actions"
  ],
  signedAab: [
    "npm run owner-tools:android-signing-help",
    "npm run mobile:signed-aab:evidence -- --require-signed"
  ],
  signedRuntimeQa: [
    "npm run owner-tools:runtime-qa-help",
    "npm run mobile:signed-aab:evidence -- --require-signed",
    "npm run validate:android -- --require-signed",
    "npm run generate:signed-runtime-qa-preflight",
    "npm run validate:signed-runtime-qa-preflight",
    "npm run validate:runtime-qa-report -- --require-complete"
  ],
  playConsoleUpload: [
    "npm run owner-tools:play-upload-help",
    "npm run validate:play-upload-confirmation -- --require-complete"
  ]
};

const forbiddenText = [
  "CF_API_TOKEN=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "BEGIN PRIVATE KEY",
  "BEGIN RSA PRIVATE KEY",
  "github_pat_",
  "ghp_"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(auditPath)) {
  fail(`Missing final release audit: ${auditPath}`);
} else if (!fs.existsSync(jsonPath)) {
  fail(`Missing release blocker report JSON: ${jsonPath}`);
} else if (!fs.existsSync(mdPath)) {
  fail(`Missing release blocker report Markdown: ${mdPath}`);
} else {
  const audit = readJson(auditPath);
  const report = readJson(jsonPath);
  const md = fs.readFileSync(mdPath, "utf8");

  const pending = Array.isArray(audit.pendingChecks)
    ? audit.pendingChecks.filter((id) => id !== "releaseBlockerReport")
    : [];
  if (report.blockerCount !== pending.length) {
    fail(`Blocker count ${report.blockerCount} does not match audit pending count ${pending.length}.`);
  }

  for (const gate of pending) {
    if (!report.blockers.some((blocker) => blocker.id === gate)) {
      fail(`Blocker report is missing pending audit gate: ${gate}`);
    }
    if (!md.includes(gate)) {
      fail(`Blocker report Markdown is missing pending audit gate: ${gate}`);
    }
  }

  for (const gate of expectedOwnerOnlyGates) {
    if (pending.includes(gate) && !report.blockers.some((blocker) => blocker.id === gate)) {
      fail(`Owner-only gate is pending but missing from blocker report: ${gate}`);
    }
  }

  const requiredCommands = [
    ...alwaysRequiredCommands,
    ...pending.flatMap((gate) => commandsByGate[gate] || [])
  ];

  for (const command of [...new Set(requiredCommands)]) {
    if (!md.includes(command) && !JSON.stringify(report.safeSequence || []).includes(command)) {
      fail(`Blocker report is missing required command: ${command}`);
    }
  }

  const combined = `${JSON.stringify(report)}\n${md}`;
  if (combined.includes("Pages project open-cycle.") || combined.includes("Pages project open-cycle,")) {
    fail("Blocker report must reference the open-cycle-site Pages project, not open-cycle.");
  }
  for (const text of forbiddenText) {
    if (combined.includes(text)) {
      fail(`Blocker report includes forbidden secret marker: ${text}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Release blocker report checks passed.");

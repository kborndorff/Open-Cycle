const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "release-evidence-index.md");

const evidence = [
  {
    area: "Overall release state",
    file: "reports/final-release-audit.json",
    command: "npm run release:audit",
    purpose: "Machine-readable completion audit for public, website, Android, and Play Store readiness."
  },
  {
    area: "Overall release state",
    file: "reports/release-completion-matrix.md",
    command: "npm run generate:release-completion-matrix && npm run validate:release-completion-matrix",
    purpose: "Human-readable completion proof matrix that maps mobile, website, public GitHub, security/privacy, and Play Store gates to concrete evidence."
  },
  {
    area: "Overall release state",
    file: "reports/release-blocker-report.md",
    command: "npm run generate:release-blockers && npm run validate:release-blockers",
    purpose: "Compact owner-only go/no-go blocker report with exact helper and proof commands for the remaining release gates."
  },
  {
    area: "Overall release state",
    file: "reports/release-status.json",
    command: "npm run release:status",
    purpose: "Current release phase summary and pending owner-side actions."
  },
  {
    area: "Public repository safety",
    file: "reports/public-push-readiness.json",
    command: "npm run validate:public-push",
    purpose: "Evidence that the repository is ready for public GitHub visibility without generated/private artifacts."
  },
  {
    area: "Public repository safety",
    file: "reports/public-repository-publication-manifest.md",
    command: "npm run generate:public-repo-manifest && npm run validate:public-repo-manifest",
    purpose: "Public-safe manifest of files intended for GitHub publication and private release material that must stay out of the repo."
  },
  {
    area: "Public repository safety",
    file: "reports/release-artifact-hygiene.json",
    command: "npm run validate:release-artifacts",
    purpose: "Evidence that build outputs, signed files, and private release artifacts are kept out of public source."
  },
  {
    area: "Public repository safety",
    file: "reports/public-artifact-policy.json",
    command: "npm run validate:public-artifacts",
    purpose: "Evidence that public automation can expose unsigned AAB evidence only, not signed artifacts or secrets."
  },
  {
    area: "Local-only privacy",
    file: "reports/local-only-runtime.json",
    command: "npm run validate:local-only-runtime",
    purpose: "Evidence that the shipped web/mobile runtime does not use remote APIs, analytics, ads, push, or cloud sync."
  },
  {
    area: "Local-only privacy",
    file: "reports/privacy-parity.json",
    command: "npm run generate:privacy-parity && npm run validate:privacy-parity",
    purpose: "Evidence that app, website, Android manifest, and Play Store privacy claims agree."
  },
  {
    area: "Function coverage",
    file: "reports/function-coverage.json",
    command: "npm run validate:functions",
    purpose: "Traceability between app functions, public docs, and validation coverage."
  },
  {
    area: "GitHub workflows",
    file: "reports/workflow-provenance.json",
    command: "npm run generate:workflow-provenance && npm run validate:workflow-provenance",
    purpose: "Evidence that public GitHub workflows use read-only source permissions, deploy site/dist, and avoid signing or Play upload automation."
  },
  {
    area: "Website publication",
    file: "reports/live-site-publication.json",
    command: "npm run validate:site:live -- --url=https://open-cycle-site.pages.dev",
    purpose: "Live Cloudflare Pages validation for privacy/license/source links and no tracking."
  },
  {
    area: "Website publication",
    file: "reports/cloudflare-pages-deployment.json",
    command: "npm run generate:cloudflare-pages-deployment && npm run validate:cloudflare-pages-deployment",
    purpose: "Wrangler-backed Cloudflare Pages deployment evidence for the latest Pages preview URL, stable Pages domain, and current custom-domain attachment status."
  },
  {
    area: "Website publication",
    file: "reports/cloudflare-pages-domain-attach-api.json",
    command: "npm run cloudflare:attach-domains",
    purpose: "Public-safe Cloudflare Pages custom-domain API helper dry-run showing target domains and whether owner credentials are present without printing token values.",
    pendingAllowed: true
  },
  {
    area: "Website publication",
    file: "reports/cloudflare-pages-domain-attachment.json",
    command: "npm run validate:cloudflare-pages-domains:live",
    purpose: "Live evidence for whether open-cycle.com and www.open-cycle.com are attached to the Pages project.",
    pendingAllowed: true
  },
  {
    area: "Website publication",
    file: "reports/live-custom-domain-publication.json",
    command: "npm run validate:custom-domain:live",
    purpose: "Live custom-domain validation for open-cycle.com after Cloudflare domain attachment.",
    pendingAllowed: true
  },
  {
    area: "GitHub publication",
    file: "reports/live-github-publication.json",
    command: "npm run validate:github:live",
    purpose: "Live GitHub repository validation after the public push.",
    pendingAllowed: true
  },
  {
    area: "GitHub publication",
    file: "reports/live-github-actions.json",
    command: "npm run validate:github:actions",
    purpose: "Live GitHub Actions workflow validation after the public push.",
    pendingAllowed: true
  },
  {
    area: "Android public build",
    file: "reports/unsigned-aab-evidence.json",
    command: "npm run mobile:unsigned-aab:evidence -- --require-aab",
    purpose: "Unsigned Android App Bundle path, hash, and size for public-safe build verification."
  },
  {
    area: "Android public build",
    file: "reports/android-permissions.json",
    command: "npm run generate:android-permissions && npm run validate:android-permissions",
    purpose: "Evidence that the public Android manifest requests zero permissions, omits internet access, disables backup, and matches Play identity."
  },
  {
    area: "Visual QA",
    file: "reports/visual-test-report.json",
    command: "npm run test:visual && npm run validate:visual-test-report",
    purpose: "Machine-readable Playwright visual run report for desktop and phone website/app screenshots."
  },
  {
    area: "Visual QA",
    file: "reports/visual-evidence-manifest.json",
    command: "npm run generate:visual-evidence && npm run validate:visual-evidence",
    purpose: "Machine-readable manifest of website, app, Android emulator, and Play Store graphic evidence with PNG dimensions, byte sizes, and SHA-256 hashes."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-data-safety-packet.md",
    command: "npm run generate:play-data-safety && npm run validate:play-data-safety",
    purpose: "Owner-facing Play Data safety answers proving truly local, no collection, and no sharing."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-content-rating-packet.md",
    command: "npm run generate:play-content-rating && npm run validate:play-content-rating",
    purpose: "Owner-facing Play content rating and app content answers for no ads, no account, no UGC, no location, and wellness-not-medical posture."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-health-declaration-packet.md",
    command: "npm run generate:play-health-declaration && npm run validate:play-health-declaration",
    purpose: "Owner-facing Play Health Apps declaration answers for Period Tracking, no medical device claims, no Health Connect, no health permissions, and disclaimer posture."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-app-access-packet.md",
    command: "npm run generate:play-app-access && npm run validate:play-app-access",
    purpose: "Owner-facing Play App access answers proving no login, account, test credentials, paid gate, or network access is required for review."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-ads-declaration-packet.md",
    command: "npm run generate:play-ads-declaration && npm run validate:play-ads-declaration",
    purpose: "Owner-facing Play ads declaration answers proving no ads, no ad SDKs, no Advertising ID, and no ad monetization."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-target-audience-packet.md",
    command: "npm run generate:play-target-audience && npm run validate:play-target-audience",
    purpose: "Owner-facing Play target audience and children declaration answers for adult-only target audience, no child-directed marketing, and no Families ads posture."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-testing-rollout-packet.md",
    command: "npm run generate:play-testing-rollout && npm run validate:play-testing-rollout",
    purpose: "Owner-facing Play testing and production-access plan for internal testing, closed testing, tester feedback, and rollout readiness without tester identifiers."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-app-content-packet.md",
    command: "npm run generate:play-app-content && npm run validate:play-app-content",
    purpose: "Aggregate owner-facing Play App content declaration index for Data safety, App access, Ads, Health, Target audience, Content rating, and Testing."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-release-candidate-packet.md",
    command: "npm run generate:play-release-candidate && npm run validate:play-release-candidate",
    purpose: "Public-safe release-candidate packet tying together Play version identity, release notes, unsigned AAB evidence, preflight status, and private signed-AAB boundary."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-console-upload-packet.md",
    command: "npm run generate:play-console-packet && npm run validate:play-console-packet",
    purpose: "Play Console upload packet assembled from public-safe release evidence."
  },
  {
    area: "Play Store preparation",
    file: "reports/play-console-field-map.md",
    command: "npm run generate:play-console-field-map && npm run validate:play-console-field-map",
    purpose: "Field-by-field Play Console upload map for listing text, graphics, declarations, and private upload boundaries."
  },
  {
    area: "GitHub publication",
    file: "reports/github-publication-packet.md",
    command: "npm run generate:github-publication-packet && npm run validate:github-publication-packet",
    purpose: "Public GitHub publication packet and checklist."
  },
  {
    area: "Owner handoff",
    file: "reports/owner-action-packet.md",
    command: "npm run generate:owner-action-packet && npm run validate:owner-action-packet",
    purpose: "Account-side action packet for Cloudflare, GitHub secrets, signing, and Play Console work."
  },
  {
    area: "Private Android signing",
    file: "reports/android-signing-handoff-packet.md",
    command: "npm run generate:android-signing-handoff && npm run validate:android-signing-handoff",
    purpose: "Public-safe handoff for private Android signing, signed evidence, and runtime QA boundaries.",
    pendingAllowed: true,
    privatePhase: true
  },
  {
    area: "Private Play upload",
    file: "reports/play-production-readiness-packet.md",
    command: "npm run generate:play-production-readiness && npm run validate:play-production-readiness",
    purpose: "Public-safe production readiness summary separating public-ready evidence from private signing, runtime QA, and Play upload confirmation.",
    pendingAllowed: true,
    privatePhase: true
  },
  {
    area: "Private Android signing",
    file: "reports/signed-runtime-qa-preflight.json",
    command: "npm run generate:signed-runtime-qa-preflight && npm run validate:signed-runtime-qa-preflight",
    purpose: "Public-safe signed runtime QA preflight proving signed AAB evidence and local install-tooling readiness without storing secrets or signed artifacts.",
    pendingAllowed: true,
    privatePhase: true
  },
  {
    area: "Private Android signing",
    file: "reports/runtime-qa-report.md",
    command: "npm run generate:runtime-qa-report && npm run validate:runtime-qa-report",
    purpose: "Signed runtime QA template/status. Complete mode is private and owner-controlled.",
    pendingAllowed: true
  },
  {
    area: "Private Android signing",
    file: "reports/signed-aab-evidence.json",
    command: "npm run mobile:signed-aab:evidence -- --require-signed",
    purpose: "Private signed AAB hash and size evidence. This remains owner-side and is not a public artifact.",
    pendingAllowed: true,
    privatePhase: true
  },
  {
    area: "Private Play upload",
    file: "reports/play-console-upload-confirmation.json",
    command: "npm run generate:play-upload-confirmation && npm run validate:play-upload-confirmation",
    purpose: "Owner-filled Play Console upload confirmation. Complete mode stays private/account-side.",
    pendingAllowed: true,
    privatePhase: true
  }
];

function fileStatus(relativePath) {
  return fs.existsSync(path.join(root, relativePath)) ? "present" : "pending";
}

function buildMarkdown() {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# OpenCycle release evidence index",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This index is public-safe by design. It points reviewers to release evidence and validation commands without storing credentials, keystores, service-account JSON, Cloudflare tokens, or signed release artifacts.",
    "",
    "The `reports/` directory is intentionally ignored by Git. Regenerate these files locally or in trusted automation when fresh evidence is needed.",
    "",
    "## Validation command",
    "",
    "```powershell",
    "npm run generate:release-evidence-index",
    "npm run validate:release-evidence-index",
    "```",
    "",
    "## Evidence",
    "",
    "| Area | Evidence file | Status | Command | Purpose |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const item of evidence) {
    const status = fileStatus(item.file);
    const statusText = item.privatePhase
      ? status === "present"
        ? "present/private owner-side"
        : "pending/private owner-side"
      : status === "present"
        ? "present"
        : item.pendingAllowed
          ? "pending/owner-side"
          : "pending";
    lines.push(`| ${item.area} | \`${item.file}\` | ${statusText} | \`${item.command}\` | ${item.purpose} |`);
  }

  lines.push(
    "",
    "## Public/private boundary",
    "",
    "- Public-safe evidence may include source checks, generated public reports, live site validation, and unsigned AAB evidence.",
    "- Private owner-side evidence may include signed AAB hashes, runtime QA completion, and Play Console upload confirmation.",
    "- Never paste or commit secret values, upload keystores, keystore passwords, Play service-account JSON, Cloudflare tokens, or signed AAB files.",
    "- Public GitHub Actions should validate or publish unsigned build evidence only."
  );

  return `${lines.join("\n")}\n`;
}

function main() {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, buildMarkdown(), "utf8");
  console.log(`Release evidence index written to ${reportPath}`);
}

main();

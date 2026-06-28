const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const jsonOutPath = path.join(reportsDir, "release-blocker-report.json");
const mdOutPath = path.join(reportsDir, "release-blocker-report.md");

const BLOCKER_GUIDANCE = {
  liveCloudflarePagesDomainAttachment: {
    area: "Website",
    ownerAction: "Attach open-cycle.com and www.open-cycle.com to the Cloudflare Pages project open-cycle-site.",
    helper: "npm run owner-tools:cloudflare-domain-help",
    prepCommands: [
      "npm run generate:cloudflare-pages-deployment",
      "npm run validate:cloudflare-pages-deployment",
      "npm run generate:custom-domain-dns",
      "npm run validate:custom-domain-dns",
      "npm run cloudflare:attach-domains",
      "npm run cloudflare:attach-domains:apply"
    ],
    proofCommand: "npm run validate:cloudflare-pages-domains:live",
    privateMaterial: "Cloudflare account access only; do not paste API tokens into chat, files, command history, or GitHub."
  },
  liveCustomDomainPublication: {
    area: "Website",
    ownerAction: "Validate the public custom domain after Cloudflare provisions the Pages domain attachment.",
    helper: "npm run owner-tools:cloudflare-domain-help",
    prepCommands: [
      "npm run generate:cloudflare-pages-deployment",
      "npm run validate:cloudflare-pages-deployment",
      "npm run generate:custom-domain-dns",
      "npm run validate:custom-domain-dns",
      "npm run cloudflare:attach-domains",
      "npm run cloudflare:attach-domains:apply"
    ],
    proofCommand: "npm run validate:custom-domain:live",
    privateMaterial: "Cloudflare dashboard/account access only; no DNS API tokens belong in the repository."
  },
  liveGithubPublication: {
    area: "Public GitHub",
    ownerAction: "Publish the current public-safe worktree to https://github.com/kborndorff/Open-Cycle.",
    helper: "npm run owner-tools:publish-help",
    proofCommand: "npm run validate:github:live",
    privateMaterial: "GitHub account access only; do not commit generated reports, signed artifacts, keystores, or credentials."
  },
  liveGithubActions: {
    area: "Public GitHub",
    ownerAction: "Wait for public GitHub Actions to finish successfully on the published branch.",
    helper: "npm run owner-tools:publish-help",
    proofCommand: "npm run validate:github:actions",
    privateMaterial: "GitHub account access and encrypted Actions secrets only; never put secret values in workflow YAML."
  },
  signedAab: {
    area: "Android signing",
    ownerAction: "Create the private signed Android App Bundle with the Play upload keystore.",
    helper: "npm run owner-tools:android-signing-help",
    proofCommand: "npm run mobile:signed-aab:evidence -- --require-signed",
    privateMaterial: "Android upload keystore, keystore password, key password, and signed AAB stay private and out of GitHub."
  },
  signedRuntimeQa: {
    area: "Signed runtime QA",
    ownerAction: "Install and test the signed candidate, then complete the private runtime QA report.",
    helper: "npm run owner-tools:runtime-qa-help",
    prepCommands: [
      "npm run mobile:signed-aab:evidence -- --require-signed",
      "npm run validate:android -- --require-signed",
      "npm run generate:signed-runtime-qa-preflight",
      "npm run validate:signed-runtime-qa-preflight"
    ],
    proofCommand: "npm run validate:runtime-qa-report -- --require-complete",
    privateMaterial: "Device/account screenshots with private data stay out of GitHub; record only public-safe checklist evidence."
  },
  playConsoleUpload: {
    area: "Play Console",
    ownerAction: "Upload the signed AAB in Play Console and complete the public-safe upload confirmation.",
    helper: "npm run owner-tools:play-upload-help",
    proofCommand: "npm run validate:play-upload-confirmation -- --require-complete",
    privateMaterial: "Play Console credentials, service-account JSON, tester lists, and account screenshots stay private."
  }
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function makeBlocker(id, audit) {
  const guidance = BLOCKER_GUIDANCE[id] || {
    area: "Release",
    ownerAction: `Resolve pending check: ${id}.`,
    helper: "npm run release:support-now",
    proofCommand: "npm run release:audit",
    privateMaterial: "Keep all secrets and private artifacts out of GitHub."
  };
  const check = audit.checks && audit.checks[id] ? audit.checks[id] : { status: "pending", detail: "Pending check." };
  return {
    id,
    area: guidance.area,
    status: check.status,
    detail: check.detail,
    ownerAction: guidance.ownerAction,
    helper: guidance.helper,
    prepCommands: guidance.prepCommands || [],
    proofCommand: guidance.proofCommand,
    privateMaterial: guidance.privateMaterial
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Release blocker report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Audit status: ${report.auditStatus}`,
    `Repository: ${report.repository}`,
    `Live Pages URL: ${report.liveSiteUrl}`,
    "",
    "This report is public-safe. It lists the remaining owner-only gates without storing Cloudflare tokens, GitHub tokens, Android keystores, signing passwords, Play Console credentials, service-account JSON, signed AAB files, or private screenshots.",
    "",
    "## Current blockers",
    ""
  ];

  if (report.blockers.length === 0) {
    lines.push("- None. Run `npm run validate:play-store-complete` to confirm final completion.");
  } else {
    for (const blocker of report.blockers) {
      lines.push(`### ${blocker.area}: ${blocker.id}`);
      lines.push("");
      lines.push(`- Status: ${blocker.status}`);
      lines.push(`- Detail: ${blocker.detail}`);
      lines.push(`- Owner action: ${blocker.ownerAction}`);
      lines.push(`- Helper: \`${blocker.helper}\``);
      for (const command of blocker.prepCommands || []) {
        lines.push(`- Diagnostic: \`${command}\``);
      }
      lines.push(`- Proof command: \`${blocker.proofCommand}\``);
      lines.push(`- Private boundary: ${blocker.privateMaterial}`);
      lines.push("");
    }
  }

  lines.push("## Safe sequence");
  lines.push("");
  lines.push("```powershell");
  lines.push("npm run release:support-now");
  for (const command of report.safeSequence) {
    lines.push(command);
  }
  lines.push("npm run release:audit");
  lines.push("npm run validate:release-audit");
  lines.push("```");
  lines.push("");
  lines.push("When every blocker proof command passes, finish with:");
  lines.push("");
  lines.push("```powershell");
  lines.push("npm run validate:play-store-complete");
  lines.push("```");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(auditPath)) {
    throw new Error(`Missing final release audit. Run npm run release:audit first: ${auditPath}`);
  }
  fs.mkdirSync(reportsDir, { recursive: true });
  const audit = readJson(auditPath);
  const pendingChecks = Array.isArray(audit.pendingChecks)
    ? audit.pendingChecks.filter((id) => id !== "releaseBlockerReport")
    : [];
  const blockers = pendingChecks.map((id) => makeBlocker(id, audit));
  const safeSequence = blockers.flatMap((blocker) => [blocker.helper, ...(blocker.prepCommands || []), blocker.proofCommand]);
  const report = {
    generatedAt: new Date().toISOString(),
    auditStatus: audit.status,
    repository: audit.repository,
    liveSiteUrl: audit.liveSiteUrl,
    blockerCount: blockers.length,
    blockers,
    safeSequence: [...new Set(safeSequence)]
  };

  fs.writeFileSync(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdOutPath, renderMarkdown(report));
  console.log(`Release blocker report written to ${jsonOutPath}`);
  console.log(`Release blocker report written to ${mdOutPath}`);
}

main();

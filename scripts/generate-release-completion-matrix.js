const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");
const auditPath = path.join(reportsDir, "final-release-audit.json");
const jsonOutPath = path.join(reportsDir, "release-completion-matrix.json");
const mdOutPath = path.join(reportsDir, "release-completion-matrix.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getCheck(audit, id) {
  return audit.checks && audit.checks[id]
    ? audit.checks[id]
    : { status: "missing", detail: `Missing audit check: ${id}` };
}

function statusFor(audit, checkIds) {
  const checks = checkIds.map((id) => ({ id, ...getCheck(audit, id) }));
  if (checks.some((check) => check.status === "fail" || check.status === "missing")) {
    return "blocked";
  }
  if (checks.some((check) => check.status === "pending")) {
    return "owner-action";
  }
  return "ready";
}

function makeRow(audit, area, requirement, evidenceChecks, ownerAction, publicSafe) {
  const checks = evidenceChecks.map((id) => {
    const check = getCheck(audit, id);
    return {
      id,
      status: check.status,
      detail: check.detail,
    };
  });

  return {
    area,
    requirement,
    status: statusFor(audit, evidenceChecks),
    publicSafe,
    ownerAction,
    evidenceChecks: checks,
  };
}

function renderMarkdown(matrix) {
  const lines = [
    "# Release completion matrix",
    "",
    `Generated: ${matrix.generatedAt}`,
    "",
    `Overall audit status: ${matrix.auditStatus}`,
    "",
    "This file maps the release goal to concrete evidence without including secrets, keystores, tokens, service account files, or signed release artifacts.",
    "",
    "| Area | Requirement | Status | Public-safe evidence | Owner action |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const row of matrix.rows) {
    const evidence = row.evidenceChecks
      .map((check) => `${check.id}: ${check.status}`)
      .join("<br>");
    lines.push(
      `| ${row.area} | ${row.requirement} | ${row.status} | ${evidence} | ${row.ownerAction} |`,
    );
  }

  lines.push("");
  lines.push("## Pending owner-only gates");
  lines.push("");
  if (matrix.pendingOwnerOnlyGates.length === 0) {
    lines.push("- None.");
  } else {
    for (const gate of matrix.pendingOwnerOnlyGates) {
      lines.push(`- ${gate}`);
    }
  }

  lines.push("");
  lines.push("## Secret boundary");
  lines.push("");
  lines.push("- Public GitHub can include source, docs, validators, public-safe reports, unsigned AAB evidence, and Cloudflare/GitHub helper commands.");
  lines.push("- Public GitHub must not include API tokens, keystore files, keystore passwords, service account JSON, signed AABs, or private Play Console screenshots.");
  lines.push("- Signed release proof is represented by checksum/evidence files only after the owner creates the private signed artifact.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(auditPath)) {
    throw new Error(`Missing audit report. Run npm run release:audit first: ${auditPath}`);
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const audit = readJson(auditPath);
  const rows = [
    makeRow(
      audit,
      "Mobile app",
      "Core cycle tracking is local-only, public-safe, and has Android release evidence.",
      ["functionCoverage", "localOnlyRuntime", "privacyParity", "androidPermissions", "unsignedAab"],
      "Owner signs private release AAB.",
      true,
    ),
    makeRow(
      audit,
      "Website",
      "Cloudflare Pages site is live and the custom domain is ready to become the public entry point.",
      ["liveSitePublication", "cloudflarePagesDeployment", "customDomainReadiness", "liveCloudflarePagesDomainAttachment", "liveCustomDomainPublication"],
      "Owner attaches open-cycle.com and www.open-cycle.com in Cloudflare Pages.",
      true,
    ),
    makeRow(
      audit,
      "Public GitHub",
      "Repository is safe to publish while keeping private release materials out of GitHub.",
      ["publicPushReadiness", "publicRepositoryPublicationManifest", "publicArtifactPolicy", "workflowProvenance", "liveGithubPublication", "liveGithubActions"],
      "Owner publishes the current worktree and confirms public Actions pass.",
      true,
    ),
    makeRow(
      audit,
      "Security and privacy",
      "License, security disclosure, artifact hygiene, permissions, and privacy claims align with a free local-only app.",
      ["sourceAvailableLicense", "securityDisclosure", "releaseArtifactHygiene", "publicArtifactPolicy", "privacyParity", "androidPermissions"],
      "No owner action unless public claims change.",
      true,
    ),
    makeRow(
      audit,
      "Play Store",
      "Play Console packets are ready, with private upload/signing/QA still separated from public source.",
      ["visualTestReport", "visualEvidenceManifest", "playConsolePacket", "playAppContentPacket", "playReleaseCandidatePacket", "playProductionReadinessPacket", "signedAab", "signedRuntimeQa", "playConsoleUpload"],
      "Owner signs the AAB, completes signed runtime QA, and confirms Play Console upload.",
      false,
    ),
  ];

  const matrix = {
    generatedAt: new Date().toISOString(),
    auditStatus: audit.status,
    repository: audit.repository,
    liveSiteUrl: audit.liveSiteUrl,
    pendingOwnerOnlyGates: audit.pendingChecks || [],
    rows,
  };

  fs.writeFileSync(jsonOutPath, `${JSON.stringify(matrix, null, 2)}\n`);
  fs.writeFileSync(mdOutPath, renderMarkdown(matrix));

  console.log(`Release completion matrix written to ${jsonOutPath}`);
  console.log(`Release completion matrix written to ${mdOutPath}`);
}

main();

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "git-publication-preflight.json");
const expectedRemote = "https://github.com/kborndorff/Open-Cycle.git";

function runGit(args) {
  const result = spawnSync("git", ["-c", `safe.directory=${root.replace(/\\/g, "/")}`, ...args], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    status: result.status,
    error: result.error?.message
  };
}

function check(id, pass, detail, command) {
  return { id, status: pass ? "pass" : "pending", detail, command };
}

function main() {
  console.log("Git publication preflight");
  console.log("This check does not push code, read tokens, or contact GitHub.");

  const inside = runGit(["rev-parse", "--is-inside-work-tree"]);
  const branch = runGit(["branch", "--show-current"]);
  const userName = runGit(["config", "--get", "user.name"]);
  const userEmail = runGit(["config", "--get", "user.email"]);
  const origin = runGit(["remote", "get-url", "origin"]);
  const lastCommit = runGit(["log", "--oneline", "-1"]);
  const publishableFiles = runGit(["ls-files", "--others", "--exclude-standard"]);
  const ignoredStatus = runGit(["status", "--short", "--ignored"]);

  const publishableFileList = publishableFiles.stdout
    ? publishableFiles.stdout.split(/\r?\n/).filter(Boolean)
    : [];
  const ignoredLines = ignoredStatus.stdout
    ? ignoredStatus.stdout.split(/\r?\n/).filter((line) => line.startsWith("!! "))
    : [];

  const checks = [
    check("gitWorktree", inside.ok && inside.stdout === "true", "Repository is a Git worktree.", "git rev-parse --is-inside-work-tree"),
    check("authorName", Boolean(userName.stdout), "Git user.name is configured.", "git config user.name"),
    check("authorEmail", Boolean(userEmail.stdout), "Git user.email is configured.", "git config user.email"),
    check("originRemote", origin.ok && origin.stdout === expectedRemote, `Origin remote is ${expectedRemote}.`, "git remote add origin https://github.com/kborndorff/Open-Cycle.git"),
    check("defaultBranch", branch.stdout === "main", "Current branch is main.", "git branch -M main"),
    check("initialCommit", lastCommit.ok, "At least one local commit exists.", "git add <public-safe files from reports/public-repository-publication-manifest.md> && git commit"),
    check("publishableFiles", publishableFileList.length > 0, "Publishable files are visible to Git.", "git ls-files --others --exclude-standard"),
    check("ignoredPrivateOutputs", ignoredLines.some((line) => line.includes("reports/")) && ignoredLines.some((line) => line.includes("app/build/")), "Generated reports and Android build outputs are ignored.", "git status --short --ignored")
  ];

  const pendingChecks = checks.filter((item) => item.status !== "pass").map((item) => item.id);
  const report = {
    generatedAt: new Date().toISOString(),
    status: pendingChecks.length === 0 ? "ready-for-owner-push" : "needs-owner-git-setup",
    repository: "https://github.com/kborndorff/Open-Cycle",
    expectedRemote,
    branch: branch.stdout || null,
    hasLocalCommit: lastCommit.ok,
    originRemoteConfigured: origin.ok,
    publishableFileCount: publishableFileList.length,
    publishablePreview: publishableFileList.slice(0, 30),
    ignoredOutputCount: ignoredLines.length,
    checks,
    pendingChecks,
    safeNextSteps: [
      "Configure Git user.name and user.email if missing.",
      "Set the local branch to main.",
      "Add origin as https://github.com/kborndorff/Open-Cycle.git.",
      "Use reports/public-repository-publication-manifest.md as the source of truth for the public-safe file set.",
      "Keep full source publication aligned with https://github.com/kborndorff/open-cycle-source.",
      "Run npm run validate:release and npm run validate:play-store-public before publishing.",
      "Create the first public-safe commit without signed artifacts, keystores, private reports, Play credentials, or Cloudflare tokens.",
      "Push only after owner approval, then run npm run validate:github:live and npm run validate:github:actions."
    ],
    secretSafe: true,
    networkUsed: false,
    pushed: false
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Git publication preflight written to ${reportPath}`);
  console.log(`Status: ${report.status}`);
  if (pendingChecks.length > 0) {
    console.log(`Pending checks: ${pendingChecks.join(", ")}`);
  }
}

main();

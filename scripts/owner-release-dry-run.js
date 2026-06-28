const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "owner-release-dry-run.json");

const steps = [
  {
    id: "ownerTools",
    label: "Check owner tool readiness without reading secrets",
    command: "npm",
    args: ["run", "validate:owner-tools"]
  },
  {
    id: "cloudflareSecretDryRun",
    label: "Rehearse Cloudflare GitHub secret setup without prompts",
    command: "npm",
    args: ["run", "github:setup-deploy-secrets", "--", "-DryRun"]
  },
  {
    id: "keystoreCreationDryRun",
    label: "Rehearse Android upload keystore creation without creating a key",
    command: "npm",
    args: ["run", "mobile:create-upload-keystore", "--", "-DryRun"]
  },
  {
    id: "androidSigningDryRun",
    label: "Rehearse Android private release without signing secrets",
    command: "npm",
    args: ["run", "mobile:release:android:prompted", "--", "-DryRun", "-SkipBuild", "-SkipPublicGate"]
  },
  {
    id: "publicReadyDryRun",
    label: "Print public release readiness command plan without network checks",
    command: "npm",
    args: ["run", "release:public-ready", "--", "--dry-run", "--skip-live-site", "--skip-live-cloudflare-domains", "--skip-live-custom-domain", "--skip-live-github", "--skip-live-actions"]
  }
];

function commandForPlatform(command) {
  return process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
}

function runStep(step) {
  const command = commandForPlatform(step.command);
  console.log(`\n==> ${step.label}`);
  console.log([command, ...step.args].join(" "));

  const isWindowsBatch =
    process.platform === "win32" &&
    [".bat", ".cmd"].includes(path.extname(command).toLowerCase());
  const result = spawnSync(isWindowsBatch ? "cmd.exe" : command, isWindowsBatch ? ["/d", "/s", "/c", "call", command, ...step.args] : step.args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    shell: false
  });

  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }

  return {
    id: step.id,
    label: step.label,
    command: [command, ...step.args].join(" "),
    status: result.error || result.status !== 0 ? "fail" : "pass",
    exitCode: result.status,
    error: result.error ? result.error.message : null
  };
}

function main() {
  console.log("Owner release dry run");
  console.log("This rehearsal does not read, prompt for, print, or store Cloudflare tokens, Android signing passwords, upload keystores, Play Console credentials, or signed artifacts.");

  const results = steps.map(runStep);
  const failures = results
    .filter((result) => result.status !== "pass")
    .map((result) => result.id);

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    networkUsed: false,
    gitUsed: false,
    note: "This report records owner-side dry-run command results only. It does not include secret values.",
    failures,
    steps: results
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Owner release dry run failed. Report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`\nOwner release dry run passed. Report written to ${reportPath}`);
}

main();

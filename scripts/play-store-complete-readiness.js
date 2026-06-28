const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const auditPath = path.join(root, "reports", "final-release-audit.json");
const isDryRun = process.argv.includes("--dry-run");

const steps = [
  ["npm", ["run", "validate:custom-domain:live"], "validate final custom-domain publication"],
  ["npm", ["run", "validate:github:live"], "validate public GitHub publication"],
  ["npm", ["run", "validate:github:actions"], "validate public GitHub Actions"],
  ["npm", ["run", "validate:play-store-private-ready"], "validate signed candidate and completed runtime QA"],
  ["npm", ["run", "validate:play-upload-confirmation", "--", "--require-complete"], "validate completed Play Console upload confirmation"],
  ["npm", ["run", "release:audit"], "generate final release audit"],
  ["npm", ["run", "validate:release-audit"], "validate final release audit"]
];

function commandText(command, args) {
  return [command, ...args].join(" ");
}

function commandForPlatform(command) {
  return process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
}

function run(command, args, label) {
  const platformCommand = commandForPlatform(command);
  console.log(`\n==> ${label}`);
  console.log(commandText(platformCommand, args));

  if (isDryRun) {
    return;
  }

  const isWindowsBatch =
    process.platform === "win32" &&
    [".bat", ".cmd"].includes(path.extname(platformCommand).toLowerCase());
  const result = spawnSync(isWindowsBatch ? "cmd.exe" : platformCommand, isWindowsBatch ? ["/d", "/s", "/c", "call", platformCommand, ...args] : args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} failed with code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function verifyAudit() {
  if (!fs.existsSync(auditPath)) {
    console.error(`Missing final release audit: ${auditPath}`);
    process.exit(1);
  }

  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  if (audit.status !== "play-upload-confirmed" || audit.pendingChecks?.length || audit.failedChecks?.length) {
    console.error("Play Store completion failed. Expected final audit status play-upload-confirmed with no pending or failed checks.");
    console.error(JSON.stringify({
      status: audit.status,
      failedChecks: audit.failedChecks || [],
      pendingChecks: audit.pendingChecks || []
    }, null, 2));
    process.exit(1);
  }

  console.log("\nPlay Store completion checks passed. Signed candidate, runtime QA, and Play upload confirmation are complete.");
}

function main() {
  console.log("Play Store completion readiness");
  if (isDryRun) {
    console.log("Dry run only. No private validation commands are executed.");
  }

  for (const [command, args, label] of steps) {
    run(command, args, label);
  }

  if (isDryRun) {
    console.log("\nDry-run complete.");
    return;
  }

  verifyAudit();
}

main();

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportPath = path.join(root, "reports", "play-store-preflight.json");
const isDryRun = process.argv.includes("--dry-run");

const steps = [
  ["npm", ["run", "validate:release"], "public release gate"],
  ["npm", ["run", "mobile:build:aab"], "build unsigned Android App Bundle"],
  ["npm", ["run", "validate:android", "--", "--require-aab"], "validate unsigned Android App Bundle"],
  ["npm", ["run", "mobile:unsigned-aab:evidence", "--", "--require-aab"], "record unsigned Android App Bundle evidence"],
  ["npm", ["run", "preflight:play-store"], "write Play Store preflight report"]
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

function verifyPreflightReport() {
  if (!fs.existsSync(reportPath)) {
    console.error(`Missing Play Store preflight report: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const pendingPrivateSteps = report.pendingPrivateSteps || [];
  const onlyPendingSignedAab = pendingPrivateSteps.length === 1 && pendingPrivateSteps[0] === "signedAab";

  if (report.status !== "ready-for-private-signing" || !onlyPendingSignedAab || report.blockingFailures?.length) {
    console.error("Play Store public readiness failed. Expected only the private signedAab step to remain.");
    console.error(JSON.stringify({
      status: report.status,
      blockingFailures: report.blockingFailures,
      pendingPrivateSteps
    }, null, 2));
    process.exit(1);
  }

  console.log("\nPlay Store public readiness checks passed. Only private signing remains.");
}

function main() {
  console.log("Play Store public readiness");
  if (isDryRun) {
    console.log("Dry run only. No build, validation, or preflight report is executed.");
  }

  for (const [command, args, label] of steps) {
    run(command, args, label);
  }

  if (isDryRun) {
    console.log("\nDry-run complete.");
    return;
  }

  verifyPreflightReport();
}

main();

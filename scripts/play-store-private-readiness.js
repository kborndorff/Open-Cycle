const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const reportPath = path.join(root, "reports", "play-store-preflight.json");
const isDryRun = process.argv.includes("--dry-run");

const steps = [
  ["npm", ["run", "validate:custom-domain:live"], "validate final custom-domain privacy URL"],
  ["npm", ["run", "validate:android", "--", "--require-signed"], "validate signed Android App Bundle"],
  ["npm", ["run", "mobile:signed-aab:evidence", "--", "--require-signed"], "record signed Android App Bundle evidence"],
  ["npm", ["run", "mobile:signed-aab:sync-evidence"], "sync signed Android App Bundle evidence into private reports"],
  ["npm", ["run", "preflight:play-store"], "write final Play Store preflight report"],
  ["npm", ["run", "validate:runtime-qa-report", "--", "--require-complete"], "validate completed runtime QA report"],
  ["npm", ["run", "generate:play-console-packet"], "generate final Play Console upload packet"],
  ["npm", ["run", "validate:play-console-packet"], "validate final Play Console upload packet"]
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

function verifyFinalPreflight() {
  if (!fs.existsSync(reportPath)) {
    console.error(`Missing Play Store preflight report: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const pendingPrivateSteps = report.pendingPrivateSteps || [];
  const blockingFailures = report.blockingFailures || [];

  if (report.status !== "ready-for-play-upload" || pendingPrivateSteps.length > 0 || blockingFailures.length > 0) {
    console.error("Play Store private readiness failed. Expected signed candidate to be ready for Play upload.");
    console.error(JSON.stringify({
      status: report.status,
      blockingFailures,
      pendingPrivateSteps
    }, null, 2));
    process.exit(1);
  }

  console.log("\nPlay Store private readiness checks passed. Signed candidate is ready for Play Console upload.");
}

function main() {
  console.log("Play Store private readiness");
  if (isDryRun) {
    console.log("Dry run only. No signed validation, QA validation, or packet generation is executed.");
  }

  for (const [command, args, label] of steps) {
    run(command, args, label);
  }

  if (isDryRun) {
    console.log("\nDry-run complete.");
    return;
  }

  verifyFinalPreflight();
}

main();

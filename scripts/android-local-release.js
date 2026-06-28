const { spawnSync } = require("node:child_process");
const path = require("node:path");

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const skipPublicGate = args.has("--skip-public-gate");
const skipBuild = args.has("--skip-build");

const privateEnv = [
  ["ANDROID_KEYSTORE_PATH", "Path to the private Play upload keystore."],
  ["ANDROID_KEY_ALIAS", "Alias inside the private Play upload keystore."],
  ["ANDROID_KEYSTORE_PASSWORD", "Private keystore password."],
  ["ANDROID_KEY_PASSWORD", "Private key password."]
];

const publicSteps = [
  ["npm", ["run", "validate:release"], "public release gate"],
  ["npm", ["run", "mobile:build:aab"], "build unsigned Android App Bundle"],
  ["npm", ["run", "validate:android", "--", "--require-aab"], "validate unsigned Android App Bundle"]
];

const privateSteps = [
  ["npm", ["run", "mobile:sign:aab", "--", "--input=apps/mobile/android/app/build/outputs/bundle/release/app-release.aab"], "sign Android App Bundle"],
  ["npm", ["run", "validate:android", "--", "--require-signed"], "validate signed Android App Bundle"],
  ["npm", ["run", "mobile:signed-aab:evidence", "--", "--require-signed"], "record signed Android App Bundle evidence"],
  ["npm", ["run", "mobile:signed-aab:sync-evidence"], "sync signed Android App Bundle evidence into private reports"],
  ["npm", ["run", "preflight:play-store"], "write Play Store preflight report"]
];

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function commandText(command, commandArgs) {
  return [command, ...commandArgs].join(" ");
}

function run(command, commandArgs, label) {
  console.log(`\n==> ${label}`);
  console.log(commandText(command, commandArgs));

  if (isDryRun) {
    return;
  }

  const isWindowsBatch =
    process.platform === "win32" &&
    [".bat", ".cmd"].includes(path.extname(command).toLowerCase());
  const result = spawnSync(isWindowsBatch ? "cmd.exe" : command, isWindowsBatch ? ["/d", "/s", "/c", "call", command, ...commandArgs] : commandArgs, {
    cwd: process.cwd(),
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

function checkPrivateEnv() {
  const missing = privateEnv.filter(([name]) => !process.env[name]);
  if (missing.length === 0) {
    return true;
  }

  console.error("\nMissing private Android signing environment values:");
  for (const [name, description] of missing) {
    console.error(`- ${name}: ${description}`);
  }
  console.error("\nSet these only in your private shell or password manager workflow. Do not commit them.");
  return false;
}

function plannedPublicSteps() {
  return [
    ...(skipPublicGate ? [] : [publicSteps[0]]),
    ...(skipBuild ? [] : publicSteps.slice(1))
  ];
}

function plannedSteps() {
  return [...plannedPublicSteps(), ...privateSteps];
}

function main() {
  console.log("Android local Play release");
  if (isDryRun) {
    console.log("Dry run only. No build, signing, validation, or secrets are used.");
  }

  if (isDryRun) {
    for (const [command, commandArgs, label] of plannedSteps()) {
      run(command === "npm" ? npmCommand() : command, commandArgs, label);
    }
    console.log("\nDry-run complete. Private signing environment was not required.");
    return;
  }

  for (const [command, commandArgs, label] of plannedPublicSteps()) {
    run(command === "npm" ? npmCommand() : command, commandArgs, label);
  }

  if (!checkPrivateEnv()) {
    process.exit(1);
  }

  for (const [command, commandArgs, label] of privateSteps) {
    run(command === "npm" ? npmCommand() : command, commandArgs, label);
  }

  console.log("\nSigned Android release candidate is ready for runtime QA and Play Console upload.");
}

main();

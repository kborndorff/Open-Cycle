const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const rootDir = process.cwd();
const inputArg = process.argv.find((arg) => arg.startsWith("--input="));
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));

const defaultInput = path.resolve(
  rootDir,
  "apps",
  "mobile",
  "android",
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
  "app-release.aab"
);

const inputPath = inputArg ? path.resolve(inputArg.split("=")[1]) : defaultInput;
const outputPath = outputArg ? path.resolve(outputArg.split("=")[1]) : inputPath.replace(".aab", "-signed.aab");

const requiredEnv = [
  ["ANDROID_KEYSTORE_PATH", "Path to the release .jks or .keystore file."],
  ["ANDROID_KEY_ALIAS", "Keystore alias name."],
  ["ANDROID_KEYSTORE_PASSWORD", "Keystore password."],
  ["ANDROID_KEY_PASSWORD", "Private key password."]
];

function run(command, args, cwd, label) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`${label || command} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label || command} failed with code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function resolveJarSigner() {
  const tool = process.platform === "win32" ? "jarsigner.exe" : "jarsigner";
  const javaHomes = [process.env.JAVA_HOME].filter(Boolean);
  if (process.platform === "win32") {
    for (const rootPath of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        javaHomes.push(path.join(rootPath, "Android", androidStudioDir, "jbr"));
      }
    }
  }

  for (const javaHome of javaHomes) {
    const fullPath = path.join(javaHome, "bin", tool);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return tool;
}

function validateInputs() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Could not find source AAB at ${inputPath}`);
    process.exit(1);
  }

  for (const [name, description] of requiredEnv) {
    if (!process.env[name]) {
      console.error(`Missing ${name}: ${description}`);
      process.exit(1);
    }
  }

  return resolveJarSigner();
}

function main() {
  const jarsigner = validateInputs();

  const keystore = path.resolve(process.env.ANDROID_KEYSTORE_PATH || "");
  if (!fs.existsSync(keystore)) {
    console.error(`Keystore file not found: ${keystore}`);
    process.exit(1);
  }

  fs.copyFileSync(inputPath, outputPath);

  run(
    jarsigner,
    [
      "-sigalg",
      "SHA256withRSA",
      "-digestalg",
      "SHA-256",
      "-keystore",
      keystore,
      "-storepass:env",
      "ANDROID_KEYSTORE_PASSWORD",
      "-keypass:env",
      "ANDROID_KEY_PASSWORD",
      outputPath,
      process.env.ANDROID_KEY_ALIAS
    ],
    rootDir,
    "jarsigner"
  );

  run(
    jarsigner,
    ["-verify", "-certs", outputPath],
    rootDir,
    "jarsigner verify"
  );

  console.log(`Signed AAB written to ${outputPath}`);
}

main();

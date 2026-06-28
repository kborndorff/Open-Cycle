const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const rootDir = process.cwd();
const mobileDir = path.resolve(rootDir, "apps", "mobile");
const androidDir = path.resolve(mobileDir, "android");
const gradleShell = process.platform === "win32" ? "gradlew.bat" : "gradlew";

function run(command, args, cwd, label) {
  const isWindowsBatch =
    process.platform === "win32" &&
    [".bat", ".cmd"].includes(path.extname(command).toLowerCase());
  const result = spawnSync(
    isWindowsBatch ? "cmd.exe" : command,
    isWindowsBatch ? ["/d", "/s", "/c", "call", command, ...args] : args,
    {
    cwd,
    stdio: "inherit",
    shell: false
    }
  );

  if (result.error) {
    console.error(`${label || command} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label || command} failed with code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function runGradle(gradlePath, gradleArgs, cwd, label) {
  run(gradlePath, gradleArgs, cwd, label);
}

function ensureAndroidPlatform() {
  if (fs.existsSync(androidDir)) {
    return;
  }

  console.log("No Android platform found. Running `capacitor add android`.");
  run(npmCommand(), ["run", "mobile:cap", "--", "add", "android"], rootDir, "capacitor add android");
}

function ensureAndroidSdkEnv() {
  if (process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT) {
    return;
  }

  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) {
    return;
  }

  const sdkPath = path.join(process.env.LOCALAPPDATA, "Android", "Sdk");
  if (!fs.existsSync(sdkPath)) {
    return;
  }

  process.env.ANDROID_HOME = sdkPath;
  process.env.ANDROID_SDK_ROOT = sdkPath;
  console.log(`Using detected Android SDK: ${sdkPath}`);
}

function javaExecutableFor(home) {
  return path.join(home, "bin", process.platform === "win32" ? "java.exe" : "java");
}

function ensureJavaEnv() {
  if (process.env.JAVA_HOME && fs.existsSync(javaExecutableFor(process.env.JAVA_HOME))) {
    return;
  }

  if (process.platform !== "win32") {
    return;
  }

  const roots = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"]
  ].filter(Boolean);

  const candidates = [];
  for (const root of roots) {
    candidates.push(
      path.join(root, "Android", "Android Studio", "jbr"),
      path.join(root, "Android", "Android Studio1", "jbr"),
      path.join(root, "Android", "Android Studio2", "jbr")
    );
  }

  const javaHome = candidates.find((candidate) => fs.existsSync(javaExecutableFor(candidate)));
  if (!javaHome) {
    return;
  }

  process.env.JAVA_HOME = javaHome;
  process.env.PATH = `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH || ""}`;
  console.log(`Using detected Java runtime: ${javaHome}`);
}

function main() {
  run(npmCommand(), ["run", "build:mobile:web"], rootDir, "build web bundle");
  ensureAndroidPlatform();

  run(npmCommand(), ["run", "mobile:sync:android"], rootDir, "sync Capacitor android");
  ensureAndroidSdkEnv();
  ensureJavaEnv();

  const externalBuildRoot = path.join(
    os.tmpdir(),
    "open-cycle-android-build",
    `build-${Date.now()}`
  );
  fs.mkdirSync(externalBuildRoot, { recursive: true });
  process.env.OPEN_CYCLE_ANDROID_BUILD_ROOT = externalBuildRoot;
  console.log(`Using temp Android build root: ${externalBuildRoot}`);

  const gradlePath = path.join(androidDir, gradleShell);
  if (!fs.existsSync(gradlePath)) {
    console.error("Android Gradle wrapper missing. Initialize Android platform again with:");
    console.error("  npm run mobile:init:android");
    process.exit(1);
  }

  runGradle(gradlePath, ["bundleRelease", "--rerun-tasks"], androidDir, "bundleRelease");

  const canonicalOutput = path.join(
    androidDir,
    "app",
    "build",
    "outputs",
    "bundle",
    "release",
    "app-release.aab"
  );
  const candidate = path.join(
    externalBuildRoot,
    "app",
    "outputs",
    "bundle",
    "release",
    "app-release.aab"
  );
  if (fs.existsSync(candidate)) {
    fs.mkdirSync(path.dirname(canonicalOutput), { recursive: true });
    fs.copyFileSync(candidate, canonicalOutput);
    console.log(`App Bundle generated at: ${canonicalOutput}`);
    console.log(`Temp build output copied from: ${candidate}`);
    return;
  }

  console.error("Expected App Bundle output not found. Check the Android build output location for your Gradle plugin version.");
  process.exit(1);
}

main();

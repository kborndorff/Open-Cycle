const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const requireAab = args.has("--require-aab");
const requireSigned = args.has("--require-signed");

const androidDir = path.join(root, "apps", "mobile", "android");
const manifestPath = path.join(androidDir, "app", "src", "main", "AndroidManifest.xml");
const capacitorConfigPath = path.join(root, "apps", "mobile", "capacitor.config.ts");
const appBuildGradlePath = path.join(androidDir, "app", "build.gradle");
const stringsPath = path.join(androidDir, "app", "src", "main", "res", "values", "strings.xml");
const playMetadataPath = path.join(root, "store-assets", "play", "listing.json");
const foregroundIconPath = path.join(androidDir, "app", "src", "main", "res", "drawable-v24", "ic_launcher_foreground.xml");
const adaptiveIconPath = path.join(androidDir, "app", "src", "main", "res", "mipmap-anydpi-v26", "ic_launcher.xml");
const roundAdaptiveIconPath = path.join(androidDir, "app", "src", "main", "res", "mipmap-anydpi-v26", "ic_launcher_round.xml");
const iconBackgroundPath = path.join(androidDir, "app", "src", "main", "res", "values", "ic_launcher_background.xml");
const gradlePath = path.join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
const aabPath = path.join(androidDir, "app", "build", "outputs", "bundle", "release", "app-release.aab");
const signedAabPath = path.join(androidDir, "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");

function resolveJavaTool(name) {
  const tool = process.platform === "win32" ? `${name}.exe` : name;
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const fullPath = path.join(javaHome, "bin", tool);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  if (process.platform === "win32") {
    const roots = [
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"]
    ].filter(Boolean);
    for (const rootPath of roots) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        const fullPath = path.join(rootPath, "Android", androidStudioDir, "jbr", "bin", tool);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
  }
  return name;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function checkAndroidProject() {
  if (!fs.existsSync(androidDir)) {
    fail("Android platform project is missing. Run npm run mobile:init:android.");
  }
  if (!fs.existsSync(gradlePath)) {
    fail("Android Gradle wrapper is missing.");
  }
}

function checkManifest() {
  if (!fs.existsSync(manifestPath)) {
    fail("AndroidManifest.xml is missing.");
    return;
  }

  const manifest = read(manifestPath);
  if (manifest.includes("android.permission.INTERNET")) {
    fail("Public local-only Android build must not request android.permission.INTERNET.");
  }
  if (!manifest.includes('android:allowBackup="false"')) {
    fail("Android backup must be disabled with android:allowBackup=\"false\".");
  }
  if (!manifest.includes('android:fullBackupContent="false"')) {
    fail("Full backup content must be disabled with android:fullBackupContent=\"false\".");
  }
  if (!manifest.includes('android:exported="true"')) {
    fail("Launcher activity must explicitly declare android:exported for Play compatibility.");
  }
}

function checkStoreIdentity() {
  for (const file of [capacitorConfigPath, appBuildGradlePath, stringsPath]) {
    if (!fs.existsSync(file)) {
      fail(`Android store identity file is missing: ${file}`);
      return;
    }
  }

  const capacitorConfig = read(capacitorConfigPath);
  const buildGradle = read(appBuildGradlePath);
  const strings = read(stringsPath);
  const manifest = fs.existsSync(manifestPath) ? read(manifestPath) : "";
  const playMetadata = fs.existsSync(playMetadataPath)
    ? JSON.parse(read(playMetadataPath))
    : { appName: "open-cycle", packageName: "com.opencycle.app" };
  const appName = playMetadata.appName || "open-cycle";
  const packageName = playMetadata.packageName || "com.opencycle.app";

  for (const [label, contents, expected] of [
    ["Capacitor appId", capacitorConfig, `appId: "${packageName}"`],
    ["Capacitor appName", capacitorConfig, `appName: "${appName}"`],
    ["Gradle namespace", buildGradle, `namespace "${packageName}"`],
    ["Gradle applicationId", buildGradle, `applicationId "${packageName}"`],
    ["Android app name string", strings, `<string name="app_name">${appName}</string>`],
    ["Android activity title string", strings, `<string name="title_activity_main">${appName}</string>`],
    ["Android package string", strings, `<string name="package_name">${packageName}</string>`],
    ["Android custom URL scheme string", strings, `<string name="custom_url_scheme">${packageName}</string>`]
  ]) {
    if (!contents.includes(expected)) {
      fail(`${label} must match Play metadata: ${expected}`);
    }
  }

  if (!manifest.includes('android:label="@string/app_name"')) {
    fail("Android application label must use @string/app_name.");
  }
  if (!manifest.includes('android:label="@string/title_activity_main"')) {
    fail("Android launcher activity label must use @string/title_activity_main.");
  }

  const versionCodeMatch = /versionCode\s+(\d+)/.exec(buildGradle);
  const versionNameMatch = /versionName\s+"([^"]+)"/.exec(buildGradle);
  const versionCode = versionCodeMatch ? Number(versionCodeMatch[1]) : 0;
  const versionName = versionNameMatch?.[1] || "";
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    fail("Android versionCode must be a positive integer for Play releases.");
  }
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(versionName)) {
    fail("Android versionName must be a simple semantic version like 1.0 or 1.0.0.");
  }
}

function checkMobileEnvDefault() {
  const envExample = read(path.join(root, "apps", "web", ".env.example"));
  if (envExample.includes("VITE_API_BASE") || envExample.includes("VITE_API_KEY")) {
    fail("apps/web/.env.example must not expose remote API configuration for the local-only app.");
  }
}

function checkLauncherIcon() {
  for (const file of [foregroundIconPath, adaptiveIconPath, roundAdaptiveIconPath, iconBackgroundPath]) {
    if (!fs.existsSync(file)) {
      fail(`Missing Android launcher icon resource: ${file}`);
      return;
    }
  }

  const foreground = read(foregroundIconPath);
  const adaptiveIcon = read(adaptiveIconPath);
  const roundAdaptiveIcon = read(roundAdaptiveIconPath);
  const background = read(iconBackgroundPath);

  if (foreground.includes("M66.94,46.02") || foreground.includes("android robot")) {
    fail("Android launcher foreground still appears to use the generated default icon.");
  }
  for (const color of ["#6D7E96", "#4F607F", "#9AAEC7"]) {
    if (!foreground.includes(color)) {
      fail(`Android launcher foreground is missing expected open-cycle color: ${color}`);
    }
  }
  if (!adaptiveIcon.includes("@drawable/ic_launcher_foreground")) {
    fail("Adaptive launcher icon must reference @drawable/ic_launcher_foreground.");
  }
  if (!roundAdaptiveIcon.includes("@drawable/ic_launcher_foreground")) {
    fail("Round adaptive launcher icon must reference @drawable/ic_launcher_foreground.");
  }
  if (!background.includes("#EDF1F7")) {
    fail("Android launcher background must use the open-cycle background color.");
  }
}

function checkAab() {
  if (!requireAab && !requireSigned) {
    return;
  }

  if (!fs.existsSync(aabPath)) {
    fail(`Expected unsigned AAB not found: ${aabPath}`);
  }

  if (requireSigned && !fs.existsSync(signedAabPath)) {
    fail(`Expected signed AAB not found: ${signedAabPath}`);
  }
}

function checkAabContents() {
  if ((!requireAab && !requireSigned) || !fs.existsSync(aabPath)) {
    return;
  }

  const jar = resolveJavaTool("jar");
  const result = spawnSync(jar, ["tf", aabPath], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  if (result.error || result.status !== 0) {
    fail("Could not inspect AAB contents. Set JAVA_HOME to a JDK/JBR with the jar tool.");
    return;
  }

  const entries = result.stdout.split(/\r?\n/);
  for (const expected of [
    "base/manifest/AndroidManifest.xml",
    "base/assets/public/index.html",
    "base/res/drawable-v24/ic_launcher_foreground.xml",
    "base/res/mipmap-anydpi-v26/ic_launcher.xml"
  ]) {
    if (!entries.includes(expected)) {
      fail(`AAB is missing expected entry: ${expected}`);
    }
  }
}

function checkSignedAab() {
  if (!requireSigned || !fs.existsSync(signedAabPath)) {
    return;
  }

  if (fs.existsSync(aabPath)) {
    const unsignedStat = fs.statSync(aabPath);
    const signedStat = fs.statSync(signedAabPath);
    if (signedStat.mtimeMs < unsignedStat.mtimeMs) {
      fail("Signed AAB is older than the unsigned AAB. Re-sign the current app-release.aab before Play upload.");
      return;
    }
  }

  const jarsigner = resolveJavaTool("jarsigner");
  const result = spawnSync(jarsigner, ["-verify", "-certs", signedAabPath], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.error || result.status !== 0 || output.includes("jar is unsigned") || !output.includes("jar verified")) {
    fail("Signed AAB verification failed. Set JAVA_HOME to a JDK/JBR with jarsigner and verify the bundle.");
  }
}

checkAndroidProject();
checkManifest();
checkStoreIdentity();
checkMobileEnvDefault();
checkLauncherIcon();
checkAab();
checkAabContents();
checkSignedAab();

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Android release checks passed.");

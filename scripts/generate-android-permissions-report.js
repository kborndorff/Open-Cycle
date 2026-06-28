const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "android-permissions.json");

const manifestPath = path.join(root, "apps", "mobile", "android", "app", "src", "main", "AndroidManifest.xml");
const buildGradlePath = path.join(root, "apps", "mobile", "android", "app", "build.gradle");
const playMetadataPath = path.join(root, "store-assets", "play", "listing.json");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function matchFirst(contents, pattern, fallback = null) {
  return pattern.exec(contents)?.[1] || fallback;
}

function extractPermissions(manifest) {
  const permissions = [];
  const pattern = /<uses-permission\b[^>]*android:name="([^"]+)"/g;
  let match = pattern.exec(manifest);
  while (match) {
    permissions.push(match[1]);
    match = pattern.exec(manifest);
  }
  return permissions;
}

function main() {
  const manifest = read(manifestPath);
  const buildGradle = read(buildGradlePath);
  const metadata = JSON.parse(read(playMetadataPath));
  const permissions = extractPermissions(manifest);

  const checks = [
    {
      scope: "Android manifest",
      status: permissions.length === 0 ? "pass" : "fail",
      detail: "No Android runtime permissions are requested by the public local-only manifest."
    },
    {
      scope: "Android manifest",
      status: !permissions.includes("android.permission.INTERNET") ? "pass" : "fail",
      detail: "android.permission.INTERNET is not requested."
    },
    {
      scope: "Android manifest",
      status: manifest.includes('android:allowBackup="false"') ? "pass" : "fail",
      detail: "android:allowBackup is false."
    },
    {
      scope: "Android manifest",
      status: manifest.includes('android:fullBackupContent="false"') ? "pass" : "fail",
      detail: "android:fullBackupContent is false."
    },
    {
      scope: "Android manifest",
      status: manifest.includes('android:exported="true"') ? "pass" : "fail",
      detail: "Launcher activity explicitly declares android:exported for Play compatibility."
    },
    {
      scope: "Android identity",
      status: buildGradle.includes(`applicationId "${metadata.packageName}"`) ? "pass" : "fail",
      detail: `Gradle applicationId matches Play package name ${metadata.packageName}.`
    },
    {
      scope: "Android identity",
      status: Boolean(matchFirst(buildGradle, /versionCode\s+(\d+)/)) ? "pass" : "fail",
      detail: "Gradle versionCode is present."
    },
    {
      scope: "Android identity",
      status: Boolean(matchFirst(buildGradle, /versionName\s+"([^"]+)"/)) ? "pass" : "fail",
      detail: "Gradle versionName is present."
    }
  ];

  const failures = checks.filter((check) => check.status !== "pass");
  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    manifestPath: path.relative(root, manifestPath).replace(/\\/g, "/"),
    buildGradlePath: path.relative(root, buildGradlePath).replace(/\\/g, "/"),
    packageName: metadata.packageName,
    applicationId: matchFirst(buildGradle, /applicationId\s+"([^"]+)"/),
    versionCode: Number(matchFirst(buildGradle, /versionCode\s+(\d+)/, "0")),
    versionName: matchFirst(buildGradle, /versionName\s+"([^"]+)"/),
    requestedPermissions: permissions,
    dangerousPermissionsRequested: permissions.filter((permission) => permission !== "android.permission.INTERNET"),
    internetPermissionRequested: permissions.includes("android.permission.INTERNET"),
    allowBackup: manifest.includes('android:allowBackup="true"') ? true : manifest.includes('android:allowBackup="false"') ? false : null,
    fullBackupContentDisabled: manifest.includes('android:fullBackupContent="false"'),
    launcherExported: manifest.includes('android:exported="true"'),
    validationCommands: [
      "npm run generate:android-permissions",
      "npm run validate:android-permissions",
      "npm run validate:android -- --require-aab",
      "npm run validate:privacy-parity"
    ],
    checks,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Android permissions report failed. Report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`Android permissions report written to ${reportPath}`);
}

main();

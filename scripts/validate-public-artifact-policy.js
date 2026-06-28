const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "public-artifact-policy.json");

const checks = [];
const failures = [];

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    fail(relativePath, "required file is missing");
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function record(scope, status, detail) {
  checks.push({ scope, status, detail });
}

function fail(scope, detail) {
  failures.push(`${scope}: ${detail}`);
  record(scope, "fail", detail);
  process.exitCode = 1;
}

function requireIncludes(scope, contents, requiredValues) {
  for (const value of requiredValues) {
    if (contents.includes(value)) {
      record(scope, "pass", `contains ${value}`);
    } else {
      fail(scope, `missing ${value}`);
    }
  }
}

function requireExcludes(scope, contents, forbiddenValues) {
  for (const value of forbiddenValues) {
    if (contents.includes(value)) {
      fail(scope, `must not include ${value}`);
    } else {
      record(scope, "pass", `excludes ${value}`);
    }
  }
}

function main() {
  console.log("Public artifact policy validation");
  console.log("This check proves public automation can publish Play/Android evidence only, while signed release assets remain private.");

  const packageJsonText = read("package.json");
  const androidWorkflow = read(".github/workflows/android-aab.yml");
  const gitignore = read(".gitignore");
  const ownerChecklist = read("docs/release-owner-checklist.md");

  requireIncludes("package.json", packageJsonText, [
    "\"validate:public-artifacts\": \"node scripts/validate-public-artifact-policy.js\"",
    "validate:public-artifacts"
  ]);

  requireIncludes(".github/workflows/android-aab.yml", androidWorkflow, [
    "permissions:",
    "contents: read",
    "Android AAB Check",
    "Validate public Play evidence",
    "npm run validate:proof-product-repository"
  ]);

  requireExcludes(".github/workflows/android-aab.yml", androidWorkflow, [
    "ANDROID_KEYSTORE_BASE64",
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_ALIAS",
    "ANDROID_KEY_PASSWORD",
    "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
    "mobile:sign:aab",
    "apps/mobile/android/gradlew",
    "actions/upload-artifact@v4",
    "validate:play-store-public",
    "app-release-signed.aab",
    "open-cycle-signed-aab",
    "r0adkll/upload-google-play"
  ]);

  requireIncludes(".gitignore", gitignore, [
    "apps/mobile/android/app/build/",
    "apps/mobile/android/**/*.jks",
    "apps/mobile/android/**/*.keystore",
    "apps/mobile/*.aab",
    "*.jks",
    "*.keystore",
    "*.aab",
    "*.apk"
  ]);

  requireIncludes("docs/release-owner-checklist.md", ownerChecklist, [
    "Keep signed AAB files out of public GitHub Actions artifacts",
    "private signing is",
    "handled locally"
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    gitUsed: false,
    networkUsed: false,
    policy: {
      publicArtifactsAllowed: [
        "public Play Console and Android evidence",
        "unsigned Android AAB build evidence"
      ],
      privateArtifactsForbiddenFromPublicAutomation: [
        "upload keystores",
        "keystore passwords",
        "signed Android AAB files",
        "Play service account JSON"
      ]
    },
    checks,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Public artifact policy failed. Report written to ${reportPath}`);
    process.exit(process.exitCode || 1);
  }

  console.log(`Public artifact policy checks passed. Report written to ${reportPath}`);
}

main();

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "release-artifact-hygiene.json");

const requiredGitignoreEntries = [
  "reports/",
  ".env",
  ".env.local",
  "apps/mobile/android/app/build/",
  "apps/mobile/android/**/*.jks",
  "apps/mobile/android/**/*.keystore",
  "apps/mobile/*.jks",
  "apps/mobile/*.keystore",
  "apps/mobile/*.aab",
  "apps/mobile/*.apk",
  "*.jks",
  "*.keystore",
  "*.keystore.*",
  "*.aab",
  "*.apk",
  "*.p12",
  "*.pfx",
  "*.pem",
  "*.key",
  "*.mobileprovision",
  "*.cer"
];

const ignoredDirNames = new Set([
  ".git",
  ".npm-cache",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "reports",
  ".gradle"
]);

const privateArtifactExtensions = new Set([
  ".jks",
  ".keystore",
  ".aab",
  ".apk",
  ".p12",
  ".pfx",
  ".pem",
  ".key",
  ".mobileprovision",
  ".cer"
]);

const allowedPrivateArtifactPaths = [
  path.join("apps", "mobile", "android", "app", "build")
];

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function isAllowedPrivateArtifact(relativePath) {
  return allowedPrivateArtifactPaths.some((allowedPath) =>
    relativePath === allowedPath || relativePath.startsWith(`${allowedPath}${path.sep}`)
  );
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }
  return files;
}

function main() {
  console.log("Release artifact hygiene validation");
  console.log("This check does not use Git and does not read keystores, passwords, tokens, or Play credentials.");

  const gitignorePath = path.join(root, ".gitignore");
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  if (!gitignore) {
    fail("Missing .gitignore.");
  }

  for (const entry of requiredGitignoreEntries) {
    if (!gitignore.includes(entry)) {
      fail(`.gitignore is missing private/generated artifact entry: ${entry}`);
    }
  }

  const privateArtifacts = [];
  for (const file of walk(root)) {
    const relativePath = path.relative(root, file);
    const extension = path.extname(file);
    if (!privateArtifactExtensions.has(extension)) {
      continue;
    }

    const normalized = normalize(relativePath);
    const allowed = isAllowedPrivateArtifact(relativePath);
    privateArtifacts.push({
      path: normalized,
      allowedGeneratedLocation: allowed
    });

    if (!allowed) {
      fail(`Private release artifact appears in a publishable source path: ${normalized}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    gitUsed: false,
    networkUsed: false,
    note: "This report checks ignore rules and artifact file placement without reading secret values.",
    requiredGitignoreEntries,
    privateArtifacts,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Release artifact hygiene failed. Report written to ${reportPath}`);
    process.exit(process.exitCode || 1);
  }

  console.log(`Release artifact hygiene checks passed. Report written to ${reportPath}`);
}

main();

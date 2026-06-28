const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "github-repository-archives.json");
const outputRoot = path.join(root, "dist", "github-repositories");
const expectedArchives = [
  {
    id: "proofProduct",
    repository: "https://github.com/kborndorff/Open-Cycle",
    archive: "Open-Cycle.zip",
    requiredFiles: [
      "README.STAGED-BUNDLE.md",
      "BUNDLE-MANIFEST.json",
      "product-uploads/play-console-submit/manifest.json",
      "site/llms.txt",
      "site/blog/index.html",
      "site/blog/no-account-period-tracker.html",
      "site/blog/period-tracker-without-internet.html"
    ]
  },
  {
    id: "fullSource",
    repository: "https://github.com/kborndorff/open-cycle-source",
    archive: "open-cycle-source.zip",
    requiredFiles: [
      "README.STAGED-BUNDLE.md",
      "BUNDLE-MANIFEST.json",
      "package.json",
      "apps/web/src/App.tsx",
      "apps/mobile/android/app/src/main/AndroidManifest.xml",
      "site/llms.txt",
      "site/blog/no-account-period-tracker.html",
      "site/blog/period-tracker-without-internet.html"
    ]
  }
];

const forbiddenExtensions = [
  ".aab",
  ".apk",
  ".jks",
  ".keystore",
  ".p12",
  ".pfx",
  ".pem",
  ".key"
];

const secretAssignmentPatterns = [
  /(?:^|[ \t])(?:CF_API_TOKEN|CLOUDFLARE_API_TOKEN|CF_ACCOUNT_ID|ANDROID_KEYSTORE_PASSWORD|ANDROID_KEY_PASSWORD|GOOGLE_PLAY_SERVICE_ACCOUNT_JSON|GH_TOKEN|GITHUB_TOKEN|API_KEY|VITE_API_KEY)[ \t]*=[ \t]*["']?[A-Za-z0-9_./+=:-]{12,}/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/
];

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function expandArchive(archivePath, targetDir) {
  const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Expand-Archive -LiteralPath ${quote(archivePath)} -DestinationPath ${quote(targetDir)} -Force`
    ],
    {
      cwd: root,
      encoding: "utf8",
      shell: false
    }
  );
  if (result.status !== 0) {
    fail(`Could not expand archive ${path.relative(root, archivePath)}: ${result.stderr || result.stdout}`);
  }
}

function validateExpandedArchive(expected, targetDir) {
  for (const requiredFile of expected.requiredFiles) {
    if (!fs.existsSync(path.join(targetDir, requiredFile))) {
      fail(`${expected.id} archive is missing required file: ${requiredFile}`);
    }
  }

  const manifestPath = path.join(targetDir, "BUNDLE-MANIFEST.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    if (manifest.repository !== expected.repository) {
      fail(`${expected.id} archive manifest repository mismatch: ${manifest.repository}`);
    }
    if (manifest.privateMaterialIncluded !== false || manifest.signedAabIncluded !== false) {
      fail(`${expected.id} archive manifest must exclude private material and signed AABs.`);
    }
  }

  for (const file of walk(targetDir)) {
    const relativePath = toPosix(path.relative(targetDir, file));
    const normalized = relativePath.toLowerCase();
    if (forbiddenExtensions.some((extension) => normalized.endsWith(extension))) {
      fail(`${expected.id} archive contains private release material: ${relativePath}`);
    }
    if (normalized.includes("local.properties")) {
      fail(`${expected.id} archive contains Android local.properties: ${relativePath}`);
    }
    if (fs.statSync(file).size < 1024 * 1024) {
      const contents = fs.readFileSync(file, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#")) {
          continue;
        }
        if (/^-----BEGIN [A-Z ]*PRIVATE KEY-----$/.test(trimmed)) {
          fail(`${expected.id} archive contains private-key-like material in ${relativePath}.`);
        }
        for (const pattern of secretAssignmentPatterns) {
          if (pattern.test(line)) {
            fail(`${expected.id} archive contains assigned secret-like material in ${relativePath}.`);
          }
        }
      }
    }
  }
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/github-repository-archives.json. Run npm run package:github-repository-bundles.");
} else {
  const report = readJson(reportPath);
  if (report.status !== "pass") {
    fail("GitHub repository archive report status must be pass.");
  }
  if (report.privateMaterialIncluded !== false || report.signedAabIncluded !== false) {
    fail("GitHub repository archive report must exclude private material and signed AABs.");
  }
  if (!Array.isArray(report.archives) || report.archives.length !== expectedArchives.length) {
    fail("GitHub repository archive report must list both upload archives.");
  }

  for (const expected of expectedArchives) {
    const archivePath = path.join(outputRoot, expected.archive);
    if (!fs.existsSync(archivePath)) {
      fail(`Missing GitHub repository upload archive: ${toPosix(path.relative(root, archivePath))}`);
      continue;
    }
    const stats = fs.statSync(archivePath);
    if (stats.size < 1024) {
      fail(`${expected.archive} is unexpectedly small.`);
    }
    const reportEntry = report.archives?.find((archive) => archive.id === expected.id);
    if (!reportEntry) {
      fail(`Archive report is missing ${expected.id}.`);
    } else {
      if (reportEntry.repository !== expected.repository) {
        fail(`${expected.id} archive report repository mismatch.`);
      }
      if (reportEntry.bytes !== stats.size) {
        fail(`${expected.id} archive report byte size is stale.`);
      }
      if (reportEntry.sha256 !== sha256(archivePath)) {
        fail(`${expected.id} archive report SHA-256 is stale.`);
      }
      if (reportEntry.privateMaterialIncluded !== false || reportEntry.signedAabIncluded !== false) {
        fail(`${expected.id} archive report must exclude private material and signed AABs.`);
      }
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `open-cycle-${expected.id}-archive-`));
    try {
      expandArchive(archivePath, tempDir);
      validateExpandedArchive(expected, tempDir);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("GitHub repository upload archive checks passed.");

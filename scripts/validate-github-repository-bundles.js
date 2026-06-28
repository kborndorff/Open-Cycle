const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const outputRoot = path.join(root, "dist", "github-repositories");
const bundles = [
  {
    id: "proofProduct",
    directory: path.join(outputRoot, "Open-Cycle"),
    repository: "https://github.com/kborndorff/Open-Cycle",
    requiredFiles: [
      "BUNDLE-MANIFEST.json",
      "README.STAGED-BUNDLE.md",
      "LICENSE.md",
      "SECURITY.md",
      "site/index.html",
      "site/llms.txt",
      "site/sitemap.xml",
      "site/blog/index.html",
      "site/blog/health-app-data-sharing.html",
      "site/blog/no-account-period-tracker.html",
      "site/blog/period-tracker-without-internet.html",
      "product-uploads/play-console-submit/manifest.json",
      "product-uploads/play-console-submit/visual-review.html",
      "product-uploads/play-console-submit/store-listing/listing.json",
      "product-uploads/play-console-submit/play-console/field-map.md",
      "product-uploads/play-console-submit/evidence/visuals/site-blog-phone.png"
    ],
    requiredText: [
      "proof, security/privacy documentation, store-facing product upload materials",
      "complete inspectable source tree is staged separately",
      "privacy-first period tracking app",
      "Period tracking privacy, in normal words"
    ]
  },
  {
    id: "fullSource",
    directory: path.join(outputRoot, "open-cycle-source"),
    repository: "https://github.com/kborndorff/open-cycle-source",
    requiredFiles: [
      "BUNDLE-MANIFEST.json",
      "README.STAGED-BUNDLE.md",
      "package.json",
      "apps/web/src/App.tsx",
      "apps/mobile/android/app/src/main/AndroidManifest.xml",
      "site/index.html",
      "site/llms.txt",
      "site/blog/index.html",
      "site/blog/no-account-period-tracker.html",
      "site/blog/period-tracker-without-internet.html",
      "scripts/generate-github-repository-bundles.js",
      "scripts/validate-github-repository-bundles.js",
      "tests"
    ],
    requiredText: [
      "Complete inspectable source tree",
      "generated/private release outputs filtered out",
      "privacy-first period tracking app",
      "local phone-only"
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

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ps1",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yml",
  ".yaml",
  ".toml",
  ""
]);

const secretAssignmentPatterns = [
  /(?:^|\s)(?:CF_API_TOKEN|CLOUDFLARE_API_TOKEN|CF_ACCOUNT_ID|ANDROID_KEYSTORE_PASSWORD|ANDROID_KEY_PASSWORD|GOOGLE_PLAY_SERVICE_ACCOUNT_JSON|GH_TOKEN|GITHUB_TOKEN|API_KEY|VITE_API_KEY)\s*=\s*["']?[A-Za-z0-9_./+=:-]{12,}/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/
];

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function walk(directory) {
  const files = [];
  if (!fs.existsSync(directory)) {
    return files;
  }
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

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function requirePath(bundle, relativePath) {
  const absolutePath = path.join(bundle.directory, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`${bundle.id} bundle is missing required path: ${relativePath}`);
  }
}

function checkManifest(bundle) {
  const manifestPath = path.join(bundle.directory, "BUNDLE-MANIFEST.json");
  if (!fs.existsSync(manifestPath)) {
    return;
  }
  const manifest = JSON.parse(readText(manifestPath));
  if (manifest.repository !== bundle.repository) {
    fail(`${bundle.id} manifest repository mismatch: ${manifest.repository}`);
  }
  if (manifest.privateMaterialIncluded !== false || manifest.signedAabIncluded !== false) {
    fail(`${bundle.id} manifest must explicitly exclude private material and signed AABs.`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length < 20) {
    fail(`${bundle.id} manifest does not list enough staged files.`);
  }
}

function checkText(bundle) {
  const combined = [
    path.join(bundle.directory, "README.STAGED-BUNDLE.md"),
    path.join(bundle.directory, "BUNDLE-MANIFEST.json"),
    path.join(bundle.directory, "site", "index.html"),
    path.join(bundle.directory, "site", "blog", "index.html"),
    path.join(bundle.directory, "site", "llms.txt")
  ]
    .filter((file) => fs.existsSync(file))
    .map(readText)
    .join("\n");

  for (const expected of bundle.requiredText) {
    if (!combined.includes(expected)) {
      fail(`${bundle.id} bundle is missing expected text: ${expected}`);
    }
  }
}

function checkFiles(bundle) {
  const files = walk(bundle.directory);
  if (files.length === 0) {
    fail(`${bundle.id} bundle has no files.`);
    return;
  }

  for (const file of files) {
    const relativePath = toPosix(path.relative(bundle.directory, file));
    const normalized = relativePath.toLowerCase();
    if (forbiddenExtensions.some((extension) => normalized.endsWith(extension))) {
      fail(`${bundle.id} bundle contains private release material: ${relativePath}`);
    }
    if (normalized.includes("local.properties")) {
      fail(`${bundle.id} bundle contains Android local.properties: ${relativePath}`);
    }

    const extension = path.extname(file).toLowerCase();
    if (textExtensions.has(extension) && fs.statSync(file).size < 1024 * 1024) {
      const contents = readText(file);
      for (const line of contents.split(/\r?\n/)) {
        if (/^-----BEGIN [A-Z ]*PRIVATE KEY-----$/.test(line.trim())) {
          fail(`${bundle.id} bundle has private-key-like material in ${relativePath}.`);
        }
      }
      for (const pattern of secretAssignmentPatterns) {
        if (pattern.test(contents)) {
          fail(`${bundle.id} bundle has assigned secret-like material in ${relativePath}.`);
        }
      }
    }
  }
}

function checkPlaySubmitBundle(bundle) {
  const manifestPath = path.join(bundle.directory, "product-uploads", "play-console-submit", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return;
  }
  const manifest = JSON.parse(readText(manifestPath));
  if (manifest.status !== "public-safe-play-console-submit-bundle") {
    fail(`${bundle.id} Play submit manifest has unexpected status.`);
  }
  if (manifest.signedAabIncluded !== false || manifest.privateMaterialIncluded !== false) {
    fail(`${bundle.id} Play submit bundle must not include private material or signed AABs.`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length < 40) {
    fail(`${bundle.id} Play submit bundle does not include expected store upload files.`);
  } else {
    const bundleRoot = path.dirname(manifestPath);
    for (const file of manifest.files) {
      const targetPath = path.join(bundleRoot, file.target || "");
      if (!file.target || !fs.existsSync(targetPath)) {
        fail(`${bundle.id} Play submit bundle is missing manifest target: ${file.target}`);
        continue;
      }
      const stats = fs.statSync(targetPath);
      if (stats.size !== file.bytes) {
        fail(`${bundle.id} Play submit bundle byte count mismatch for ${file.target}.`);
      }
      if (sha256(targetPath) !== file.sha256) {
        fail(`${bundle.id} Play submit bundle checksum mismatch for ${file.target}.`);
      }
    }
  }
}

for (const bundle of bundles) {
  if (!fs.existsSync(bundle.directory)) {
    fail(`Missing GitHub repository staging bundle: ${bundle.directory}`);
    continue;
  }
  for (const relativePath of bundle.requiredFiles) {
    requirePath(bundle, relativePath);
  }
  checkManifest(bundle);
  checkText(bundle);
  checkFiles(bundle);
  checkPlaySubmitBundle(bundle);
}

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "pass" : "fail",
  outputRoot: toPosix(path.relative(root, outputRoot)),
  repositories: bundles.map((bundle) => ({
    id: bundle.id,
    repository: bundle.repository,
    directory: toPosix(path.relative(root, bundle.directory))
  })),
  privateMaterialIncluded: false,
  signedAabIncluded: false,
  failures
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "github-repository-bundles.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length > 0) {
  process.exit(process.exitCode || 1);
}

console.log("GitHub repository staging bundle checks passed.");

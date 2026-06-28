const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const failures = [];

const requiredRootFiles = [
  "README.md",
  "LICENSE.md",
  "SECURITY.md",
  "package.json",
  ".github/workflows/ci.yml",
  ".github/workflows/android-aab.yml",
  ".github/workflows/deploy-site.yml"
];

const requiredSiteFiles = [
  "site/index.html",
  "site/privacy.html",
  "site/license.html",
  "site/llms.txt",
  "site/sitemap.xml",
  "site/blog/index.html",
  "site/blog/local-only-period-tracker.html",
  "site/blog/health-app-data-sharing.html",
  "site/blog/period-tracker-privacy-questions.html",
  "site/blog/no-account-period-tracker.html",
  "site/blog/period-tracker-without-internet.html"
];

const requiredProductFiles = [
  "manifest.json",
  "README.md",
  "visual-review.html",
  "store-listing/listing.json",
  "store-listing/release-notes.txt",
  "play-console/field-map.md",
  "play-console/data-safety-packet.md",
  "play-console/content-rating-packet.md",
  "play-console/health-declaration-packet.md",
  "play-console/app-access-packet.md",
  "play-console/ads-declaration-packet.md",
  "play-console/target-audience-packet.md",
  "play-console/testing-rollout-packet.md",
  "play-console/app-content-packet.md",
  "play-console/release-candidate-packet.md",
  "play-console/upload-packet.md",
  "evidence/play-store-preflight.json",
  "evidence/android-permissions.json",
  "evidence/visual-evidence-manifest.json",
  "evidence/emulator-qa-report.json",
  "evidence/visuals/site-desktop.png",
  "evidence/visuals/site-phone.png",
  "evidence/visuals/site-blog-desktop.png",
  "evidence/visuals/site-blog-phone.png",
  "evidence/visuals/app-desktop.png",
  "evidence/visuals/app-phone.png",
  "evidence/visuals/android-emulator-app.png",
  "evidence/visuals/android-emulator-saved-entry.png",
  "graphics/app-icon.png",
  "graphics/feature-graphic.png",
  "graphics/phone-screenshot-1.png",
  "graphics/phone-screenshot-2.png",
  "graphics/phone-screenshot-3.png",
  "graphics/phone-screenshot-4.png"
];

const requiredText = {
  "README.md": [
    "privacy-first period tracking app",
    "source-available, not open source",
    "store cycle entries in browser/device storage only",
    "https://github.com/kborndorff/open-cycle-source"
  ],
  "LICENSE.md": [
    "source-available license, not an open-source license",
    "Public visibility does not grant permission to profit from this work",
    "commercial reuse",
    "third-party app store redistribution"
  ],
  "SECURITY.md": ["No Android internet permission", "User cycle data"],
  "package.json": [
    "LicenseRef-OpenCycle-Source-Available",
    "https://github.com/kborndorff/open-cycle-source",
    "validate:proof-product-repository"
  ],
  ".github/workflows/ci.yml": [
    "npm run validate:proof-product-repository",
    "npm run build:site",
    "npm run validate:site"
  ],
  ".github/workflows/android-aab.yml": [
    "Android AAB Check",
    "Validate public Play evidence",
    "npm run validate:proof-product-repository"
  ],
  ".github/workflows/deploy-site.yml": [
    "open-cycle-site",
    "pages deploy site/dist",
    "npm run validate:custom-domain:live"
  ],
  "site/index.html": [
    "privacy-first period tracking app",
    "local phone-only",
    "/blog/no-account-period-tracker.html",
    "/blog/period-tracker-without-internet.html",
    "https://local-cycle.com"
  ],
  "site/llms.txt": [
    "privacy-first period tracking app",
    "phone or browser",
    "https://open-cycle.com/blog/",
    "https://github.com/kborndorff/open-cycle-source",
    "https://github.com/kborndorff/Open-Cycle"
  ],
  "site/license.html": [
    "source-available, not open source",
    "public so people can inspect, audit, learn from, and verify",
    "Public visibility does not grant permission to profit from this work"
  ]
};

const forbiddenPrivateExtensions = [
  ".aab",
  ".apk",
  ".jks",
  ".keystore",
  ".p12",
  ".pfx",
  ".pem",
  ".key"
];

const forbiddenAssignedSecrets = [
  "CF_API_TOKEN",
  "CF_ACCOUNT_ID",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_PASSWORD",
  "ANDROID_KEYSTORE_PATH",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
  "API_KEY",
  "VITE_API_KEY"
];

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function abs(relativePath) {
  return path.join(root, relativePath);
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function read(relativePath) {
  return fs.readFileSync(abs(relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(abs(relativePath));
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

function isPlaceholder(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, "");
  return (
    normalized === "" ||
    normalized === "..." ||
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized.includes("${{") ||
    normalized.toLowerCase().includes("\\path\\") ||
    normalized.toLowerCase().includes("/path/") ||
    normalized.toLowerCase().includes("placeholder") ||
    normalized.toLowerCase().includes("optional")
  );
}

function checkRequiredFile(relativePath) {
  if (!exists(relativePath)) {
    fail(`Missing required proof/product file: ${relativePath}`);
    return false;
  }
  return true;
}

function checkExpectedText(relativePath, expectedValues) {
  if (!checkRequiredFile(relativePath)) {
    return;
  }
  const contents = read(relativePath);
  for (const expected of expectedValues) {
    if (!includesNormalized(contents, expected)) {
      fail(`${relativePath} is missing expected proof/product content: ${expected}`);
    }
  }
}

function checkNoAssignedSecrets(relativePath) {
  const contents = read(relativePath);
  const lines = contents.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#") || line.startsWith("//") || line.startsWith("*")) {
      continue;
    }

    for (const name of forbiddenAssignedSecrets) {
      const match = new RegExp(`^(?:export\\s+|\\$env:)?${name}\\s*=\\s*([^\\s#]+)`).exec(line);
      if (match && !isPlaceholder(match[1])) {
        fail(`Possible committed secret in ${relativePath}:${index + 1} (${name}).`);
      }
    }
  }
}

function walkFiles(relativePath, files = []) {
  const fullPath = abs(relativePath);
  if (!fs.existsSync(fullPath)) {
    return files;
  }
  const stats = fs.statSync(fullPath);
  if (stats.isFile()) {
    files.push(relativePath);
    return files;
  }
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }
    walkFiles(path.join(relativePath, entry.name), files);
  }
  return files;
}

function checkNoPrivateFiles(relativePaths) {
  for (const relativePath of relativePaths) {
    for (const file of walkFiles(relativePath)) {
      const normalized = toPosix(file).toLowerCase();
      if (forbiddenPrivateExtensions.some((extension) => normalized.endsWith(extension))) {
        fail(`Proof/product repository must not contain private release material: ${file}`);
      }
      if (normalized.endsWith("/local.properties") || normalized === "local.properties") {
        fail(`Proof/product repository must not contain Android local.properties: ${file}`);
      }
    }
  }
}

function productRoot() {
  if (exists("product-uploads/play-console-submit/manifest.json")) {
    return "product-uploads/play-console-submit";
  }
  if (exists("dist/play-console-submit/manifest.json")) {
    return "dist/play-console-submit";
  }
  fail("Missing Play Console submit bundle. Run npm run generate:play-console-submit-bundle before publishing.");
  return "product-uploads/play-console-submit";
}

function readJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

function checkProductUploads(base) {
  for (const file of requiredProductFiles) {
    checkRequiredFile(path.join(base, file));
  }

  const manifestPath = path.join(base, "manifest.json");
  const manifest = readJson(manifestPath);
  if (manifest.status !== "public-safe-play-console-submit-bundle") {
    fail("Play Console submit manifest must be marked public-safe-play-console-submit-bundle.");
  }
  if (manifest.privateMaterialIncluded !== false || manifest.signedAabIncluded !== false) {
    fail("Play Console submit manifest must exclude private material and signed AABs.");
  }

  const listingPath = path.join(base, "store-listing", "listing.json");
  const listing = readJson(listingPath);
  const listingText = JSON.stringify(listing).toLowerCase();
  for (const expected of ["open-cycle", "no ads", "no account", "local", "privacy"]) {
    if (!listingText.includes(expected)) {
      fail(`Store listing is missing expected plain-language content: ${expected}`);
    }
  }

  const preflight = readJson(path.join(base, "evidence", "play-store-preflight.json"));
  if (preflight.privateMaterialIncluded === true || preflight.signedAabIncluded === true) {
    fail("Play Store preflight evidence must not include private material or signed AABs.");
  }

  const permissions = readJson(path.join(base, "evidence", "android-permissions.json"));
  if (permissions.internetPermissionRequested !== false) {
    fail("Android permissions evidence must show internetPermissionRequested=false.");
  }
}

function main() {
  console.log("OpenCycle proof/product repository validation");
  console.log("This check validates public proof, SEO/site files, store upload materials, and secret-safe boundaries.");

  for (const file of [...requiredRootFiles, ...requiredSiteFiles]) {
    checkRequiredFile(file);
  }
  for (const [relativePath, expectedValues] of Object.entries(requiredText)) {
    checkExpectedText(relativePath, expectedValues);
  }

  const uploadRoot = productRoot();
  checkProductUploads(uploadRoot);

  const publicRoots = [
    ...requiredRootFiles,
    "docs",
    "scripts",
    "site",
    "store-assets",
    uploadRoot
  ];
  checkNoPrivateFiles(publicRoots);

  for (const file of [
    ...requiredRootFiles,
    ...requiredSiteFiles,
    path.join(uploadRoot, "manifest.json"),
    path.join(uploadRoot, "store-listing", "listing.json"),
    path.join(uploadRoot, "play-console", "field-map.md")
  ]) {
    if (exists(file)) {
      checkNoAssignedSecrets(file);
    }
  }

  if (uploadRoot.startsWith("product-uploads") && exists("apps")) {
    fail("Proof/product repository must not include the private full-source apps directory.");
  }

  if (process.exitCode) {
    process.exit(process.exitCode);
  }

  console.log("Proof/product repository checks passed.");
}

main();

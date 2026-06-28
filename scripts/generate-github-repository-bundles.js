const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const outputRoot = path.join(root, "dist", "github-repositories");
const proofRepo = path.join(outputRoot, "Open-Cycle");
const sourceRepo = path.join(outputRoot, "open-cycle-source");
const playSubmitBundle = path.join(root, "dist", "play-console-submit");

const rootFiles = [
  ".env.example",
  ".gitignore",
  "LICENSE.md",
  "README.md",
  "SECURITY.md",
  "package-lock.json",
  "package.json",
  "playwright.config.ts",
  "wrangler.toml"
];

const proofDirs = [".github", "docs", "scripts", "site", "store-assets"];
const sourceDirs = [".github", "apps", "deploy", "docs", "scripts", "site", "store-assets", "tests"];

const excludedDirectoryNames = new Set([
  ".git",
  ".gradle",
  ".gradle-temp",
  ".npm-cache",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "reports"
]);

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

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function assertPublicFile(relativePath) {
  const normalized = toPosix(relativePath).toLowerCase();
  if (forbiddenPrivateExtensions.some((extension) => normalized.endsWith(extension))) {
    throw new Error(`Refusing to stage private release material: ${relativePath}`);
  }
  if (normalized.includes("/local.properties") || normalized.endsWith("/local.properties")) {
    throw new Error(`Refusing to stage Android local.properties: ${relativePath}`);
  }
}

function shouldSkipDirectory(relativePath) {
  const parts = toPosix(relativePath).split("/").filter(Boolean);
  return parts.some((part) => excludedDirectoryNames.has(part));
}

function copyFile(source, target, files, bundleRoot) {
  const relativePath = toPosix(path.relative(bundleRoot, target));
  assertPublicFile(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  const stats = fs.statSync(target);
  files.push({
    path: relativePath,
    bytes: stats.size,
    sha256: sha256(target)
  });
}

function copyTree(source, target, files, bundleRoot, options = {}) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing staging source: ${path.relative(root, source)}`);
  }
  const sourceStats = fs.statSync(source);
  if (sourceStats.isFile()) {
    copyFile(source, target, files, bundleRoot);
    return;
  }
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourceEntry = path.join(source, entry.name);
    const targetEntry = path.join(target, entry.name);
    const relativeSource = path.relative(root, sourceEntry);
    const entryStats = entry.isDirectory() || entry.isFile()
      ? null
      : fs.statSync(sourceEntry);
    const isDirectory = entry.isDirectory() || Boolean(entryStats?.isDirectory());
    const isFile = entry.isFile() || Boolean(entryStats?.isFile());

    if (isDirectory) {
      if (options.skipExcludedDirectories !== false && shouldSkipDirectory(relativeSource)) {
        continue;
      }
      copyTree(sourceEntry, targetEntry, files, bundleRoot, options);
      continue;
    }
    if (isFile) {
      copyFile(sourceEntry, targetEntry, files, bundleRoot);
    }
  }
}

function writeReadme(target, title, lines) {
  fs.writeFileSync(
    path.join(target, "README.STAGED-BUNDLE.md"),
    [`# ${title}`, "", ...lines, ""].join("\n"),
    "utf8"
  );
}

function writeManifest(target, manifest) {
  fs.writeFileSync(path.join(target, "BUNDLE-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function stageRepository(target, dirs, repository, purpose) {
  const files = [];
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });

  for (const file of rootFiles) {
    copyTree(path.join(root, file), path.join(target, file), files, target);
  }
  for (const directory of dirs) {
    copyTree(path.join(root, directory), path.join(target, directory), files, target);
  }

  return {
    generatedAt: new Date().toISOString(),
    repository,
    purpose,
    privateMaterialIncluded: false,
    signedAabIncluded: false,
    files
  };
}

function requirePlaySubmitBundle() {
  const manifestPath = path.join(playSubmitBundle, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Missing dist/play-console-submit/manifest.json. Run npm run generate:play-console-submit-bundle first.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.signedAabIncluded !== false || manifest.privateMaterialIncluded !== false) {
    throw new Error("Play Console submit bundle is not marked public-safe.");
  }
}

function verifyCopiedPlaySubmitBundle(target) {
  const manifestPath = path.join(target, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Copied Play Console submit bundle is missing manifest.json.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.files) || manifest.files.length < 40) {
    throw new Error("Copied Play Console submit bundle manifest does not list the expected upload files.");
  }
  for (const file of manifest.files) {
    const targetPath = path.join(target, file.target || "");
    if (!file.target || !fs.existsSync(targetPath)) {
      throw new Error(`Copied Play Console submit bundle is missing manifest target: ${file.target}`);
    }
    const stats = fs.statSync(targetPath);
    if (stats.size !== file.bytes) {
      throw new Error(`Copied Play Console submit bundle byte count mismatch for ${file.target}.`);
    }
    if (sha256(targetPath) !== file.sha256) {
      throw new Error(`Copied Play Console submit bundle checksum mismatch for ${file.target}.`);
    }
  }
}

function main() {
  requirePlaySubmitBundle();
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  const proofManifest = stageRepository(
    proofRepo,
    proofDirs,
    "https://github.com/kborndorff/Open-Cycle",
    "Public proof, security/privacy documentation, store-facing product upload materials, release helpers, and public-safe evidence."
  );
  const copiedPlaySubmitBundle = path.join(proofRepo, "product-uploads", "play-console-submit");
  copyTree(playSubmitBundle, copiedPlaySubmitBundle, proofManifest.files, proofRepo, {
    skipExcludedDirectories: false
  });
  verifyCopiedPlaySubmitBundle(copiedPlaySubmitBundle);
  writeReadme(proofRepo, "Open-Cycle proof/product staging bundle", [
    "Upload this folder to kborndorff/Open-Cycle when publishing public proof, security/privacy docs, store-facing Play Console materials, and release evidence.",
    "",
    "This staged bundle intentionally excludes signed AABs, keystores, passwords, Play Console credentials, Cloudflare tokens, GitHub tokens, private screenshots, and unredacted private reports.",
    "",
    "The complete inspectable source tree is staged separately in dist/github-repositories/open-cycle-source."
  ]);
  proofManifest.files.sort((a, b) => a.path.localeCompare(b.path));
  writeManifest(proofRepo, proofManifest);

  const sourceManifest = stageRepository(
    sourceRepo,
    sourceDirs,
    "https://github.com/kborndorff/open-cycle-source",
    "Complete inspectable source tree with generated/private release outputs filtered out."
  );
  writeReadme(sourceRepo, "open-cycle-source staging bundle", [
    "Upload this folder to kborndorff/open-cycle-source when publishing the complete inspectable source tree.",
    "",
    "This staged bundle intentionally excludes node_modules, build outputs, reports, signed AABs, keystores, passwords, Play Console credentials, Cloudflare tokens, GitHub tokens, private screenshots, and generated dist folders.",
    "",
    "Public proof and store-facing upload materials are staged separately in dist/github-repositories/Open-Cycle."
  ]);
  sourceManifest.files.sort((a, b) => a.path.localeCompare(b.path));
  writeManifest(sourceRepo, sourceManifest);

  console.log(`GitHub repository staging bundles written to ${outputRoot}`);
  console.log(`Proof/product files: ${proofManifest.files.length}`);
  console.log(`Full-source files: ${sourceManifest.files.length}`);
}

main();

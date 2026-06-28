const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const releaseNotesPath = path.join(root, "store-assets", "play", "release-notes.txt");
const gradlePath = path.join(root, "apps", "mobile", "android", "app", "build.gradle");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(releaseNotesPath)) {
  fail("Missing store-assets/play/release-notes.txt. Run npm run generate:play-release-notes.");
} else {
  const notes = fs.readFileSync(releaseNotesPath, "utf8").trim();
  const gradle = fs.existsSync(gradlePath) ? fs.readFileSync(gradlePath, "utf8") : "";
  const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];

  if (!notes) {
    fail("Play release notes must not be empty.");
  }
  if (notes.length > 500) {
    fail("Play release notes must be 500 characters or fewer.");
  }
  if (versionName && !notes.includes(versionName)) {
    fail("Play release notes must include the Android versionName.");
  }
  for (const expected of ["Free local cycle logging", "no account", "hidden tracking", "Cycle data stays"]) {
    if (!notes.includes(expected)) {
      fail(`Play release notes are missing expected local-only wording: ${expected}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play release notes checks passed.");

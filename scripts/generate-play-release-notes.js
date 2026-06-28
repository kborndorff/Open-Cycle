const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const outDir = path.join(root, "store-assets", "play");
const releaseNotesPath = path.join(outDir, "release-notes.txt");
const gradlePath = path.join(root, "apps", "mobile", "android", "app", "build.gradle");

function readVersionName() {
  if (!fs.existsSync(gradlePath)) {
    return "1.0";
  }
  const gradle = fs.readFileSync(gradlePath, "utf8");
  return /versionName\s+"([^"]+)"/.exec(gradle)?.[1] || "1.0";
}

const versionName = readVersionName();
const notes = [
  `open-cycle ${versionName}`,
  "",
  "- Free local cycle logging with no account, ads, hidden tracking, or cloud sync.",
  "- Cycle data stays on your device for core tracking.",
  "- Public source and privacy policy are available for review."
].join("\n");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(releaseNotesPath, `${notes}\n`, "utf8");
console.log(`Generated Play release notes at ${releaseNotesPath}`);

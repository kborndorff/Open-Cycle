const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "runtime-qa-report.md");
const signedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");
const force = process.argv.includes("--force");

function fileSha256(file) {
  if (!fs.existsSync(file)) {
    return "pending-signed-aab";
  }
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileSize(file) {
  if (!fs.existsSync(file)) {
    return "pending-signed-aab";
  }
  return String(fs.statSync(file).size);
}

const report = [
  "# Runtime QA report",
  "",
  "This report is intended for the private signed Play candidate. It should not include keystore paths, signing passwords, Cloudflare tokens, or Play Console credentials.",
  "",
  "## Candidate",
  "",
  `- Signed AAB present: ${fs.existsSync(signedAabPath) ? "yes" : "no"}`,
  `- Signed AAB SHA-256: ${fileSha256(signedAabPath)}`,
  `- Signed AAB size bytes: ${fileSize(signedAabPath)}`,
  "- Tester/device: TODO",
  "- Test date: TODO",
  "",
  "## Install and launch",
  "",
  "- [ ] Installed signed candidate through Play internal testing, bundletool, or Android Studio.",
  "- [ ] Confirmed `npm run validate:android -- --require-signed` passed for this signed candidate.",
  "- [ ] Launched app with airplane mode enabled.",
  "- [ ] App opened without login, account creation, or network prompt.",
  "",
  "## Local-only tracking",
  "",
  "- [ ] Added a cycle entry with date, flow, symptoms, mood, and notes.",
  "- [ ] Closed and reopened the app.",
  "- [ ] Confirmed the cycle entry remained visible.",
  "- [ ] Updated the flow.",
  "- [ ] Confirmed the updated flow remained after another close/reopen.",
  "- [ ] Deleted the cycle entry.",
  "- [ ] Confirmed the cycle entry stayed deleted after another close/reopen.",
  "- [ ] Added two cycle entries, cleared all local entries, and confirmed both were removed.",
  "",
  "## Privacy and permissions",
  "",
  "- [ ] Confirmed Android app info shows no network-facing permission requested by the public build.",
  "- [ ] Confirmed Android app info does not list Internet permission (`android.permission.INTERNET`).",
  "- [ ] Confirmed no location permission prompt appeared.",
  "- [ ] Confirmed no account, contact, photos, media, or notification permission prompt appeared.",
  "- [ ] Confirmed no analytics, crash reporting, ad, push notification, or cloud sync prompt appeared.",
  "- [ ] Confirmed Android backup remains disabled in validation output.",
  "",
  "## Optional Local Cycle link",
  "",
  "- [ ] Confirmed core cycle log remains usable without Local Cycle.",
  "- [ ] Opened visible Local Cycle link manually.",
  "- [ ] Confirmed Local Cycle link is optional and outside core tracking.",
  "",
  "## Store evidence",
  "",
  "- [ ] Captured at least two phone screenshots after adding sample local cycle entries.",
  "- [ ] Recorded signed AAB validation command output.",
  "",
  "## Notes",
  "",
  "TODO",
  ""
].join("\n");

fs.mkdirSync(reportsDir, { recursive: true });
if (fs.existsSync(reportPath) && !force) {
  const existing = fs.readFileSync(reportPath, "utf8");
  const migrated = existing
    .replace("Added a ride with date, route name, distance, duration, and notes.", "Added a cycle entry with date, flow, symptoms, mood, and notes.")
    .replace("Confirmed the ride remained visible.", "Confirmed the cycle entry remained visible.")
    .replace("Renamed the ride.", "Updated the flow.")
    .replace("Confirmed the updated name remained after another close/reopen.", "Confirmed the updated flow remained after another close/reopen.")
    .replace("Deleted the ride.", "Deleted the cycle entry.")
    .replace("Confirmed the ride stayed deleted after another close/reopen.", "Confirmed the cycle entry stayed deleted after another close/reopen.")
    .replace("## OpenCycle redirect", "## Optional Local Cycle link")
    .replace("Confirmed core ride log remains usable without OpenCycle.", "Confirmed core cycle log remains usable without Local Cycle.")
    .replace("Confirmed core cycle log remains usable without OpenCycle.", "Confirmed core cycle log remains usable without Local Cycle.")
    .replace("Opened visible OpenCycle link manually.", "Opened visible Local Cycle link manually.")
    .replace("Confirmed OpenCycle link is optional and outside core tracking.", "Confirmed Local Cycle link is optional and outside core tracking.")
    .replace("after adding sample local rides.", "after adding sample local cycle entries.");
  const withSignedAabSize = migrated.includes("Signed AAB size bytes:")
    ? migrated
    : migrated.replace(
      /^- Signed AAB SHA-256:.*$/m,
      (line) => `${line}\n- Signed AAB size bytes: ${fileSize(signedAabPath)}`
    );
  const withSignedValidation = withSignedAabSize.includes("validate:android -- --require-signed")
    ? withSignedAabSize
    : withSignedAabSize.replace(
      "- [ ] Installed signed candidate through Play internal testing, bundletool, or Android Studio.",
      "- [ ] Installed signed candidate through Play internal testing, bundletool, or Android Studio.\n- [ ] Confirmed `npm run validate:android -- --require-signed` passed for this signed candidate."
    );
  const withInternetPermission = withSignedValidation.includes("android.permission.INTERNET")
    ? withSignedValidation
    : withSignedValidation.replace(
      "- [ ] Confirmed Android app info shows no network-facing permission requested by the public build.",
      "- [ ] Confirmed Android app info shows no network-facing permission requested by the public build.\n- [ ] Confirmed Android app info does not list Internet permission (`android.permission.INTERNET`)."
    );
  const withNoTrackingPrompts = withInternetPermission.includes("analytics, crash reporting, ad, push notification, or cloud sync")
    ? withInternetPermission
    : withInternetPermission.replace(
      "- [ ] Confirmed no account, contact, photos, media, or notification permission prompt appeared.",
      "- [ ] Confirmed no account, contact, photos, media, or notification permission prompt appeared.\n- [ ] Confirmed no analytics, crash reporting, ad, push notification, or cloud sync prompt appeared."
    );
  const withClearAll = withNoTrackingPrompts.includes("cleared all local entries")
    ? withNoTrackingPrompts
    : withNoTrackingPrompts.replace(
      "- [ ] Confirmed the cycle entry stayed deleted after another close/reopen.",
      "- [ ] Confirmed the cycle entry stayed deleted after another close/reopen.\n- [ ] Added two cycle entries, cleared all local entries, and confirmed both were removed."
    );
  if (withClearAll !== existing) {
    fs.writeFileSync(reportPath, withClearAll, "utf8");
    console.log(`Runtime QA report updated with cycle-entry wording at ${reportPath}.`);
    process.exit(0);
  }
  console.log(`Runtime QA report already exists at ${reportPath}. Not overwriting; pass --force to regenerate the template.`);
  process.exit(0);
}
fs.writeFileSync(reportPath, report, "utf8");
console.log(`Runtime QA report template written to ${reportPath}`);

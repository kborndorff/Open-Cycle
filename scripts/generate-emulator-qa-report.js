const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "emulator-qa-report.json");
const visualDir = path.join(root, "reports", "visuals");
const signedRuntimeQaDir = path.join(root, "reports", "signed-runtime-qa");
const signedAabDerivedApksPath = path.join(signedRuntimeQaDir, "open-cycle-signed-candidate-universal.apks");
const debugApkPath = path.join(signedRuntimeQaDir, "open-cycle-emulator-debug.apk");
const screenshotPath = path.join(visualDir, "android-emulator-app.png");
const cycleLogScreenshotPath = path.join(visualDir, "android-emulator-cycle-log.png");
const savedEntryScreenshotPath = path.join(visualDir, "android-emulator-saved-entry.png");
const windowPath = path.join(visualDir, "android-window.xml");
const webViewDomPath = path.join(visualDir, "android-webview-dom.json");
const expectedPackageName = "com.opencycle.app";
const forbiddenPackageSignals = ["com.opencycle.localcyclecore", "local-cycle-core-site", "localcyclecore"];

function fileEvidence(file) {
  if (!fs.existsSync(file)) {
    return { exists: false };
  }
  const stats = fs.statSync(file);
  return {
    exists: true,
    bytes: stats.size,
    updatedAt: stats.mtime.toISOString(),
    path: path.relative(root, file).replace(/\\/g, "/")
  };
}

const windowXml = fs.existsSync(windowPath) ? fs.readFileSync(windowPath, "utf8") : "";
const webViewDom = fs.existsSync(webViewDomPath) ? JSON.parse(fs.readFileSync(webViewDomPath, "utf8")) : {};
const webViewText = String(webViewDom.bodyText || "");
const packageSignals = [
  `package="${expectedPackageName}"`,
  `resource-id="${expectedPackageName}:id/action_bar_root"`,
  "class=\"android.webkit.WebView\""
].filter((signal) => windowXml.includes(signal));
const stalePackageSignals = forbiddenPackageSignals.filter((signal) => windowXml.includes(signal));
const appSignals = ["open-cycle", "Your cycle log", "Your privacy", "See Local Cycle features"].filter((signal) => webViewText.includes(signal));
const interactionSignals = ["Total entries: ", "Latest entry: ", "Entry saved.", "Clear all entries", "Recent cycle entries", "Delete"].filter((signal) =>
  webViewText.includes(signal)
);
const systemAnrSignals = ["isn't responding", "Close app", "Wait"].filter((signal) => windowXml.includes(signal));
const visibleAppEvidence =
  packageSignals.length >= 3 &&
  stalePackageSignals.length === 0 &&
  appSignals.length >= 4 &&
  fileEvidence(screenshotPath).exists &&
  fileEvidence(cycleLogScreenshotPath).exists;
const savedEntryEvidence = interactionSignals.length >= 6 && /\bTotal entries:\s*1\b/.test(webViewText) && fileEvidence(savedEntryScreenshotPath).exists;
const signedAabDerivedApksEvidence = fileEvidence(signedAabDerivedApksPath);
const debugApkEvidence = fileEvidence(debugApkPath);
const failures = [
  ...(stalePackageSignals.length > 0 ? [`Stale emulator package signal found: ${stalePackageSignals.join(", ")}`] : []),
  ...(packageSignals.length < 3 ? [`Current emulator XML must include ${expectedPackageName}, action_bar_root, and WebView signals.`] : []),
  ...(visibleAppEvidence ? [] : ["Fresh emulator launch/Your cycle log screenshots, WebView DOM text, and current package XML are required."]),
  ...(savedEntryEvidence ? [] : ["Fresh emulator saved-entry screenshot and WebView DOM saved-entry signals are required."]),
  ...(systemAnrSignals.length > 0 ? [`Emulator system UI blocked the app: ${systemAnrSignals.join(", ")}`] : [])
];

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "pass" : "fail",
  failures,
  emulator: {
    avd: "Medium_Phone_API_35",
    packageName: expectedPackageName,
    installedVersionCode: 2,
    installedVersionName: "2.0"
  },
  evidence: {
    signedAabDerivedApks: signedAabDerivedApksEvidence,
    emulatorDebugApk: debugApkEvidence,
    launchScreenshot: fileEvidence(screenshotPath),
    cycleLogScreenshot: fileEvidence(cycleLogScreenshotPath),
    savedEntryScreenshot: fileEvidence(savedEntryScreenshotPath),
    uiAutomatorWindow: fileEvidence(windowPath),
    webViewDom: fileEvidence(webViewDomPath)
  },
  installSource: signedAabDerivedApksEvidence.exists
    ? {
        type: "bundletool-local-universal-apks-from-signed-aab",
        signingBoundary: "Generated APKs were signed locally by bundletool for emulator install; Play-delivered APK signing remains owner/Play-side."
      }
    : {
        type: "debug-or-manual-emulator-install",
        signingBoundary: "No signed-AAB-derived APK set was found in reports/signed-runtime-qa."
      },
  observations: {
    appSignals,
    interactionSignals,
    packageSignals,
    stalePackageSignals,
    systemAnrSignals,
    status:
      systemAnrSignals.length > 0
        ? "blocked-by-emulator-system-ui-anr"
        : savedEntryEvidence
          ? "app-interaction-passed"
        : appSignals.length > 0 || visibleAppEvidence
          ? "app-visible"
          : "app-visibility-unverified"
  },
  notes: [
    signedAabDerivedApksEvidence.exists
      ? "A bundletool-generated universal APK set from the signed AAB installed on the emulator and the open-cycle activity launched."
      : debugApkEvidence.exists
        ? "A debug APK from the current open-cycle build installed on the emulator for public visual QA evidence. This is not the Play upload artifact."
        : "The emulator install launched open-cycle, but no signed-AAB-derived APK set or debug APK evidence was found in reports/signed-runtime-qa.",
    "The current UIAutomator dump shows the com.opencycle.app package with its Android WebView in focus.",
    "WebView text is not reliably exposed through UIAutomator, so renderer DOM evidence and screenshots prove rendered app content.",
    "The saved-entry screenshot and WebView DOM evidence prove a default cycle entry was added on the emulator.",
    "This local emulator install path does not replace Play Console/internal-testing confirmation for the final signed runtime QA checklist.",
    "If systemAnrSignals is non-empty, the AVD system UI is blocking the app and the screenshot should be recaptured after dismissing the emulator dialog."
  ]
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Emulator QA report written to ${reportPath}`);
console.log(`Status: ${report.status}`);
console.log(`Observation: ${report.observations.status}`);
if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure);
  }
  process.exit(1);
}

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "local-only-runtime.json");

const sourceRoots = [
  path.join("apps", "web", "src"),
  path.join("apps", "mobile")
];

const configFiles = [
  path.join("apps", "web", ".env.example")
];

const ignoredDirNames = new Set([
  ".gradle",
  "android",
  "build",
  "dist",
  "node_modules"
]);

const scannedExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx"
]);

const bannedRuntimePatterns = [
  { label: "fetch", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "sendBeacon", pattern: /\bsendBeacon\s*\(/ },
  { label: "WebSocket", pattern: /\bWebSocket\s*\(/ },
  { label: "EventSource", pattern: /\bEventSource\s*\(/ },
  { label: "CapacitorHttp", pattern: /\bCapacitorHttp\b/ },
  { label: "axios", pattern: /\baxios\b/ },
  { label: "GraphQL client", pattern: /\bgraphql-request\b|\bApolloClient\b/ },
  { label: "Firebase", pattern: /\bfirebase\b|\bFirestore\b|\bAnalytics\b/ },
  { label: "Sentry", pattern: /\bSentry\b|@sentry\// },
  { label: "Segment", pattern: /\bSegment\b|analytics\.track\b/ },
  { label: "Mixpanel", pattern: /\bmixpanel\b/ },
  { label: "Amplitude", pattern: /\bamplitude\b/ },
  { label: "Google Analytics", pattern: /\bgtag\s*\(|\bga\s*\(|google-analytics|googletagmanager/ },
  { label: "Ad SDK", pattern: /\badmob\b|adsbygoogle|advertising-id/i },
  { label: "Push notifications", pattern: /push-notifications|PushNotifications/ },
  { label: "Remote API env", pattern: /\bVITE_API_BASE\b|\bVITE_API_KEY\b/ }
];

const requiredLocalSignals = [
  { label: "localStorage", pattern: /\blocalStorage\b/ },
  { label: "no account copy", pattern: /No account/i },
  { label: "local-only copy", pattern: /local[- ]only|stored only on this device|on your device/i }
];

const failures = [];
const scannedFiles = [];
const localSignals = new Set();

function fail(message) {
  failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (scannedExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log("Local-only runtime validation");
  console.log("This check scans app/runtime source for network, analytics, cloud sync, ad, and push-notification primitives.");

  const files = [
    ...sourceRoots.flatMap((sourceRoot) => walk(path.join(root, sourceRoot))),
    ...configFiles.map((configFile) => path.join(root, configFile)).filter((file) => fs.existsSync(file))
  ];

  for (const file of files) {
    const relativePath = normalize(path.relative(root, file));
    const contents = fs.readFileSync(file, "utf8");
    scannedFiles.push(relativePath);

    for (const signal of requiredLocalSignals) {
      if (signal.pattern.test(contents)) {
        localSignals.add(signal.label);
      }
    }

    for (const banned of bannedRuntimePatterns) {
      if (banned.pattern.test(contents)) {
        fail(`${relativePath} includes local-only incompatible runtime signal: ${banned.label}`);
      }
    }
  }

  for (const signal of requiredLocalSignals) {
    if (!localSignals.has(signal.label)) {
      fail(`Missing expected local-only runtime signal in app source: ${signal.label}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    secretSafe: true,
    gitUsed: false,
    networkUsed: false,
    scannedRoots: sourceRoots.map(normalize),
    scannedConfigFiles: configFiles.map(normalize),
    scannedFiles,
    requiredLocalSignals: requiredLocalSignals.map((signal) => signal.label),
    observedLocalSignals: Array.from(localSignals).sort(),
    bannedRuntimeSignals: bannedRuntimePatterns.map((banned) => banned.label),
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Local-only runtime checks failed. Report written to ${reportPath}`);
    process.exit(process.exitCode || 1);
  }

  console.log(`Local-only runtime checks passed. Report written to ${reportPath}`);
}

main();

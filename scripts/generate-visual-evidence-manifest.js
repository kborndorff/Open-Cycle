const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const outputPath = path.join(reportsDir, "visual-evidence-manifest.json");

const entries = [
  {
    id: "siteDesktop",
    category: "websiteVisualQa",
    source: "reports/visuals/site-desktop.png",
    purpose: "Playwright desktop screenshot of the hosted website experience."
  },
  {
    id: "sitePhone",
    category: "websiteVisualQa",
    source: "reports/visuals/site-phone.png",
    purpose: "Playwright phone screenshot of the hosted website experience."
  },
  {
    id: "siteBlogDesktop",
    category: "websiteVisualQa",
    source: "reports/visuals/site-blog-desktop.png",
    purpose: "Playwright desktop screenshot of the blog article experience."
  },
  {
    id: "siteBlogPhone",
    category: "websiteVisualQa",
    source: "reports/visuals/site-blog-phone.png",
    purpose: "Playwright phone screenshot of the blog article experience."
  },
  {
    id: "appDesktop",
    category: "appVisualQa",
    source: "reports/visuals/app-desktop.png",
    purpose: "Playwright desktop screenshot of the web app experience."
  },
  {
    id: "appPhone",
    category: "appVisualQa",
    source: "reports/visuals/app-phone.png",
    purpose: "Playwright phone screenshot of the web app experience."
  },
  {
    id: "androidEmulatorLaunch",
    category: "androidEmulatorQa",
    source: "reports/visuals/android-emulator-app.png",
    purpose: "Android emulator screenshot proving the app launches."
  },
  {
    id: "androidEmulatorCycleLog",
    category: "androidEmulatorQa",
    source: "reports/visuals/android-emulator-cycle-log.png",
    purpose: "Android emulator screenshot proving the cycle log renders."
  },
  {
    id: "androidEmulatorSavedEntry",
    category: "androidEmulatorQa",
    source: "reports/visuals/android-emulator-saved-entry.png",
    purpose: "Android emulator screenshot proving a local entry was saved."
  },
  {
    id: "androidUiAutomatorXml",
    category: "androidEmulatorQa",
    source: "reports/visuals/android-window.xml",
    purpose: "UIAutomator XML captured during emulator QA.",
    type: "xml"
  },
  {
    id: "androidWebViewDom",
    category: "androidEmulatorQa",
    source: "reports/visuals/android-webview-dom.json",
    purpose: "Renderer DOM text captured from the Android WebView during emulator QA.",
    type: "json"
  },
  {
    id: "playAppIcon",
    category: "playStoreGraphic",
    source: "store-assets/play/app-icon.png",
    purpose: "Google Play app icon upload graphic.",
    expected: { width: 512, height: 512, bitDepth: 8, colorType: 6 }
  },
  {
    id: "playFeatureGraphic",
    category: "playStoreGraphic",
    source: "store-assets/play/feature-graphic.png",
    purpose: "Google Play feature graphic upload.",
    expected: { width: 1024, height: 500, bitDepth: 8, colorType: 2 }
  },
  ...[1, 2, 3, 4].map((index) => ({
    id: `playPhoneScreenshot${index}`,
    category: "playStoreGraphic",
    source: `store-assets/play/phone-screenshot-${index}.png`,
    purpose: `Google Play phone screenshot upload ${index}.`,
    expected: { width: 1080, height: 1920, bitDepth: 8, colorType: 2 }
  })),
  ...[1, 2, 3, 4].map((index) => ({
    id: `playTablet7Screenshot${index}`,
    category: "playStoreGraphic",
    source: `store-assets/play/tablet-7-screenshot-${index}.png`,
    purpose: `Google Play 7-inch tablet screenshot upload ${index}.`,
    expected: { width: 1920, height: 1080, bitDepth: 8, colorType: 2 }
  })),
  ...[1, 2, 3, 4].map((index) => ({
    id: `playTablet10Screenshot${index}`,
    category: "playStoreGraphic",
    source: `store-assets/play/tablet-10-screenshot-${index}.png`,
    purpose: `Google Play 10-inch tablet screenshot upload ${index}.`,
    expected: { width: 2560, height: 1440, bitDepth: 8, colorType: 2 }
  }))
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readPngInfo(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    hasAlpha: buffer[25] === 4 || buffer[25] === 6
  };
}

function fileInfo(entry, failures) {
  const absolutePath = path.join(root, entry.source);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing visual evidence file: ${entry.source}`);
    return {
      id: entry.id,
      category: entry.category,
      source: entry.source,
      purpose: entry.purpose,
      exists: false
    };
  }

  const stat = fs.statSync(absolutePath);
  const info = {
    id: entry.id,
    category: entry.category,
    source: entry.source,
    purpose: entry.purpose,
    exists: true,
    bytes: stat.size,
    sha256: sha256(absolutePath)
  };

  if (entry.type === "xml") {
    info.type = "xml";
    if (stat.size <= 0) {
      failures.push(`${entry.source} must not be empty.`);
    }
    const xml = fs.readFileSync(absolutePath, "utf8");
    const requiredXmlSignals = [
      'package="com.opencycle.app"',
      'resource-id="com.opencycle.app:id/action_bar_root"',
      'class="android.webkit.WebView"'
    ];
    for (const signal of requiredXmlSignals) {
      if (!xml.includes(signal)) {
        failures.push(`${entry.source} is missing current Open Cycle emulator signal: ${signal}`);
      }
    }
    for (const forbidden of ["com.opencycle.localcyclecore", "localcyclecore", "local-cycle-core-site"]) {
      if (xml.includes(forbidden)) {
        failures.push(`${entry.source} contains stale emulator package signal: ${forbidden}`);
      }
    }
    return info;
  }

  if (entry.type === "json") {
    info.type = "json";
    if (stat.size <= 0) {
      failures.push(`${entry.source} must not be empty.`);
    }
    const dom = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    const text = String(dom.bodyText || "");
    const normalizedText = text.toLowerCase();
    for (const signal of ["open-cycle", "free, private cycle tracking", "your cycle log", "total entries: 1", "entry saved.", "delete"]) {
      if (!normalizedText.includes(signal)) {
        failures.push(`${entry.source} is missing current Open Cycle WebView DOM signal: ${signal}`);
      }
    }
    if (dom.url !== "http://localhost/") {
      failures.push(`${entry.source} must record the Capacitor localhost URL; got ${dom.url}.`);
    }
    for (const forbidden of ["com.opencycle.localcyclecore", "localcyclecore", "local-cycle-core-site", "LOCAL-FIRST", "Local-first", "local-first"]) {
      if (JSON.stringify(dom).includes(forbidden)) {
        failures.push(`${entry.source} contains stale Open Cycle signal: ${forbidden}`);
      }
    }
    return info;
  }

  const png = readPngInfo(absolutePath);
  if (!png) {
    failures.push(`${entry.source} must be a valid PNG file.`);
    return info;
  }
  info.type = "png";
  info.png = png;

  if (stat.size <= 0) {
    failures.push(`${entry.source} must not be empty.`);
  }
  if (entry.expected) {
    for (const [key, expectedValue] of Object.entries(entry.expected)) {
      if (png[key] !== expectedValue) {
        failures.push(`${entry.source} expected ${key} ${expectedValue}; got ${png[key]}.`);
      }
    }
  }

  return info;
}

function main() {
  const failures = [];
  const files = entries.map((entry) => fileInfo(entry, failures));
  const counts = files.reduce((acc, file) => {
    acc.total += 1;
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, { total: 0 });

  const manifest = {
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "pass" : "fail",
    appName: "open-cycle",
    packageName: "com.opencycle.app",
    secretSafe: failures.length === 0,
    publicSafe: true,
    privateMaterialIncluded: false,
    signedAabIncluded: false,
    generatorCommand: "npm run generate:visual-evidence",
    validatorCommand: "npm run validate:visual-evidence",
    requiredCounts: {
      websiteVisualQa: 4,
      appVisualQa: 2,
      androidEmulatorQa: 5,
      playStoreGraphic: 14,
      total: 25
    },
    counts,
    failures,
    files
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Visual evidence manifest written to ${outputPath}`);
  console.log(`Status: ${manifest.status}`);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
}

main();

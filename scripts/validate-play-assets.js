const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const assetsDir = path.join(root, "store-assets", "play");
const assets = [
  {
    file: "app-icon.svg",
    png: "app-icon.png",
    width: 512,
    height: 512,
    alpha: true,
    mustContain: ["CORE"]
  },
  {
    file: "feature-graphic.svg",
    png: "feature-graphic.png",
    width: 1024,
    height: 500,
    alpha: false,
    mustContain: ["open-cycle", "No account. No hidden tracking. No cloud sync."]
  },
  {
    file: "phone-screenshot-1.svg",
    png: "phone-screenshot-1.png",
    width: 1080,
    height: 1920,
    alpha: false,
    mustContain: ["Your cycle log", "No internet needed"]
  },
  {
    file: "phone-screenshot-2.svg",
    png: "phone-screenshot-2.png",
    width: 1080,
    height: 1920,
    alpha: false,
    mustContain: ["Simple entries", "Local by design"]
  },
  {
    file: "phone-screenshot-3.svg",
    png: "phone-screenshot-3.png",
    width: 1080,
    height: 1920,
    alpha: false,
    mustContain: ["Review entries", "Delete one entry"]
  },
  {
    file: "phone-screenshot-4.svg",
    png: "phone-screenshot-4.png",
    width: 1080,
    height: 1920,
    alpha: false,
    mustContain: ["User controls", "Clear all local entries"]
  },
  {
    file: "tablet-7-screenshot-1.svg",
    png: "tablet-7-screenshot-1.png",
    width: 1920,
    height: 1080,
    alpha: false,
    mustContain: ["open-cycle", "Your cycle log"]
  },
  {
    file: "tablet-7-screenshot-2.svg",
    png: "tablet-7-screenshot-2.png",
    width: 1920,
    height: 1080,
    alpha: false,
    mustContain: ["Add a cycle entry", "Save entry"]
  },
  {
    file: "tablet-7-screenshot-3.svg",
    png: "tablet-7-screenshot-3.png",
    width: 1920,
    height: 1080,
    alpha: false,
    mustContain: ["Review and edit", "Delete one entry"]
  },
  {
    file: "tablet-7-screenshot-4.svg",
    png: "tablet-7-screenshot-4.png",
    width: 1920,
    height: 1080,
    alpha: false,
    mustContain: ["Private by default", "Clear all local entries"]
  },
  {
    file: "tablet-10-screenshot-1.svg",
    png: "tablet-10-screenshot-1.png",
    width: 2560,
    height: 1440,
    alpha: false,
    mustContain: ["open-cycle", "Your cycle log"]
  },
  {
    file: "tablet-10-screenshot-2.svg",
    png: "tablet-10-screenshot-2.png",
    width: 2560,
    height: 1440,
    alpha: false,
    mustContain: ["Add a cycle entry", "Save entry"]
  },
  {
    file: "tablet-10-screenshot-3.svg",
    png: "tablet-10-screenshot-3.png",
    width: 2560,
    height: 1440,
    alpha: false,
    mustContain: ["Review and edit", "Delete one entry"]
  },
  {
    file: "tablet-10-screenshot-4.svg",
    png: "tablet-10-screenshot-4.png",
    width: 2560,
    height: 1440,
    alpha: false,
    mustContain: ["Private by default", "Clear all local entries"]
  }
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25]
  };
}

for (const asset of assets) {
  const filePath = path.join(assetsDir, asset.file);
  if (!fs.existsSync(filePath)) {
    fail(`Missing Play Store asset source: ${asset.file}`);
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const widthMatch = new RegExp(`\\bwidth="${asset.width}"`).test(content);
  const heightMatch = new RegExp(`\\bheight="${asset.height}"`).test(content);
  const viewBoxMatch = content.includes(`viewBox="0 0 ${asset.width} ${asset.height}"`);

  if (!widthMatch || !heightMatch || !viewBoxMatch) {
    fail(`${asset.file} must be ${asset.width}x${asset.height}.`);
  }

  for (const text of asset.mustContain) {
    if (!content.includes(text)) {
      fail(`${asset.file} is missing required text: ${text}`);
    }
  }

  const pngPath = path.join(assetsDir, asset.png);
  if (!fs.existsSync(pngPath)) {
    fail(`Missing exported Play Store PNG asset: ${asset.png}`);
    continue;
  }

  const dimensions = readPngDimensions(pngPath);
  if (!dimensions) {
    fail(`${asset.png} must be a valid PNG file.`);
    continue;
  }
  if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
    fail(`${asset.png} must be ${asset.width}x${asset.height}; got ${dimensions.width}x${dimensions.height}.`);
  }
  if (dimensions.bitDepth !== 8) {
    fail(`${asset.png} must be an 8-bit PNG; got bit depth ${dimensions.bitDepth}.`);
  }
  if (asset.alpha && dimensions.colorType !== 6) {
    fail(`${asset.png} must be a 32-bit PNG with alpha for the Play app icon; got color type ${dimensions.colorType}.`);
  }
  if (!asset.alpha && dimensions.colorType !== 2) {
    fail(`${asset.png} must be a 24-bit PNG without alpha for Play preview assets; got color type ${dimensions.colorType}.`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Store asset checks passed.");

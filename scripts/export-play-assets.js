const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = process.cwd();
const assetsDir = path.join(root, "store-assets", "play");
const playAssets = [
  {
    source: "app-icon.svg",
    target: "app-icon.png",
    width: 512,
    height: 512,
    preserveAlpha: true
  },
  {
    source: "feature-graphic.svg",
    target: "feature-graphic.png",
    width: 1024,
    height: 500,
    preserveAlpha: false
  },
  {
    source: "phone-screenshot-1.svg",
    target: "phone-screenshot-1.png",
    width: 1080,
    height: 1920,
    preserveAlpha: false
  },
  {
    source: "phone-screenshot-2.svg",
    target: "phone-screenshot-2.png",
    width: 1080,
    height: 1920,
    preserveAlpha: false
  },
  {
    source: "phone-screenshot-3.svg",
    target: "phone-screenshot-3.png",
    width: 1080,
    height: 1920,
    preserveAlpha: false
  },
  {
    source: "phone-screenshot-4.svg",
    target: "phone-screenshot-4.png",
    width: 1080,
    height: 1920,
    preserveAlpha: false
  },
  {
    source: "tablet-7-screenshot-1.svg",
    target: "tablet-7-screenshot-1.png",
    width: 1920,
    height: 1080,
    preserveAlpha: false
  },
  {
    source: "tablet-7-screenshot-2.svg",
    target: "tablet-7-screenshot-2.png",
    width: 1920,
    height: 1080,
    preserveAlpha: false
  },
  {
    source: "tablet-7-screenshot-3.svg",
    target: "tablet-7-screenshot-3.png",
    width: 1920,
    height: 1080,
    preserveAlpha: false
  },
  {
    source: "tablet-7-screenshot-4.svg",
    target: "tablet-7-screenshot-4.png",
    width: 1920,
    height: 1080,
    preserveAlpha: false
  },
  {
    source: "tablet-10-screenshot-1.svg",
    target: "tablet-10-screenshot-1.png",
    width: 2560,
    height: 1440,
    preserveAlpha: false
  },
  {
    source: "tablet-10-screenshot-2.svg",
    target: "tablet-10-screenshot-2.png",
    width: 2560,
    height: 1440,
    preserveAlpha: false
  },
  {
    source: "tablet-10-screenshot-3.svg",
    target: "tablet-10-screenshot-3.png",
    width: 2560,
    height: 1440,
    preserveAlpha: false
  },
  {
    source: "tablet-10-screenshot-4.svg",
    target: "tablet-10-screenshot-4.png",
    width: 2560,
    height: 1440,
    preserveAlpha: false
  }
];

async function exportAsset(asset) {
  const source = path.join(assetsDir, asset.source);
  const target = path.join(assetsDir, asset.target);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing source asset: ${source}`);
  }

  let pipeline = sharp(source, { density: 144 }).resize(asset.width, asset.height, { fit: "fill" });
  if (!asset.preserveAlpha) {
    pipeline = pipeline.flatten({ background: "#edf1f7" });
  }

  await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(target);
}

async function main() {
  for (const asset of playAssets) {
    await exportAsset(asset);
  }
  console.log(`Exported Play Store PNG assets in ${assetsDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

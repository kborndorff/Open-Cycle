const fs = require("node:fs");
const path = require("node:path");

const siteDir = path.resolve(__dirname, "..", "site");
const distDir = path.join(siteDir, "dist");
const files = ["privacy.html", "license.html", "styles.css", "logo.svg", "script.js", "upgrade.html", "open-cycle.html", "upgrade.js", "robots.txt", "sitemap.xml", "llms.txt"];
const dirs = ["blog"];

if (!fs.existsSync(distDir)) {
  console.error("site/dist is missing. Run the Vite site build first.");
  process.exit(1);
}

for (const file of files) {
  const source = path.join(siteDir, file);
  const target = path.join(distDir, file);
  if (!fs.existsSync(source)) {
    console.error(`Missing site static source: ${source}`);
    process.exit(1);
  }
  fs.copyFileSync(source, target);
}

for (const dir of dirs) {
  const sourceDir = path.join(siteDir, dir);
  const targetDir = path.join(distDir, dir);
  if (!fs.existsSync(sourceDir)) {
    console.error(`Missing site static source directory: ${sourceDir}`);
    process.exit(1);
  }
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

console.log("Copied static site pages to site/dist.");

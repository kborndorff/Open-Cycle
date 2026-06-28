const fs = require("node:fs");
const path = require("node:path");

const files = [
  "site/index.html",
  "docs/github-and-visibility.md",
  "README.md",
  "package.json"
];

const tokens = ["{{GITHUB_ORG}}", "{{GITHUB_REPO}}"];
const root = process.cwd();
let unresolved = false;

for (const file of files) {
  const filePath = path.join(root, file);
  const content = fs.readFileSync(filePath, "utf8");
  const found = tokens.filter((token) => content.includes(token));
  if (found.length > 0) {
    unresolved = true;
    console.error(`Unresolved placeholders in ${file}: ${found.join(", ")}`);
  }
}

if (unresolved) {
  console.error("Run npm run set-public-links first.");
  process.exit(1);
}

console.log("No unresolved GitHub placeholders found.");

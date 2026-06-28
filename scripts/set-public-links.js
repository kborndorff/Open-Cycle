const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const args = process.argv.slice(2);
const root = process.cwd();

function loadRootEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("export ")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index < 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const raw = trimmed.slice(index + 1).trim();
    if (!key) {
      continue;
    }

    values[key] = raw.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  }

  return values;
}

const values = {
  GITHUB_ORG: process.env.GITHUB_ORG,
  GITHUB_REPO: process.env.GITHUB_REPO
};
const rootEnv = loadRootEnvFile();
if (!values.GITHUB_ORG) {
  values.GITHUB_ORG = process.env.PUBLIC_GITHUB_ORG;
  if (!values.GITHUB_ORG) {
    values.GITHUB_ORG = rootEnv.PUBLIC_GITHUB_ORG;
  }
}
if (!values.GITHUB_REPO) {
  values.GITHUB_REPO = process.env.PUBLIC_GITHUB_REPO;
  if (!values.GITHUB_REPO) {
    values.GITHUB_REPO = rootEnv.PUBLIC_GITHUB_REPO;
  }
}

function resolveRepositoryFromPackageJson() {
  const packageJsonPath = path.join(root, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const raw = typeof packageJson.repository === "string"
      ? packageJson.repository
      : packageJson.repository?.url || packageJson.homepage || "";
    const normalized = raw.replace("git@github.com:", "https://github.com/").replace(/\.git$/, "");
    const match = /github\.com\/([^/]+)\/([^/#?]+)/.exec(normalized);
    if (match && match[1] && match[2]) {
      return { org: match[1], repo: match[2] };
    }
  } catch {
    return null;
  }

  return null;
}

for (let i = 0; i < args.length; i += 1) {
  const token = args[i];
  const next = args[i + 1];
  if (token === "--org") {
    values.GITHUB_ORG = next;
    i += 1;
    continue;
  }
  if (token === "--repo") {
    values.GITHUB_REPO = next;
    i += 1;
    continue;
  }
  if (token === "--help") {
    console.log("Usage: npm run set-public-links [-- --org <github-org-or-user> --repo <repo-name>]");
    console.log("In GitHub Actions, GITHUB_REPOSITORY=<owner>/<repo> is auto-detected.");
    process.exit(0);
  }
}

if (!values.GITHUB_ORG || !values.GITHUB_REPO) {
  if (process.env.GITHUB_REPOSITORY) {
    const normalizedRepository = process.env.GITHUB_REPOSITORY.replace(/^https?:\/\/github\.com\//, "").trim();
    const [envOrg, envRepo] = normalizedRepository.split("/");
    if (envOrg && envRepo) {
      values.GITHUB_ORG = envOrg;
      values.GITHUB_REPO = envRepo;
    }
  }

  if (!values.GITHUB_ORG || !values.GITHUB_REPO) {
    const packageRepository = resolveRepositoryFromPackageJson();
    if (packageRepository) {
      values.GITHUB_ORG = packageRepository.org;
      values.GITHUB_REPO = packageRepository.repo;
    }
  }

  if (!values.GITHUB_ORG || !values.GITHUB_REPO) {
    try {
      const raw = execSync("git remote get-url origin", { encoding: "utf8" }).trim();
      const parsed = raw.replace("git@github.com:", "https://github.com/").replace(".git", "");
      const match = /https?:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(parsed);
      if (match && match[1] && match[2]) {
        values.GITHUB_ORG = match[1];
        values.GITHUB_REPO = match[2];
      }
    } catch {
      // no remote available in this environment
    }
  }
}

  if (!values.GITHUB_ORG || !values.GITHUB_REPO) {
    console.error("Missing required values. Set GITHUB_ORG and GITHUB_REPO env vars or pass:");
    console.error("npm run set-public-links -- --org <github-org-or-user> --repo <repo-name>");
    console.error("Or set PUBLIC_GITHUB_ORG and PUBLIC_GITHUB_REPO env vars.");
    console.error("Or run in GitHub Actions with GITHUB_REPOSITORY set to <owner>/<repo>.");
    console.error("Or configure git remote origin as https://github.com/<owner>/<repo>.git.");
    process.exit(1);
  }

const trimmedOrg = String(values.GITHUB_ORG).trim();
const trimmedRepo = String(values.GITHUB_REPO).trim();
values.GITHUB_ORG = trimmedOrg;
values.GITHUB_REPO = trimmedRepo.replace(/\.git$/, "");

if (!values.GITHUB_ORG || !values.GITHUB_REPO) {
  console.error("Resolved repository values are empty after normalization.");
  process.exit(1);
}

const files = [
  path.join(root, "site/index.html"),
  path.join(root, "docs/github-and-visibility.md"),
  path.join(root, "README.md"),
  path.join(root, "package.json")
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`Missing expected file: ${file}`);
    process.exit(1);
  }
}

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const replaced = content
    .replaceAll("{{GITHUB_ORG}}", values.GITHUB_ORG)
    .replaceAll("{{GITHUB_REPO}}", values.GITHUB_REPO);
  if (replaced !== content) {
    fs.writeFileSync(file, replaced);
  }
}

console.log(`Updated public links to github.com/${values.GITHUB_ORG}/${values.GITHUB_REPO}`);

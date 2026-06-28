const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-github-publication-help.ps1");

const requiredText = [
  "OpenCycle GitHub publication helper",
  "does not run git, push code, read tokens, or set secrets",
  "https://github.com/$Repo",
  "https://github.com/$SourceRepo",
  "kborndorff/Open-Cycle",
  "kborndorff/open-cycle-source",
  "Proof/product repository target",
  "Full source repository target",
  "Push public proof, security, store-facing upload materials, and release evidence helpers",
  "Push the complete inspectable source tree",
  "git push -u source $Branch",
  "publish this worktree to the default branch",
  "npm run validate:release",
  "npm run validate:play-store-public",
  "npm run generate:public-repo-manifest",
  "npm run validate:public-repo-manifest",
  "npm run validate:public-push",
  "npm run generate:github-repository-bundles",
  "npm run validate:github-repository-bundles",
  "npm run package:github-repository-bundles",
  "npm run validate:github-repository-archives",
  "Validated ZIP upload fallback",
  "dist/github-repositories/Open-Cycle.zip",
  "dist/github-repositories/open-cycle-source.zip",
  "reports/github-repository-archives.json",
  "npm run release:handoff",
  "git status",
  "git remote -v",
  "git push -u origin $Branch",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "npm run release:public-ready",
  "npm run github:setup-deploy-secrets",
  "No secret values are printed by this helper"
];

const forbiddenText = [
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "gh secret set CF_API_TOKEN --body",
  "gh secret set CF_ACCOUNT_ID --body",
  "reports/signed-aab-evidence.json",
  "app-release-signed.aab"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(helperPath)) {
  fail("Missing scripts/print-github-publication-help.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`GitHub publication helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`GitHub publication helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("GitHub publication helper checks passed.");

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const skipLiveSite = args.includes("--skip-live-site");
const skipLiveCloudflareDomains = args.includes("--skip-live-cloudflare-domains");
const skipLiveCustomDomain = args.includes("--skip-live-custom-domain");
const skipLiveGithub = args.includes("--skip-live-github");
const skipLiveActions = args.includes("--skip-live-actions");
const urlArg = args.find((arg) => arg.startsWith("--url="));
const repoArg = args.find((arg) => arg.startsWith("--repo="));
const branchArg = args.find((arg) => arg.startsWith("--branch="));
const siteUrl = urlArg ? urlArg.split("=").slice(1).join("=") : process.env.SITE_URL || "https://open-cycle-site.pages.dev";
const githubRepo = repoArg ? repoArg.split("=").slice(1).join("=") : process.env.GITHUB_REPOSITORY || "kborndorff/Open-Cycle";
const githubBranch = branchArg ? branchArg.split("=").slice(1).join("=") : process.env.GITHUB_REF_NAME || "";
const githubBranchArgs = githubBranch ? [`--branch=${githubBranch}`] : [];

const steps = [
  ["npm", ["run", "validate:public-push"], "validate local public-push file set"],
  ["npm", ["run", "validate:custom-domain"], "validate custom-domain readiness"],
  ["npm", ["run", "validate:play-store-public"], "complete public Play Store readiness"],
  ...(skipLiveSite
    ? []
    : [["npm", ["run", "validate:site:live", "--", `--url=${siteUrl}`], "validate live Cloudflare Pages site"]]),
  ...(skipLiveCloudflareDomains
    ? []
    : [["npm", ["run", "validate:cloudflare-pages-domains:live"], "validate Cloudflare Pages custom domain attachment"]]),
  ...(skipLiveCustomDomain
    ? []
    : [["npm", ["run", "validate:custom-domain:live"], "validate live open-cycle.com custom domain"]]),
  ["npm", ["run", "generate:visual-evidence"], "generate visual evidence manifest"],
  ["npm", ["run", "validate:visual-evidence"], "validate visual evidence manifest"],
  ["npm", ["run", "generate:cloudflare-pages-deployment"], "generate Cloudflare Pages deployment evidence"],
  ["npm", ["run", "validate:cloudflare-pages-deployment"], "validate Cloudflare Pages deployment evidence"],
  ["npm", ["run", "release:status"], "generate public release status"],
  ["npm", ["run", "validate:release-status"], "validate public release status"],
  ["npm", ["run", "generate:github-publication-packet"], "generate GitHub publication packet"],
  ["npm", ["run", "validate:github-publication-packet"], "validate GitHub publication packet"],
  ...(skipLiveGithub
    ? []
    : [["npm", ["run", "validate:github:live", "--", `--repo=${githubRepo}`, ...githubBranchArgs], "validate live public GitHub repository"]]),
  ...(skipLiveActions
    ? []
    : [["npm", ["run", "validate:github:actions", "--", `--repo=${githubRepo}`, ...githubBranchArgs], "validate live public GitHub Actions"]]),
  ["npm", ["run", "generate:play-console-packet"], "generate Play Console upload packet"],
  ["npm", ["run", "validate:play-console-packet"], "validate Play Console upload packet"],
  ["npm", ["run", "generate:play-upload-confirmation"], "generate private Play upload confirmation template"],
  ["npm", ["run", "validate:play-upload-confirmation"], "validate Play upload confirmation template"],
  ["npm", ["run", "release:audit"], "generate final release audit"],
  ["npm", ["run", "generate:release-completion-matrix"], "generate release completion matrix"],
  ["npm", ["run", "validate:release-completion-matrix"], "validate release completion matrix"],
  ["npm", ["run", "generate:release-blockers"], "generate release blocker report"],
  ["npm", ["run", "validate:release-blockers"], "validate release blocker report"],
  ["npm", ["run", "release:audit"], "refresh final release audit with generated release reports"],
  ["npm", ["run", "validate:release-audit"], "validate final release audit"],
  ["npm", ["run", "generate:release-evidence-index"], "generate release evidence index"],
  ["npm", ["run", "validate:release-evidence-index"], "validate release evidence index"],
  ["npm", ["run", "validate:release-evidence-docs"], "validate release evidence guide"],
  ["npm", ["run", "validate:public"], "validate public repository safety"],
  ["npm", ["run", "release:next"], "print current release next steps"]
];

function commandText(command, commandArgs) {
  return [command, ...commandArgs].join(" ");
}

function commandForPlatform(command) {
  return process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
}

function run(command, commandArgs, label) {
  const platformCommand = commandForPlatform(command);
  console.log(`\n==> ${label}`);
  console.log(commandText(platformCommand, commandArgs));

  if (isDryRun) {
    return;
  }

  const isWindowsBatch =
    process.platform === "win32" &&
    [".bat", ".cmd"].includes(path.extname(platformCommand).toLowerCase());
  const result = spawnSync(isWindowsBatch ? "cmd.exe" : platformCommand, isWindowsBatch ? ["/d", "/s", "/c", "call", platformCommand, ...commandArgs] : commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} failed with code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function main() {
  console.log("Public release readiness");
  if (isDryRun) {
    console.log("Dry run only. No validation commands are executed.");
  }
  if (skipLiveSite) {
    console.log("Live-site validation is skipped for this run.");
  } else {
    console.log(`Live-site validation target: ${siteUrl}`);
  }
  if (skipLiveCustomDomain) {
    console.log("Live custom-domain validation is skipped for this run.");
  } else {
    console.log("Live custom-domain validation target: https://open-cycle.com");
  }
  if (skipLiveCloudflareDomains) {
    console.log("Live Cloudflare Pages domain-attachment validation is skipped for this run.");
  } else {
    console.log("Live Cloudflare Pages domain-attachment target: open-cycle-site -> open-cycle.com, www.open-cycle.com");
  }
  if (skipLiveGithub) {
    console.log("Live GitHub publication validation is skipped for this run.");
  } else {
    console.log(`Live GitHub publication target: ${githubRepo}@${githubBranch || "<repository-default-branch>"}`);
  }
  if (skipLiveActions) {
    console.log("Live GitHub Actions validation is skipped for this run.");
  } else {
    console.log(`Live GitHub Actions target: ${githubRepo}@${githubBranch || "<repository-default-branch>"}`);
  }

  for (const [command, commandArgs, label] of steps) {
    run(command, commandArgs, label);
  }

  console.log("\nPublic release readiness checks passed. Private signing, runtime QA, and Play upload may still remain.");
}

main();

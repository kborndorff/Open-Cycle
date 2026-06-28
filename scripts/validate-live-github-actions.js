const fs = require("node:fs");
const path = require("node:path");

const repoArg = process.argv.find((arg) => arg.startsWith("--repo="));
const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const isDryRun = process.argv.includes("--dry-run");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "live-github-actions.json");
const repository = repoArg ? repoArg.split("=").slice(1).join("=") : "kborndorff/Open-Cycle";
const requestedBranch = branchArg ? branchArg.split("=").slice(1).join("=") : "";

const workflows = [
  { file: "ci.yml", name: "OpenCycle Local CI" },
  { file: "android-aab.yml", name: "Android AAB Check" },
  { file: "deploy-site.yml", name: "Deploy Site to Cloudflare Pages" }
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "OpenCycle-actions-validator"
    }
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${body.slice(0, 200)}`);
  }
  return JSON.parse(body);
}

async function main() {
  console.log("Live GitHub Actions validation");
  console.log(`Repository: ${repository}`);
  console.log(`Branch: ${requestedBranch || "<repository-default-branch>"}`);

  const report = {
    generatedAt: new Date().toISOString(),
    repository,
    branch: requestedBranch || "",
    requestedBranch: requestedBranch || null,
    status: "pending",
    workflows: [],
    failures: []
  };

  if (isDryRun) {
    console.log("Dry run only. No network requests are executed.");
    const dryRunBranch = requestedBranch || "<repository-default-branch>";
    for (const workflow of workflows) {
      console.log(`https://api.github.com/repos/${repository}/actions/workflows/${workflow.file}`);
      console.log(`https://api.github.com/repos/${repository}/actions/workflows/${workflow.file}/runs?branch=${dryRunBranch}&per_page=1`);
    }
    return;
  }

  let resolvedBranch = requestedBranch || "main";
  if (!requestedBranch) {
    try {
      const repo = await fetchJson(`https://api.github.com/repos/${repository}`);
      resolvedBranch = repo.default_branch || "main";
      report.github = {
        fullName: repo.full_name,
        private: repo.private,
        archived: repo.archived,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.failures.push(`repository: ${message}`);
      fail(`repository: ${message}`);
    }
  }
  report.branch = resolvedBranch;
  report.resolvedBranch = resolvedBranch;

  for (const workflow of workflows) {
    const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflow.file}`;
    let workflowData;
    try {
      workflowData = await fetchJson(workflowUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.failures.push(`${workflow.file}: ${message}`);
      fail(`${workflow.file}: ${message}`);
      continue;
    }

    if (workflowData.name !== workflow.name) {
      const message = `${workflow.file} workflow name must be ${workflow.name}; got ${workflowData.name || "unknown"}.`;
      report.failures.push(message);
      fail(message);
    }
    if (workflowData.state !== "active") {
      const message = `${workflow.file} workflow must be active; got ${workflowData.state || "unknown"}.`;
      report.failures.push(message);
      fail(message);
    }
    if (workflowData.path !== `.github/workflows/${workflow.file}`) {
      const message = `${workflow.file} workflow path must be .github/workflows/${workflow.file}; got ${workflowData.path || "unknown"}.`;
      report.failures.push(message);
      fail(message);
    }

    const url = `https://api.github.com/repos/${repository}/actions/workflows/${workflow.file}/runs?branch=${encodeURIComponent(resolvedBranch)}&per_page=1`;
    let data;
    try {
      data = await fetchJson(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.failures.push(`${workflow.file}: ${message}`);
      fail(`${workflow.file}: ${message}`);
      continue;
    }

    const run = data.workflow_runs?.[0];
    if (!run) {
      const message = `${workflow.file} has no workflow runs on ${resolvedBranch}.`;
      report.failures.push(message);
      fail(message);
      continue;
    }

    const evidence = {
      file: workflow.file,
      expectedName: workflow.name,
      workflowId: workflowData.id,
      workflowName: workflowData.name,
      workflowState: workflowData.state,
      workflowPath: workflowData.path,
      workflowHtmlUrl: workflowData.html_url,
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      htmlUrl: run.html_url,
      headBranch: run.head_branch,
      headSha: run.head_sha,
      updatedAt: run.updated_at
    };
    report.workflows.push(evidence);

    if (run.status !== "completed" || run.conclusion !== "success") {
      const message = `${workflow.file} latest run must be completed/success; got ${run.status}/${run.conclusion}.`;
      report.failures.push(message);
      fail(message);
    }
  }

  if (process.exitCode) {
    report.status = "fail";
    writeReport(report);
    process.exit(process.exitCode);
  }

  report.status = "pass";
  writeReport(report);
  console.log(`Live GitHub Actions checks passed for ${repository}@${resolvedBranch}.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
  writeReport({
    generatedAt: new Date().toISOString(),
    repository,
    branch: requestedBranch || "",
    requestedBranch: requestedBranch || null,
    status: "fail",
    workflows: [],
    failures: [message]
  });
  process.exit(1);
});

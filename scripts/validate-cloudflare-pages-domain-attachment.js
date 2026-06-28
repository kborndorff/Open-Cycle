const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "cloudflare-pages-domain-attachment.json");
const projectName = process.env.CF_PAGES_PROJECT_NAME || "open-cycle-site";
const requiredDomains = ["open-cycle-site.pages.dev", "open-cycle.com", "www.open-cycle.com"];

function fail(report, message) {
  report.failures.push(message);
  console.error(message);
  process.exitCode = 1;
}

function writeReport(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function parseProjectRow(output) {
  const row = output
    .split(/\r?\n/)
    .find((line) => line.includes(`│ ${projectName} `));

  if (!row) {
    return null;
  }

  const cells = row
    .split("│")
    .map((cell) => cell.trim())
    .filter(Boolean);

  return {
    projectName: cells[0] || "",
    projectDomains: (cells[1] || "")
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean),
    gitProvider: cells[2] || "",
    lastModified: cells[3] || ""
  };
}

function main() {
  console.log("Cloudflare Pages domain attachment validation");
  console.log("This check does not read, print, or store Cloudflare API tokens.");

  const report = {
    generatedAt: new Date().toISOString(),
    status: "pending",
    projectName,
    requiredDomains,
    command: "npx.cmd wrangler pages project list",
    project: null,
    failures: []
  };

  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["wrangler", "pages", "project", "list"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  report.stdoutPreview = stdout.slice(0, 4000);
  report.stderrPreview = stderr.slice(0, 2000);

  if (result.error) {
    fail(report, `Could not start Wrangler Pages project list: ${result.error.message}`);
  } else if (result.status !== 0) {
    fail(report, `Wrangler Pages project list failed with code ${result.status}.`);
  }

  const project = parseProjectRow(stdout);
  report.project = project;

  if (!project) {
    fail(report, `Cloudflare Pages project was not listed: ${projectName}`);
  } else {
    for (const domain of requiredDomains) {
      if (!project.projectDomains.includes(domain)) {
        fail(report, `Cloudflare Pages project ${projectName} is missing domain: ${domain}`);
      }
    }
  }

  if (process.exitCode) {
    report.status = "fail";
    writeReport(report);
    process.exit(process.exitCode);
  }

  report.status = "pass";
  writeReport(report);
  console.log(`Cloudflare Pages domain attachment checks passed for ${projectName}.`);
}

main();

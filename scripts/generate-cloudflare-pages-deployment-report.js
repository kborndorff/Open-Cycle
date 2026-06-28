const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "cloudflare-pages-deployment.json");
const projectName = process.env.CF_PAGES_PROJECT_NAME || "open-cycle-site";
const stablePagesDomain = `${projectName}.pages.dev`;
const stablePagesUrl = `https://${stablePagesDomain}`;
const requiredCustomDomains = ["open-cycle.com", "www.open-cycle.com"];

function runWrangler(args) {
  const command = process.platform === "win32" ? "cmd.exe" : "npx";
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", "call", "npx.cmd", "wrangler", ...args]
    : ["wrangler", ...args];
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    status: result.status,
    stdout: stripAnsi(result.stdout || ""),
    stderr: stripAnsi(result.stderr || ""),
    error: result.error ? result.error.message : null
  };
}

function stripAnsi(value) {
  return String(value).replace(/\x1b\[[0-9;]*m/g, "");
}

function splitTableRow(line) {
  const separator = line.includes("│") ? "│" : "â”‚";
  return line
    .split(separator)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function parseProject(output) {
  const row = output
    .split(/\r?\n/)
    .find((line) => line.includes(projectName) && line.includes(".pages.dev"));
  if (!row) {
    return null;
  }
  const cells = splitTableRow(row);
  return {
    name: cells[0] || "",
    domains: (cells[1] || "")
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean),
    gitProvider: cells[2] || "",
    lastModified: cells[3] || ""
  };
}

function parseDeployments(output) {
  return output
    .split(/\r?\n/)
    .filter((line) => line.includes(`https://`) && line.includes(`.${stablePagesDomain}`))
    .map((line) => {
      const cells = splitTableRow(line);
      const deploymentUrlIndex = cells.findIndex((cell) => cell.startsWith("https://") && cell.includes(`.${stablePagesDomain}`));
      return {
        id: cells[0] || "",
        environment: cells[1] || "",
        branch: cells[2] || "",
        deploymentUrl: deploymentUrlIndex >= 0 ? cells[deploymentUrlIndex] : "",
        statusAge: deploymentUrlIndex >= 0 ? cells[deploymentUrlIndex + 1] || "" : ""
      };
    })
    .filter((deployment) => deployment.id && deployment.deploymentUrl);
}

function readLiveSiteReport() {
  const liveSitePath = path.join(reportsDir, "live-site-publication.json");
  if (!fs.existsSync(liveSitePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(liveSitePath, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const failures = [];
  const version = runWrangler(["--version"]);
  const projectList = runWrangler(["pages", "project", "list"]);
  const deploymentList = runWrangler(["pages", "deployment", "list", "--project-name", projectName]);
  const project = parseProject(projectList.stdout);
  const deployments = parseDeployments(deploymentList.stdout);
  const latestDeployment = deployments[0] || null;
  const liveSite = readLiveSiteReport();
  const validatedUrls = new Set(Array.isArray(liveSite?.validatedUrls) ? liveSite.validatedUrls : []);
  if (typeof liveSite?.url === "string") {
    validatedUrls.add(liveSite.url);
  }

  if (version.status !== 0) {
    failures.push(`Wrangler version command failed with code ${version.status}.`);
  }
  if (projectList.status !== 0) {
    failures.push(`Wrangler Pages project list failed with code ${projectList.status}.`);
  }
  if (deploymentList.status !== 0) {
    failures.push(`Wrangler Pages deployment list failed with code ${deploymentList.status}.`);
  }
  if (!project) {
    failures.push(`Cloudflare Pages project was not found: ${projectName}`);
  }
  if (project && !project.domains.includes(stablePagesDomain)) {
    failures.push(`Cloudflare Pages project is missing stable Pages domain: ${stablePagesDomain}`);
  }
  if (!latestDeployment) {
    failures.push(`No Cloudflare Pages deployments were listed for ${projectName}.`);
  }
  if (latestDeployment && !latestDeployment.deploymentUrl.startsWith("https://")) {
    failures.push("Latest Cloudflare Pages deployment URL must use HTTPS.");
  }
  if (!validatedUrls.has(stablePagesUrl)) {
    failures.push(`Stable Pages URL is not in live-site validation evidence: ${stablePagesUrl}`);
  }

  const projectDomains = project?.domains || [];
  const missingCustomDomains = requiredCustomDomains.filter((domain) => !projectDomains.includes(domain));
  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "pass" : "fail",
    secretSafe: failures.length === 0,
    publicSafe: true,
    privateMaterialIncluded: false,
    accountIdsIncluded: false,
    dashboardUrlsIncluded: false,
    commandSet: [
      "npx.cmd wrangler --version",
      `npx.cmd wrangler pages project list`,
      `npx.cmd wrangler pages deployment list --project-name ${projectName}`
    ],
    wranglerVersion: version.stdout.trim(),
    projectName,
    stablePagesUrl,
    requiredCustomDomains,
    project: project
      ? {
          name: project.name,
          domains: project.domains,
          gitProvider: project.gitProvider,
          lastModified: project.lastModified
        }
      : null,
    latestDeployment,
    deploymentCount: deployments.length,
    customDomainStatus: missingCustomDomains.length === 0 ? "attached" : "pending",
    missingCustomDomains,
    liveSiteValidation: {
      status: liveSite?.status || "missing",
      validatedStablePagesUrl: validatedUrls.has(stablePagesUrl),
      validatedUrls: Array.from(validatedUrls)
    },
    nextCommands: missingCustomDomains.length === 0
      ? [
          "npm run validate:cloudflare-pages-domains:live",
          "npm run validate:custom-domain:live"
        ]
      : [
          "npm run cloudflare:attach-domains",
          "npm run cloudflare:attach-domains:apply",
          "npm run validate:cloudflare-pages-domains:live",
          "npm run validate:custom-domain:live"
        ],
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Cloudflare Pages deployment report written to ${reportPath}`);
  console.log(`Status: ${report.status}`);
  console.log(`Latest deployment: ${latestDeployment?.deploymentUrl || "missing"}`);
  console.log(`Custom domain status: ${report.customDomainStatus}`);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
}

main();

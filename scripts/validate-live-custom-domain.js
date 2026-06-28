const fs = require("node:fs");
const dns = require("node:dns").promises;
const path = require("node:path");

const rootUrlArg = process.argv.find((arg) => arg.startsWith("--url="));
const rootUrl = (rootUrlArg ? rootUrlArg.split("=").slice(1).join("=") : process.env.CUSTOM_DOMAIN_URL || "https://open-cycle.com").replace(/\/+$/, "");
const reportsDir = path.join(process.cwd(), "reports");
const reportPath = path.join(reportsDir, "live-custom-domain-publication.json");
const checkedPaths = [
  "/",
  "/privacy.html",
  "/license.html",
  "/blog/",
  "/blog/health-app-data-sharing.html",
  "/blog/no-account-period-tracker.html",
  "/blog/period-tracker-without-internet.html",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/features",
  "/open-cycle.html?next=/features"
];
const dnsResults = [];
const failures = [];

function fail(message) {
  console.error(message);
  failures.push(message);
  process.exitCode = 1;
}

function writeReport(status) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    status,
    url: rootUrl,
    checkedPaths,
    dnsResults,
    failures
  }, null, 2)}\n`, "utf8");
}

function assertUrl() {
  try {
    const parsed = new URL(rootUrl);
    if (parsed.protocol !== "https:") {
      fail("Custom domain URL must use HTTPS.");
    }
    if (!["open-cycle.com", "www.open-cycle.com"].includes(parsed.hostname)) {
      fail("Custom domain URL must be https://open-cycle.com or https://www.open-cycle.com.");
    }
    return parsed;
  } catch {
    fail(`Invalid custom domain URL: ${rootUrl}`);
    return null;
  }
}

async function text(pathname, redirect = "follow") {
  const url = `${rootUrl}${pathname}`;
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { redirect });
      const body = await response.text();
      return { response, body };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

function requireHeader(response, name, expectedValue) {
  const actual = response.headers.get(name);
  if (!actual) {
    fail(`Missing custom-domain security header: ${name}`);
    return;
  }
  if (expectedValue && actual.toLowerCase() !== expectedValue.toLowerCase()) {
    fail(`Custom-domain security header ${name} must be ${expectedValue}; got ${actual}.`);
  }
}

function includesText(body, expected) {
  return body.toLowerCase().includes(expected.toLowerCase());
}

async function checkDns(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    dnsResults.push({
      hostname,
      status: "resolved",
      addresses: addresses.map((address) => address.address)
    });
    return true;
  } catch (error) {
    const code = error && error.code ? error.code : "unknown";
    dnsResults.push({
      hostname,
      status: "unresolved",
      error: code
    });
    fail(`Custom domain DNS does not resolve for ${hostname}: ${code}.`);
    return false;
  }
}

async function main() {
  const parsed = assertUrl();
  if (!parsed) {
    writeReport("fail");
    process.exit(1);
  }
  if (!(await checkDns(parsed.hostname))) {
    writeReport("fail");
    process.exit(process.exitCode || 1);
  }

  const index = await text("/");
  if (index.response.status !== 200) {
    fail(`Custom-domain index must return 200; got ${index.response.status}.`);
  }
  for (const expected of [
    "open-cycle",
    "https://github.com/kborndorff/open-cycle-source",
    "https://local-cycle.com",
    "/blog/",
    "/privacy.html",
    "/license.html",
    "Your entries stay on your",
    "privacy-first period tracking app"
  ]) {
    if (!includesText(index.body, expected)) {
      fail(`Custom-domain index is missing expected content: ${expected}`);
    }
  }
  requireHeader(index.response, "x-frame-options", "DENY");
  requireHeader(index.response, "x-content-type-options", "nosniff");
  requireHeader(index.response, "referrer-policy", "no-referrer");

  const privacy = await text("/privacy.html");
  if (privacy.response.status !== 200) {
    fail(`Custom-domain privacy page must return 200; got ${privacy.response.status}.`);
  }
  if (!privacy.body.includes("does not collect, sell, share, transmit, or monetize personal data")) {
    fail("Custom-domain privacy page is missing the local-only privacy statement.");
  }
  if (!privacy.body.includes("/license.html")) {
    fail("Custom-domain privacy page must link to the license terms.");
  }

  const license = await text("/license.html");
  if (license.response.status !== 200) {
    fail(`Custom-domain license page must return 200; got ${license.response.status}.`);
  }
  for (const expected of [
    "source-available, not open source",
    "public so people can inspect, audit, learn from, and verify",
    "Public visibility does not grant permission to profit from this work",
    "commercial reuse",
    "third-party app store redistribution",
    "https://github.com/kborndorff/open-cycle-source/blob/main/LICENSE.md"
  ]) {
    if (!license.body.includes(expected)) {
      fail(`Custom-domain license page is missing expected content: ${expected}`);
    }
  }

  const blog = await text("/blog/");
  if (blog.response.status !== 200) {
    fail(`Custom-domain blog index must return 200; got ${blog.response.status}.`);
  }
  for (const expected of [
    "Period tracking privacy, in normal words",
    "period tracking app",
    "privacy-first",
    "/blog/local-only-period-tracker.html",
    "/blog/health-app-data-sharing.html",
    "/blog/period-tracker-privacy-questions.html",
    "/blog/no-account-period-tracker.html",
    "/blog/period-tracker-without-internet.html"
  ]) {
    if (!includesText(blog.body, expected)) {
      fail(`Custom-domain blog index is missing expected content: ${expected}`);
    }
  }

  const article = await text("/blog/health-app-data-sharing.html");
  if (article.response.status !== 200) {
    fail(`Custom-domain blog article must return 200; got ${article.response.status}.`);
  }
  for (const expected of [
    "Why people keep worrying about health app data",
    "Flo Health",
    "GoodRx",
    "BetterHelp",
    "https://www.ftc.gov"
  ]) {
    if (!includesText(article.body, expected)) {
      fail(`Custom-domain blog article is missing expected content: ${expected}`);
    }
  }

  const noAccountArticle = await text("/blog/no-account-period-tracker.html");
  if (noAccountArticle.response.status !== 200) {
    fail(`Custom-domain no-account blog article must return 200; got ${noAccountArticle.response.status}.`);
  }
  for (const expected of [
    "A period tracker should not need your email",
    "no-account period tracker",
    "https://www.ftc.gov"
  ]) {
    if (!includesText(noAccountArticle.body, expected)) {
      fail(`Custom-domain no-account blog article is missing expected content: ${expected}`);
    }
  }

  const noInternetArticle = await text("/blog/period-tracker-without-internet.html");
  if (noInternetArticle.response.status !== 200) {
    fail(`Custom-domain no-internet blog article must return 200; got ${noInternetArticle.response.status}.`);
  }
  for (const expected of [
    "Why a period tracker may not need internet access",
    "Android build does not request the internet permission",
    "https://www.hhs.gov"
  ]) {
    if (!includesText(noInternetArticle.body, expected)) {
      fail(`Custom-domain no-internet blog article is missing expected content: ${expected}`);
    }
  }

  const robots = await text("/robots.txt");
  if (robots.response.status !== 200 || !includesText(robots.body, "Sitemap: https://open-cycle.com/sitemap.xml")) {
    fail("Custom-domain robots.txt must return 200 and point to the OpenCycle sitemap.");
  }

  const sitemap = await text("/sitemap.xml");
  if (sitemap.response.status !== 200) {
    fail(`Custom-domain sitemap.xml must return 200; got ${sitemap.response.status}.`);
  }
  for (const expected of [
    "https://open-cycle.com/",
    "https://open-cycle.com/blog/",
    "https://open-cycle.com/blog/local-only-period-tracker.html",
    "https://open-cycle.com/blog/health-app-data-sharing.html",
    "https://open-cycle.com/blog/period-tracker-privacy-questions.html",
    "https://open-cycle.com/blog/no-account-period-tracker.html",
    "https://open-cycle.com/blog/period-tracker-without-internet.html"
  ]) {
    if (!includesText(sitemap.body, expected)) {
      fail(`Custom-domain sitemap.xml is missing expected URL: ${expected}`);
    }
  }

  const llms = await text("/llms.txt");
  if (llms.response.status !== 200) {
    fail(`Custom-domain llms.txt must return 200; got ${llms.response.status}.`);
  }
  for (const expected of [
    "# open-cycle",
    "privacy-first period tracking app",
    "phone or browser",
    "https://github.com/kborndorff/open-cycle-source",
    "https://open-cycle.com/blog/",
    "https://open-cycle.com/blog/no-account-period-tracker.html",
    "https://open-cycle.com/blog/period-tracker-without-internet.html"
  ]) {
    if (!includesText(llms.body, expected)) {
      fail(`Custom-domain llms.txt is missing expected content: ${expected}`);
    }
  }

  const features = await text("/features", "manual");
  if (![301, 302, 307, 308].includes(features.response.status)) {
    fail(`Custom-domain /features must redirect gently to upgrade page; got ${features.response.status}.`);
  }
  const location = features.response.headers.get("location") || "";
  if (!location.includes("/open-cycle.html?next=/features") && !location.includes("/open-cycle.html?next=%2Ffeatures")) {
    fail(`Custom-domain /features redirect must target /open-cycle.html?next=/features; got ${location}.`);
  }

  const upgrade = await text("/open-cycle.html?next=/features");
  if (upgrade.response.status !== 200) {
    fail(`Custom-domain upgrade page must return 200; got ${upgrade.response.status}.`);
  }
  if (!upgrade.body.includes("Local Cycle offers reminders") || !upgrade.body.includes("Redirecting in") || !upgrade.body.includes("https://local-cycle.com")) {
    fail("Custom-domain upgrade page is missing gentle Local Cycle optional paid feature copy.");
  }

  if (process.exitCode) {
    writeReport("fail");
    process.exit(process.exitCode);
  }

  writeReport("pass");
  console.log(`Custom domain live checks passed for ${rootUrl}.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  failures.push(message);
  writeReport("fail");
  process.exit(1);
});

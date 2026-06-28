const fs = require("node:fs");
const path = require("node:path");

const rootUrlArg = process.argv.find((arg) => arg.startsWith("--url="));
const rootUrl = (rootUrlArg ? rootUrlArg.split("=").slice(1).join("=") : process.env.SITE_URL || "").replace(/\/+$/, "");
const reportsDir = path.join(process.cwd(), "reports");
const reportPath = path.join(reportsDir, "live-site-publication.json");
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
const allowedExternalLinks = [
  "https://github.com/kborndorff/Open-Cycle",
  "https://github.com/kborndorff/open-cycle-source",
  "https://local-cycle.com",
  "https://open-cycle.com",
  "https://www.ftc.gov",
  "https://www.hhs.gov",
  "https://arxiv.org"
];
const forbiddenTrackingSignals = [
  "googletagmanager",
  "google-analytics",
  "gtag(",
  "ga(",
  "plausible",
  "fathom",
  "posthog",
  "mixpanel",
  "amplitude",
  "segment",
  "sentry",
  "hotjar",
  "clarity",
  "facebook.net",
  "connect.facebook.net",
  "adsbygoogle",
  "doubleclick",
  "XMLHttpRequest",
  "fetch(",
  "sendBeacon",
  "WebSocket",
  "EventSource"
];
const failures = [];

function fail(message) {
  console.error(message);
  failures.push(message);
  process.exitCode = 1;
}

function existingValidatedUrls() {
  if (!fs.existsSync(reportPath)) {
    return [];
  }

  try {
    const existing = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const urls = new Set(Array.isArray(existing.validatedUrls) ? existing.validatedUrls : []);
    if (existing.status === "pass" && typeof existing.url === "string" && existing.url.length > 0) {
      urls.add(existing.url);
    }
    return Array.from(urls);
  } catch {
    return [];
  }
}

function writeReport(status) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const validatedUrls = new Set(existingValidatedUrls());
  if (status === "pass") {
    validatedUrls.add(rootUrl);
  }
  fs.writeFileSync(reportPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    status,
    url: rootUrl,
    validatedUrls: Array.from(validatedUrls),
    checkedPaths,
    noTrackingPolicy: {
      remoteScriptsAllowed: false,
      allowedExternalLinks,
      forbiddenTrackingSignals
    },
    failures
  }, null, 2)}\n`, "utf8");
}

function assertUrl() {
  if (!rootUrl) {
    fail("Missing site URL. Use --url=https://example.pages.dev or set SITE_URL.");
    return null;
  }

  try {
    const parsed = new URL(rootUrl);
    if (parsed.protocol !== "https:") {
      fail("Live site URL must use HTTPS.");
    }
    return parsed;
  } catch {
    fail(`Invalid live site URL: ${rootUrl}`);
    return null;
  }
}

async function text(path, redirect = "follow") {
  const url = `${rootUrl}${path}`;
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
    fail(`Missing live security header: ${name}`);
    return;
  }
  if (expectedValue && actual.toLowerCase() !== expectedValue.toLowerCase()) {
    fail(`Live security header ${name} must be ${expectedValue}; got ${actual}.`);
  }
}

function includesText(body, expected) {
  return body.toLowerCase().includes(expected.toLowerCase());
}

function validateNoTracking(label, body) {
  const normalized = body.toLowerCase();
  for (const signal of forbiddenTrackingSignals) {
    if (normalized.includes(signal.toLowerCase())) {
      fail(`${label} must not include website tracking/network signal: ${signal}`);
    }
  }

  const externalScriptMatches = body.match(/<script[^>]+src=["']https?:\/\//gi) || [];
  for (const match of externalScriptMatches) {
    fail(`${label} must not load remote scripts: ${match}`);
  }

  const externalMatches = body.match(/https?:\/\/[^"')\s<>]+/g) || [];
  for (const url of externalMatches) {
    if (!allowedExternalLinks.some((allowed) => url.startsWith(allowed))) {
      fail(`${label} includes unexpected external URL: ${url}`);
    }
  }
}

async function main() {
  if (!assertUrl()) {
    writeReport("fail");
    process.exit(1);
  }

  const index = await text("/");
  if (index.response.status !== 200) {
    fail(`Live index must return 200; got ${index.response.status}.`);
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
      fail(`Live index is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live index", index.body);
  requireHeader(index.response, "x-frame-options", "DENY");
  requireHeader(index.response, "x-content-type-options", "nosniff");
  requireHeader(index.response, "referrer-policy", "no-referrer");

  const privacy = await text("/privacy.html");
  if (privacy.response.status !== 200) {
    fail(`Live privacy page must return 200; got ${privacy.response.status}.`);
  }
  if (!privacy.body.includes("does not collect, sell, share, transmit, or monetize personal data")) {
    fail("Live privacy page is missing the local-only privacy statement.");
  }
  if (!privacy.body.includes("not medical advice, diagnosis, or treatment")) {
    fail("Live privacy page is missing the wellness-use medical disclaimer.");
  }
  if (!privacy.body.includes("/license.html")) {
    fail("Live privacy page must link to the license terms.");
  }
  if (privacy.body.includes("optional local API install")) {
    fail("Live privacy page must not describe an optional local API install.");
  }
  validateNoTracking("Live privacy page", privacy.body);

  const license = await text("/license.html");
  if (license.response.status !== 200) {
    fail(`Live license page must return 200; got ${license.response.status}.`);
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
      fail(`Live license page is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live license page", license.body);

  const blog = await text("/blog/");
  if (blog.response.status !== 200) {
    fail(`Live blog index must return 200; got ${blog.response.status}.`);
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
      fail(`Live blog index is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live blog index", blog.body);

  const article = await text("/blog/health-app-data-sharing.html");
  if (article.response.status !== 200) {
    fail(`Live blog article must return 200; got ${article.response.status}.`);
  }
  for (const expected of [
    "Why people keep worrying about health app data",
    "Flo Health",
    "GoodRx",
    "BetterHelp",
    "https://www.ftc.gov"
  ]) {
    if (!includesText(article.body, expected)) {
      fail(`Live blog article is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live blog article", article.body);

  const noAccountArticle = await text("/blog/no-account-period-tracker.html");
  if (noAccountArticle.response.status !== 200) {
    fail(`Live no-account blog article must return 200; got ${noAccountArticle.response.status}.`);
  }
  for (const expected of [
    "A period tracker should not need your email",
    "no-account period tracker",
    "https://www.ftc.gov"
  ]) {
    if (!includesText(noAccountArticle.body, expected)) {
      fail(`Live no-account blog article is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live no-account blog article", noAccountArticle.body);

  const noInternetArticle = await text("/blog/period-tracker-without-internet.html");
  if (noInternetArticle.response.status !== 200) {
    fail(`Live no-internet blog article must return 200; got ${noInternetArticle.response.status}.`);
  }
  for (const expected of [
    "Why a period tracker may not need internet access",
    "Android build does not request the internet permission",
    "https://www.hhs.gov"
  ]) {
    if (!includesText(noInternetArticle.body, expected)) {
      fail(`Live no-internet blog article is missing expected content: ${expected}`);
    }
  }
  validateNoTracking("Live no-internet blog article", noInternetArticle.body);

  const robots = await text("/robots.txt");
  if (robots.response.status !== 200 || !includesText(robots.body, "Sitemap: https://open-cycle.com/sitemap.xml")) {
    fail("Live robots.txt must return 200 and point to the OpenCycle sitemap.");
  }

  const sitemap = await text("/sitemap.xml");
  if (sitemap.response.status !== 200) {
    fail(`Live sitemap.xml must return 200; got ${sitemap.response.status}.`);
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
      fail(`Live sitemap.xml is missing expected URL: ${expected}`);
    }
  }

  const llms = await text("/llms.txt");
  if (llms.response.status !== 200) {
    fail(`Live llms.txt must return 200; got ${llms.response.status}.`);
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
      fail(`Live llms.txt is missing expected content: ${expected}`);
    }
  }

  const features = await text("/features", "manual");
  if (![301, 302, 307, 308].includes(features.response.status)) {
    fail(`Live /features must redirect gently to upgrade page; got ${features.response.status}.`);
  }
  const location = features.response.headers.get("location") || "";
  if (!location.includes("/open-cycle.html?next=/features") && !location.includes("/open-cycle.html?next=%2Ffeatures")) {
    fail(`Live /features redirect must target /open-cycle.html?next=/features; got ${location}.`);
  }

  const upgrade = await text("/open-cycle.html?next=/features");
  if (upgrade.response.status !== 200) {
    fail(`Live upgrade page must return 200; got ${upgrade.response.status}.`);
  }
  if (!upgrade.body.includes("Local Cycle offers reminders") || !upgrade.body.includes("Redirecting in") || !upgrade.body.includes("https://local-cycle.com")) {
    fail("Live upgrade page is missing gentle Local Cycle optional paid feature copy.");
  }
  validateNoTracking("Live upgrade page", upgrade.body);

  if (process.exitCode) {
    writeReport("fail");
    process.exit(process.exitCode);
  }

  writeReport("pass");
  console.log(`Live site checks passed for ${rootUrl}.`);
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message);
    if (error.cause) {
      console.error(error.cause);
    }
  } else {
    console.error(error);
  }
  failures.push(error instanceof Error ? error.message : String(error));
  writeReport("fail");
  process.exit(1);
});

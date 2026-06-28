const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const distDir = path.join(root, "site", "dist");
const requiredFiles = [
  "index.html",
  "privacy.html",
  "license.html",
  "upgrade.html",
  "open-cycle.html",
  "styles.css",
  "logo.svg",
  "script.js",
  "upgrade.js",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "blog/index.html",
  "blog/local-only-period-tracker.html",
  "blog/health-app-data-sharing.html",
  "blog/period-tracker-privacy-questions.html",
  "blog/no-account-period-tracker.html",
  "blog/period-tracker-without-internet.html",
  "_headers",
  "_redirects"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readDist(file) {
  return fs.readFileSync(path.join(distDir, file), "utf8");
}

function normalizedText(contents) {
  return contents.replace(/\s+/g, " ").toLowerCase();
}

if (!fs.existsSync(distDir)) {
  fail("site/dist is missing. Run npm run build:site first.");
} else {
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(distDir, file))) {
      fail(`site/dist is missing required deploy file: ${file}`);
    }
  }
}

if (!process.exitCode) {
  const index = readDist("index.html");
  const privacy = readDist("privacy.html");
  const license = readDist("license.html");
  const upgrade = readDist("upgrade.html");
  const openCycle = readDist("open-cycle.html");
  const blogIndex = readDist("blog/index.html");
  const localOnlyPost = readDist("blog/local-only-period-tracker.html");
  const healthSharingPost = readDist("blog/health-app-data-sharing.html");
  const privacyQuestionsPost = readDist("blog/period-tracker-privacy-questions.html");
  const noAccountPost = readDist("blog/no-account-period-tracker.html");
  const noInternetPost = readDist("blog/period-tracker-without-internet.html");
  const robots = readDist("robots.txt");
  const sitemap = readDist("sitemap.xml");
  const llms = readDist("llms.txt");
  const script = readDist("script.js");
  const upgradeScript = readDist("upgrade.js");
  const redirects = readDist("_redirects");
  const headers = readDist("_headers");
  const publicPages = [
    ["site/dist/index.html", index],
    ["site/dist/privacy.html", privacy],
    ["site/dist/license.html", license],
    ["site/dist/upgrade.html", upgrade],
    ["site/dist/open-cycle.html", openCycle],
    ["site/dist/blog/index.html", blogIndex],
    ["site/dist/blog/local-only-period-tracker.html", localOnlyPost],
    ["site/dist/blog/health-app-data-sharing.html", healthSharingPost],
    ["site/dist/blog/period-tracker-privacy-questions.html", privacyQuestionsPost],
    ["site/dist/blog/no-account-period-tracker.html", noAccountPost],
    ["site/dist/blog/period-tracker-without-internet.html", noInternetPost],
    ["site/dist/script.js", script],
    ["site/dist/upgrade.js", upgradeScript],
    ["site/dist/llms.txt", llms]
  ];
  const normalizedIndex = normalizedText(index);
  const normalizedBlogIndex = normalizedText(blogIndex);
  const normalizedLocalOnlyPost = normalizedText(localOnlyPost);
  const normalizedHealthSharingPost = normalizedText(healthSharingPost);
  const normalizedPrivacyQuestionsPost = normalizedText(privacyQuestionsPost);
  const normalizedNoAccountPost = normalizedText(noAccountPost);
  const normalizedNoInternetPost = normalizedText(noInternetPost);
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
  const allowedExternalLinks = [
    "https://github.com/kborndorff/Open-Cycle",
    "https://github.com/kborndorff/open-cycle-source",
    "https://local-cycle.com",
    "https://open-cycle.com",
    "https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3133-flo-health-inc",
    "https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising",
    "https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook",
    "https://www.hhs.gov/hipaa/for-professionals/special-topics/reproductive-health/index.html",
    "https://arxiv.org/abs/2606.26276"
  ];

  if (!index.includes("/privacy.html")) {
    fail("site/dist/index.html must link to /privacy.html.");
  }
  if (!index.includes("/license.html")) {
    fail("site/dist/index.html must link to /license.html.");
  }
  if (!index.includes("https://github.com/kborndorff/open-cycle-source")) {
    fail("site/dist/index.html must link to the full source repository.");
  }
  for (const expected of ["your entries stay on your", "no account", "https://local-cycle.com"]) {
    if (!normalizedIndex.includes(expected)) {
      fail(`site/dist/index.html is missing public local/free positioning: ${expected}`);
    }
  }
  for (const expected of [
    "/blog/",
    "privacy-first period tracking app",
    "local phone-only cycle tracking",
    "Plain-language reads about period tracking and data privacy"
  ]) {
    if (!normalizedIndex.includes(expected.toLowerCase())) {
      fail(`site/dist/index.html is missing SEO/blog content: ${expected}`);
    }
  }
  if (!normalizedBlogIndex.includes("period tracking privacy, in normal words") || !blogIndex.includes("/blog/local-only-period-tracker.html") || !blogIndex.includes("/blog/no-account-period-tracker.html") || !blogIndex.includes("/blog/period-tracker-without-internet.html")) {
    fail("site/dist/blog/index.html must introduce the privacy blog and link to starter posts.");
  }
  if (!normalizedLocalOnlyPost.includes("local phone-only cycle tracking") || !normalizedLocalOnlyPost.includes("privacy-first period tracking app")) {
    fail("site/dist/blog/local-only-period-tracker.html must explain local-only period tracking in plain language.");
  }
  if (!normalizedHealthSharingPost.includes("ftc case page") || !normalizedHealthSharingPost.includes("flo health") || !normalizedHealthSharingPost.includes("goodrx") || !normalizedHealthSharingPost.includes("betterhelp")) {
    fail("site/dist/blog/health-app-data-sharing.html must link real health privacy issues to plain-language guidance.");
  }
  if (!normalizedPrivacyQuestionsPost.includes("hhs") || !normalizedPrivacyQuestionsPost.includes("fertility tracking apps") || !normalizedPrivacyQuestionsPost.includes("local phone-only tracker")) {
    fail("site/dist/blog/period-tracker-privacy-questions.html must include privacy checklist content and real-source links.");
  }
  if (!normalizedNoAccountPost.includes("no-account period tracker") || !normalizedNoAccountPost.includes("period tracker should not need your email") || !normalizedNoAccountPost.includes("https://www.ftc.gov")) {
    fail("site/dist/blog/no-account-period-tracker.html must explain no-account period tracking and link to real privacy issues.");
  }
  if (!normalizedNoInternetPost.includes("period tracker may not need internet access") || !normalizedNoInternetPost.includes("android build does not request the internet permission") || !normalizedNoInternetPost.includes("https://www.hhs.gov")) {
    fail("site/dist/blog/period-tracker-without-internet.html must explain phone-only period tracking without internet access.");
  }
  if (!robots.includes("Sitemap: https://open-cycle.com/sitemap.xml")) {
    fail("site/dist/robots.txt must point to the sitemap.");
  }
  for (const expectedUrl of [
    "https://open-cycle.com/",
    "https://open-cycle.com/blog/",
    "https://open-cycle.com/blog/local-only-period-tracker.html",
    "https://open-cycle.com/blog/health-app-data-sharing.html",
    "https://open-cycle.com/blog/period-tracker-privacy-questions.html",
    "https://open-cycle.com/blog/no-account-period-tracker.html",
    "https://open-cycle.com/blog/period-tracker-without-internet.html"
  ]) {
    if (!sitemap.includes(expectedUrl)) {
      fail(`site/dist/sitemap.xml is missing URL: ${expectedUrl}`);
    }
  }
  if (!llms.includes("open-cycle is a free, privacy-first period tracking app") || !llms.includes("No ads, ad SDKs, hidden analytics") || !llms.includes("https://open-cycle.com/blog/")) {
    fail("site/dist/llms.txt must summarize open-cycle for AI crawlers in plain language.");
  }
  if (!privacy.includes("does not collect, sell, share, transmit, or monetize personal data") || !privacy.includes("cycle dates, flow, symptoms, moods, and notes") || !privacy.includes("clear all local entries")) {
    fail("site/dist/privacy.html must include the local-only privacy statement.");
  }
  if (!privacy.includes("not medical advice, diagnosis, or treatment")) {
    fail("site/dist/privacy.html must include the wellness-use medical disclaimer.");
  }
  if (privacy.includes("optional local API install")) {
    fail("site/dist/privacy.html must not describe an optional local API install.");
  }
  if (!privacy.includes("/license.html")) {
    fail("site/dist/privacy.html must link to the public license terms.");
  }
  for (const [label, contents] of publicPages) {
    const normalized = contents.toLowerCase();
    for (const signal of forbiddenTrackingSignals) {
      if (normalized.includes(signal.toLowerCase())) {
        fail(`${label} must not include website tracking/network signal: ${signal}`);
      }
    }

    const externalScriptMatches = contents.match(/<script[^>]+src=["']https?:\/\//gi) || [];
    for (const match of externalScriptMatches) {
      fail(`${label} must not load remote scripts: ${match}`);
    }

    const externalMatches = contents.match(/https?:\/\/[^"')\s<>]+/g) || [];
    for (const url of externalMatches) {
      if (!allowedExternalLinks.some((allowed) => url.startsWith(allowed))) {
        fail(`${label} includes unexpected external URL: ${url}`);
      }
    }
  }
  for (const expected of [
    "source-available, not open source",
    "public so people can inspect, audit, learn from, and verify",
    "Public visibility does not grant permission to profit from this work",
    "commercial reuse",
    "third-party app store redistribution",
    "https://github.com/kborndorff/open-cycle-source/blob/main/LICENSE.md"
  ]) {
    if (!license.includes(expected)) {
      fail(`site/dist/license.html is missing expected license content: ${expected}`);
    }
  }
  if (!upgrade.includes("Local Cycle offers reminders") || !upgrade.includes("Redirecting in") || !upgrade.includes("https://local-cycle.com")) {
    fail("site/dist/upgrade.html must present Local Cycle as the optional paid feature path with a gentle countdown.");
  }
  if (!openCycle.includes("Local Cycle offers reminders") || !openCycle.includes("Redirecting in") || !openCycle.includes("https://local-cycle.com")) {
    fail("site/dist/open-cycle.html must present Local Cycle as the optional paid feature path with a gentle countdown.");
  }
  if (!upgradeScript.includes("https://local-cycle.com")) {
    fail("site/dist/upgrade.js must redirect optional paid feature paths to local-cycle.com.");
  }
  if (!script.includes("legacyHosts") || !script.includes("Redirecting gently")) {
    fail("site/dist/script.js must include legacy-domain gentle redirect handling.");
  }
  for (const route of ["/features", "/pro", "/upgrade", "/pricing"]) {
    const routeLine = `${route} /open-cycle.html?next=${route} 302`;
    if (!redirects.includes(routeLine)) {
      fail(`site/dist/_redirects is missing gentle redirect route: ${routeLine}`);
    }
  }
  if (!headers.includes("X-Frame-Options") || !headers.includes("Referrer-Policy")) {
    fail("site/dist/_headers is missing expected security headers.");
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Site deploy checks passed.");

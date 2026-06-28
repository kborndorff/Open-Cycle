const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium, devices, expect } = require("@playwright/test");

const root = process.cwd();
const screenshotDir = path.join(root, "reports", "visuals");
const reportPath = path.join(root, "reports", "visual-test-report.json");
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain"
};

function serveStatic(staticRoot) {
  const resolvedRoot = path.resolve(staticRoot);
  const server = http.createServer((request, response) => {
    let pathname = decodeURIComponent((request.url || "/").split("?")[0]);
    if (pathname === "/") {
      pathname = "/index.html";
    } else if (pathname.endsWith("/")) {
      pathname = `${pathname}index.html`;
    }

    const filePath = path.resolve(path.join(resolvedRoot, pathname));
    if (!filePath.startsWith(resolvedRoot)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream"
      });
      response.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function checkPublicSite(browser, projectName, useOptions, baseUrl) {
  const context = await browser.newContext(useOptions);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await expect(page.getByRole("heading", { name: "open-cycle", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View source" })).toBeVisible();
  await expect(page.getByText("Your cycle notes stay with you")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  const screenshotPath = path.join(screenshotDir, `site-${projectName}.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();
  return screenshotPath;
}

async function checkBlog(browser, projectName, useOptions, baseUrl) {
  const context = await browser.newContext(useOptions);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/blog/`);
  await expect(page.getByRole("heading", { name: "Period tracking privacy, in normal words" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the guide" })).toBeVisible();
  await expect(page.getByRole("link", { name: "See the examples" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Use the checklist" })).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "See the examples" }).click();
  await expect(page.getByRole("heading", { name: "Why people keep worrying about health app data" })).toBeVisible();
  await expect(page.getByRole("link", { name: "FTC case page: Flo Health, Inc." })).toBeVisible();
  await assertNoHorizontalOverflow(page);
  const screenshotPath = path.join(screenshotDir, `site-blog-${projectName}.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();
  return screenshotPath;
}

async function checkApp(browser, projectName, useOptions, baseUrl) {
  const context = await browser.newContext(useOptions);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`);
  await expect(page.getByRole("heading", { name: "open-cycle", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your cycle log" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save entry" })).toBeVisible();
  await assertNoHorizontalOverflow(page);

  const selectedDate = await page.locator("input[type='date']").inputValue();
  const expectedDisplayDate = await page.evaluate(
    (dateValue) => new Date(`${dateValue}T12:00:00`).toLocaleDateString(),
    selectedDate
  );

  await page.getByPlaceholder("Cramps, headache, tender breasts").fill("Mild cramps");
  await page.getByPlaceholder("Calm, tired, energized").fill("Calm");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Entry saved.")).toBeVisible();
  await expect(page.getByText("Total entries: 1")).toBeVisible();
  await expect(page.getByText(`Latest entry: ${expectedDisplayDate}`)).toBeVisible();
  await expect(page.getByText(`${expectedDisplayDate} - Mild cramps - Calm`)).toBeVisible();

  const screenshotPath = path.join(screenshotDir, `app-${projectName}.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();
  return screenshotPath;
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const sitePreview = await serveStatic(path.join(root, "site", "dist"));
  const appPreview = await serveStatic(path.join(root, "apps", "web", "dist"));
  const browser = await chromium.launch({ channel: "chrome" });
  const results = [];

  try {
    const projects = [
      {
        name: "desktop",
        use: {
          ...devices["Desktop Chrome"],
          viewport: { width: 1440, height: 1100 }
        }
      },
      {
        name: "phone",
        use: {
          ...devices["Pixel 5"],
          viewport: { width: 430, height: 1100 }
        }
      }
    ];

    for (const project of projects) {
      results.push({
        project: project.name,
        target: "site",
        status: "pass",
        screenshot: path.relative(root, await checkPublicSite(browser, project.name, project.use, sitePreview.url)).replace(/\\/g, "/")
      });
      results.push({
        project: project.name,
        target: "siteBlog",
        status: "pass",
        screenshot: path.relative(root, await checkBlog(browser, project.name, project.use, sitePreview.url)).replace(/\\/g, "/")
      });
      results.push({
        project: project.name,
        target: "app",
        status: "pass",
        screenshot: path.relative(root, await checkApp(browser, project.name, project.use, appPreview.url)).replace(/\\/g, "/")
      });
    }
  } finally {
    await browser.close();
    await Promise.all([closeServer(sitePreview.server), closeServer(appPreview.server)]);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: "pass",
    runner: "playwright-api",
    browserChannel: "chrome",
    secretSafe: true,
    publicSafe: true,
    privateMaterialIncluded: false,
    screenshotDir: "reports/visuals",
    results,
    failures: []
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Visual Playwright checks passed. Report written to ${reportPath}`);
}

main().catch((error) => {
  const report = {
    generatedAt: new Date().toISOString(),
    status: "fail",
    runner: "playwright-api",
    browserChannel: "chrome",
    secretSafe: false,
    publicSafe: true,
    privateMaterialIncluded: false,
    screenshotDir: "reports/visuals",
    results: [],
    failures: [error && error.stack ? error.stack : String(error)]
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error);
  process.exit(1);
});

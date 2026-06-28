import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: "reports/playwright-html", open: "never" }]],
  outputDir: "reports/playwright-results",
  use: {
    channel: "chrome",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "node scripts/serve-static-preview.cjs site/dist 4174",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: "node scripts/serve-static-preview.cjs apps/web/dist 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  ],
  projects: [
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
  ]
});

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.ORBIT_E2E_BASE_URL ?? "http://127.0.0.1:5173";

export default defineConfig({
  testDir: ".",
  timeout: 45_000,
  expect: {
    timeout: 8_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-iphone12mini", use: { ...devices["iPhone 12 mini"] } },
    { name: "mobile-iphone15pro", use: { ...devices["iPhone 15 Pro"] } }
  ],
  webServer: process.env.ORBIT_E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        cwd: "../../frontend/orbit-web",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        url: baseURL
      }
});


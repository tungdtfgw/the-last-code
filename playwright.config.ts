import { defineConfig, devices } from "@playwright/test";

/** E2E against the production build (vite preview with the local API, port 4173) with real Pyodide from jsDelivr, on Chromium, Firefox, WebKit and iPhone WebKit. */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    actionTimeout: 20_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // Phone layout (412 px, touch, isMobile) driven by real tap/touch input. The user agent stays
    // desktop Chrome: with an Android UA CodeMirror switches to its Android IME code path, which
    // desktop Chromium's synthetic key events do not exercise (Enter would not split lines).
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], userAgent: devices["Desktop Chrome"].userAgent },
    },
    // Playwright's WebKit builds (2370, 2380) segfault at launch on macOS 26.0, so they are
    // opt-in: E2E_WEBKIT=1 npm run test:e2e. They run unchanged on Linux CI or an older macOS.
    ...(process.env.E2E_WEBKIT === "1"
      ? [
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
          { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
        ]
      : []),
  ],
  // The preview server also serves the API: a fresh SQLite file and mail outbox per run, mail limits off.
  webServer: {
    command: "rm -rf .data/e2e.sqlite .data/e2e-outbox && npm run build && npm run preview",
    env: {
      DB_DRIVER: "sqlite",
      SQLITE_PATH: ".data/e2e.sqlite",
      MAIL_TRANSPORT: "outbox",
      OUTBOX_DIR: ".data/e2e-outbox",
      AUTH_RATE_LIMIT: "off",
      APP_ORIGIN: "http://localhost:4173",
    },
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

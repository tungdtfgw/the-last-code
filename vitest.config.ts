import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/integration/**/*.test.ts", "server/**/*.test.ts", "workers/d1-gateway/src/**/*.test.ts"],
    testTimeout: 30000,
  },
});

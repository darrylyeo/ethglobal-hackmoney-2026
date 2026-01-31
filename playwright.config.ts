import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 60_000,
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "pnpm run build && pnpm run preview",
    url: "http://localhost:4173/",
    timeout: 120_000,
    reuseExistingServer: true,
  },
  testDir: ".",
  testMatch: ["src/routes/**/*.test.ts", "e2e/**/*.test.ts"],
});

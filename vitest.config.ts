import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ["src/api/**/*.spec.ts", "src/constants/**/*.spec.ts", "src/lib/**/*.spec.ts"],
    exclude: [
      "**/voltaire.spec.ts",
      "**/tx-status.spec.ts",
      "**/identity-resolve.spec.ts",
    ],
  },
});

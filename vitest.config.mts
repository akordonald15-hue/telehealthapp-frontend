import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Bound worker contention: the existing suite passed in 24s with two workers,
    // while unrestricted parallelism during browser/build QA caused a 20s timeout.
    maxWorkers: 2,
    // The per-test budget must exceed Testing Library's async query budget, or a slow query
    // races the test timeout and fails for the wrong reason on a loaded machine.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

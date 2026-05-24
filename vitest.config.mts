import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    coverage: {
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/app/**",
        "src/db/**",
      ],
      include: ["src/lib/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
    },
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});

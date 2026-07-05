import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// DayOne is a local-first single-page app. Vitest config lives here too so the
// pure sequenceEngine and helpers can be unit-tested without a separate file.
export default defineConfig({
  // Relative base so the built app works when served from a subpath such as
  // https://<user>.github.io/launchpad/ as well as from a domain root.
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

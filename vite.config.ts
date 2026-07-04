import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// DayOne is a local-first single-page app. Vitest config lives here too so the
// pure sequenceEngine and helpers can be unit-tested without a separate file.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

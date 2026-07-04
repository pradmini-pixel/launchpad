import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// DayOne is a local-first single-page app. Vitest config lives here too so the
// pure sequenceEngine and helpers can be unit-tested without a separate file.
export default defineConfig({
  plugins: [react()],
  server: {
    // Route Groq calls through the dev server so the browser makes a
    // same-origin request (no CORS). The Authorization header (your key) is
    // forwarded untouched; nothing is stored server-side.
    proxy: {
      "/groq": {
        target: "https://api.groq.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/groq/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

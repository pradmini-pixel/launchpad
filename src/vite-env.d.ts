/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for Groq in production builds. On a static host (e.g. GitHub
   * Pages) point this at a Groq proxy (see workers/groq-proxy.js), including
   * the `/openai/v1` suffix. Unset in local dev, where the Vite proxy is used.
   */
  readonly VITE_GROQ_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

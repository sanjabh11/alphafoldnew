/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NCBI_API_KEY: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RETRIES: string
  readonly VITE_API_CACHE_TTL: string
  readonly VITE_PROXY_ENABLED: string
  readonly VITE_PROXY_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

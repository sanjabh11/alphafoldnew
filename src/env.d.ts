/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NCBI_API_KEY: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RETRIES: string
  readonly VITE_API_CACHE_TTL: string
  readonly VITE_PROXY_ENABLED: string
  readonly VITE_PROXY_PORT: string
  readonly VITE_MAX_BATCH_SIZE: string
  readonly VITE_MAX_CONCURRENT_REQUESTS: string
  readonly VITE_NORMALIZATION_METHOD: string
  readonly VITE_LOG_TRANSFORM_ENABLED: string
  readonly VITE_TRIM_OUTLIERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

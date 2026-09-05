/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT?: string
  readonly VITE_API_URL?: string
  readonly VITE_GOOGLE_API_KEY?: string
  readonly VITE_ELEVEN_LAB_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

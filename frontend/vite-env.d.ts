/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CLIENT_TARGET: string
  readonly VITE_FRONTEND_URL: string
  readonly VITE_USE_MOCK_AUTH: string
  readonly VITE_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
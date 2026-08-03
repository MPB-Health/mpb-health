/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARYX_ACCOUNTS_URL: string;
  readonly VITE_ARYX_ACCOUNTS_ANON_KEY: string;
  readonly VITE_SSO_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

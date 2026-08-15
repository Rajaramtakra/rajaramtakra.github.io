/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_AUTO_LOGIN_EMAIL?: string;
  readonly VITE_DEV_AUTO_LOGIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

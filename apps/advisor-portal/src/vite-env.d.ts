/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Set to "true" to enable Tiptap rich text for ticket replies (P0/P1). */
  readonly VITE_RICH_TICKET_EDITOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

# @mpbhealth/database

Supabase client, generated types, auth helpers, and realtime hooks.

## Installation

```bash
pnpm add @mpbhealth/database
```

Built with tsup. Output in `dist/`.

## Usage

```ts
import { supabase, getSupabase } from "@mpbhealth/database";
import type { Database, Profile } from "@mpbhealth/database";
```

```tsx
import { useSupabaseQuery, useRealtimeSubscription } from "@mpbhealth/database";

const { data, loading } = useSupabaseQuery("profiles", (q) => q.select("*"));
```

## API Reference

### Client

- `supabase` — default Supabase client instance
- `getSupabase()` — client getter (useful for lazy init)

### Types

- `Database` — full generated database type
- `BlogArticle`, `CmsPage`, `Profile` — common model types

### Auth Helpers

- `installAuthRefreshGuard` — auto-refresh token management

### Hooks

- `useSupabaseQuery(table, query)` — declarative data fetching
- `usePaginatedQuery(table, query, options)` — paginated fetching
- `useRealtimeSubscription(channel, config)` — single-table realtime
- `useMultiTableSubscription(channels)` — multi-table realtime
- `usePresence(channel)` — presence tracking

## Apps Using This Package

All applications and most packages.

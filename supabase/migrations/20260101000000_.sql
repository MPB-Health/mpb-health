-- Fresh local stacks need pg_trgm before the baseline dump creates GIN
-- indexes that reference extensions.gin_trgm_ops. Production already has
-- this extension; CREATE EXTENSION IF NOT EXISTS is a no-op there if replayed.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

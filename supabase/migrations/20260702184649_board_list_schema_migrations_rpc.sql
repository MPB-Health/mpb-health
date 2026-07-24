create or replace function public.board_list_schema_migrations()
returns table (version text, name text)
language sql
security definer
set search_path = ''
as $$
  select m.version::text, m.name::text
  from supabase_migrations.schema_migrations m
  where m.name is not null
  order by m.version;
$$;

revoke all on function public.board_list_schema_migrations() from public;
revoke all on function public.board_list_schema_migrations() from anon;
revoke all on function public.board_list_schema_migrations() from authenticated;
grant execute on function public.board_list_schema_migrations() to service_role;;

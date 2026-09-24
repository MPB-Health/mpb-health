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

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'board_sync_reader') then
    create role board_sync_reader login noinherit;
  end if;
end
$$;

grant usage on schema public to board_sync_reader;
grant execute on function public.board_list_schema_migrations() to board_sync_reader;;

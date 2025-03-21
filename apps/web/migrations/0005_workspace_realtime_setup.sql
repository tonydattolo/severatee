-- Add replica identity for realtime
alter table public.workspaces replica identity full;
alter table public.workspace_members replica identity full;
-- alter table public.posts replica identity full;

-- Setup realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.workspaces;
alter publication supabase_realtime add table public.workspace_members;
-- alter publication supabase_realtime add table public.posts;

-- Fix permissions
grant usage on schema public to supabase_auth_admin;
grant execute on function public.workspace_auth_claims to supabase_auth_admin;
revoke execute on function public.workspace_auth_claims from authenticated, anon, public;

-- Ensure proper auth hook permissions
grant execute on function public.auth_hook_claims to supabase_auth_admin;
revoke execute on function public.auth_hook_claims from authenticated, anon, public; 
-- MarkAI Clerk authentication migration
-- Links Clerk identities to existing Neon users while preserving all workspace data.

begin;

alter table users add column if not exists clerk_user_id text;

create unique index if not exists idx_users_clerk_user_id_unique
  on users(clerk_user_id)
  where clerk_user_id is not null;

commit;

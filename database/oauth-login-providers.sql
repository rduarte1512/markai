-- MarkAI OAuth login providers migration
-- Safe to run after database/schema.sql.

begin;

create table if not exists oauth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google','microsoft')),
  provider_user_id text not null,
  provider_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_user_id),
  unique(user_id, provider)
);

create index if not exists idx_oauth_accounts_user on oauth_accounts(user_id);
create index if not exists idx_oauth_accounts_email on oauth_accounts(lower(provider_email));

drop trigger if exists oauth_accounts_set_updated_at on oauth_accounts;
create trigger oauth_accounts_set_updated_at
before update on oauth_accounts
for each row execute function set_updated_at();

commit;

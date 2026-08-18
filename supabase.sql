-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  is_main boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  url text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
alter table links enable row level security;

-- Anyone (including anonymous visitors) can read the directory
create policy "public read categories" on categories for select using (true);
create policy "public read links" on links for select using (true);

-- Only signed-in users (i.e. you, once you create an admin account in Supabase Auth)
-- can add/edit/delete
create policy "auth write categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write links" on links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed with the sections from the FOT Universe mockup
insert into categories (name, sort_order) values
  ('General', 1), ('Listing', 2), ('Ad Ops', 3), ('MAAS', 4)
on conflict (name) do nothing;

insert into links (category_id, name, url, sort_order)
select c.id, v.link_name, v.url, v.sort_order
from (values
  ('General', 'FOT 360', 'https://example.com', 1),
  ('General', 'SharePoint', 'https://example.com', 2),
  ('General', 'AST Ticket', 'https://example.com', 3),
  ('Listing', 'AdminNet MY', 'https://example.com', 1),
  ('Listing', 'AdminNet SG', 'https://example.com', 2),
  ('Listing', 'LST Ticket', 'https://example.com', 3),
  ('Ad Ops', 'GAM', 'https://example.com', 1),
  ('Ad Ops', 'Ad Aspects', 'https://example.com', 2),
  ('Ad Ops', 'Dashboard', 'https://example.com', 3),
  ('MAAS', 'Brief Forms', 'https://example.com', 1),
  ('MAAS', 'Ad Aspects', 'https://example.com', 2),
  ('MAAS', 'Dashboard', 'https://example.com', 3)
) as v(category_name, link_name, url, sort_order)
join categories c on c.name = v.category_name
on conflict do nothing;

-- Knowledge base for the Confluence-trained chatbot (uses Gemini's 768-dim embeddings)
create extension if not exists vector;

create table if not exists kb_chunks (
  id uuid primary key default gen_random_uuid(),
  page_id text not null,
  page_title text not null,
  page_url text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(768),
  videos jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create index if not exists kb_chunks_page_id_idx on kb_chunks (page_id);
create index if not exists kb_chunks_embedding_idx on kb_chunks using ivfflat (embedding vector_cosine_ops);

alter table kb_chunks enable row level security;
create policy "public read kb_chunks" on kb_chunks for select using (true);

-- Confluence credentials, editable from the admin panel instead of env vars
create table if not exists settings (
  id text primary key default 'default',
  confluence_base_url text,
  confluence_email text,
  confluence_api_token text,
  confluence_space_key text
);

insert into settings (id) values ('default') on conflict (id) do nothing;

alter table settings enable row level security;
-- No public read policy: only authenticated (admin) requests can read or write this table
create policy "auth read settings" on settings for select
  using (auth.role() = 'authenticated');
create policy "auth write settings" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create or replace function match_kb_chunks(
  query_embedding vector(768),
  match_count int default 6
)
returns table (
  page_id text,
  page_title text,
  page_url text,
  content text,
  videos jsonb,
  similarity float
)
language sql stable
as $$
  select page_id, page_title, page_url, content, videos, 1 - (embedding <=> query_embedding) as similarity
  from kb_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$;

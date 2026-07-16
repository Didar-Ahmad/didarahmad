-- Run this once in Supabase: SQL Editor → New query → paste → Run.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  category text not null default 'Website',
  tech_stack text[] not null default '{}',
  tags text[] not null default '{}',
  youtube_url text not null,
  thumbnail_url text,
  published_at timestamptz not null default now(),
  website_url text,
  github_url text,
  featured boolean not null default false,
  show_on_homepage boolean not null default false,
  display_in_feed boolean not null default true,
  published boolean not null default true
);
alter table public.projects enable row level security;
create policy "Public can view published projects" on public.projects for select using (published = true);
create policy "Owner can manage all projects" on public.projects for all to authenticated using ((auth.jwt() ->> 'email') = 'info@didarahmad.com') with check ((auth.jwt() ->> 'email') = 'info@didarahmad.com');

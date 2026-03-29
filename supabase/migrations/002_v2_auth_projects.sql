-- V2: Auth, Projects, Categories, Host Settings
-- Run this AFTER 001_initial_schema.sql

-- ============================================================
-- PROFILES (linked to Supabase Auth)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(50) not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can create their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PROJECTS (Workspaces)
-- ============================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text default '',
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code varchar(8) unique not null,
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role varchar(20) not null default 'member',
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index idx_projects_owner on projects(owner_id);
create index idx_projects_invite on projects(invite_code);
create index idx_project_members_project on project_members(project_id);
create index idx_project_members_user on project_members(user_id);

alter table projects enable row level security;
alter table project_members enable row level security;

create policy "Projects visible to members"
  on projects for select using (
    exists (
      select 1 from project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
    )
    or owner_id = auth.uid()
  );

create policy "Authenticated users can create projects"
  on projects for insert with check (auth.uid() = owner_id);

create policy "Owners can update projects"
  on projects for update using (auth.uid() = owner_id);

create policy "Owners can delete projects"
  on projects for delete using (auth.uid() = owner_id);

create policy "Project members visible to fellow members"
  on project_members for select using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join projects"
  on project_members for insert with check (auth.uid() = user_id);

create policy "Members can leave (delete themselves)"
  on project_members for delete using (auth.uid() = user_id);

-- ============================================================
-- ALTER SESSIONS: add project_id, host settings, categories
-- ============================================================

alter table sessions add column project_id uuid references projects(id) on delete set null;
alter table sessions add column max_curated integer not null default 5;
alter table sessions add column categories text[] default '{}';
alter table sessions add column sound_enabled boolean not null default true;
alter table sessions add column completed_at timestamptz;

create index idx_sessions_project on sessions(project_id);

-- ============================================================
-- ALTER IDEAS: add category
-- ============================================================

alter table ideas add column category varchar(50) default null;

-- ============================================================
-- ALTER LEADERBOARD: scope to project
-- ============================================================

alter table leaderboard add column project_id uuid references projects(id) on delete cascade;

-- Drop the old unique constraint and add project-scoped one
alter table leaderboard drop constraint if exists leaderboard_user_id_key;
-- Allow same user in multiple project leaderboards
create unique index idx_leaderboard_user_project on leaderboard(user_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'));

-- ============================================================
-- UPDATE RLS FOR AUTH
-- ============================================================

-- Sessions: now use auth
drop policy if exists "Sessions are viewable by everyone" on sessions;
drop policy if exists "Anyone can create a session" on sessions;
drop policy if exists "Host can update their session" on sessions;

create policy "Sessions viewable by authenticated users"
  on sessions for select using (auth.uid() is not null);

create policy "Authenticated users can create sessions"
  on sessions for insert with check (auth.uid() is not null);

create policy "Host can update session"
  on sessions for update using (auth.uid() = host_id);

-- Participants: use auth
drop policy if exists "Participants are viewable by everyone" on participants;
drop policy if exists "Anyone can join a session" on participants;
drop policy if exists "Participants can update themselves" on participants;

create policy "Participants viewable by authenticated users"
  on participants for select using (auth.uid() is not null);

create policy "Authenticated users can join"
  on participants for insert with check (auth.uid() = user_id);

create policy "Participants can update themselves"
  on participants for update using (auth.uid() = user_id);

-- Allow host to delete participants (kick)
create policy "Host can kick participants"
  on participants for delete using (
    exists (
      select 1 from sessions
      where sessions.id = participants.session_id
      and sessions.host_id = auth.uid()
    )
    or auth.uid() = user_id
  );

-- Ideas: use auth
drop policy if exists "Ideas are viewable by session members" on ideas;
drop policy if exists "Anyone can submit ideas" on ideas;
drop policy if exists "Authors can update their ideas" on ideas;
drop policy if exists "Authors can delete their ideas" on ideas;

create policy "Ideas viewable by authenticated users"
  on ideas for select using (auth.uid() is not null);

create policy "Authenticated users can submit ideas"
  on ideas for insert with check (auth.uid() = author_id);

create policy "Authors can update ideas"
  on ideas for update using (auth.uid() = author_id);

create policy "Authors can delete ideas"
  on ideas for delete using (auth.uid() = author_id);

-- Ratings: use auth
drop policy if exists "Ratings are viewable by everyone" on ratings;
drop policy if exists "Anyone can submit ratings" on ratings;
drop policy if exists "Raters can update their ratings" on ratings;

create policy "Ratings viewable by authenticated users"
  on ratings for select using (auth.uid() is not null);

create policy "Authenticated users can rate"
  on ratings for insert with check (auth.uid() = rater_id);

create policy "Raters can update ratings"
  on ratings for update using (auth.uid() = rater_id);

-- Final votes: use auth
drop policy if exists "Votes are viewable by everyone" on final_votes;
drop policy if exists "Anyone can cast a vote" on final_votes;
drop policy if exists "Voters can update their vote" on final_votes;

create policy "Votes viewable by authenticated users"
  on final_votes for select using (auth.uid() is not null);

create policy "Authenticated users can vote"
  on final_votes for insert with check (auth.uid() = voter_id);

create policy "Voters can update vote"
  on final_votes for update using (auth.uid() = voter_id);

-- Leaderboard: use auth
drop policy if exists "Leaderboard is public" on leaderboard;
drop policy if exists "Anyone can create leaderboard entries" on leaderboard;
drop policy if exists "Anyone can update leaderboard entries" on leaderboard;

create policy "Leaderboard is public"
  on leaderboard for select using (true);

create policy "Authenticated users can create leaderboard entries"
  on leaderboard for insert with check (auth.uid() is not null);

create policy "Authenticated users can update leaderboard entries"
  on leaderboard for update using (auth.uid() is not null);

-- ============================================================
-- ENABLE REALTIME on new tables
-- ============================================================

alter publication supabase_realtime add table project_members;

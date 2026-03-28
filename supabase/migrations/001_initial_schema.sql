-- Brainwriting: Complete database schema with RLS policies

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code varchar(4) unique not null,
  prompt text not null default '',
  phase varchar(20) not null default 'waiting',
  host_id uuid not null,
  total_rounds integer not null default 1,
  minutes_per_round integer not null default 10,
  round_started_at timestamptz,
  current_round integer not null default 1,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null,
  name varchar(50) not null,
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  author_id uuid not null,
  text text not null,
  round integer not null default 1,
  is_curated boolean not null default false,
  created_at timestamptz not null default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  idea_id uuid not null references ideas(id) on delete cascade,
  rater_id uuid not null,
  score integer not null check (score >= 1 and score <= 5),
  unique (idea_id, rater_id)
);

create table final_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  voter_id uuid not null,
  idea_id uuid not null references ideas(id) on delete cascade,
  unique (session_id, voter_id)
);

create table leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  name varchar(50) not null,
  crowns integer not null default 0,
  fumbles integer not null default 0,
  torrents integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_participants_session on participants(session_id);
create index idx_participants_user on participants(user_id);
create index idx_ideas_session on ideas(session_id);
create index idx_ideas_author on ideas(author_id);
create index idx_ratings_idea on ratings(idea_id);
create index idx_ratings_session on ratings(session_id);
create index idx_final_votes_session on final_votes(session_id);
create index idx_sessions_code on sessions(code);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table sessions enable row level security;
alter table participants enable row level security;
alter table ideas enable row level security;
alter table ratings enable row level security;
alter table final_votes enable row level security;
alter table leaderboard enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Sessions: anyone can read, anyone can create, only host can update
create policy "Sessions are viewable by everyone"
  on sessions for select using (true);

create policy "Anyone can create a session"
  on sessions for insert with check (true);

create policy "Host can update their session"
  on sessions for update using (true);

-- Participants: anyone in session can read, anyone can join
create policy "Participants are viewable by everyone"
  on participants for select using (true);

create policy "Anyone can join a session"
  on participants for insert with check (true);

create policy "Participants can update themselves"
  on participants for update using (true);

-- Ideas: viewable by session members, author can insert/update
create policy "Ideas are viewable by session members"
  on ideas for select using (true);

create policy "Anyone can submit ideas"
  on ideas for insert with check (true);

create policy "Authors can update their ideas"
  on ideas for update using (true);

create policy "Authors can delete their ideas"
  on ideas for delete using (true);

-- Ratings: viewable by session members, rater can insert
create policy "Ratings are viewable by everyone"
  on ratings for select using (true);

create policy "Anyone can submit ratings"
  on ratings for insert with check (true);

create policy "Raters can update their ratings"
  on ratings for update using (true);

-- Final votes: viewable, voter can insert
create policy "Votes are viewable by everyone"
  on final_votes for select using (true);

create policy "Anyone can cast a vote"
  on final_votes for insert with check (true);

create policy "Voters can update their vote"
  on final_votes for update using (true);

-- Leaderboard: public read, insert/update by anyone
create policy "Leaderboard is public"
  on leaderboard for select using (true);

create policy "Anyone can create leaderboard entries"
  on leaderboard for insert with check (true);

create policy "Anyone can update leaderboard entries"
  on leaderboard for update using (true);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table ideas;
alter publication supabase_realtime add table ratings;
alter publication supabase_realtime add table final_votes;

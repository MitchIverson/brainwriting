-- Story Mode: new tables and session columns

-- Add game mode and genre to sessions
alter table sessions add column if not exists game_mode varchar(10) not null default 'classic';
alter table sessions add column if not exists genre varchar(20) default null;

-- Widen phase column for story phases like 'story:generate:8'
alter table sessions alter column phase type varchar(30);

-- Story beats: tracks winning idea for each of the 8 macro-rounds
create table story_beats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  round_number integer not null check (round_number >= 1 and round_number <= 8),
  beat_name varchar(30) not null,
  prompt_text text not null,
  winning_idea_id uuid references ideas(id) on delete set null,
  unique (session_id, round_number)
);

create index idx_story_beats_session on story_beats(session_id);

alter table story_beats enable row level security;

create policy "Story beats viewable by authenticated users"
  on story_beats for select using (auth.uid() is not null);

create policy "Authenticated users can create story beats"
  on story_beats for insert with check (auth.uid() is not null);

create policy "Authenticated users can update story beats"
  on story_beats for update using (auth.uid() is not null);

alter publication supabase_realtime add table story_beats;

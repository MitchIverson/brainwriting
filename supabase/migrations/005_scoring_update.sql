-- Scoring System Update: rename awards, add shortlists column

-- Rename "fumbles" → "hail_marys"
alter table leaderboard rename column fumbles to hail_marys;

-- Rename "torrents" → "blitzes"
alter table leaderboard rename column torrents to blitzes;

-- Add shortlists column (1 pt per Top 5 placement)
alter table leaderboard add column if not exists shortlists integer not null default 0;

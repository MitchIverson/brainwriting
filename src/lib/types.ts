export interface Session {
  id: string;
  code: string;
  prompt: string;
  phase: string;
  host_id: string;
  total_rounds: number;
  minutes_per_round: number;
  round_started_at: string | null;
  current_round: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  joined_at: string;
}

export interface Idea {
  id: string;
  session_id: string;
  author_id: string;
  text: string;
  round: number;
  is_curated: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  session_id: string;
  idea_id: string;
  rater_id: string;
  score: number;
}

export interface FinalVote {
  id: string;
  session_id: string;
  voter_id: string;
  idea_id: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  name: string;
  crowns: number;
  fumbles: number;
  torrents: number;
  updated_at: string;
}

export type Phase =
  | 'waiting'
  | `generate:${number}`
  | 'curate'
  | 'rate'
  | 'reveal'
  | 'debate'
  | 'results';

export interface RatedIdea extends Idea {
  avg_rating: number;
  author_name: string;
  vote_count?: number;
}

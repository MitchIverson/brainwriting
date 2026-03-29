export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

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
  project_id: string | null;
  max_curated: number;
  categories: string[];
  sound_enabled: boolean;
  completed_at: string | null;
  game_mode: 'classic' | 'story';
  genre: string | null;
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
  category: string | null;
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
  project_id: string | null;
  updated_at: string;
}

export interface StoryBeat {
  id: string;
  session_id: string;
  round_number: number;
  beat_name: string;
  prompt_text: string;
  winning_idea_id: string | null;
}

export type Phase =
  | 'waiting'
  | `generate:${number}`
  | 'spark'
  | 'curate'
  | 'rate'
  | 'reveal'
  | 'debate'
  | 'results'
  | 'story:final';

export interface RatedIdea extends Idea {
  avg_rating: number;
  author_name: string;
  vote_count?: number;
}

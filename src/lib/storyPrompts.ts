export interface StoryBeatTemplate {
  round: number;
  name: string;
  prompt: string;
  emoji: string;
}

export interface Genre {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const GENRES: Genre[] = [
  { id: 'default', name: 'Universal', description: 'Works for any genre', emoji: '🎬' },
  { id: 'horror', name: 'Horror', description: 'Dread, secrets, confinement', emoji: '👻' },
  { id: 'romcom', name: 'Romantic Comedy', description: 'Love, charm, misunderstandings', emoji: '💕' },
  { id: 'thriller', name: 'Thriller', description: 'Conspiracy, stakes, ticking clocks', emoji: '🔍' },
  { id: 'scifi', name: 'Sci-Fi', description: 'Technology, ethics, new worlds', emoji: '🚀' },
];

const DEFAULT_BEATS: StoryBeatTemplate[] = [
  {
    round: 1,
    name: 'The World',
    prompt: 'Who is our main character and where do they live? Paint us a picture.',
    emoji: '🌍',
  },
  {
    round: 2,
    name: 'The Want',
    prompt: 'What does {character} do every day, and what do they secretly want?',
    emoji: '💭',
  },
  {
    round: 3,
    name: 'The Disruption',
    prompt: 'What happens one day that changes everything for {character}?',
    emoji: '💥',
  },
  {
    round: 4,
    name: 'The Obstacle',
    prompt: 'What must {character} now do, and what stands in their way?',
    emoji: '🧱',
  },
  {
    round: 5,
    name: 'The Twist',
    prompt: 'What does {character} discover — and what does it cost them?',
    emoji: '🔀',
  },
  {
    round: 6,
    name: 'The Crisis',
    prompt: 'Everything falls apart. What is the "all is lost" moment?',
    emoji: '🔥',
  },
  {
    round: 7,
    name: 'The Climax',
    prompt: 'What does {character} now understand, and what do they do about it?',
    emoji: '⚔️',
  },
  {
    round: 8,
    name: 'The New World',
    prompt: 'How has the world changed? What did {character} finally learn?',
    emoji: '🌅',
  },
];

const HORROR_BEATS: StoryBeatTemplate[] = [
  {
    round: 1,
    name: 'The World',
    prompt: 'Who is our character and what isolated or unsettling place do they inhabit?',
    emoji: '🏚️',
  },
  {
    round: 2,
    name: 'The Want',
    prompt: 'What does {character} cling to for normalcy, and what are they hiding from?',
    emoji: '🕯️',
  },
  {
    round: 3,
    name: 'The Disruption',
    prompt: 'What does {character} discover lurking nearby — something that shouldn\'t exist?',
    emoji: '👁️',
  },
  {
    round: 4,
    name: 'The Obstacle',
    prompt: 'What must {character} survive, and why can\'t they just leave?',
    emoji: '🚪',
  },
  {
    round: 5,
    name: 'The Twist',
    prompt: 'What terrifying truth does {character} uncover — and what does it cost them?',
    emoji: '💀',
  },
  {
    round: 6,
    name: 'The Crisis',
    prompt: '{character} realizes there is no escape. Why?',
    emoji: '😱',
  },
  {
    round: 7,
    name: 'The Climax',
    prompt: 'How does {character} make a final desperate stand?',
    emoji: '🪓',
  },
  {
    round: 8,
    name: 'The New World',
    prompt: '{character} survives — but at what cost? What still isn\'t right?',
    emoji: '🌑',
  },
];

const ROMCOM_BEATS: StoryBeatTemplate[] = [
  {
    round: 1,
    name: 'The World',
    prompt: 'Who is our charming but flawed lead, and what\'s their world like?',
    emoji: '💐',
  },
  {
    round: 2,
    name: 'The Want',
    prompt: 'What does {character} think they want in life (and love)?',
    emoji: '💌',
  },
  {
    round: 3,
    name: 'The Disruption',
    prompt: 'Who does {character} meet, and what hilariously awkward circumstance brings them together?',
    emoji: '☕',
  },
  {
    round: 4,
    name: 'The Obstacle',
    prompt: 'Why can\'t {character} and their love interest be together? What keeps getting in the way?',
    emoji: '🙈',
  },
  {
    round: 5,
    name: 'The Twist',
    prompt: 'What unexpected connection or secret brings them closer — but complicates everything?',
    emoji: '💋',
  },
  {
    round: 6,
    name: 'The Crisis',
    prompt: 'A misunderstanding about what drives them apart. What happens?',
    emoji: '💔',
  },
  {
    round: 7,
    name: 'The Climax',
    prompt: 'How does {character} make a grand gesture to win them back?',
    emoji: '🏃',
  },
  {
    round: 8,
    name: 'The New World',
    prompt: 'They\'re finally together. What did {character} learn about love?',
    emoji: '💕',
  },
];

const THRILLER_BEATS: StoryBeatTemplate[] = [
  {
    round: 1,
    name: 'The World',
    prompt: 'Who is our protagonist and what seemingly normal world do they operate in?',
    emoji: '🕶️',
  },
  {
    round: 2,
    name: 'The Want',
    prompt: 'What drives {character} — and what secret are they sitting on?',
    emoji: '🔐',
  },
  {
    round: 3,
    name: 'The Disruption',
    prompt: 'What does {character} witness or stumble onto that pulls them into danger?',
    emoji: '📸',
  },
  {
    round: 4,
    name: 'The Obstacle',
    prompt: 'Who is hunting {character}, and why can\'t they trust anyone?',
    emoji: '🎯',
  },
  {
    round: 5,
    name: 'The Twist',
    prompt: 'What does {character} realize has been going on all along — and what does it cost them?',
    emoji: '🕸️',
  },
  {
    round: 6,
    name: 'The Crisis',
    prompt: 'The clock runs out. What impossible choice does {character} face?',
    emoji: '⏰',
  },
  {
    round: 7,
    name: 'The Climax',
    prompt: 'With only one shot left, what does {character} do?',
    emoji: '💣',
  },
  {
    round: 8,
    name: 'The New World',
    prompt: 'The dust settles. What has {character} lost, and what remains?',
    emoji: '🌫️',
  },
];

const SCIFI_BEATS: StoryBeatTemplate[] = [
  {
    round: 1,
    name: 'The World',
    prompt: 'In a world where one thing is fundamentally different, who do we meet?',
    emoji: '🌌',
  },
  {
    round: 2,
    name: 'The Want',
    prompt: 'What role does {character} play in this world, and what do they wish was different?',
    emoji: '🤖',
  },
  {
    round: 3,
    name: 'The Disruption',
    prompt: 'What discovery or event shatters {character}\'s understanding of their world?',
    emoji: '⚡',
  },
  {
    round: 4,
    name: 'The Obstacle',
    prompt: 'What must {character} do now, and what system or force opposes them?',
    emoji: '🛡️',
  },
  {
    round: 5,
    name: 'The Twist',
    prompt: 'What does {character} discover about the technology/world — and what is the ethical cost?',
    emoji: '🧬',
  },
  {
    round: 6,
    name: 'The Crisis',
    prompt: 'The consequences of {character}\'s actions threaten everything. What happens?',
    emoji: '🌋',
  },
  {
    round: 7,
    name: 'The Climax',
    prompt: 'How does {character} use what they\'ve learned to change the game?',
    emoji: '🚀',
  },
  {
    round: 8,
    name: 'The New World',
    prompt: 'The world is forever changed. What remains — and what question lingers?',
    emoji: '🌠',
  },
];

const GENRE_MAP: Record<string, StoryBeatTemplate[]> = {
  default: DEFAULT_BEATS,
  horror: HORROR_BEATS,
  romcom: ROMCOM_BEATS,
  thriller: THRILLER_BEATS,
  scifi: SCIFI_BEATS,
};

export function getStoryBeats(genre: string | null): StoryBeatTemplate[] {
  return GENRE_MAP[genre || 'default'] || DEFAULT_BEATS;
}

export function buildPitch(beats: { round: number; text: string }[]): string {
  const sorted = [...beats].sort((a, b) => a.round - b.round);
  return sorted.map((b) => b.text).join(' ');
}

export function buildLogline(beats: { round: number; text: string }[]): string {
  const r1 = beats.find((b) => b.round === 1)?.text || '';
  const r3 = beats.find((b) => b.round === 3)?.text || '';
  const r4 = beats.find((b) => b.round === 4)?.text || '';

  if (!r1 || !r3 || !r4) return '';

  // Extract a short character reference from R1 (first ~60 chars)
  const charRef = r1.length > 60 ? r1.slice(0, 60) + '...' : r1;

  return `When ${r3.toLowerCase()}, ${charRef} must ${r4.toLowerCase()}`;
}

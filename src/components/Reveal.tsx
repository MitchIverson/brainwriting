'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/StarRating';
import { Idea, Rating, Participant } from '@/lib/types';
import { RatedIdea } from '@/lib/types';

interface RevealProps {
  ideas: Idea[];
  ratings: Rating[];
  participants: Participant[];
  isHost: boolean;
  onAdvance: () => void;
}

function computeRankedIdeas(
  ideas: Idea[],
  ratings: Rating[],
  participants: Participant[]
): RatedIdea[] {
  const curated = ideas.filter((i) => i.is_curated);

  return curated
    .map((idea) => {
      const ideaRatings = ratings.filter((r) => r.idea_id === idea.id);
      const avg =
        ideaRatings.length > 0
          ? ideaRatings.reduce((sum, r) => sum + r.score, 0) / ideaRatings.length
          : 0;
      const author = participants.find((p) => p.user_id === idea.author_id);
      return {
        ...idea,
        avg_rating: Math.round(avg * 10) / 10,
        author_name: author?.name || 'Unknown',
      };
    })
    .sort((a, b) => b.avg_rating - a.avg_rating);
}

/** Find the person who generated the most ideas in a given round */
function findBlitzForRound(ideas: Idea[], participants: Participant[], round: number) {
  const roundIdeas = ideas.filter((i) => i.round === round);
  const counts: Record<string, number> = {};
  roundIdeas.forEach((i) => {
    counts[i.author_id] = (counts[i.author_id] || 0) + 1;
  });

  let maxId = '';
  let maxCount = 0;
  for (const [uid, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxId = uid;
    }
  }

  const author = participants.find((p) => p.user_id === maxId);
  return { name: author?.name || 'Unknown', count: maxCount, userId: maxId };
}

/** Find the overall most prolific person across all ideas (for display) */
function findBlitz(ideas: Idea[], participants: Participant[]) {
  const counts: Record<string, number> = {};
  ideas.forEach((i) => {
    counts[i.author_id] = (counts[i.author_id] || 0) + 1;
  });

  let maxId = '';
  let maxCount = 0;
  for (const [uid, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxId = uid;
    }
  }

  const author = participants.find((p) => p.user_id === maxId);
  return { name: author?.name || 'Unknown', count: maxCount, userId: maxId };
}

export default function Reveal({
  ideas,
  ratings,
  participants,
  isHost,
  onAdvance,
}: RevealProps) {
  const ranked = computeRankedIdeas(ideas, ratings, participants);
  const top5 = ranked.slice(0, 5);
  const hailMary = ranked.length > 0 ? ranked[ranked.length - 1] : null;
  const blitz = findBlitz(ideas, participants);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-heading text-3xl text-gold text-center">Top Ideas</h2>

      {/* Top 5 Shortlist — anonymous, with ⭐ badge */}
      <div className="space-y-3">
        <h3 className="font-heading text-lg text-text-secondary text-center uppercase tracking-wider">
          ⭐ The Shortlist — Top {Math.min(5, top5.length)}
        </h3>
        {top5.map((idea, i) => (
          <Card key={idea.id} glow={i === 0 ? 'gold' : 'none'}>
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-lg ${
                  i === 0
                    ? 'bg-gold text-bg-primary'
                    : 'bg-card-border text-text-secondary'
                }`}
              >
                #{i + 1}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-body text-text-primary text-lg">{idea.text}</p>
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(idea.avg_rating)} readonly size="sm" />
                  <span className="text-sm font-body text-text-secondary">
                    {idea.avg_rating}
                  </span>
                  <Badge variant="gold">⭐ +1 pt</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* The Blitz — name revealed */}
      <Card glow="teal">
        <div className="text-center space-y-1">
          <span className="text-3xl">⚡</span>
          <h3 className="font-heading text-xl text-teal">The Blitz</h3>
          <p className="font-body text-text-primary text-lg">{blitz.name}</p>
          <p className="font-body text-text-secondary text-sm">
            {blitz.count} ideas generated — most prolific ideator
          </p>
        </div>
      </Card>

      {/* The Hail Mary — name revealed */}
      {hailMary && ranked.length > 1 && (
        <Card>
          <div className="text-center space-y-1">
            <span className="text-3xl">🎲</span>
            <h3 className="font-heading text-xl text-text-primary">The Hail Mary</h3>
            <p className="font-body text-text-secondary text-xs uppercase tracking-wider">
              Boldest Swing
            </p>
            <p className="font-body text-text-primary text-lg">&ldquo;{hailMary.text}&rdquo;</p>
            <Badge variant="neutral">{hailMary.author_name}</Badge>
          </div>
        </Card>
      )}

      {isHost ? (
        <Button size="lg" className="w-full" onClick={onAdvance}>
          Begin Debate →
        </Button>
      ) : (
        <p className="text-center text-sm font-body text-text-secondary">
          Waiting for host to begin debate...
        </p>
      )}
    </div>
  );
}

export { computeRankedIdeas, findBlitz, findBlitzForRound };

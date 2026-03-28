'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Idea } from '@/lib/types';

interface CurateProps {
  ideas: Idea[];
  userId: string;
  maxSelections: number;
  onToggleCurate: (ideaId: string, curated: boolean) => void;
  onSubmit: () => void;
}

export default function Curate({
  ideas,
  userId,
  maxSelections,
  onToggleCurate,
  onSubmit,
}: CurateProps) {
  const myIdeas = ideas.filter((i) => i.author_id === userId);
  const curatedCount = myIdeas.filter((i) => i.is_curated).length;

  // Group by round
  const rounds = [...new Set(myIdeas.map((i) => i.round))].sort();

  const handleToggle = (idea: Idea) => {
    if (!idea.is_curated && curatedCount >= maxSelections) return;
    onToggleCurate(idea.id, !idea.is_curated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl text-gold">Curate Your Ideas</h2>
        <p className="font-body text-text-secondary">
          Pick your top {maxSelections} from {myIdeas.length} ideas ({curatedCount}/{maxSelections})
        </p>
      </div>

      {myIdeas.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="font-body text-text-secondary">
              You didn&apos;t submit any ideas this session.
            </p>
            <p className="font-body text-text-secondary text-sm mt-2">
              You can still participate in rating and voting!
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round} className="space-y-2">
              {rounds.length > 1 && (
                <h3 className="font-heading text-sm text-text-secondary uppercase tracking-wider">
                  Round {round}
                </h3>
              )}
              {myIdeas
                .filter((i) => i.round === round)
                .map((idea) => (
                  <div
                    key={idea.id}
                    onClick={() => handleToggle(idea)}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      idea.is_curated
                        ? 'border-gold bg-gold/5'
                        : curatedCount >= maxSelections
                        ? 'border-card-border bg-card-bg opacity-50 cursor-not-allowed'
                        : 'border-card-border bg-card-bg hover:border-gold/30'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        idea.is_curated
                          ? 'border-gold bg-gold text-bg-primary'
                          : 'border-card-border'
                      }`}
                    >
                      {idea.is_curated && <span className="text-xs">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-text-primary">{idea.text}</p>
                    </div>
                    {rounds.length > 1 && (
                      <Badge variant="neutral">R{idea.round}</Badge>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
      >
        Submit & Rate →
      </Button>
    </div>
  );
}

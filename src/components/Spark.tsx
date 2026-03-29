'use client';

import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Idea } from '@/lib/types';
import { shuffleArray } from '@/lib/utils';

interface SparkProps {
  ideas: Idea[];
  userId: string;
  currentRound: number;
  totalRounds: number;
  isHost: boolean;
  onContinue: () => void;
}

export default function Spark({
  ideas,
  userId,
  currentRound,
  totalRounds,
  isHost,
  onContinue,
}: SparkProps) {
  // Show 3-5 random ideas from OTHER people in the PREVIOUS round
  const sparkIdeas = useMemo(() => {
    const othersIdeas = ideas.filter(
      (i) => i.author_id !== userId && i.round === currentRound - 1
    );
    return shuffleArray(othersIdeas).slice(0, Math.min(5, othersIdeas.length));
  }, [ideas, userId, currentRound]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-4xl">✨</span>
        <h2 className="font-heading text-3xl text-gold">Spark Break</h2>
        <p className="font-body text-text-secondary">
          Here are some ideas from the room. Let them inspire your next round!
        </p>
        <Badge variant="teal">Round {currentRound}/{totalRounds} coming up</Badge>
      </div>

      {sparkIdeas.length > 0 ? (
        <div className="space-y-3">
          {sparkIdeas.map((idea) => (
            <Card key={idea.id}>
              <p className="font-body text-text-primary italic">
                &ldquo;{idea.text}&rdquo;
              </p>
              {idea.category && (
                <Badge variant="neutral" className="mt-2">{idea.category}</Badge>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center font-body text-text-secondary py-4">
            No ideas from others to show yet. Keep going!
          </p>
        </Card>
      )}

      {isHost ? (
        <Button size="lg" className="w-full" onClick={onContinue}>
          Start Round {currentRound} →
        </Button>
      ) : (
        <p className="text-center text-sm font-body text-text-secondary">
          Waiting for host to start round {currentRound}...
        </p>
      )}
    </div>
  );
}

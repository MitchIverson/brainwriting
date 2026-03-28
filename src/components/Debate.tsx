'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/StarRating';
import { Idea, Rating, Participant, FinalVote } from '@/lib/types';
import { computeRankedIdeas } from '@/components/Reveal';

interface DebateProps {
  ideas: Idea[];
  ratings: Rating[];
  participants: Participant[];
  finalVotes: FinalVote[];
  userId: string;
  isHost: boolean;
  onCastVote: (ideaId: string) => void;
  onRevealWinner: () => void;
}

export default function Debate({
  ideas,
  ratings,
  participants,
  finalVotes,
  userId,
  isHost,
  onCastVote,
  onRevealWinner,
}: DebateProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ranked = computeRankedIdeas(ideas, ratings, participants);
  const top5 = ranked.slice(0, 5);

  const myVote = finalVotes.find((v) => v.voter_id === userId);
  const hasVoted = !!myVote;

  const handleVote = () => {
    if (selectedId) {
      onCastVote(selectedId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl text-gold">Debate & Vote</h2>
        <p className="font-body text-text-secondary">
          {hasVoted
            ? 'Your vote is in! Waiting for everyone...'
            : 'Discuss the top ideas, then cast your vote'}
        </p>
      </div>

      <div className="space-y-3">
        {top5.map((idea, i) => {
          const isSelected = selectedId === idea.id;
          const isVoted = myVote?.idea_id === idea.id;

          return (
            <Card
              key={idea.id}
              selected={isSelected || isVoted}
              onClick={hasVoted ? undefined : () => setSelectedId(idea.id)}
              glow={isVoted ? 'gold' : 'none'}
            >
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
                  <div className="flex items-center gap-3">
                    <Badge variant="teal">{idea.author_name}</Badge>
                    <div className="flex items-center gap-1">
                      <StarRating value={Math.round(idea.avg_rating)} readonly size="sm" />
                      <span className="text-sm font-body text-text-secondary">
                        {idea.avg_rating}
                      </span>
                    </div>
                  </div>
                </div>
                {(isSelected || isVoted) && (
                  <div className="text-gold text-xl">✓</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {!hasVoted ? (
        <Button
          size="lg"
          className="w-full"
          onClick={handleVote}
          disabled={!selectedId}
        >
          Cast My Vote →
        </Button>
      ) : isHost ? (
        <Button size="lg" className="w-full" onClick={onRevealWinner}>
          Reveal Winner →
        </Button>
      ) : (
        <Card>
          <div className="text-center py-2">
            <p className="font-body text-text-secondary">
              ✓ Vote submitted! Waiting for host to reveal the winner...
            </p>
          </div>
        </Card>
      )}

      <div className="text-center">
        <Badge variant="neutral">
          {finalVotes.length}/{participants.length} votes in
        </Badge>
      </div>
    </div>
  );
}

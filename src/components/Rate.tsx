'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StarRating from '@/components/StarRating';
import { Idea, Rating } from '@/lib/types';
import { shuffleArray } from '@/lib/utils';

interface RateProps {
  ideas: Idea[];
  ratings: Rating[];
  userId: string;
  isHost: boolean;
  onSubmitRating: (ideaId: string, score: number) => void;
  onAdvance: () => void;
}

export default function Rate({
  ideas,
  ratings,
  userId,
  isHost,
  onSubmitRating,
  onAdvance,
}: RateProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Get curated ideas from OTHER participants, shuffled
  const otherCuratedIdeas = useMemo(
    () =>
      shuffleArray(
        ideas.filter((i) => i.is_curated && i.author_id !== userId)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ideas.filter((i) => i.is_curated).length, userId, refreshKey]
  );

  const myRatings = ratings.filter((r) => r.rater_id === userId);
  const ratedCount = myRatings.length;
  const totalToRate = otherCuratedIdeas.length;

  const getRating = (ideaId: string) => {
    return myRatings.find((r) => r.idea_id === ideaId)?.score || 0;
  };

  const allRated = ratedCount >= totalToRate && totalToRate > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-heading text-3xl text-gold">Rate Ideas</h2>
        <p className="font-body text-text-secondary">
          {totalToRate > 0
            ? `${ratedCount}/${totalToRate} rated`
            : 'No ideas from others to rate yet'}
        </p>
      </div>

      {otherCuratedIdeas.length === 0 ? (
        <Card>
          <div className="text-center py-6 space-y-3">
            <p className="font-body text-text-secondary">
              No curated ideas from other participants yet.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Refresh
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {otherCuratedIdeas.map((idea) => (
            <Card key={idea.id}>
              <div className="space-y-3">
                <p className="font-body text-text-primary text-lg">
                  {idea.text}
                </p>
                <StarRating
                  value={getRating(idea.id)}
                  onChange={(score) => onSubmitRating(idea.id, score)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {isHost && (
        <Button
          size="lg"
          className="w-full"
          onClick={onAdvance}
          disabled={!allRated && totalToRate > 0}
        >
          {allRated ? 'Reveal Results →' : `Rate all ideas first (${ratedCount}/${totalToRate})`}
        </Button>
      )}

      {!isHost && (
        <p className="text-center text-sm font-body text-text-secondary">
          {allRated
            ? 'All rated! Waiting for host to reveal results...'
            : 'Rate all ideas, then wait for the host to advance.'}
        </p>
      )}
    </div>
  );
}

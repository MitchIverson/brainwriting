'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { StoryBeat, Idea } from '@/lib/types';
import { StoryBeatTemplate } from '@/lib/storyPrompts';

interface StorySoFarProps {
  completedBeats: StoryBeat[];
  ideas: Idea[];
  beatTemplates: StoryBeatTemplate[];
  currentBeatNumber: number;
}

export default function StorySoFar({
  completedBeats,
  ideas,
  beatTemplates,
  currentBeatNumber,
}: StorySoFarProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show completed beats (those with winning ideas)
  const beatsWithWinners = completedBeats
    .filter((b) => b.winning_idea_id)
    .sort((a, b) => a.round_number - b.round_number);

  if (beatsWithWinners.length === 0) return null;

  const getWinningText = (beat: StoryBeat) => {
    const idea = ideas.find((i) => i.id === beat.winning_idea_id);
    return idea?.text || '';
  };

  const getTemplate = (roundNumber: number) => {
    return beatTemplates.find((t) => t.round === roundNumber);
  };

  // Build the story paragraph
  const storyText = beatsWithWinners.map((b) => getWinningText(b)).join(' ');

  // Collapsed: show just the last 2 sentences
  const recentBeats = beatsWithWinners.slice(-2);

  return (
    <Card className="border-gold/20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm text-gold uppercase tracking-wider flex items-center gap-2">
            <span>The Story So Far</span>
            <span className="text-xs font-body text-text-secondary font-normal">
              ({beatsWithWinners.length}/{currentBeatNumber - 1} beats)
            </span>
          </h3>
          {beatsWithWinners.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-body text-gold/70 hover:text-gold cursor-pointer"
            >
              {expanded ? 'Collapse' : 'Show all'}
            </button>
          )}
        </div>

        {expanded ? (
          <div className="space-y-2">
            {beatsWithWinners.map((beat) => {
              const template = getTemplate(beat.round_number);
              return (
                <div key={beat.id} className="flex gap-2">
                  <span className="text-sm flex-shrink-0">{template?.emoji || ''}</span>
                  <div>
                    <span className="text-xs font-heading text-gold/60">
                      {template?.name || `Beat ${beat.round_number}`}:
                    </span>
                    <p className="font-body text-sm text-text-primary leading-relaxed">
                      {getWinningText(beat)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-body text-sm text-text-primary leading-relaxed italic">
            {beatsWithWinners.length > 2 && '... '}
            {recentBeats.map((b) => getWinningText(b)).join(' ')}
          </p>
        )}
      </div>
    </Card>
  );
}

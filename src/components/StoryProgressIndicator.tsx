'use client';

import { StoryBeat } from '@/lib/types';
import { StoryBeatTemplate } from '@/lib/storyPrompts';

interface StoryProgressIndicatorProps {
  beats: StoryBeatTemplate[];
  completedBeats: StoryBeat[];
  currentBeatNumber: number;
}

export default function StoryProgressIndicator({
  beats,
  completedBeats,
  currentBeatNumber,
}: StoryProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 md:gap-1.5 py-3">
      {beats.map((beat) => {
        const isCompleted = completedBeats.some(
          (b) => b.round_number === beat.round && b.winning_idea_id
        );
        const isCurrent = beat.round === currentBeatNumber;

        return (
          <div key={beat.round} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                isCurrent
                  ? 'bg-gold text-bg-primary scale-110 shadow-lg shadow-gold/40 font-bold'
                  : isCompleted
                  ? 'bg-gold/30 text-gold'
                  : 'bg-card-bg text-text-secondary border border-card-border'
              }`}
              title={`${beat.name}: ${beat.prompt}`}
            >
              {beat.emoji}
            </div>
            <span
              className={`text-[9px] md:text-[10px] font-body leading-tight text-center max-w-[60px] ${
                isCurrent
                  ? 'text-gold font-semibold'
                  : isCompleted
                  ? 'text-text-secondary'
                  : 'text-text-secondary/50'
              }`}
            >
              {beat.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

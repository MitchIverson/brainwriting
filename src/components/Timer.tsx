'use client';

import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/lib/utils';

interface TimerProps {
  roundStartedAt: string | null;
  minutesPerRound: number;
}

export default function Timer({ roundStartedAt, minutesPerRound }: TimerProps) {
  const secondsLeft = useTimer(roundStartedAt, minutesPerRound);
  const isUrgent = secondsLeft <= 30 && secondsLeft > 0;
  const isExpired = secondsLeft <= 0;

  return (
    <div className="text-center">
      <div
        className={`font-heading text-5xl md:text-6xl font-bold tracking-wider transition-colors duration-500 ${
          isExpired
            ? 'text-danger animate-pulse'
            : isUrgent
            ? 'text-danger drop-shadow-[0_0_20px_rgba(232,82,74,0.5)]'
            : 'text-gold drop-shadow-[0_0_20px_rgba(232,168,56,0.3)]'
        }`}
      >
        {isExpired ? "Time!" : formatTime(secondsLeft)}
      </div>
    </div>
  );
}

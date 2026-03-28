'use client';

import { useState, useEffect } from 'react';

export function useTimer(
  roundStartedAt: string | null,
  minutesPerRound: number
): number {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!roundStartedAt) return minutesPerRound * 60;
    const elapsed = Math.floor(
      (Date.now() - new Date(roundStartedAt).getTime()) / 1000
    );
    return Math.max(0, minutesPerRound * 60 - elapsed);
  });

  useEffect(() => {
    if (!roundStartedAt) {
      setSecondsLeft(minutesPerRound * 60);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(roundStartedAt).getTime()) / 1000
      );
      setSecondsLeft(Math.max(0, minutesPerRound * 60 - elapsed));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [roundStartedAt, minutesPerRound]);

  return secondsLeft;
}

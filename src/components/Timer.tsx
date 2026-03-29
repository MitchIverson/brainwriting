'use client';

import { useRef, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/lib/utils';

interface TimerProps {
  roundStartedAt: string | null;
  minutesPerRound: number;
  soundEnabled?: boolean;
}

// Generate beep sounds using Web Audio API
function playBeep(frequency: number, duration: number, volume: number = 0.3) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio isn't available
  }
}

export default function Timer({ roundStartedAt, minutesPerRound, soundEnabled = true }: TimerProps) {
  const secondsLeft = useTimer(roundStartedAt, minutesPerRound);
  const isUrgent = secondsLeft <= 30 && secondsLeft > 0;
  const isExpired = secondsLeft <= 0;
  const hasPlayed30 = useRef(false);
  const hasPlayedEnd = useRef(false);

  // Reset sound flags when round changes
  useEffect(() => {
    hasPlayed30.current = false;
    hasPlayedEnd.current = false;
  }, [roundStartedAt]);

  // Play sounds at 30s and 0s
  useEffect(() => {
    if (!soundEnabled) return;

    if (secondsLeft === 30 && !hasPlayed30.current) {
      hasPlayed30.current = true;
      playBeep(880, 0.3); // A5 note - warning
    }

    if (secondsLeft === 0 && !hasPlayedEnd.current) {
      hasPlayedEnd.current = true;
      // Triple beep for times up
      playBeep(1047, 0.2, 0.4);
      setTimeout(() => playBeep(1047, 0.2, 0.4), 250);
      setTimeout(() => playBeep(1319, 0.4, 0.4), 500);
    }
  }, [secondsLeft, soundEnabled]);

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

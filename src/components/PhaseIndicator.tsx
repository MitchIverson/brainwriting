'use client';

const PHASES = [
  { key: 'waiting', label: 'Lobby' },
  { key: 'generate', label: 'Generate' },
  { key: 'curate', label: 'Curate' },
  { key: 'rate', label: 'Rate' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'debate', label: 'Debate' },
  { key: 'results', label: 'Results' },
];

interface PhaseIndicatorProps {
  currentPhase: string;
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const normalizedPhase = currentPhase.startsWith('generate') ? 'generate' : currentPhase;
  const currentIndex = PHASES.findIndex((p) => p.key === normalizedPhase);

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 py-3">
      {PHASES.map((phase, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;

        return (
          <div key={phase.key} className="flex items-center gap-1 md:gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-gold shadow-lg shadow-gold/40 scale-125'
                    : isPast
                    ? 'bg-gold/40'
                    : 'bg-card-border'
                }`}
              />
              <span
                className={`text-[10px] md:text-xs font-body hidden sm:block ${
                  isActive ? 'text-gold font-semibold' : isPast ? 'text-text-secondary' : 'text-text-secondary/50'
                }`}
              >
                {phase.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`w-4 md:w-8 h-px mb-3 sm:mb-4 ${
                  isPast ? 'bg-gold/40' : 'bg-card-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

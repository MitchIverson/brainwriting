'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Timer from '@/components/Timer';
import { Session, Idea } from '@/lib/types';

interface GenerateProps {
  session: Session;
  ideas: Idea[];
  allIdeas: Idea[]; // all ideas in session (for room activity count)
  userId: string;
  isHost: boolean;
  onSubmitIdea: (text: string, round: number) => void;
  onDeleteIdea: (ideaId: string) => void;
  onNextRound: () => void;
  onFinishGenerating: () => void;
}

export default function Generate({
  session,
  ideas,
  allIdeas,
  userId,
  isHost,
  onSubmitIdea,
  onDeleteIdea,
  onNextRound,
  onFinishGenerating,
}: GenerateProps) {
  const [inputText, setInputText] = useState('');

  const currentRound = session.current_round;
  const totalRounds = session.total_rounds;
  const isLastRound = currentRound >= totalRounds;

  const myIdeas = ideas.filter((i) => i.author_id === userId);
  const myRoundIdeas = myIdeas.filter((i) => i.round === currentRound);
  const totalRoomIdeas = allIdeas.length;

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    onSubmitIdea(text, currentRound);
    setInputText('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Timer */}
      <Timer
        roundStartedAt={session.round_started_at}
        minutesPerRound={session.minutes_per_round}
      />

      {/* Round Progress */}
      {totalRounds > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalRounds }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold transition-all ${
                i + 1 === currentRound
                  ? 'bg-gold text-bg-primary scale-110'
                  : i + 1 < currentRound
                  ? 'bg-gold/30 text-gold'
                  : 'bg-card-bg text-text-secondary border border-card-border'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Prompt */}
      <Card glow="gold">
        <p className="font-heading text-lg md:text-xl text-gold text-center">
          {session.prompt}
        </p>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="Type your idea and hit Enter..."
          className="flex-1 bg-card-bg border border-card-border rounded-lg px-4 py-3 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
          autoFocus
        />
        <Button onClick={handleSubmit} disabled={!inputText.trim()}>
          Add
        </Button>
      </div>

      {/* Badges */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Badge variant="gold">This round: {myRoundIdeas.length}</Badge>
        {totalRounds > 1 && (
          <Badge variant="teal">Total: {myIdeas.length}</Badge>
        )}
        <Badge variant="neutral">Room activity: {totalRoomIdeas} ideas</Badge>
      </div>

      {/* My ideas this round */}
      {myRoundIdeas.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-heading text-sm text-text-secondary uppercase tracking-wider">
            Your ideas — Round {currentRound}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {myRoundIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-start gap-2 bg-card-bg border border-card-border rounded-lg px-4 py-2.5"
              >
                <p className="flex-1 font-body text-text-primary text-sm">{idea.text}</p>
                <button
                  onClick={() => onDeleteIdea(idea.id)}
                  className="text-text-secondary hover:text-danger text-xs mt-0.5 cursor-pointer"
                  title="Delete idea"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      {isHost && (
        <div className="pt-2">
          {isLastRound ? (
            <Button size="lg" className="w-full" onClick={onFinishGenerating}>
              Done — Select My Top 5 →
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={onNextRound}>
              Next Round ({currentRound + 1}/{totalRounds}) →
            </Button>
          )}
        </div>
      )}

      {!isHost && (
        <p className="text-center text-sm font-body text-text-secondary">
          {isLastRound
            ? 'Waiting for host to advance to curation...'
            : 'Waiting for host to start next round...'}
        </p>
      )}
    </div>
  );
}

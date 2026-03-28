'use client';

import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import PhaseIndicator from '@/components/PhaseIndicator';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import Generate from '@/components/Generate';
import Curate from '@/components/Curate';
import Rate from '@/components/Rate';
import Reveal from '@/components/Reveal';
import Debate from '@/components/Debate';
import Results from '@/components/Results';
import Leaderboard from '@/components/Leaderboard';
import { setUserName } from '@/lib/utils';
import { Session } from '@/lib/types';

export default function Home() {
  const {
    session,
    participants,
    ideas,
    ratings,
    finalVotes,
    loading,
    error,
    userId,
    isHost,
    createSession,
    joinSession,
    updateSession,
    submitIdea,
    deleteIdea,
    toggleCurate,
    submitRating,
    castVote,
    leaveSession,
  } = useSession();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [curateReady, setCurateReady] = useState(false);

  const handleCreateSession = useCallback(
    async (name: string) => {
      setUserName(name);
      await createSession(name);
    },
    [createSession]
  );

  const handleJoinSession = useCallback(
    async (code: string, name: string) => {
      setUserName(name);
      await joinSession(code, name);
    },
    [joinSession]
  );

  const handleNextRound = useCallback(() => {
    if (!session) return;
    const nextRound = session.current_round + 1;
    updateSession({
      current_round: nextRound,
      phase: `generate:${nextRound}`,
      round_started_at: new Date().toISOString(),
    });
  }, [session, updateSession]);

  const handleFinishGenerating = useCallback(() => {
    updateSession({ phase: 'curate' });
  }, [updateSession]);

  const handleCurateSubmit = useCallback(() => {
    setCurateReady(true);
    if (isHost) {
      updateSession({ phase: 'rate' });
    }
  }, [isHost, updateSession]);

  const handleAdvanceToReveal = useCallback(() => {
    updateSession({ phase: 'reveal' });
  }, [updateSession]);

  const handleAdvanceToDebate = useCallback(() => {
    updateSession({ phase: 'debate' });
  }, [updateSession]);

  const handleRevealWinner = useCallback(() => {
    updateSession({ phase: 'results' });
  }, [updateSession]);

  const handleNewRound = useCallback(() => {
    updateSession({
      phase: 'generate:1',
      current_round: 1,
      round_started_at: new Date().toISOString(),
    });
  }, [updateSession]);

  // Show leaderboard
  if (showLeaderboard) {
    return <Leaderboard onBack={() => setShowLeaderboard(false)} />;
  }

  // No session yet — show lobby
  if (!session) {
    return (
      <Lobby
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
        onViewLeaderboard={() => setShowLeaderboard(true)}
        loading={loading}
        error={error}
      />
    );
  }

  const phase = session.phase;

  const renderPhase = () => {
    if (phase === 'waiting') {
      return (
        <WaitingRoom
          session={session}
          participants={participants}
          isHost={isHost}
          onUpdateSession={updateSession as (updates: Partial<Session>) => void}
          onLeave={leaveSession}
        />
      );
    }

    if (phase.startsWith('generate')) {
      return (
        <Generate
          session={session}
          ideas={ideas.filter((i) => i.author_id === userId)}
          allIdeas={ideas}
          userId={userId}
          isHost={isHost}
          onSubmitIdea={submitIdea}
          onDeleteIdea={deleteIdea}
          onNextRound={handleNextRound}
          onFinishGenerating={handleFinishGenerating}
        />
      );
    }

    if (phase === 'curate') {
      if (curateReady && !isHost) {
        return (
          <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="font-heading text-2xl text-gold">Ideas Curated!</h2>
            <p className="font-body text-text-secondary">
              Waiting for everyone to finish curating...
            </p>
          </div>
        );
      }
      return (
        <Curate
          ideas={ideas}
          userId={userId}
          maxSelections={5}
          onToggleCurate={toggleCurate}
          onSubmit={handleCurateSubmit}
        />
      );
    }

    if (phase === 'rate') {
      return (
        <Rate
          ideas={ideas}
          ratings={ratings}
          userId={userId}
          isHost={isHost}
          onSubmitRating={submitRating}
          onAdvance={handleAdvanceToReveal}
        />
      );
    }

    if (phase === 'reveal') {
      return (
        <Reveal
          ideas={ideas}
          ratings={ratings}
          participants={participants}
          isHost={isHost}
          onAdvance={handleAdvanceToDebate}
        />
      );
    }

    if (phase === 'debate') {
      return (
        <Debate
          ideas={ideas}
          ratings={ratings}
          participants={participants}
          finalVotes={finalVotes}
          userId={userId}
          isHost={isHost}
          onCastVote={castVote}
          onRevealWinner={handleRevealWinner}
        />
      );
    }

    if (phase === 'results') {
      return (
        <Results
          ideas={ideas}
          ratings={ratings}
          participants={participants}
          finalVotes={finalVotes}
          isHost={isHost}
          onNewRound={handleNewRound}
          onLeave={leaveSession}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {phase !== 'waiting' && (
        <div className="border-b border-card-border">
          <PhaseIndicator currentPhase={phase} />
        </div>
      )}
      <main className="flex-1 p-4 md:p-6">{renderPhase()}</main>
    </div>
  );
}

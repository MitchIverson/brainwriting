'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useProjects } from '@/hooks/useProjects';
import PhaseIndicator from '@/components/PhaseIndicator';
import Auth from '@/components/Auth';
import Dashboard from '@/components/Dashboard';
import ProjectView from '@/components/ProjectView';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import Generate from '@/components/Generate';
import Spark from '@/components/Spark';
import Curate from '@/components/Curate';
import Rate from '@/components/Rate';
import Reveal from '@/components/Reveal';
import Debate from '@/components/Debate';
import Results from '@/components/Results';
import Leaderboard from '@/components/Leaderboard';
import { Project, Session } from '@/lib/types';

type View = 'dashboard' | 'project' | 'leaderboard' | 'session';

export default function Home() {
  const auth = useAuth();
  const {
    session,
    participants,
    ideas,
    ratings,
    finalVotes,
    loading: sessionLoading,
    error: sessionError,
    isHost,
    createSession,
    joinSession,
    updateSession,
    submitIdea,
    deleteIdea,
    toggleCurate,
    submitRating,
    castVote,
    kickParticipant,
    leaveSession,
  } = useSession(auth.user?.id);

  const projectsHook = useProjects(auth.user?.id);

  const [view, setView] = useState<View>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [curateReady, setCurateReady] = useState(false);

  const userId = auth.user?.id || '';
  const displayName = auth.profile?.display_name || '';

  // -- Navigation handlers --

  const handleCreateSession = useCallback(
    async (projectId?: string) => {
      const result = await createSession(displayName, projectId);
      if (result) setView('session');
    },
    [createSession, displayName]
  );

  const handleJoinSession = useCallback(
    async (code: string) => {
      const result = await joinSession(code, displayName);
      if (result) setView('session');
    },
    [joinSession, displayName]
  );

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setView('project');
  }, []);

  const handleLeaveSession = useCallback(() => {
    leaveSession();
    setCurateReady(false);
    setView('dashboard');
  }, [leaveSession]);

  // -- Phase transition handlers --

  const handleNextRound = useCallback(() => {
    if (!session) return;
    const nextRound = session.current_round + 1;
    // If multi-round, go to spark screen first
    if (session.total_rounds > 1) {
      updateSession({
        current_round: nextRound,
        phase: 'spark',
      });
    } else {
      updateSession({
        current_round: nextRound,
        phase: `generate:${nextRound}`,
        round_started_at: new Date().toISOString(),
      });
    }
  }, [session, updateSession]);

  const handleStartRoundFromSpark = useCallback(() => {
    if (!session) return;
    updateSession({
      phase: `generate:${session.current_round}`,
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
    setCurateReady(false);
    updateSession({
      phase: 'generate:1',
      current_round: 1,
      round_started_at: new Date().toISOString(),
    });
  }, [updateSession]);

  // Skip phase handlers (host only)
  const handleSkipToReveal = useCallback(() => {
    updateSession({ phase: 'reveal' });
  }, [updateSession]);

  const handleSkipToResults = useCallback(() => {
    updateSession({ phase: 'results' });
  }, [updateSession]);

  // -- Auth loading state --
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-4xl text-gold">Brainwriting</h1>
          <p className="text-text-secondary font-body">Loading...</p>
        </div>
      </div>
    );
  }

  // -- Not logged in: show auth --
  if (!auth.user) {
    return (
      <Auth
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        error={auth.error}
      />
    );
  }

  // -- Leaderboard view --
  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('dashboard')} />;
  }

  // -- Project detail view --
  if (view === 'project' && selectedProject && auth.profile) {
    return (
      <ProjectView
        project={selectedProject}
        userId={userId}
        profile={auth.profile}
        onBack={() => { setSelectedProject(null); setView('dashboard'); }}
        onCreateSession={(projectId) => handleCreateSession(projectId)}
        onJoinSession={handleJoinSession}
      />
    );
  }

  // -- In a session --
  if (view === 'session' && session) {
    const phase = session.phase;

    const renderPhase = () => {
      if (phase === 'waiting') {
        return (
          <WaitingRoom
            session={session}
            participants={participants}
            isHost={isHost}
            userId={userId}
            onUpdateSession={updateSession as (updates: Partial<Session>) => void}
            onKickParticipant={kickParticipant}
            onLeave={handleLeaveSession}
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

      if (phase === 'spark') {
        return (
          <Spark
            ideas={ideas}
            userId={userId}
            currentRound={session.current_round}
            totalRounds={session.total_rounds}
            isHost={isHost}
            onContinue={handleStartRoundFromSpark}
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
            maxSelections={session.max_curated || 5}
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
            session={session}
            ideas={ideas}
            ratings={ratings}
            participants={participants}
            finalVotes={finalVotes}
            isHost={isHost}
            onNewRound={handleNewRound}
            onLeave={handleLeaveSession}
          />
        );
      }

      return null;
    };

    return (
      <div className="min-h-screen flex flex-col">
        {phase !== 'waiting' && (
          <div className="border-b border-card-border">
            <div className="flex items-center justify-between px-4">
              <PhaseIndicator currentPhase={phase} />
              {isHost && phase !== 'results' && (
                <div className="flex gap-2">
                  {(phase === 'rate' || phase === 'reveal' || phase === 'debate') && (
                    <button
                      onClick={handleSkipToResults}
                      className="text-xs font-body text-text-secondary hover:text-gold cursor-pointer"
                    >
                      Skip to Results →
                    </button>
                  )}
                  {phase === 'rate' && (
                    <button
                      onClick={handleSkipToReveal}
                      className="text-xs font-body text-text-secondary hover:text-gold cursor-pointer"
                    >
                      Skip to Reveal →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{renderPhase()}</main>
      </div>
    );
  }

  // -- Dashboard (default view when logged in but not in a session) --
  if (auth.profile) {
    return (
      <Dashboard
        profile={auth.profile}
        projects={projectsHook.projects}
        loading={projectsHook.loading}
        onCreateProject={projectsHook.createProject}
        onJoinProject={projectsHook.joinProject}
        onSelectProject={handleSelectProject}
        onCreateSession={() => handleCreateSession()}
        onJoinSession={handleJoinSession}
        onViewLeaderboard={() => setView('leaderboard')}
        onSignOut={auth.signOut}
      />
    );
  }

  return null;
}

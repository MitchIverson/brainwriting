'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useProjects } from '@/hooks/useProjects';
import PhaseIndicator from '@/components/PhaseIndicator';
import StoryProgressIndicator from '@/components/StoryProgressIndicator';
import StorySoFar from '@/components/StorySoFar';
import StoryResults from '@/components/StoryResults';
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
import { getStoryBeats } from '@/lib/storyPrompts';
import { computeRankedIdeas } from '@/components/Reveal';

type View = 'dashboard' | 'project' | 'leaderboard' | 'session';

export default function Home() {
  const auth = useAuth();
  const {
    session,
    participants,
    ideas,
    ratings,
    finalVotes,
    storyBeats,
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
    saveStoryBeat,
    resetForNextBeat,
    leaveSession,
  } = useSession(auth.user?.id);

  const projectsHook = useProjects(auth.user?.id);

  const [view, setView] = useState<View>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [curateReady, setCurateReady] = useState(false);

  const userId = auth.user?.id || '';
  const displayName = auth.profile?.display_name || '';

  // -- Story Mode helpers --
  const isStoryMode = session?.game_mode === 'story';
  const beatTemplates = useMemo(
    () => (isStoryMode ? getStoryBeats(session?.genre || null) : []),
    [isStoryMode, session?.genre]
  );

  // Current story beat number: count completed beats + 1
  const completedStoryBeats = useMemo(
    () => storyBeats.filter((b) => b.winning_idea_id),
    [storyBeats]
  );
  const currentStoryBeatNumber = completedStoryBeats.length + 1;
  const currentBeatTemplate = beatTemplates.find((b) => b.round === currentStoryBeatNumber);
  const isLastStoryBeat = currentStoryBeatNumber >= 8;

  // For story mode, filter ideas to only those from the current beat
  // We use a naming convention: story beat ideas have round >= (beatNum-1)*100+1
  // Actually, simpler: we just track which ideas belong to which beat by checking
  // ideas created after the last beat was locked in. But the simplest approach:
  // In story mode, when we advance to next beat we DON'T clear ideas from DB.
  // Instead, we filter by the idea round numbers. For each beat, generate rounds
  // start at current_round which resets to 1. So we need to track beat-specific ideas.
  //
  // Best approach: ideas for beat N use round numbers (N-1)*100+1 through (N-1)*100+totalRounds
  // This way each beat's ideas are distinguishable.
  const storyBeatIdeas = useMemo(() => {
    if (!isStoryMode) return ideas;
    const beatBase = (currentStoryBeatNumber - 1) * 100;
    return ideas.filter((i) => i.round > beatBase && i.round <= beatBase + 100);
  }, [isStoryMode, ideas, currentStoryBeatNumber]);

  // For story mode ratings, only count ratings on current beat's curated ideas
  const storyBeatRatings = useMemo(() => {
    if (!isStoryMode) return ratings;
    const beatIdeaIds = new Set(storyBeatIdeas.map((i) => i.id));
    return ratings.filter((r) => beatIdeaIds.has(r.idea_id));
  }, [isStoryMode, ratings, storyBeatIdeas]);

  // For story mode votes, only count votes on current beat's ideas
  const storyBeatVotes = useMemo(() => {
    if (!isStoryMode) return finalVotes;
    const beatIdeaIds = new Set(storyBeatIdeas.map((i) => i.id));
    return finalVotes.filter((v) => beatIdeaIds.has(v.idea_id));
  }, [isStoryMode, finalVotes, storyBeatIdeas]);

  // The actual ideas/ratings/votes to pass to phase components
  const activeIdeas = isStoryMode ? storyBeatIdeas : ideas;
  const activeRatings = isStoryMode ? storyBeatRatings : ratings;
  const activeVotes = isStoryMode ? storyBeatVotes : finalVotes;

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
    const nextRound = isStoryMode
      ? (currentStoryBeatNumber - 1) * 100 + session.current_round + 1
      : session.current_round + 1;
    const nextCurrentRound = session.current_round + 1;

    if (session.total_rounds > 1) {
      updateSession({
        current_round: nextCurrentRound,
        phase: 'spark',
      });
    } else {
      updateSession({
        current_round: nextCurrentRound,
        phase: `generate:${nextRound}`,
        round_started_at: new Date().toISOString(),
      });
    }
  }, [session, updateSession, isStoryMode, currentStoryBeatNumber]);

  const handleStartRoundFromSpark = useCallback(() => {
    if (!session) return;
    const genRound = isStoryMode
      ? (currentStoryBeatNumber - 1) * 100 + session.current_round
      : session.current_round;
    updateSession({
      phase: `generate:${genRound}`,
      round_started_at: new Date().toISOString(),
    });
  }, [session, updateSession, isStoryMode, currentStoryBeatNumber]);

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

  // Story Mode: Lock in winning idea and advance to next beat
  const handleLockInBeat = useCallback(async () => {
    if (!session || !isStoryMode || !currentBeatTemplate) return;

    // Find the winning idea from votes
    const voteCounts: Record<string, number> = {};
    activeVotes.forEach((v) => {
      voteCounts[v.idea_id] = (voteCounts[v.idea_id] || 0) + 1;
    });

    let winId = '';
    let winCount = 0;
    for (const [id, count] of Object.entries(voteCounts)) {
      if (count > winCount) {
        winCount = count;
        winId = id;
      }
    }

    // Fallback to highest rated if no votes
    if (!winId) {
      const ranked = computeRankedIdeas(activeIdeas, activeRatings, participants);
      if (ranked.length > 0) winId = ranked[0].id;
    }

    if (!winId) return;

    // Save the story beat
    await saveStoryBeat(
      currentStoryBeatNumber,
      currentBeatTemplate.name,
      currentBeatTemplate.prompt,
      winId
    );

    // Check if this was the last beat
    if (isLastStoryBeat) {
      updateSession({ phase: 'story:final' });
    } else {
      // Reset for next beat
      await resetForNextBeat();
      setCurateReady(false);

      // Advance to next beat's generate phase
      const nextBeat = currentStoryBeatNumber + 1;
      const nextBeatTemplate = beatTemplates.find((b) => b.round === nextBeat);
      const genRound = (nextBeat - 1) * 100 + 1;

      updateSession({
        prompt: nextBeatTemplate?.prompt || '',
        current_round: 1,
        phase: `generate:${genRound}`,
        round_started_at: new Date().toISOString(),
      });
    }
  }, [
    session, isStoryMode, currentBeatTemplate, activeVotes, activeIdeas, activeRatings,
    participants, saveStoryBeat, currentStoryBeatNumber, isLastStoryBeat,
    resetForNextBeat, beatTemplates, updateSession,
  ]);

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

    // Story mode: compute the generate round number correctly
    const storyGenRound = isStoryMode
      ? (currentStoryBeatNumber - 1) * 100 + session.current_round
      : session.current_round;

    // For story mode, create a virtual session with the beat's prompt
    const effectiveSession = isStoryMode && currentBeatTemplate
      ? {
          ...session,
          prompt: `${currentBeatTemplate.emoji} ${currentBeatTemplate.name}: ${session.prompt}`,
        }
      : session;

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

      // Story Mode final pitch
      if (phase === 'story:final' && isStoryMode) {
        return (
          <StoryResults
            session={session}
            storyBeats={storyBeats}
            ideas={ideas}
            participants={participants}
            beatTemplates={beatTemplates}
            isHost={isHost}
            onLeave={handleLeaveSession}
          />
        );
      }

      if (phase.startsWith('generate')) {
        return (
          <Generate
            session={effectiveSession}
            ideas={activeIdeas.filter((i) => i.author_id === userId)}
            allIdeas={activeIdeas}
            userId={userId}
            isHost={isHost}
            onSubmitIdea={(text, _round, category) => {
              // In story mode, use beat-offset round numbers
              const round = isStoryMode ? storyGenRound : session.current_round;
              submitIdea(text, round, category);
            }}
            onDeleteIdea={deleteIdea}
            onNextRound={handleNextRound}
            onFinishGenerating={handleFinishGenerating}
          />
        );
      }

      if (phase === 'spark') {
        return (
          <Spark
            ideas={activeIdeas}
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
            ideas={activeIdeas}
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
            ideas={activeIdeas}
            ratings={activeRatings}
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
            ideas={activeIdeas}
            ratings={activeRatings}
            participants={participants}
            isHost={isHost}
            onAdvance={handleAdvanceToDebate}
          />
        );
      }

      if (phase === 'debate') {
        return (
          <Debate
            ideas={activeIdeas}
            ratings={activeRatings}
            participants={participants}
            finalVotes={activeVotes}
            userId={userId}
            isHost={isHost}
            onCastVote={castVote}
            onRevealWinner={handleRevealWinner}
          />
        );
      }

      if (phase === 'results') {
        if (isStoryMode) {
          // Story mode results: show beat results with "Lock In" button
          return (
            <Results
              session={session}
              ideas={activeIdeas}
              ratings={activeRatings}
              participants={participants}
              finalVotes={activeVotes}
              isHost={isHost}
              onNewRound={handleLockInBeat}
              onLeave={handleLeaveSession}
              storyBeatLabel={currentBeatTemplate ? `${currentBeatTemplate.emoji} ${currentBeatTemplate.name}` : undefined}
              storyNextLabel={isLastStoryBeat ? 'Reveal Final Pitch' : `Lock In & Next Beat (${currentStoryBeatNumber + 1}/8)`}
            />
          );
        }
        return (
          <Results
            session={session}
            ideas={activeIdeas}
            ratings={activeRatings}
            participants={participants}
            finalVotes={activeVotes}
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
              {isStoryMode && phase !== 'story:final' ? (
                <StoryProgressIndicator
                  beats={beatTemplates}
                  completedBeats={storyBeats}
                  currentBeatNumber={currentStoryBeatNumber}
                />
              ) : (
                <PhaseIndicator currentPhase={phase} />
              )}
              {isHost && phase !== 'results' && phase !== 'story:final' && (
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
        <main className="flex-1 p-4 md:p-6">
          {/* Story So Far banner (shown during active story phases) */}
          {isStoryMode && phase !== 'waiting' && phase !== 'story:final' && completedStoryBeats.length > 0 && (
            <div className="max-w-2xl mx-auto mb-4">
              <StorySoFar
                completedBeats={storyBeats}
                ideas={ideas}
                beatTemplates={beatTemplates}
                currentBeatNumber={currentStoryBeatNumber}
              />
            </div>
          )}
          {renderPhase()}
        </main>
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

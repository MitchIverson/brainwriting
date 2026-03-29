'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, Participant, Idea, Rating, FinalVote, StoryBeat } from '@/lib/types';
import { genCode } from '@/lib/utils';

export function useSession(userId: string | undefined) {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [finalVotes, setFinalVotes] = useState<FinalVote[]>([]);
  const [storyBeats, setStoryBeats] = useState<StoryBeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isHost = session?.host_id === userId;

  // Subscribe to realtime changes for a session
  const subscribe = useCallback(
    (sessionId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`session:${sessionId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setSession(payload.new as Session);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setParticipants((prev) => {
              if (prev.some((p) => p.id === (payload.new as Participant).id)) return prev;
              return [...prev, payload.new as Participant];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setParticipants((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ideas', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setIdeas((prev) => {
              if (prev.some((i) => i.id === (payload.new as Idea).id)) return prev;
              return [...prev, payload.new as Idea];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'ideas', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setIdeas((prev) =>
              prev.map((i) => (i.id === (payload.new as Idea).id ? (payload.new as Idea) : i))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'ideas', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setIdeas((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ratings', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setRatings((prev) => {
              if (prev.some((r) => r.id === (payload.new as Rating).id)) return prev;
              return [...prev, payload.new as Rating];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'ratings', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setRatings((prev) =>
              prev.map((r) => (r.id === (payload.new as Rating).id ? (payload.new as Rating) : r))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'final_votes', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setFinalVotes((prev) => {
              if (prev.some((v) => v.id === (payload.new as FinalVote).id)) return prev;
              return [...prev, payload.new as FinalVote];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'story_beats', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setStoryBeats((prev) => {
              if (prev.some((b) => b.id === (payload.new as StoryBeat).id)) return prev;
              return [...prev, payload.new as StoryBeat];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'story_beats', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            setStoryBeats((prev) =>
              prev.map((b) => (b.id === (payload.new as StoryBeat).id ? (payload.new as StoryBeat) : b))
            );
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    []
  );

  // Create a new session
  const createSession = useCallback(
    async (displayName: string, projectId?: string) => {
      if (!userId) return null;
      setLoading(true);
      setError(null);
      try {
        const code = genCode();

        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            code,
            host_id: userId,
            prompt: '',
            phase: 'waiting',
            project_id: projectId || null,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        const { error: participantError } = await supabase
          .from('participants')
          .insert({
            session_id: sessionData.id,
            user_id: userId,
            name: displayName,
          });

        if (participantError) throw participantError;

        setSession(sessionData);

        const { data: parts } = await supabase
          .from('participants')
          .select('*')
          .eq('session_id', sessionData.id);
        setParticipants(parts || []);

        subscribe(sessionData.id);
        return sessionData as Session;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, subscribe]
  );

  // Join an existing session
  const joinSession = useCallback(
    async (code: string, displayName: string) => {
      if (!userId) return null;
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code.toUpperCase())
          .single();

        if (sessionError || !sessionData) throw new Error('Session not found');

        // Check if already joined
        const { data: existing } = await supabase
          .from('participants')
          .select('*')
          .eq('session_id', sessionData.id)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          const { error: participantError } = await supabase
            .from('participants')
            .insert({
              session_id: sessionData.id,
              user_id: userId,
              name: displayName,
            });

          if (participantError) throw participantError;
        }

        setSession(sessionData);

        // Fetch all session data
        const [partsRes, ideasRes, ratingsRes, votesRes, beatsRes] = await Promise.all([
          supabase.from('participants').select('*').eq('session_id', sessionData.id),
          supabase.from('ideas').select('*').eq('session_id', sessionData.id),
          supabase.from('ratings').select('*').eq('session_id', sessionData.id),
          supabase.from('final_votes').select('*').eq('session_id', sessionData.id),
          supabase.from('story_beats').select('*').eq('session_id', sessionData.id),
        ]);

        setParticipants(partsRes.data || []);
        setIdeas(ideasRes.data || []);
        setRatings(ratingsRes.data || []);
        setFinalVotes(votesRes.data || []);
        setStoryBeats(beatsRes.data || []);

        subscribe(sessionData.id);
        return sessionData as Session;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join session');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, subscribe]
  );

  // Update session (host only)
  const updateSession = useCallback(
    async (updates: Partial<Session>) => {
      if (!session) return;
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', session.id);
      if (error) setError(error.message);
    },
    [session]
  );

  // Submit an idea (with optional category)
  const submitIdea = useCallback(
    async (text: string, round: number, category?: string) => {
      if (!session || !userId) return;
      const { error } = await supabase.from('ideas').insert({
        session_id: session.id,
        author_id: userId,
        text,
        round,
        category: category || null,
      });
      if (error) setError(error.message);
    },
    [session, userId]
  );

  // Delete an idea
  const deleteIdea = useCallback(
    async (ideaId: string) => {
      const { error } = await supabase.from('ideas').delete().eq('id', ideaId);
      if (error) setError(error.message);
    },
    []
  );

  // Toggle curate an idea
  const toggleCurate = useCallback(
    async (ideaId: string, curated: boolean) => {
      const { error } = await supabase
        .from('ideas')
        .update({ is_curated: curated })
        .eq('id', ideaId);
      if (error) setError(error.message);
    },
    []
  );

  // Submit a rating
  const submitRating = useCallback(
    async (ideaId: string, score: number) => {
      if (!session || !userId) return;
      const { error } = await supabase
        .from('ratings')
        .upsert(
          {
            session_id: session.id,
            idea_id: ideaId,
            rater_id: userId,
            score,
          },
          { onConflict: 'idea_id,rater_id' }
        );
      if (error) setError(error.message);
    },
    [session, userId]
  );

  // Cast final vote
  const castVote = useCallback(
    async (ideaId: string) => {
      if (!session || !userId) return;
      const { error } = await supabase
        .from('final_votes')
        .upsert(
          {
            session_id: session.id,
            voter_id: userId,
            idea_id: ideaId,
          },
          { onConflict: 'session_id,voter_id' }
        );
      if (error) setError(error.message);
    },
    [session, userId]
  );

  // Kick a participant (host only)
  const kickParticipant = useCallback(
    async (participantId: string) => {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);
      if (error) setError(error.message);
    },
    []
  );

  // Update leaderboard (project-scoped or global)
  const updateLeaderboard = useCallback(
    async (
      targetUserId: string,
      targetName: string,
      field: 'crowns' | 'shortlists' | 'blitzes' | 'hail_marys'
    ) => {
      const projectId = session?.project_id || null;

      // Check if entry exists
      let query = supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', targetUserId);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data: existing } = await query.single();

      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({
            [field]: (existing as Record<string, number>)[field] + 1,
            name: targetName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) console.error('Leaderboard update error:', error);
      } else {
        const { error } = await supabase.from('leaderboard').insert({
          user_id: targetUserId,
          name: targetName,
          project_id: projectId,
          [field]: 1,
        });
        if (error) console.error('Leaderboard insert error:', error);
      }
    },
    [session?.project_id]
  );

  // Save a story beat (winning idea for a macro-round)
  const saveStoryBeat = useCallback(
    async (roundNumber: number, beatName: string, promptText: string, winningIdeaId: string) => {
      if (!session) return;

      // Check if beat already exists
      const existing = storyBeats.find(
        (b) => b.session_id === session.id && b.round_number === roundNumber
      );

      if (existing) {
        const { error } = await supabase
          .from('story_beats')
          .update({ winning_idea_id: winningIdeaId })
          .eq('id', existing.id);
        if (error) console.error('Update story beat error:', error);
      } else {
        const { error } = await supabase.from('story_beats').insert({
          session_id: session.id,
          round_number: roundNumber,
          beat_name: beatName,
          prompt_text: promptText,
          winning_idea_id: winningIdeaId,
        });
        if (error) console.error('Insert story beat error:', error);
      }
    },
    [session, storyBeats]
  );

  // Clear ideas/ratings/votes for next story beat round (keeps all data in DB, just resets curated flags)
  const resetForNextBeat = useCallback(async () => {
    if (!session) return;
    // Un-curate all ideas so curation starts fresh
    const curatedIds = ideas.filter((i) => i.is_curated).map((i) => i.id);
    if (curatedIds.length > 0) {
      await supabase
        .from('ideas')
        .update({ is_curated: false })
        .in('id', curatedIds);
    }
    // Clear local ratings and votes for fresh round
    // (DB still has them but they won't interfere since new ideas get new IDs)
    setRatings([]);
    setFinalVotes([]);
  }, [session, ideas]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSession(null);
    setParticipants([]);
    setIdeas([]);
    setRatings([]);
    setFinalVotes([]);
    setStoryBeats([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    session,
    participants,
    ideas,
    ratings,
    finalVotes,
    storyBeats,
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
    kickParticipant,
    updateLeaderboard,
    saveStoryBeat,
    resetForNextBeat,
    leaveSession,
  };
}

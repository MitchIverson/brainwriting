'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/StarRating';
import { Session, Participant, Idea, Rating, FinalVote, RatedIdea } from '@/lib/types';

function computeRankedIdeas(
  ideas: Idea[],
  ratings: Rating[],
  participants: Participant[]
): RatedIdea[] {
  const curated = ideas.filter((i) => i.is_curated);
  return curated
    .map((idea) => {
      const ideaRatings = ratings.filter((r) => r.idea_id === idea.id);
      const avg = ideaRatings.length > 0
        ? ideaRatings.reduce((sum, r) => sum + r.score, 0) / ideaRatings.length
        : 0;
      const author = participants.find((p) => p.user_id === idea.author_id);
      return {
        ...idea,
        avg_rating: Math.round(avg * 10) / 10,
        author_name: author?.name || 'Unknown',
      };
    })
    .sort((a, b) => b.avg_rating - a.avg_rating);
}

export default function SharedResults() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [finalVotes, setFinalVotes] = useState<FinalVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [sessRes, partRes, ideaRes, rateRes, voteRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase.from('participants').select('*').eq('session_id', sessionId),
        supabase.from('ideas').select('*').eq('session_id', sessionId),
        supabase.from('ratings').select('*').eq('session_id', sessionId),
        supabase.from('final_votes').select('*').eq('session_id', sessionId),
      ]);

      if (sessRes.error) {
        setError('Session not found');
        setLoading(false);
        return;
      }

      setSession(sessRes.data as Session);
      setParticipants((partRes.data || []) as Participant[]);
      setIdeas((ideaRes.data || []) as Idea[]);
      setRatings((rateRes.data || []) as Rating[]);
      setFinalVotes((voteRes.data || []) as FinalVote[]);
      setLoading(false);
    }

    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="text-text-secondary font-body">Loading results...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Card>
          <p className="text-center text-text-secondary font-body py-4">{error || 'Session not found'}</p>
        </Card>
      </div>
    );
  }

  const ranked = computeRankedIdeas(ideas, ratings, participants);
  const top5 = ranked.slice(0, 5);

  // Find winner by votes
  const voteCounts: Record<string, number> = {};
  finalVotes.forEach((v) => { voteCounts[v.idea_id] = (voteCounts[v.idea_id] || 0) + 1; });
  let winnerId = '';
  let winnerVotes = 0;
  for (const [id, count] of Object.entries(voteCounts)) {
    if (count > winnerVotes) { winnerVotes = count; winnerId = id; }
  }
  const winner = ranked.find((i) => i.id === winnerId) || ranked[0];

  // Blitz (most ideas overall)
  const ideaCounts: Record<string, number> = {};
  ideas.forEach((i) => { ideaCounts[i.author_id] = (ideaCounts[i.author_id] || 0) + 1; });
  let blitzId = '';
  let blitzCount = 0;
  for (const [uid, count] of Object.entries(ideaCounts)) {
    if (count > blitzCount) { blitzCount = count; blitzId = uid; }
  }
  const blitzName = participants.find((p) => p.user_id === blitzId)?.name || 'Unknown';

  const hailMary = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl text-gold">Brainwriting Results</h1>
          <p className="font-body text-text-secondary">&ldquo;{session.prompt}&rdquo;</p>
          <p className="text-xs font-body text-text-secondary">
            {participants.length} participants · {ideas.length} ideas generated · {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Winner */}
        {winner && (
          <Card glow="gold" className="text-center">
            <div className="space-y-2 py-4">
              <span className="text-5xl">👑</span>
              <h2 className="font-heading text-3xl text-gold">The Crown</h2>
              <p className="font-body text-text-primary text-xl">&ldquo;{winner.text}&rdquo;</p>
              <Badge variant="gold" className="text-base px-4 py-1">{winner.author_name}</Badge>
            </div>
          </Card>
        )}

        {/* Awards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card glow="teal">
            <div className="text-center space-y-1">
              <span className="text-3xl">⚡</span>
              <h3 className="font-heading text-lg text-teal">The Blitz</h3>
              <p className="font-body text-text-primary text-sm">{blitzName}</p>
              <p className="text-xs font-body text-text-secondary">{blitzCount} ideas</p>
            </div>
          </Card>
          {hailMary && (
            <Card>
              <div className="text-center space-y-1">
                <span className="text-3xl">🎲</span>
                <h3 className="font-heading text-lg text-text-primary">The Hail Mary</h3>
                <p className="text-xs font-body text-text-secondary">Boldest Swing</p>
                <p className="font-body text-text-primary text-sm">&ldquo;{hailMary.text}&rdquo;</p>
                <Badge variant="neutral">{hailMary.author_name}</Badge>
              </div>
            </Card>
          )}
        </div>

        {/* Top 5 Shortlist */}
        <div className="space-y-3">
          <h3 className="font-heading text-lg text-text-secondary text-center uppercase tracking-wider">
            ⭐ The Shortlist — Top {Math.min(5, top5.length)}
          </h3>
          {top5.map((idea, i) => (
            <Card key={idea.id} glow={i === 0 ? 'gold' : 'none'}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-lg ${
                  i === 0 ? 'bg-gold text-bg-primary' : 'bg-card-border text-text-secondary'
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-body text-text-primary">{idea.text}</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="teal">{idea.author_name}</Badge>
                    <div className="flex items-center gap-1">
                      <StarRating value={Math.round(idea.avg_rating)} readonly size="sm" />
                      <span className="text-sm font-body text-text-secondary">{idea.avg_rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-xs font-body text-text-secondary">
            Powered by <span className="text-gold">Brainwriting</span>
          </p>
        </div>
      </div>
    </div>
  );
}

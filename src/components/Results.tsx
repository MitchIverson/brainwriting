'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Session, Idea, Rating, Participant, FinalVote, LeaderboardEntry } from '@/lib/types';
import { computeRankedIdeas, findBlitz, findBlitzForRound } from '@/components/Reveal';
import { supabase } from '@/lib/supabase';

interface ResultsProps {
  session: Session;
  ideas: Idea[];
  ratings: Rating[];
  participants: Participant[];
  finalVotes: FinalVote[];
  isHost: boolean;
  onNewRound: () => void;
  onLeave: () => void;
  storyBeatLabel?: string;
  storyNextLabel?: string;
}

export default function Results({
  session,
  ideas,
  ratings,
  participants,
  finalVotes,
  isHost,
  onNewRound,
  onLeave,
  storyBeatLabel,
  storyNextLabel,
}: ResultsProps) {
  const leaderboardUpdated = useRef(false);
  const [copied, setCopied] = useState(false);

  const ranked = computeRankedIdeas(ideas, ratings, participants);
  const top5 = ranked.slice(0, 5);
  const hailMary = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  const blitz = findBlitz(ideas, participants);

  // Compute Blitz winners per round
  const blitzPerRound = useMemo(() => {
    const rounds = new Set(ideas.map((i) => i.round));
    const winners: { userId: string; name: string; round: number; count: number }[] = [];
    rounds.forEach((round) => {
      const result = findBlitzForRound(ideas, participants, round);
      if (result.userId) {
        winners.push({ userId: result.userId, name: result.name, round, count: result.count });
      }
    });
    return winners;
  }, [ideas, participants]);

  // Compute Shortlist: who has ideas in the top 5? One person can earn multiple points
  const shortlistAwards = useMemo(() => {
    const awards: { userId: string; name: string; count: number }[] = [];
    const authorCounts: Record<string, { name: string; count: number }> = {};
    top5.forEach((idea) => {
      if (!authorCounts[idea.author_id]) {
        authorCounts[idea.author_id] = { name: idea.author_name, count: 0 };
      }
      authorCounts[idea.author_id].count++;
    });
    for (const [userId, data] of Object.entries(authorCounts)) {
      awards.push({ userId, name: data.name, count: data.count });
    }
    return awards.sort((a, b) => b.count - a.count);
  }, [top5]);

  // Find winning idea (most votes)
  const winner = useMemo(() => {
    const voteCounts: Record<string, number> = {};
    finalVotes.forEach((v) => {
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

    const winIdea = ranked.find((i) => i.id === winId);
    return winIdea ? { ...winIdea, vote_count: winCount } : ranked[0] || null;
  }, [finalVotes, ranked]);

  const isStoryMode = session.game_mode === 'story';

  // Mark session as completed & update leaderboard (host only, once)
  // Skip leaderboard in story mode — awards happen per-beat but we don't persist them
  useEffect(() => {
    if (!isHost || leaderboardUpdated.current || isStoryMode) return;
    leaderboardUpdated.current = true;

    async function finalize() {
      // Mark session completed
      await supabase
        .from('sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', session.id);

      const projectId = session.project_id || null;

      // Collect all leaderboard increments per user
      const increments: Record<string, { name: string; crowns: number; shortlists: number; blitzes: number; hail_marys: number }> = {};

      const ensureUser = (userId: string, name: string) => {
        if (!increments[userId]) {
          increments[userId] = { name, crowns: 0, shortlists: 0, blitzes: 0, hail_marys: 0 };
        }
      };

      // Crown: +1 to winner
      if (winner) {
        ensureUser(winner.author_id, winner.author_name);
        increments[winner.author_id].crowns += 1;
      }

      // Shortlist: +1 per top-5 idea
      shortlistAwards.forEach((award) => {
        ensureUser(award.userId, award.name);
        increments[award.userId].shortlists += award.count;
      });

      // Blitz: +1 per round won
      blitzPerRound.forEach((bpr) => {
        ensureUser(bpr.userId, bpr.name);
        increments[bpr.userId].blitzes += 1;
      });

      // Hail Mary: +1 to lowest-rated curated idea author
      if (hailMary && ranked.length > 1) {
        ensureUser(hailMary.author_id, hailMary.author_name);
        increments[hailMary.author_id].hail_marys += 1;
      }

      // Apply increments to leaderboard
      for (const [userId, inc] of Object.entries(increments)) {
        let query = supabase.from('leaderboard').select('*').eq('user_id', userId);
        if (projectId) {
          query = query.eq('project_id', projectId);
        } else {
          query = query.is('project_id', null);
        }
        const { data: existing } = await query.single();

        if (existing) {
          const entry = existing as LeaderboardEntry;
          await supabase
            .from('leaderboard')
            .update({
              crowns: entry.crowns + inc.crowns,
              shortlists: entry.shortlists + inc.shortlists,
              blitzes: entry.blitzes + inc.blitzes,
              hail_marys: entry.hail_marys + inc.hail_marys,
              name: inc.name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);
        } else {
          await supabase.from('leaderboard').insert({
            user_id: userId,
            name: inc.name,
            project_id: projectId,
            crowns: inc.crowns,
            shortlists: inc.shortlists,
            blitzes: inc.blitzes,
            hail_marys: inc.hail_marys,
          });
        }
      }
    }

    finalize();
  }, [isHost, winner, hailMary, blitzPerRound, shortlistAwards, ranked, participants, session, isStoryMode]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/session/${session.id}/results`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* The Crown */}
      {winner && (
        <Card glow="gold" className="text-center">
          <div className="space-y-2 py-4">
            <span className="text-5xl">👑</span>
            <h2 className="font-heading text-3xl text-gold">The Crown</h2>
            <p className="font-body text-text-primary text-xl">
              &ldquo;{winner.text}&rdquo;
            </p>
            <Badge variant="gold" className="text-base px-4 py-1">{winner.author_name}</Badge>
            {winner.vote_count && (
              <p className="text-sm font-body text-text-secondary">
                {winner.vote_count} vote{winner.vote_count !== 1 ? 's' : ''} · +3 pts
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Shortlist */}
      {shortlistAwards.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="text-center">
              <span className="text-2xl">⭐</span>
              <h3 className="font-heading text-lg text-gold">The Shortlist</h3>
              <p className="text-xs font-body text-text-secondary">+1 pt per Top 5 idea</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {shortlistAwards.map((award) => (
                <div key={award.userId} className="text-center">
                  <Badge variant="gold">{award.name}</Badge>
                  <p className="text-xs font-body text-text-secondary mt-1">
                    ⭐ ×{award.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Blitz & Hail Mary side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card glow="teal">
          <div className="text-center space-y-1">
            <span className="text-3xl">⚡</span>
            <h3 className="font-heading text-lg text-teal">The Blitz</h3>
            <p className="font-body text-text-primary text-sm">{blitz.name}</p>
            <p className="text-xs font-body text-text-secondary">
              {blitz.count} ideas generated
            </p>
            {blitzPerRound.length > 1 && (
              <p className="text-xs font-body text-text-secondary">
                {blitzPerRound.length} round{blitzPerRound.length !== 1 ? 's' : ''} of Blitz awarded
              </p>
            )}
          </div>
        </Card>

        {hailMary && ranked.length > 1 && (
          <Card>
            <div className="text-center space-y-1">
              <span className="text-3xl">🎲</span>
              <h3 className="font-heading text-lg text-text-primary">The Hail Mary</h3>
              <p className="text-xs font-body text-text-secondary uppercase tracking-wider">
                Boldest Swing
              </p>
              <p className="font-body text-text-primary text-sm">
                &ldquo;{hailMary.text}&rdquo;
              </p>
              <Badge variant="neutral">{hailMary.author_name}</Badge>
            </div>
          </Card>
        )}
      </div>

      {/* Share Link */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-body text-text-secondary">Share these results</p>
            <p className="text-xs font-body text-text-secondary/60 truncate">{shareUrl}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </Card>

      {/* Story Beat Label */}
      {storyBeatLabel && (
        <div className="text-center">
          <Badge variant="gold" className="text-sm px-3 py-1">{storyBeatLabel} — Complete!</Badge>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4">
        {isHost && (
          <Button size="lg" className="w-full" onClick={onNewRound}>
            {storyNextLabel || 'New Round (Same Prompt) →'}
          </Button>
        )}
        {!isHost && storyNextLabel && (
          <p className="text-center text-sm font-body text-text-secondary">
            Waiting for host to lock in this beat...
          </p>
        )}
        <Button variant="secondary" size="lg" className="w-full" onClick={onLeave}>
          Leave Session
        </Button>
      </div>
    </div>
  );
}

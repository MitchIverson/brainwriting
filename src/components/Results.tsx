'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Session, Idea, Rating, Participant, FinalVote, LeaderboardEntry } from '@/lib/types';
import { computeRankedIdeas, findTorrent } from '@/components/Reveal';
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
}: ResultsProps) {
  const leaderboardUpdated = useRef(false);
  const [copied, setCopied] = useState(false);

  const ranked = computeRankedIdeas(ideas, ratings, participants);
  const torrent = findTorrent(ideas, participants);
  const fumble = ranked.length > 1 ? ranked[ranked.length - 1] : null;

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

  // Mark session as completed & update leaderboard (host only, once)
  useEffect(() => {
    if (!isHost || leaderboardUpdated.current) return;
    leaderboardUpdated.current = true;

    async function finalize() {
      // Mark session completed
      await supabase
        .from('sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', session.id);

      const projectId = session.project_id || null;
      const updates: { userId: string; name: string; field: 'crowns' | 'fumbles' | 'torrents' }[] = [];

      if (winner) {
        updates.push({ userId: winner.author_id, name: winner.author_name, field: 'crowns' });
      }
      if (fumble && ranked.length > 1) {
        updates.push({ userId: fumble.author_id, name: fumble.author_name, field: 'fumbles' });
      }
      if (torrent.userId) {
        const tName = participants.find((p) => p.user_id === torrent.userId)?.name || 'Unknown';
        updates.push({ userId: torrent.userId, name: tName, field: 'torrents' });
      }

      for (const u of updates) {
        let query = supabase.from('leaderboard').select('*').eq('user_id', u.userId);
        if (projectId) {
          query = query.eq('project_id', projectId);
        } else {
          query = query.is('project_id', null);
        }
        const { data: existing } = await query.single();

        if (existing) {
          await supabase
            .from('leaderboard')
            .update({
              [u.field]: (existing as LeaderboardEntry)[u.field] + 1,
              name: u.name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('leaderboard').insert({
            user_id: u.userId,
            name: u.name,
            project_id: projectId,
            [u.field]: 1,
          });
        }
      }
    }

    finalize();
  }, [isHost, winner, fumble, torrent, ranked, participants, session]);

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
                {winner.vote_count} vote{winner.vote_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Fumble & Torrent side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fumble && ranked.length > 1 && (
          <Card glow="danger">
            <div className="text-center space-y-1">
              <span className="text-3xl">💀</span>
              <h3 className="font-heading text-lg text-danger">The Fumble</h3>
              <p className="text-xs font-body text-text-secondary uppercase tracking-wider">
                Most Audacious
              </p>
              <p className="font-body text-text-primary text-sm">
                &ldquo;{fumble.text}&rdquo;
              </p>
              <Badge variant="danger">{fumble.author_name}</Badge>
            </div>
          </Card>
        )}

        <Card glow="teal">
          <div className="text-center space-y-1">
            <span className="text-3xl">⚡</span>
            <h3 className="font-heading text-lg text-teal">The Torrent</h3>
            <p className="font-body text-text-primary text-sm">{torrent.name}</p>
            <p className="text-xs font-body text-text-secondary">
              {torrent.count} ideas generated
            </p>
          </div>
        </Card>
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

      {/* Actions */}
      <div className="space-y-3 pt-4">
        {isHost && (
          <Button size="lg" className="w-full" onClick={onNewRound}>
            New Round (Same Prompt) →
          </Button>
        )}
        <Button variant="secondary" size="lg" className="w-full" onClick={onLeave}>
          Leave Session
        </Button>
      </div>
    </div>
  );
}

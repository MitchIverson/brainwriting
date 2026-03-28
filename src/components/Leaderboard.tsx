'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LeaderboardEntry } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        // Sort by weighted score
        const sorted = data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
          const scoreA = a.crowns * 3 + a.fumbles + a.torrents;
          const scoreB = b.crowns * 3 + b.fumbles + b.torrents;
          return scoreB - scoreA;
        });
        setEntries(sorted);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl text-gold">All-Time Leaderboard</h1>
          <p className="font-body text-text-secondary text-sm">
            Ranked by: 👑×3 + 💀×1 + ⚡×1
          </p>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-text-secondary font-body py-4">Loading...</p>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <p className="text-center text-text-secondary font-body py-4">
              No entries yet. Complete a session to appear here!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const score = entry.crowns * 3 + entry.fumbles + entry.torrents;
              return (
                <Card key={entry.id} glow={i === 0 ? 'gold' : 'none'}>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm ${
                        i === 0
                          ? 'bg-gold text-bg-primary'
                          : i === 1
                          ? 'bg-text-secondary/30 text-text-primary'
                          : i === 2
                          ? 'bg-amber-700/30 text-amber-500'
                          : 'bg-card-border text-text-secondary'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading text-text-primary">{entry.name}</p>
                      <div className="flex gap-2 mt-1">
                        {entry.crowns > 0 && (
                          <Badge variant="gold">👑 {entry.crowns}</Badge>
                        )}
                        {entry.fumbles > 0 && (
                          <Badge variant="danger">💀 {entry.fumbles}</Badge>
                        )}
                        {entry.torrents > 0 && (
                          <Badge variant="teal">⚡ {entry.torrents}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-xl text-gold">{score}</span>
                      <p className="text-xs font-body text-text-secondary">pts</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { StoryBeat, Idea, Session, Participant, LeaderboardEntry } from '@/lib/types';
import { StoryBeatTemplate, buildPitch, buildLogline } from '@/lib/storyPrompts';
import { supabase } from '@/lib/supabase';

interface StoryResultsProps {
  session: Session;
  storyBeats: StoryBeat[];
  ideas: Idea[];
  participants: Participant[];
  beatTemplates: StoryBeatTemplate[];
  isHost: boolean;
  onLeave: () => void;
}

export default function StoryResults({
  session,
  storyBeats,
  ideas,
  participants,
  beatTemplates,
  isHost,
  onLeave,
}: StoryResultsProps) {
  const [copied, setCopied] = useState(false);

  const completedBeats = storyBeats
    .filter((b) => b.winning_idea_id)
    .sort((a, b) => a.round_number - b.round_number);

  const getWinningText = (beat: StoryBeat) => {
    const idea = ideas.find((i) => i.id === beat.winning_idea_id);
    return idea?.text || '';
  };

  const getWinningAuthor = (beat: StoryBeat) => {
    const idea = ideas.find((i) => i.id === beat.winning_idea_id);
    if (!idea) return '';
    return participants.find((p) => p.user_id === idea.author_id)?.name || 'Unknown';
  };

  const getTemplate = (roundNumber: number) => {
    return beatTemplates.find((t) => t.round === roundNumber);
  };

  // Build pitch from winning texts
  const pitchBeats = completedBeats.map((b) => ({
    round: b.round_number,
    text: getWinningText(b),
  }));

  const fullPitch = buildPitch(pitchBeats);
  const logline = buildLogline(pitchBeats);

  // Count contributions per participant
  const contributions = useMemo(() => {
    const counts: Record<string, { name: string; beatWins: number }> = {};
    completedBeats.forEach((beat) => {
      const idea = ideas.find((i) => i.id === beat.winning_idea_id);
      if (!idea) return;
      const p = participants.find((pp) => pp.user_id === idea.author_id);
      const name = p?.name || 'Unknown';
      if (!counts[idea.author_id]) {
        counts[idea.author_id] = { name, beatWins: 0 };
      }
      counts[idea.author_id].beatWins++;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.beatWins - a.beatWins);
  }, [completedBeats, ideas, participants]);

  const genreName = session.genre
    ? session.genre.charAt(0).toUpperCase() + session.genre.slice(1)
    : 'Universal';

  const handleCopyPitch = () => {
    const text = `${genreName} Movie Pitch\n\n${logline ? `Logline: ${logline}\n\n` : ''}${completedBeats
      .map((b) => {
        const template = getTemplate(b.round_number);
        return `${template?.emoji || ''} ${template?.name || `Beat ${b.round_number}`}: ${getWinningText(b)}`;
      })
      .join('\n\n')}\n\n---\nWriters: ${participants.map((p) => p.name).join(', ')}\nCreated with Brainwriting`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-5xl">🎬</span>
        <h1 className="font-heading text-3xl md:text-4xl text-gold">Your Movie Pitch</h1>
        <Badge variant="gold">{genreName}</Badge>
      </div>

      {/* Logline */}
      {logline && (
        <Card glow="gold">
          <div className="text-center space-y-2">
            <h3 className="font-heading text-sm text-gold uppercase tracking-wider">Logline</h3>
            <p className="font-body text-text-primary text-lg italic leading-relaxed">
              &ldquo;{logline}&rdquo;
            </p>
          </div>
        </Card>
      )}

      {/* Full Story Beats */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm text-text-secondary uppercase tracking-wider text-center">
          The Full Pitch
        </h3>
        {completedBeats.map((beat) => {
          const template = getTemplate(beat.round_number);
          const author = getWinningAuthor(beat);
          return (
            <Card key={beat.id}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template?.emoji || ''}</span>
                  <h4 className="font-heading text-sm text-gold">
                    {template?.name || `Beat ${beat.round_number}`}
                  </h4>
                  <span className="text-xs font-body text-text-secondary ml-auto">
                    by {author}
                  </span>
                </div>
                <p className="font-body text-text-primary leading-relaxed">
                  {getWinningText(beat)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Contributors */}
      {contributions.length > 0 && (
        <Card>
          <div className="space-y-3">
            <h3 className="font-heading text-sm text-text-secondary uppercase tracking-wider text-center">
              Writers Room
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {contributions.map(([userId, data]) => (
                <div key={userId} className="text-center">
                  <Badge variant={data.beatWins >= 3 ? 'gold' : 'teal'}>
                    {data.name}
                  </Badge>
                  <p className="text-xs font-body text-text-secondary mt-1">
                    {data.beatWins} beat{data.beatWins !== 1 ? 's' : ''} won
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Copy / Share */}
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleCopyPitch}
      >
        {copied ? 'Copied!' : 'Copy Full Pitch'}
      </Button>

      {/* Leave */}
      <Button variant="secondary" size="lg" className="w-full" onClick={onLeave}>
        Leave Session
      </Button>
    </div>
  );
}

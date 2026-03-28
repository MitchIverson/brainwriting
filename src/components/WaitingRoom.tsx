'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Session, Participant } from '@/lib/types';

interface WaitingRoomProps {
  session: Session;
  participants: Participant[];
  isHost: boolean;
  onUpdateSession: (updates: Partial<Session>) => void;
  onLeave: () => void;
}

const PRESETS = [
  { label: 'Deep Dive', rounds: 1, minutes: 10, desc: '1 round x 10 min' },
  { label: 'Standard', rounds: 3, minutes: 5, desc: '3 rounds x 5 min' },
  { label: 'Lightning', rounds: 5, minutes: 1, desc: '5 rounds x 1 min' },
  { label: 'Custom', rounds: 0, minutes: 0, desc: 'Set your own' },
];

export default function WaitingRoom({
  session,
  participants,
  isHost,
  onUpdateSession,
  onLeave,
}: WaitingRoomProps) {
  const [selectedPreset, setSelectedPreset] = useState(1); // Standard default
  const [customRounds, setCustomRounds] = useState(3);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [prompt, setPrompt] = useState(session.prompt);

  const isCustom = selectedPreset === 3;
  const rounds = isCustom ? customRounds : PRESETS[selectedPreset].rounds;
  const minutes = isCustom ? customMinutes : PRESETS[selectedPreset].minutes;
  const totalTime = rounds * minutes;

  const canStart = prompt.trim().length > 0 && participants.length >= 1;

  const handleStart = () => {
    onUpdateSession({
      prompt: prompt.trim(),
      total_rounds: rounds,
      minutes_per_round: minutes,
      current_round: 1,
      phase: 'generate:1',
      round_started_at: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Session Code */}
      <div className="text-center space-y-2">
        <p className="text-text-secondary font-body text-sm uppercase tracking-wider">
          Session Code
        </p>
        <p className="font-heading text-5xl md:text-6xl text-gold tracking-[0.3em]">
          {session.code}
        </p>
        <p className="text-text-secondary font-body text-sm">
          Share this code with your team
        </p>
      </div>

      {/* Participants */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-text-primary">In the Room</h3>
            <Badge variant="teal">{participants.length} joined</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <Badge key={p.id} variant={p.user_id === session.host_id ? 'gold' : 'teal'}>
                {p.name}
                {p.user_id === session.host_id && ' (host)'}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {isHost ? (
        <>
          {/* Round Format */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-text-primary">Round Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(i)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedPreset === i
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-card-border text-text-secondary hover:border-gold/30'
                    }`}
                  >
                    <div className="font-heading text-sm font-semibold">{preset.label}</div>
                    <div className="text-xs font-body opacity-70">{preset.desc}</div>
                  </button>
                ))}
              </div>

              {isCustom && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-body text-text-secondary mb-1">
                      Rounds
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={customRounds}
                      onChange={(e) => setCustomRounds(Math.max(1, Math.min(10, Number(e.target.value))))}
                      className="w-full bg-bg-primary border border-card-border rounded-lg px-3 py-2 text-text-primary font-body focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-body text-text-secondary mb-1">
                      Minutes per round
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-full bg-bg-primary border border-card-border rounded-lg px-3 py-2 text-text-primary font-body focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
              )}

              <p className="text-sm font-body text-text-secondary text-center">
                {rounds} round{rounds > 1 ? 's' : ''} x {minutes} min = {totalTime} min generating
              </p>
            </div>
          </Card>

          {/* Prompt */}
          <Card>
            <div className="space-y-3">
              <h3 className="font-heading text-lg text-text-primary">Creative Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Come up with a storyline for Fred in episode 3"'
                rows={3}
                className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-3 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 resize-none"
              />
            </div>
          </Card>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleStart}
            disabled={!canStart}
          >
            Start Round
          </Button>
        </>
      ) : (
        <Card>
          <div className="text-center space-y-2 py-4">
            <div className="text-3xl">⏳</div>
            <p className="font-heading text-lg text-text-primary">
              Waiting for the host to start...
            </p>
            <p className="text-sm font-body text-text-secondary">
              The host is setting up the session
            </p>
          </div>
        </Card>
      )}

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onLeave}>
          Leave Session
        </Button>
      </div>
    </div>
  );
}

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
  userId: string;
  onUpdateSession: (updates: Partial<Session>) => void;
  onKickParticipant: (participantId: string) => void;
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
  userId,
  onUpdateSession,
  onKickParticipant,
  onLeave,
}: WaitingRoomProps) {
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [customRounds, setCustomRounds] = useState(3);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [prompt, setPrompt] = useState(session.prompt);
  const [maxCurated, setMaxCurated] = useState(session.max_curated || 5);
  const [soundEnabled, setSoundEnabled] = useState(session.sound_enabled !== false);
  const [categoriesInput, setCategoriesInput] = useState((session.categories || []).join(', '));

  const isCustom = selectedPreset === 3;
  const rounds = isCustom ? customRounds : PRESETS[selectedPreset].rounds;
  const minutes = isCustom ? customMinutes : PRESETS[selectedPreset].minutes;
  const totalTime = rounds * minutes;

  const canStart = prompt.trim().length > 0 && participants.length >= 1;

  const handleStart = () => {
    const categories = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    onUpdateSession({
      prompt: prompt.trim(),
      total_rounds: rounds,
      minutes_per_round: minutes,
      current_round: 1,
      phase: 'generate:1',
      round_started_at: new Date().toISOString(),
      max_curated: maxCurated,
      sound_enabled: soundEnabled,
      categories,
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
              <div key={p.id} className="flex items-center gap-1">
                <Badge variant={p.user_id === session.host_id ? 'gold' : 'teal'}>
                  {p.name}
                  {p.user_id === session.host_id && ' (host)'}
                </Badge>
                {isHost && p.user_id !== userId && (
                  <button
                    onClick={() => onKickParticipant(p.id)}
                    className="text-text-secondary hover:text-danger text-xs cursor-pointer"
                    title={`Remove ${p.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>
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

          {/* Advanced Settings */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-heading text-lg text-text-primary">Settings</h3>

              {/* Categories */}
              <div>
                <label className="block text-xs font-body text-text-secondary mb-1">
                  Idea Categories (optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder='e.g. Comedy, Drama, Wild Card'
                  className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>

              {/* Max Curated */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-text-primary">Ideas to curate</p>
                  <p className="text-xs font-body text-text-secondary">How many favorites each person picks</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMaxCurated(Math.max(1, maxCurated - 1))}
                    className="w-8 h-8 rounded bg-card-bg border border-card-border text-text-primary flex items-center justify-center cursor-pointer hover:border-gold/50"
                  >
                    -
                  </button>
                  <span className="font-heading text-lg text-gold w-6 text-center">{maxCurated}</span>
                  <button
                    onClick={() => setMaxCurated(Math.min(10, maxCurated + 1))}
                    className="w-8 h-8 rounded bg-card-bg border border-card-border text-text-primary flex items-center justify-center cursor-pointer hover:border-gold/50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-text-primary">Timer sounds</p>
                  <p className="text-xs font-body text-text-secondary">Beep at 30s and time&apos;s up</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-all cursor-pointer ${
                    soundEnabled ? 'bg-gold' : 'bg-card-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
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

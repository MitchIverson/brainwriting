'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getUserName, setUserName } from '@/lib/utils';

interface LobbyProps {
  onCreateSession: (name: string) => void;
  onJoinSession: (code: string, name: string) => void;
  onViewLeaderboard: () => void;
  loading: boolean;
  error: string | null;
}

export default function Lobby({
  onCreateSession,
  onJoinSession,
  onViewLeaderboard,
  loading,
  error,
}: LobbyProps) {
  const [name, setName] = useState(getUserName());
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'join'>('choose');

  const handleNameChange = (val: string) => {
    setName(val);
    setUserName(val);
  };

  const canProceed = name.trim().length >= 2;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-5xl md:text-6xl text-gold tracking-tight">
            Brainwriting
          </h1>
          <p className="text-text-secondary font-body text-lg">
            A writers&apos; room ideation tool
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body text-text-secondary mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
                className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {error && (
              <p className="text-danger text-sm font-body">{error}</p>
            )}

            {mode === 'choose' ? (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onCreateSession(name.trim())}
                  disabled={!canProceed || loading}
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setMode('join')}
                  disabled={!canProceed}
                >
                  Join with Code
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-body text-text-secondary mb-1.5">
                    Session Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. A7K2"
                    maxLength={4}
                    className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body text-center text-2xl tracking-[0.3em] uppercase placeholder:text-text-secondary/50 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && code.length === 4 && canProceed) {
                        onJoinSession(code, name.trim());
                      }
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onJoinSession(code, name.trim())}
                  disabled={code.length !== 4 || !canProceed || loading}
                >
                  {loading ? 'Joining...' : 'Join Session'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setMode('choose')}
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="text-center">
          <button
            onClick={onViewLeaderboard}
            className="text-teal text-sm font-body hover:underline cursor-pointer"
          >
            View All-Time Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface AuthProps {
  onSignIn: (email: string, password: string) => Promise<unknown>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<unknown>;
  error: string | null;
}

export default function Auth({ onSignIn, onSignUp, error }: AuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === 'signup') {
      const result = await onSignUp(email, password, displayName);
      if (result) setSignUpSuccess(true);
    } else {
      await onSignIn(email, password);
    }
    setSubmitting(false);
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-5xl text-gold">Brainwriting</h1>
          </div>
          <Card>
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">✉️</div>
              <h2 className="font-heading text-xl text-text-primary">Check your email!</h2>
              <p className="font-body text-text-secondary">
                We sent a confirmation link to <span className="text-teal">{email}</span>.
                Click it to activate your account, then come back and sign in.
              </p>
              <Button
                variant="secondary"
                onClick={() => { setSignUpSuccess(false); setMode('signin'); }}
              >
                Back to Sign In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-heading text-xl text-text-primary text-center">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-body text-text-secondary mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How others will see you"
                  maxLength={50}
                  required
                  className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-body text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-body text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
                className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {error && (
              <p className="text-danger text-sm font-body">{error}</p>
            )}

            <Button size="lg" className="w-full" disabled={submitting}>
              {submitting
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>

            <p className="text-center text-sm font-body text-text-secondary">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-teal hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-teal hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

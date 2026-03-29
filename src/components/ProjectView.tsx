'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Project, Session, LeaderboardEntry, Idea, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface ProjectViewProps {
  project: Project;
  userId: string;
  profile: Profile;
  onBack: () => void;
  onCreateSession: (projectId: string) => void;
  onJoinSession: (code: string) => void;
}

type Tab = 'sessions' | 'vault' | 'leaderboard';

export default function ProjectView({
  project,
  userId,
  profile,
  onBack,
  onCreateSession,
  onJoinSession,
}: ProjectViewProps) {
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [vaultIdeas, setVaultIdeas] = useState<(Idea & { author_name: string; session_prompt: string })[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = project.owner_id === userId;

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    setSessions((sessionsData || []) as Session[]);

    // Fetch project leaderboard
    const { data: lbData } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('project_id', project.id);
    if (lbData) {
      const sorted = lbData.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
        const scoreA = a.crowns * 3 + a.shortlists + a.blitzes + a.hail_marys;
        const scoreB = b.crowns * 3 + b.shortlists + b.blitzes + b.hail_marys;
        return scoreB - scoreA;
      });
      setLeaderboard(sorted);
    }

    // Fetch member profiles
    const { data: members } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', project.id);
    if (members && members.length > 0) {
      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      setMemberProfiles((profiles || []) as Profile[]);
    }

    // Fetch vault ideas (curated ideas from all project sessions)
    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map((s: Session) => s.id);
      const { data: ideas } = await supabase
        .from('ideas')
        .select('*')
        .in('session_id', sessionIds)
        .eq('is_curated', true)
        .order('created_at', { ascending: false });

      if (ideas) {
        // Get participant info for author names
        const { data: participants } = await supabase
          .from('participants')
          .select('user_id, name')
          .in('session_id', sessionIds);

        const participantMap: Record<string, string> = {};
        (participants || []).forEach((p) => { participantMap[p.user_id] = p.name; });

        const sessionMap: Record<string, string> = {};
        sessionsData.forEach((s: Session) => { sessionMap[s.id] = s.prompt; });

        setVaultIdeas(ideas.map((idea: Idea) => ({
          ...idea,
          author_name: participantMap[idea.author_id] || 'Unknown',
          session_prompt: sessionMap[idea.session_id] || 'Unknown prompt',
        })));
      }
    }

    setLoading(false);
  }, [project.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'sessions', label: 'Sessions' },
    { key: 'vault', label: 'Idea Vault' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={onBack} className="text-text-secondary text-sm font-body hover:text-teal cursor-pointer mb-1">
              ← Back to Projects
            </button>
            <h1 className="font-heading text-2xl md:text-3xl text-gold">{project.name}</h1>
            {project.description && (
              <p className="font-body text-text-secondary text-sm mt-1">{project.description}</p>
            )}
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-body text-text-secondary">Invite Code</p>
            <p className="font-heading text-lg text-teal tracking-wider">{project.invite_code}</p>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-body text-text-secondary">Members:</span>
          {memberProfiles.map((p) => (
            <Badge key={p.id} variant={p.id === project.owner_id ? 'gold' : 'teal'}>
              {p.display_name}{p.id === project.owner_id ? ' (owner)' : ''}
            </Badge>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-card-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-body transition-colors cursor-pointer ${
                tab === t.key
                  ? 'text-gold border-b-2 border-gold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-text-secondary font-body py-4">Loading...</p>
          </Card>
        ) : (
          <>
            {/* Sessions Tab */}
            {tab === 'sessions' && (
              <div className="space-y-3">
                <Button onClick={() => onCreateSession(project.id)}>
                  New Session
                </Button>
                {sessions.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary font-body py-4">
                      No sessions yet. Start one!
                    </p>
                  </Card>
                ) : (
                  sessions.map((session) => (
                    <Card
                      key={session.id}
                      onClick={session.phase !== 'results' && session.completed_at === null ? () => onJoinSession(session.code) : undefined}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-body text-text-primary">
                            {session.prompt || 'No prompt set'}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="neutral">{session.code}</Badge>
                            <Badge variant={
                              session.phase === 'results' || session.completed_at ? 'teal' : 'gold'
                            }>
                              {session.completed_at ? 'Completed' : session.phase}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs font-body text-text-secondary">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Idea Vault Tab */}
            {tab === 'vault' && (
              <div className="space-y-3">
                {vaultIdeas.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary font-body py-4">
                      No curated ideas yet. Complete a session to populate the vault.
                    </p>
                  </Card>
                ) : (
                  <>
                    <p className="text-sm font-body text-text-secondary">
                      {vaultIdeas.length} curated idea{vaultIdeas.length !== 1 ? 's' : ''} across {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </p>
                    {vaultIdeas.map((idea) => (
                      <Card key={idea.id}>
                        <div className="space-y-2">
                          <p className="font-body text-text-primary">{idea.text}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="teal">{idea.author_name}</Badge>
                            {idea.category && (
                              <Badge variant="gold">{idea.category}</Badge>
                            )}
                            <span className="text-xs font-body text-text-secondary">
                              from: {idea.session_prompt.slice(0, 50)}{idea.session_prompt.length > 50 ? '...' : ''}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {tab === 'leaderboard' && (
              <div className="space-y-3">
                <p className="text-sm font-body text-text-secondary">
                  Ranked by: 👑×3 + ⭐×1 + ⚡×1 + 🎲×1
                </p>
                {leaderboard.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary font-body py-4">
                      No leaderboard entries yet. Complete a session!
                    </p>
                  </Card>
                ) : (
                  leaderboard.map((entry, i) => {
                    const score = entry.crowns * 3 + entry.shortlists + entry.blitzes + entry.hail_marys;
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
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {entry.crowns > 0 && <Badge variant="gold">👑 {entry.crowns}</Badge>}
                              {entry.shortlists > 0 && <Badge variant="gold">⭐ {entry.shortlists}</Badge>}
                              {entry.blitzes > 0 && <Badge variant="teal">⚡ {entry.blitzes}</Badge>}
                              {entry.hail_marys > 0 && <Badge variant="neutral">🎲 {entry.hail_marys}</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-heading text-xl text-gold">{score}</span>
                            <p className="text-xs font-body text-text-secondary">pts</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

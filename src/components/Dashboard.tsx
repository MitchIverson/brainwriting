'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Profile, Project } from '@/lib/types';

interface DashboardProps {
  profile: Profile;
  projects: Project[];
  loading: boolean;
  onCreateProject: (name: string, description: string) => Promise<Project | null>;
  onJoinProject: (code: string) => Promise<Project | null>;
  onSelectProject: (project: Project) => void;
  onCreateSession: () => void;
  onJoinSession: (code: string) => void;
  onViewLeaderboard: () => void;
  onSignOut: () => void;
}

export default function Dashboard({
  profile,
  projects,
  loading,
  onCreateProject,
  onJoinProject,
  onSelectProject,
  onCreateSession,
  onJoinSession,
  onViewLeaderboard,
  onSignOut,
}: DashboardProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showJoinProject, setShowJoinProject] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setSubmitting(true);
    await onCreateProject(projectName.trim(), projectDesc.trim());
    setProjectName('');
    setProjectDesc('');
    setShowNewProject(false);
    setSubmitting(false);
  };

  const handleJoinProject = async () => {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    setJoinError(null);
    const result = await onJoinProject(inviteCode.trim());
    if (!result) setJoinError('Project not found. Check the invite code.');
    else {
      setInviteCode('');
      setShowJoinProject(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-gold">Brainwriting</h1>
            <p className="font-body text-text-secondary text-sm">
              Welcome back, <span className="text-teal">{profile.display_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onViewLeaderboard}>
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card onClick={onCreateSession} className="hover:border-gold/40">
            <div className="text-center space-y-1 py-2">
              <span className="text-2xl">⚡</span>
              <p className="font-heading text-lg text-text-primary">Quick Session</p>
              <p className="text-xs font-body text-text-secondary">
                Start without a project
              </p>
            </div>
          </Card>
          <Card onClick={() => setShowQuickJoin(!showQuickJoin)} className="hover:border-teal/40">
            <div className="text-center space-y-1 py-2">
              <span className="text-2xl">🔗</span>
              <p className="font-heading text-lg text-text-primary">Join Session</p>
              <p className="text-xs font-body text-text-secondary">
                Enter a 4-character code
              </p>
            </div>
          </Card>
        </div>

        {showQuickJoin && (
          <Card>
            <div className="flex gap-2">
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. A7K2"
                maxLength={4}
                className="flex-1 bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body text-center text-xl tracking-[0.3em] uppercase placeholder:text-text-secondary/50 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sessionCode.length === 4) onJoinSession(sessionCode);
                }}
              />
              <Button onClick={() => onJoinSession(sessionCode)} disabled={sessionCode.length !== 4}>
                Join
              </Button>
            </div>
          </Card>
        )}

        {/* Projects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-text-primary">Your Projects</h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowJoinProject(true); setShowNewProject(false); }}>
                Join Project
              </Button>
              <Button size="sm" onClick={() => { setShowNewProject(true); setShowJoinProject(false); }}>
                New Project
              </Button>
            </div>
          </div>

          {showNewProject && (
            <Card>
              <div className="space-y-3">
                <h3 className="font-heading text-lg text-gold">Create Project</h3>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder='e.g. "Season 4 Writers Room"'
                  maxLength={100}
                  className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body placeholder:text-text-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowNewProject(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreateProject} disabled={!projectName.trim() || submitting}>
                    {submitting ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {showJoinProject && (
            <Card>
              <div className="space-y-3">
                <h3 className="font-heading text-lg text-gold">Join Project</h3>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="Enter 8-character invite code"
                  maxLength={8}
                  className="w-full bg-bg-primary border border-card-border rounded-lg px-4 py-2.5 text-text-primary font-body text-center text-lg tracking-[0.2em] uppercase placeholder:text-text-secondary/50 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinProject(); }}
                />
                {joinError && <p className="text-danger text-sm font-body">{joinError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowJoinProject(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleJoinProject} disabled={inviteCode.length < 8 || submitting}>
                    {submitting ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading ? (
            <Card>
              <p className="text-center text-text-secondary font-body py-4">Loading projects...</p>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <div className="text-center py-6 space-y-2">
                <p className="font-body text-text-secondary">No projects yet</p>
                <p className="text-xs font-body text-text-secondary">
                  Create a project to organize sessions and track your team&apos;s leaderboard
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Card key={project.id} onClick={() => onSelectProject(project)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg text-text-primary">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm font-body text-text-secondary mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="teal">→</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

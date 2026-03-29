'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, ProjectMember, Session } from '@/lib/types';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get projects where user is a member
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (memberships && memberships.length > 0) {
      const projectIds = memberships.map((m) => m.project_id);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });
      setProjects(data || []);
    } else {
      setProjects([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (name: string, description: string) => {
    if (!userId) return null;

    // Generate invite code
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        owner_id: userId,
        invite_code: code,
      })
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return null;
    }

    // Add owner as member
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      role: 'owner',
    });

    await fetchProjects();
    return project as Project;
  }, [userId, fetchProjects]);

  const joinProject = useCallback(async (inviteCode: string) => {
    if (!userId) return null;

    const { data: project, error: findError } = await supabase
      .from('projects')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (findError || !project) return null;

    // Check if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: userId,
        role: 'member',
      });
    }

    await fetchProjects();
    return project as Project;
  }, [userId, fetchProjects]);

  const getProjectMembers = useCallback(async (projectId: string): Promise<ProjectMember[]> => {
    const { data } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);
    return (data || []) as ProjectMember[];
  }, []);

  const getProjectSessions = useCallback(async (projectId: string): Promise<Session[]> => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    return (data || []) as Session[];
  }, []);

  return {
    projects,
    loading,
    createProject,
    joinProject,
    getProjectMembers,
    getProjectSessions,
    refreshProjects: fetchProjects,
  };
}

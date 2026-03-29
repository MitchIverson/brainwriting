-- Fix: Self-referential RLS on project_members was blocking reads.
-- The policy "visible to fellow members" required reading project_members
-- to determine if you could read project_members — circular dependency.

-- Fix project_members: users can always see their own memberships,
-- and can see other members of projects they belong to.
drop policy if exists "Project members visible to fellow members" on project_members;

-- Simple approach: allow reading all memberships for projects you own,
-- plus your own membership rows (which lets fetchProjects work).
-- Then a second pass fills in other members.
create policy "Users can read project memberships"
  on project_members for select using (
    user_id = auth.uid()
    or project_id in (
      select id from projects where owner_id = auth.uid()
    )
  );

-- Also fix projects SELECT: the subquery into project_members was also
-- blocked by the circular RLS. Use a simpler approach.
drop policy if exists "Projects visible to members" on projects;

create policy "Projects visible to owner or members"
  on projects for select using (
    owner_id = auth.uid()
    or id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

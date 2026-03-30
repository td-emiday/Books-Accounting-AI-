'use client';

import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function useWorkspaces() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map((m: any) => ({ ...m.workspaces, memberRole: m.role })) || [];
    },
  });
}

export function useCurrentWorkspace() {
  return useWorkspaceStore((s) => s.currentWorkspace);
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, Profile } from '@/types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  profile: Profile | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setProfile: (profile: Profile | null) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      profile: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setProfile: (profile) => set({ profile }),
      reset: () => set({ currentWorkspace: null, profile: null }),
    }),
    {
      name: 'emiday-workspace',
    }
  )
);

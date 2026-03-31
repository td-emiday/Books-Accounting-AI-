import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  sidebarOpen: boolean;
  addTransactionOpen: boolean;
  importStatementOpen: boolean;
  theme: Theme;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setAddTransactionOpen: (open: boolean) => void;
  setImportStatementOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('emiday-theme') as Theme) || 'light';
  }
  return 'light';
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  addTransactionOpen: false,
  importStatementOpen: false,
  theme: getInitialTheme(),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setAddTransactionOpen: (open) => set({ addTransactionOpen: open }),
  setImportStatementOpen: (open) => set({ importStatementOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem('emiday-theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('emiday-theme', next);
      return { theme: next };
    }),
}));

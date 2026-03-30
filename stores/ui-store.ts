import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  addTransactionOpen: boolean;
  importStatementOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setAddTransactionOpen: (open: boolean) => void;
  setImportStatementOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  addTransactionOpen: false,
  importStatementOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setAddTransactionOpen: (open) => set({ addTransactionOpen: open }),
  setImportStatementOpen: (open) => set({ importStatementOpen: open }),
}));

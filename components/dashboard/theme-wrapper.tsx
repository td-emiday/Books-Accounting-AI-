'use client';

import { useUIStore } from '@/stores/ui-store';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'theme-dark dark text-[#F1F5F9]' : 'theme-light text-[#0F172A]'} ${theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-[#F3F4F6]'}`}>
      {children}
    </div>
  );
}

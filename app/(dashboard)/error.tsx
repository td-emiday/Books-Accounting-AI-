'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card p-8 text-center space-y-4 max-w-md">
        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} className="text-danger" />
        </div>
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="text-sm text-text-secondary">
          {error.message || 'An unexpected error occurred in this section.'}
        </p>
        <button onClick={reset} className="btn-primary px-5 py-2.5 text-sm">
          Try Again
        </button>
      </div>
    </div>
  );
}

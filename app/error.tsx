'use client';

import { useEffect } from 'react';

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 px-4">
        <div className="text-6xl font-instrument-serif italic text-danger">500</div>
        <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
        <p className="text-text-secondary max-w-md mx-auto">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary px-6 py-3 text-sm">
            Try Again
          </button>
          <a href="/" className="btn-secondary px-6 py-3 text-sm">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

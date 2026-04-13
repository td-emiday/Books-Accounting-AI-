'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Onboarding now happens inside the dashboard.
// This page just redirects to the dashboard where the onboarding modal will appear.
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#5B21B6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#71717a]">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

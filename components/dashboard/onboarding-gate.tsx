'use client';

import { OnboardingModal } from './onboarding-modal';

interface Props {
  needsOnboarding: boolean;
}

export function OnboardingGate({ needsOnboarding }: Props) {
  if (!needsOnboarding) return null;
  return <OnboardingModal />;
}

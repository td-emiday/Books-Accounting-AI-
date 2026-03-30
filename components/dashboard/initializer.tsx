'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Profile, Workspace } from '@/types';

interface Props {
  profile: any;
  workspaces: any[];
}

export function DashboardInitializer({ profile, workspaces }: Props) {
  const { setProfile, setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (profile) {
      setProfile({
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        phone: profile.phone,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      });
    }

    // Set first workspace if none selected
    if (!currentWorkspace && workspaces.length > 0) {
      const ws = workspaces[0];
      setCurrentWorkspace({
        id: ws.id,
        name: ws.name,
        ownerId: ws.owner_id,
        businessType: ws.business_type,
        jurisdiction: ws.jurisdiction,
        industry: ws.industry,
        vatRegistered: ws.vat_registered,
        vatNumber: ws.vat_number,
        tin: ws.tin,
        rcNumber: ws.rc_number,
        currency: ws.currency,
        planTier: ws.plan_tier,
        billingCycle: ws.billing_cycle,
        trialEndsAt: ws.trial_ends_at,
        createdAt: ws.created_at,
        updatedAt: ws.updated_at,
      });
    }
  }, [profile, workspaces]);

  return null;
}

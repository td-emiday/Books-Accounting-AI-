'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------- Fetcher ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adminFetch(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Admin API error: ${res.status}`);
  }
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adminMutate(
  url: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body?: unknown,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Admin API error: ${res.status}`);
  }
  return res.json();
}

// ---------- Queries ----------

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminFetch('/api/admin/stats'),
    staleTime: 30_000,
  });
}

export function useAdminUsers(filters: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('perPage', String(filters.perPage));
      return adminFetch(`/api/admin/users?${params.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useAdminWorkspaces(filters: {
  search?: string;
  page?: number;
  perPage?: number;
  planTier?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'workspaces', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('perPage', String(filters.perPage));
      if (filters.planTier) params.set('planTier', filters.planTier);
      return adminFetch(`/api/admin/workspaces?${params.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useAdminSubscriptions(filters: { page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('perPage', String(filters.perPage));
      return adminFetch(`/api/admin/subscriptions?${params.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useAdminActivity(filters: { page?: number; perPage?: number; action?: string }) {
  return useQuery({
    queryKey: ['admin', 'activity', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.perPage) params.set('perPage', String(filters.perPage));
      if (filters.action) params.set('action', filters.action);
      return adminFetch(`/api/admin/activity?${params.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminFetch('/api/admin/settings'),
    staleTime: 30_000,
  });
}

// ---------- Mutations ----------

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminMutate(`/api/admin/workspaces/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminMutate('/api/admin/settings', 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './use-supabase';
import { useCurrentWorkspace } from './use-workspace';
import type { Transaction } from '@/types';

export function useTransactions(filters?: {
  type?: 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  source?: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const supabase = useSupabase();
  const workspace = useCurrentWorkspace();
  const page = filters?.page || 1;
  const perPage = filters?.perPage || 25;

  return useQuery({
    queryKey: ['transactions', workspace?.id, filters],
    queryFn: async () => {
      if (!workspace) return { data: [], count: 0 };

      let query = supabase
        .from('transactions')
        .select('*, categories(name, type, tax_treatment, icon, color)', { count: 'exact' })
        .eq('workspace_id', workspace.id)
        .order('date', { ascending: false });

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.startDate) query = query.gte('date', filters.startDate);
      if (filters?.endDate) query = query.lte('date', filters.endDate);
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.source) query = query.eq('source', filters.source);
      if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

      query = query.range((page - 1) * perPage, page * perPage - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!workspace?.id,
  });
}

export function useCreateTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const workspace = useCurrentWorkspace();

  return useMutation({
    mutationFn: async (transaction: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          workspace_id: workspace!.id,
          type: transaction.type,
          amount: transaction.amount,
          currency: workspace!.currency,
          date: transaction.date,
          description: transaction.description,
          vendor_client: transaction.vendorClient,
          category_id: transaction.categoryId,
          category_confirmed: transaction.categoryConfirmed || false,
          source: transaction.source || 'MANUAL',
          reference: transaction.reference,
          notes: transaction.notes,
          vat_applicable: transaction.vatApplicable || false,
          vat_amount: transaction.vatAmount,
          wht_applicable: transaction.whtApplicable || false,
          wht_rate: transaction.whtRate,
          wht_amount: transaction.whtAmount,
          receipt_url: transaction.receiptUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

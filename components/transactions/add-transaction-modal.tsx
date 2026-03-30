'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Sparkles, Upload } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useCreateTransaction } from '@/hooks/use-transactions';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface FormValues {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
  vendorClient: string;
  categoryId: string;
  vatApplicable: boolean;
  whtApplicable: boolean;
  notes: string;
}

export function AddTransactionModal() {
  const { addTransactionOpen, setAddTransactionOpen } = useUIStore();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const createTx = useCreateTransaction();
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; categoryName: string; confidence: number } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .or(`workspace_id.is.null,workspace_id.eq.${workspace?.id}`)
        .order('name');
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: 'EXPENSE',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      vendorClient: '',
      categoryId: '',
      vatApplicable: false,
      whtApplicable: false,
      notes: '',
    },
  });

  const txType = watch('type');
  const description = watch('description');

  // AI categorisation suggestion
  useEffect(() => {
    if (description.length < 5) {
      setAiSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/categorise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            type: txType,
            workspaceId: workspace?.id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiSuggestion(data);
        }
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [description, txType, workspace?.id]);

  const onSubmit = async (data: FormValues) => {
    await createTx.mutateAsync({
      type: data.type,
      amount: data.amount,
      date: data.date,
      description: data.description,
      vendorClient: data.vendorClient,
      categoryId: data.categoryId || undefined,
      categoryConfirmed: !!data.categoryId,
      vatApplicable: data.vatApplicable,
      whtApplicable: data.whtApplicable,
      notes: data.notes,
      source: 'MANUAL',
    });
    reset();
    setAddTransactionOpen(false);
  };

  const filteredCategories = categories?.filter(c => c.type === txType) || [];

  return (
    <AnimatePresence>
      {addTransactionOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={() => setAddTransactionOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-screen w-full max-w-[480px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-10 px-6 py-4 border-b border-[rgba(108,63,232,0.08)] flex items-center justify-between">
              <h2 className="font-instrument-serif italic text-xl">Add Transaction</h2>
              <button
                onClick={() => setAddTransactionOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Type Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setValue('type', 'INCOME')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    txType === 'INCOME'
                      ? 'bg-white shadow-sm text-[#059669]'
                      : 'text-text-muted'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'EXPENSE')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    txType === 'EXPENSE'
                      ? 'bg-white shadow-sm text-[#DC2626]'
                      : 'text-text-muted'
                  }`}
                >
                  Expense
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
                    {workspace?.currency === 'GHS' ? 'GH₵' : workspace?.currency === 'ZAR' ? 'R' : '₦'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { required: true, min: 0.01, valueAsNumber: true })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  {...register('date', { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input
                  type="text"
                  {...register('description', { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
                  placeholder="What was this transaction for?"
                />
              </div>

              {/* Vendor/Client */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {txType === 'INCOME' ? 'Client' : 'Vendor'}
                </label>
                <input
                  type="text"
                  {...register('vendorClient')}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
                  placeholder={txType === 'INCOME' ? 'Client name' : 'Vendor name'}
                />
              </div>

              {/* Category with AI suggestion */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                {aiSuggestion && !watch('categoryId') && (
                  <button
                    type="button"
                    onClick={() => setValue('categoryId', aiSuggestion.categoryId)}
                    className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-brand-1/5 border border-brand-1/15 text-xs text-brand-1 hover:bg-brand-1/10 transition-all w-full text-left"
                  >
                    <Sparkles size={14} />
                    <span className="font-medium">AI suggests: {aiSuggestion.categoryName}</span>
                    <span className="ml-auto text-text-muted">{Math.round(aiSuggestion.confidence * 100)}%</span>
                  </button>
                )}
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tax flags */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('vatApplicable')}
                    className="w-4 h-4 rounded border-gray-300 text-brand-1 focus:ring-brand-2/30"
                  />
                  <span className="text-sm">VAT applicable (7.5%)</span>
                </label>
                {txType === 'EXPENSE' && (
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('whtApplicable')}
                      className="w-4 h-4 rounded border-gray-300 text-brand-1 focus:ring-brand-2/30"
                    />
                    <span className="text-sm">Withholding Tax applies</span>
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createTx.isPending}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-60"
                >
                  {createTx.isPending ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

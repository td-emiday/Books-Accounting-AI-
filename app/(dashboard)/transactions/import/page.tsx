'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Upload, FileText, Check, AlertTriangle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: '₵', ZAR: 'R', KES: 'KSh', XOF: 'CFA', XAF: 'FCFA',
};
function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

interface ParsedTransaction {
  date: string;
  description: string;
  credit: number | null;
  debit: number | null;
  balance: number | null;
  reference: string | null;
  suggestedCategory?: string;
  isDuplicate?: boolean;
}

export default function ImportStatementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [detectedCurrency, setDetectedCurrency] = useState<string>('NGN');
  const [importResult, setImportResult] = useState<{ count: number; duplicates: number } | null>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !workspace) {
      setError(!workspace ? 'No workspace selected. Please select a workspace first.' : 'No file selected.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspace.id);

      const res = await fetch('/api/import/bank-statement', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse statement');
      setParsed(data.transactions || []);
      setDetectedCurrency(data.currency || 'NGN');
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/import/bank-statement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace?.id,
          transactions: parsed.filter(t => !t.isDuplicate),
          currency: detectedCurrency,
        }),
      });

      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      setImportResult({
        count: data.imported || parsed.filter(t => !t.isDuplicate).length,
        duplicates: parsed.filter(t => t.isDuplicate).length,
      });
      setStep(2);

      // Invalidate transaction and dashboard caches so KPIs update
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = parsed.reduce((s, t) => s + (t.credit || 0), 0);
  const totalExpense = parsed.reduce((s, t) => s + (t.debit || 0), 0);
  const duplicateCount = parsed.filter(t => t.isDuplicate).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Import Bank Statement</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {['Upload', 'Review', 'Confirm'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < step ? 'bg-brand-gradient text-white' :
              i === step ? 'bg-[#F5F3FF] text-[#7b39fc] ring-2 ring-[#7b39fc]/30' :
              'bg-[#F3F4F6] text-[#6B7280]'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className="text-xs font-semibold text-[#374151] hidden sm:block">{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${i < step ? 'bg-[#7b39fc]' : 'bg-[#E5E7EB]'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 sm:p-8 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#7b39fc]" />
              <p className="text-sm font-semibold text-[#7b39fc]">Parsing your bank statement...</p>
              <p className="text-xs text-[#6B7280]">AI is extracting transactions. This may take a moment.</p>
            </div>
          )}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-[#DDD6FE] rounded-2xl p-6 sm:p-12 text-center hover:border-[#7b39fc] transition-colors cursor-pointer bg-[#FAFAFE]"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload size={40} className="mx-auto text-[#A78BFA] mb-4" />
            <p className="text-sm font-semibold text-[#111827] mb-1">
              {file ? file.name : 'Drag your bank statement PDF here, or click to browse'}
            </p>
            <p className="text-sm text-[#6B7280]">
              Supported: PDF from any Nigerian bank (GTBank, Access, Zenith, UBA, etc.)
            </p>
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE]">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#7b39fc]" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{file.name}</p>
                  <p className="text-xs text-[#6B7280]">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    Upload & Parse
                    <ArrowRight size={14} className="ml-1.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap gap-4 text-sm">
            <div><span className="text-[#6B7280]">Transactions:</span> <strong className="text-[#111827]">{parsed.length}</strong></div>
            <div><span className="text-[#6B7280]">Currency:</span> <strong className="text-[#7b39fc]">{detectedCurrency}</strong></div>
            <div><span className="text-[#6B7280]">Income:</span> <strong className="text-[#059669]">{getCurrencySymbol(detectedCurrency)}{totalIncome.toLocaleString()}</strong></div>
            <div><span className="text-[#6B7280]">Expenses:</span> <strong className="text-[#DC2626]">{getCurrencySymbol(detectedCurrency)}{totalExpense.toLocaleString()}</strong></div>
            {duplicateCount > 0 && (
              <div className="badge-warning">
                <AlertTriangle size={12} className="mr-1" />
                {duplicateCount} duplicates flagged
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="data-table w-full text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold uppercase">Date</th>
                    <th className="text-left py-3 px-4 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold uppercase">Description</th>
                    <th className="text-right py-3 px-4 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold uppercase">Credit</th>
                    <th className="text-right py-3 px-4 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold uppercase">Debit</th>
                    <th className="text-center py-3 px-4 bg-[#F9FAFB] text-[#6B7280] text-xs font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((tx, i) => (
                    <tr key={i} className={`border-t border-[#F3F4F6] ${tx.isDuplicate ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 px-4 text-xs text-[#6B7280] whitespace-nowrap">{tx.date}</td>
                      <td className="py-2.5 px-4 text-sm text-[#111827] font-medium truncate max-w-[200px]">{tx.description}</td>
                      <td className="py-2.5 px-4 text-right text-xs text-[#059669] font-semibold">
                        {tx.credit ? `${getCurrencySymbol(detectedCurrency)}${tx.credit.toLocaleString()}` : '\u2014'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-xs text-[#DC2626] font-semibold">
                        {tx.debit ? `${getCurrencySymbol(detectedCurrency)}${tx.debit.toLocaleString()}` : '\u2014'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {tx.isDuplicate ? (
                          <span className="badge-warning text-[9px]">Duplicate</span>
                        ) : (
                          <span className="badge-success text-[9px]">New</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-sm text-[#374151] font-medium hover:text-[#111827]">
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              {loading ? 'Importing...' : `Import ${parsed.length - duplicateCount} Transactions`}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && importResult && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-[#059669]" />
          </div>
          <h2 className="font-inter font-bold text-xl text-[#111827] mb-2">Import Complete!</h2>
          <p className="text-sm text-[#374151] mb-6">
            {importResult.count} transactions imported successfully.
            {importResult.duplicates > 0 && ` ${importResult.duplicates} duplicates skipped.`}
          </p>
          <button
            onClick={() => router.push('/transactions')}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            View Transactions
            <ArrowRight size={14} className="ml-1.5" />
          </button>
        </div>
      )}
    </div>
  );
}

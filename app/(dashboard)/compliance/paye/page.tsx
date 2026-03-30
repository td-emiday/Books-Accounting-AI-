'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { calculatePAYE } from '@/lib/compliance/nigeria';
import { formatCurrency } from '@/lib/utils';
import { Plus, Download, X, Pencil, Trash2, Loader2 } from 'lucide-react';

interface EmployeeForm {
  fullName: string;
  email: string;
  grossMonthlySalary: number;
  department: string;
}

const emptyForm: EmployeeForm = { fullName: '', email: '', grossMonthlySalary: 0, department: '' };

export default function PAYEPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const currency = workspace?.currency || 'NGN';
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [downloading, setDownloading] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .eq('is_active', true)
        .order('full_name');
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from('employees').update({
          full_name: form.fullName,
          email: form.email || null,
          gross_monthly_salary: form.grossMonthlySalary,
          department: form.department || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employees').insert({
          workspace_id: workspace!.id,
          full_name: form.fullName,
          email: form.email || null,
          gross_monthly_salary: form.grossMonthlySalary,
          department: form.department || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditingId(emp.id);
    setForm({
      fullName: emp.full_name,
      email: emp.email || '',
      grossMonthlySalary: Number(emp.gross_monthly_salary),
      department: emp.department || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const totalMonthlyPAYE = (employees || []).reduce((sum, emp: any) => {
    return sum + calculatePAYE(Number(emp.gross_monthly_salary)).monthlyPAYE;
  }, 0);

  const handleDownload = useCallback(async () => {
    if (!workspace?.id) return;
    setDownloading(true);
    try {
      const now = new Date();
      const startDate = `${now.getFullYear()}-01-01`;
      const endDate = now.toISOString().split('T')[0];
      const res = await fetch(`/api/reports/download?type=paye&workspaceId=${workspace.id}&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paye-schedule-${now.getFullYear()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PAYE PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [workspace?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">PAYE Management</h1>
        <div className="flex gap-3">
          <button onClick={handleDownload} disabled={downloading} className="btn-secondary px-4 py-2 text-sm">
            {downloading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
            {downloading ? 'Downloading...' : 'Download PAYE Schedule'}
          </button>
          <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
            <Plus size={14} className="mr-1.5" /> Add Employee
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card p-6">
        <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Total Monthly PAYE</p>
        <p className="font-inter font-bold text-3xl text-brand-1">{formatCurrency(totalMonthlyPAYE, currency)}</p>
        <p className="text-sm text-text-muted mt-1">{(employees || []).length} active employees</p>
      </div>

      {/* Employee Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-text-muted">Loading employees...</p>
        ) : !employees || employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium mb-1">No employees added yet</p>
            <p className="text-xs text-text-muted mb-4">Add your employees to calculate PAYE obligations.</p>
            <button onClick={openAdd} className="btn-primary px-4 py-2 text-xs">Add Employee</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-right py-3 px-4">Gross Monthly</th>
                  <th className="text-center py-3 px-4">PAYE Band</th>
                  <th className="text-right py-3 px-4">Monthly PAYE</th>
                  <th className="text-right py-3 px-4">Annual PAYE</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any) => {
                  const paye = calculatePAYE(Number(emp.gross_monthly_salary));
                  return (
                    <tr key={emp.id} className="border-t border-[rgba(108,63,232,0.06)]">
                      <td className="py-3 px-4">
                        <p className="font-medium">{emp.full_name}</p>
                        {emp.email && <p className="text-xs text-text-muted">{emp.email}</p>}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs">{emp.department || '—'}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(Number(emp.gross_monthly_salary), currency)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge-info">{(paye.effectiveRate * 100).toFixed(1)}%</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-brand-1">{formatCurrency(paye.monthlyPAYE, currency)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(paye.annualPAYE, currency)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-brand-1/5 text-text-muted hover:text-brand-1 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Deactivate ${emp.full_name}?`)) deactivateMutation.mutate(emp.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors" title="Deactivate"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-1/5 border-t border-brand-1/10">
                  <td colSpan={4} className="py-3 px-4 font-semibold">Total Monthly PAYE</td>
                  <td className="py-3 px-4 text-right font-bold text-lg text-brand-1">{formatCurrency(totalMonthlyPAYE, currency)}</td>
                  <td className="py-3 px-4 text-right font-bold">{formatCurrency(totalMonthlyPAYE * 12, currency)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={closeModal} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] glass-card p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-inter font-bold text-lg">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-brand-1/5"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="Employee name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email (optional)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="employee@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Gross Monthly Salary (₦)</label>
                <input type="number" value={form.grossMonthlySalary || ''} onChange={(e) => setForm({...form, grossMonthlySalary: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Department (optional)</label>
                <input type="text" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="e.g. Engineering" />
              </div>
              {form.grossMonthlySalary > 0 && (
                <div className="p-3 rounded-xl bg-brand-1/5 text-sm">
                  <p className="text-text-secondary">Estimated monthly PAYE: <strong className="text-brand-1">{formatCurrency(calculatePAYE(form.grossMonthlySalary).monthlyPAYE, currency)}</strong></p>
                </div>
              )}
              <button onClick={() => saveMutation.mutate()} disabled={!form.fullName || !form.grossMonthlySalary || saveMutation.isPending}
                className="btn-primary w-full py-3 text-sm disabled:opacity-60">
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

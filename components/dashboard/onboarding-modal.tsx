'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { BUSINESS_TYPES, INDUSTRIES, JURISDICTIONS, CURRENCIES } from '@/lib/constants';
import {
  Building2, FileText, ArrowRight, ArrowLeft, Check, AlertCircle,
  Upload, X, File, Loader2, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Business Info', icon: Building2 },
  { label: 'Documents', icon: FileText },
];

/* TIN validation */
function validateTIN(tin: string): { valid: boolean; message: string } {
  if (!tin) return { valid: true, message: '' };
  const cleaned = tin.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleaned)) return { valid: false, message: 'TIN must contain only numbers (and optional hyphens)' };
  if (cleaned.length < 8 || cleaned.length > 14) return { valid: false, message: 'TIN should be 8-14 digits' };
  return { valid: true, message: '' };
}

/* RC Number validation */
function validateRCNumber(rc: string): { valid: boolean; message: string } {
  if (!rc) return { valid: true, message: '' };
  const cleaned = rc.replace(/^(RC|rc|Rc)\s*/i, '').trim();
  if (!/^\d+$/.test(cleaned)) return { valid: false, message: 'RC Number must be numeric (optionally prefixed with "RC")' };
  if (cleaned.length < 4 || cleaned.length > 10) return { valid: false, message: 'RC Number should be 4-10 digits' };
  return { valid: true, message: '' };
}

interface UploadedDoc {
  file: File;
  type: 'CAC' | 'MEMART';
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/20 focus:border-[#7b39fc]/40 text-sm text-gray-900 placeholder:text-gray-400 transition-all";
const selectClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/20 focus:border-[#7b39fc]/40 text-sm text-gray-900 transition-all";

export function OnboardingModal() {
  const router = useRouter();
  const supabase = useSupabase();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addTaxLater, setAddTaxLater] = useState(false);
  const [tinTouched, setTinTouched] = useState(false);
  const [rcTouched, setRcTouched] = useState(false);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'LIMITED_COMPANY' as string,
    industry: '',
    jurisdiction: 'NG' as 'NG' | 'GH' | 'ZA',
    vatRegistered: false,
    vatNumber: '',
    tin: '',
    rcNumber: '',
  });

  const currency = CURRENCIES[formData.jurisdiction]?.code || 'NGN';
  const tinValidation = useMemo(() => validateTIN(formData.tin), [formData.tin]);
  const rcValidation = useMemo(() => validateRCNumber(formData.rcNumber), [formData.rcNumber]);

  const isStep0Valid = useMemo(() => {
    if (!formData.businessName.trim()) return false;
    if (!addTaxLater && (!tinValidation.valid || !rcValidation.valid)) return false;
    return true;
  }, [formData.businessName, addTaxLater, tinValidation.valid, rcValidation.valid]);

  const handleFileSelect = useCallback((type: 'CAC' | 'MEMART') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError('File must be under 10MB');
        return;
      }
      // Replace existing doc of same type
      setDocuments(prev => [
        ...prev.filter(d => d.type !== type),
        { file, type, uploading: false, uploaded: false },
      ]);
      setError(null);
    };
    input.click();
  }, []);

  const removeDocument = useCallback((type: 'CAC' | 'MEMART') => {
    setDocuments(prev => prev.filter(d => d.type !== type));
  }, []);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated. Please sign in again.');

      // 1. Create workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: formData.businessName,
          owner_id: user.id,
          business_type: formData.businessType,
          jurisdiction: formData.jurisdiction,
          industry: formData.industry,
          vat_registered: formData.vatRegistered,
          vat_number: formData.vatNumber || null,
          tin: formData.tin || null,
          rc_number: formData.rcNumber || null,
          currency,
          plan_tier: 'STARTER',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          onboarding_completed: true,
        })
        .select()
        .single();

      if (wsError) throw wsError;

      // 2. Create workspace membership
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'OWNER',
        accepted_at: new Date().toISOString(),
      });

      // 3. Upload documents
      for (const doc of documents) {
        const filePath = `${workspace.id}/${doc.type.toLowerCase()}/${Date.now()}-${doc.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('corporate-documents')
          .upload(filePath, doc.file);

        if (uploadError) {
          console.error(`Failed to upload ${doc.type}:`, uploadError);
          continue; // Don't block workspace creation
        }

        await supabase.from('corporate_documents').insert({
          workspace_id: workspace.id,
          document_type: doc.type,
          file_name: doc.file.name,
          file_path: filePath,
          file_size: doc.file.size,
          mime_type: doc.file.type,
          uploaded_by: user.id,
        });
      }

      // 4. Set workspace in store
      setCurrentWorkspace({
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.owner_id,
        businessType: workspace.business_type,
        jurisdiction: workspace.jurisdiction,
        industry: workspace.industry,
        vatRegistered: workspace.vat_registered,
        vatNumber: workspace.vat_number,
        tin: workspace.tin,
        rcNumber: workspace.rc_number,
        currency: workspace.currency,
        planTier: workspace.plan_tier,
        billingCycle: workspace.billing_cycle,
        trialEndsAt: workspace.trial_ends_at,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      });

      // 5. Refresh page to load dashboard
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cacDoc = documents.find(d => d.type === 'CAC');
  const memartDoc = documents.find(d => d.type === 'MEMART');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-instrument-serif italic text-2xl text-gray-900">Complete Your Setup</h1>
            <p className="text-sm text-gray-500 mt-1">Tell us about your business to get started.</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i < step
                    ? 'bg-[#7b39fc] text-white'
                    : i === step
                    ? 'bg-[#7b39fc]/10 text-[#7b39fc] ring-1 ring-[#7b39fc]/20'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check size={12} /> : <s.icon size={12} />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${i < step ? 'bg-[#7b39fc]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Business Info + Tax */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className={inputClass}
                      placeholder="Your business name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type</label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className={selectClass}
                      >
                        {BUSINESS_TYPES.map(bt => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <div className="grid grid-cols-3 gap-3">
                      {JURISDICTIONS.map(j => (
                        <button
                          key={j.code}
                          type="button"
                          onClick={() => setFormData({ ...formData, jurisdiction: j.code })}
                          className={`p-3 rounded-xl border-2 text-center transition-all text-sm ${
                            formData.jurisdiction === j.code
                              ? 'border-[#7b39fc] bg-[#7b39fc]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-lg">{j.flag}</span>
                          <p className="text-xs font-medium mt-1 text-gray-700">{j.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">TAX DETAILS</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VAT Registered?</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, vatRegistered: true })}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.vatRegistered ? 'border-[#7b39fc] bg-[#7b39fc]/5 text-[#7b39fc]' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, vatRegistered: false })}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          !formData.vatRegistered ? 'border-[#7b39fc] bg-[#7b39fc]/5 text-[#7b39fc]' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {formData.vatRegistered && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">VAT Number</label>
                      <input
                        type="text"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                        className={inputClass}
                        placeholder="Enter VAT number"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">TIN</label>
                      <input
                        type="text"
                        value={formData.tin}
                        disabled={addTaxLater}
                        onBlur={() => setTinTouched(true)}
                        onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                        className={`${inputClass} ${addTaxLater ? 'opacity-40 cursor-not-allowed' : ''} ${tinTouched && !tinValidation.valid ? 'border-red-300 focus:ring-red-200' : ''}`}
                        placeholder="e.g. 12345678-0001"
                      />
                      {tinTouched && !tinValidation.valid && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={11} /> {tinValidation.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">RC Number</label>
                      <input
                        type="text"
                        value={formData.rcNumber}
                        disabled={addTaxLater}
                        onBlur={() => setRcTouched(true)}
                        onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                        className={`${inputClass} ${addTaxLater ? 'opacity-40 cursor-not-allowed' : ''} ${rcTouched && !rcValidation.valid ? 'border-red-300 focus:ring-red-200' : ''}`}
                        placeholder="e.g. RC123456"
                      />
                      {rcTouched && !rcValidation.valid && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={11} /> {rcValidation.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${
                        addTaxLater ? 'bg-[#7b39fc] border-[#7b39fc]' : 'border-gray-300 group-hover:border-gray-400'
                      }`}
                      onClick={() => {
                        setAddTaxLater(!addTaxLater);
                        if (!addTaxLater) {
                          setFormData({ ...formData, tin: '', rcNumber: '' });
                          setTinTouched(false);
                          setRcTouched(false);
                        }
                      }}
                    >
                      {addTaxLater && <Check size={10} className="text-white" />}
                    </div>
                    <span
                      className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setAddTaxLater(!addTaxLater);
                        if (!addTaxLater) {
                          setFormData({ ...formData, tin: '', rcNumber: '' });
                          setTinTouched(false);
                          setRcTouched(false);
                        }
                      }}
                    >
                      I&apos;ll add TIN and RC Number later
                    </span>
                  </label>
                </div>
              )}

              {/* Step 1: Document Upload */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Upload your corporate registration documents. These help us verify your business.
                  </p>

                  {/* CAC Document */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CAC Certificate of Incorporation
                      <span className="text-gray-400 font-normal ml-1">(required for businesses)</span>
                    </label>
                    {cacDoc ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="w-10 h-10 rounded-lg bg-[#7b39fc]/10 flex items-center justify-center flex-shrink-0">
                          <File size={18} className="text-[#7b39fc]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{cacDoc.file.name}</p>
                          <p className="text-xs text-gray-400">{(cacDoc.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          onClick={() => removeDocument('CAC')}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFileSelect('CAC')}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7b39fc]/30 hover:bg-[#7b39fc]/[0.02] transition-all text-center group"
                      >
                        <Upload size={20} className="mx-auto text-gray-400 group-hover:text-[#7b39fc] transition-colors mb-2" />
                        <p className="text-sm text-gray-600">Click to upload CAC document</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG — max 10MB</p>
                      </button>
                    )}
                  </div>

                  {/* MEMART Document */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Memorandum &amp; Articles of Association (MEMART)
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    {memartDoc ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="w-10 h-10 rounded-lg bg-[#7b39fc]/10 flex items-center justify-center flex-shrink-0">
                          <File size={18} className="text-[#7b39fc]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{memartDoc.file.name}</p>
                          <p className="text-xs text-gray-400">{(memartDoc.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          onClick={() => removeDocument('MEMART')}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFileSelect('MEMART')}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7b39fc]/30 hover:bg-[#7b39fc]/[0.02] transition-all text-center group"
                      >
                        <Upload size={20} className="mx-auto text-gray-400 group-hover:text-[#7b39fc] transition-colors mb-2" />
                        <p className="text-sm text-gray-600">Click to upload MEMART</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG — max 10MB</p>
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                    <p className="text-xs text-amber-700 leading-relaxed">
                      💡 You can skip document upload and add them later from Settings → Documents. However, some features like compliance reports may require verified documents.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              {step === 1 && (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip documents
                </button>
              )}
              <button
                onClick={() => {
                  if (step === 0) {
                    if (!isStep0Valid) return;
                    setStep(1);
                  } else {
                    handleFinish();
                  }
                }}
                disabled={(step === 0 && !isStep0Valid) || loading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7b39fc] hover:bg-[#6d28d9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Setting up...
                  </>
                ) : step === 1 ? (
                  <>
                    <Sparkles size={14} className="mr-1.5" />
                    Finish Setup
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} className="ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

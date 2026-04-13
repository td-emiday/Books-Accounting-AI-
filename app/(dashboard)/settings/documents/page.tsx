'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSupabase } from '@/hooks/use-supabase';
import {
  FileText, Upload, Trash2, ExternalLink, Loader2,
  ShieldCheck, AlertCircle, File,
} from 'lucide-react';

interface CorporateDocument {
  id: string;
  document_type: 'CAC' | 'MEMART' | string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string;
}

const DOC_LABELS: Record<string, { label: string; description: string }> = {
  CAC: {
    label: 'CAC Certificate of Incorporation',
    description: 'Proof that your business is registered with the Corporate Affairs Commission',
  },
  MEMART: {
    label: 'Memorandum & Articles of Association',
    description: 'The legal document outlining your company\'s rules and structure',
  },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsSettingsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<CorporateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('corporate_documents')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace, supabase]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = useCallback(async (type: 'CAC' | 'MEMART') => {
    if (!workspace) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File must be under 10MB' });
        return;
      }

      setUploading(type);
      setMessage(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const filePath = `${workspace.id}/${type.toLowerCase()}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('corporate-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('corporate_documents').insert({
          workspace_id: workspace.id,
          document_type: type,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        });

        if (dbError) throw dbError;

        setMessage({ type: 'success', text: `${DOC_LABELS[type]?.label || type} uploaded successfully.` });
        fetchDocuments();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Upload failed. Please try again.' });
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }, [workspace, supabase, fetchDocuments]);

  const handleDelete = useCallback(async (doc: CorporateDocument) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

    setDeleting(doc.id);
    setMessage(null);

    try {
      // Delete from storage
      await supabase.storage.from('corporate-documents').remove([doc.file_path]);

      // Delete from DB
      const { error } = await supabase
        .from('corporate_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setMessage({ type: 'success', text: 'Document deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete document.' });
    } finally {
      setDeleting(null);
    }
  }, [supabase]);

  const handleView = useCallback(async (doc: CorporateDocument) => {
    try {
      const { data } = await supabase.storage
        .from('corporate-documents')
        .createSignedUrl(doc.file_path, 60); // 60 second signed URL

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not open document. Please try again.' });
    }
  }, [supabase]);

  const docsByType: Record<string, CorporateDocument[]> = {};
  for (const doc of documents) {
    if (!docsByType[doc.document_type]) docsByType[doc.document_type] = [];
    docsByType[doc.document_type].push(doc);
  }

  const docTypes: Array<'CAC' | 'MEMART'> = ['CAC', 'MEMART'];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Settings</h1>

      {/* Settings navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[rgba(108,63,232,0.08)] pb-3">
        <a href="/settings" className="px-3 py-1.5 rounded-lg text-[#6B7280] text-sm font-medium hover:bg-[#5B21B6]/5">General</a>
        <a href="/settings/billing" className="px-3 py-1.5 rounded-lg text-[#6B7280] text-sm font-medium hover:bg-[#5B21B6]/5">Billing</a>
        <a href="/settings/team" className="px-3 py-1.5 rounded-lg text-[#6B7280] text-sm font-medium hover:bg-[#5B21B6]/5">Team</a>
        <a href="/settings/notifications" className="px-3 py-1.5 rounded-lg text-[#6B7280] text-sm font-medium hover:bg-[#5B21B6]/5">Notifications</a>
        <a href="/settings/whatsapp" className="px-3 py-1.5 rounded-lg text-[#6B7280] text-sm font-medium hover:bg-[#5B21B6]/5">WhatsApp</a>
        <span className="px-3 py-1.5 rounded-lg bg-[#5B21B6]/10 text-[#5B21B6] text-sm font-medium cursor-default">Documents</span>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
            : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
        }`}>
          {message.type === 'error' && <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-[#5B21B6] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#374151]">Secure Document Vault</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Corporate documents are encrypted and stored securely. They are used for compliance verification and may be required for certain reports.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#5B21B6]" />
        </div>
      ) : (
        <div className="space-y-4">
          {docTypes.map((type) => {
            const typeDocs = docsByType[type] || [];
            const info = DOC_LABELS[type];
            const isUploading = uploading === type;

            return (
              <div key={type} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">{info.label}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{info.description}</p>
                  </div>
                  <button
                    onClick={() => handleUpload(type)}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#5B21B6] bg-[#F5F3FF] border border-[#DDD6FE] hover:bg-[#EDE9FE] transition-all disabled:opacity-60 flex-shrink-0"
                  >
                    {isUploading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>

                {typeDocs.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <FileText size={24} className="mx-auto text-[#D1D5DB] mb-2" />
                    <p className="text-sm text-[#9CA3AF]">No {info.label} uploaded yet</p>
                    <button
                      onClick={() => handleUpload(type)}
                      className="mt-3 text-xs text-[#5B21B6] hover:underline font-medium"
                    >
                      Upload now →
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F4F6]">
                    {typeDocs.map((doc) => (
                      <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                          <File size={16} className="text-[#5B21B6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827] truncate">{doc.file_name}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {formatFileSize(doc.file_size)} · Uploaded {new Date(doc.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleView(doc)}
                            className="p-2 rounded-lg text-[#6B7280] hover:text-[#5B21B6] hover:bg-[#F5F3FF] transition-colors"
                            title="View document"
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deleting === doc.id}
                            className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
                            title="Delete document"
                          >
                            {deleting === doc.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-[#9CA3AF] flex items-start gap-1.5">
        <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
        <span>Documents are stored in a private, encrypted bucket accessible only to your workspace members. Files are never shared with third parties.</span>
      </div>
    </div>
  );
}

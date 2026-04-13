'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { MessageSquare, Phone, Check, X, Loader2, Send, Shield, Smartphone, ArrowRight } from 'lucide-react';

interface WhatsAppLink {
  id: string;
  phone_number: string;
  verified: boolean;
  created_at: string;
}

export default function WhatsAppSettingsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const [links, setLinks] = useState<WhatsAppLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/whatsapp/link');
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!phoneInput || !workspace) return;
    setLinking(true);
    setMessage(null);

    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneInput, workspaceId: workspace.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Verification code sent! Check your WhatsApp and reply with the code.' });
      setPhoneInput('');
      fetchLinks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send verification code' });
    } finally {
      setLinking(false);
    }
  };

  const handleVerify = async () => {
    if (!codeInput || !pendingLink) return;
    setVerifying(true);
    setMessage(null);

    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: pendingLink.phone_number, code: codeInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: '✅ Phone number verified! You can now send invoices and receipts via WhatsApp.' });
      setCodeInput('');
      fetchLinks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verification failed. Please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingLink || !workspace) return;
    setLinking(true);
    setMessage(null);

    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: pendingLink.phone_number, workspaceId: workspace.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'New verification code sent! Check your WhatsApp.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend code' });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (phoneNumber: string) => {
    try {
      await fetch('/api/whatsapp/link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      setLinks(links.filter(l => l.phone_number !== phoneNumber));
      setMessage({ type: 'success', text: 'Phone number unlinked' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to unlink' });
    }
  };

  const verifiedLink = links.find(l => l.verified);
  const pendingLink = links.find(l => !l.verified);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">WhatsApp Integration</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Send invoices and receipts via WhatsApp to automatically update your books.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
            : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
        }`}>
          {message.text}
        </div>
      )}

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <h2 className="font-inter font-bold text-base text-[#111827] mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-[#25D366]" />
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#F9FAFB]">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-3">
              <Smartphone size={18} className="text-[#25D366]" />
            </div>
            <p className="text-sm font-semibold text-[#111827] mb-1">1. Link your phone</p>
            <p className="text-xs text-[#6B7280]">Enter your WhatsApp number and verify with a code</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#F9FAFB]">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-3">
              <Send size={18} className="text-[#25D366]" />
            </div>
            <p className="text-sm font-semibold text-[#111827] mb-1">2. Send documents</p>
            <p className="text-xs text-[#6B7280]">Photo invoices, receipts, or type transactions</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#F9FAFB]">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-3">
              <Check size={18} className="text-[#25D366]" />
            </div>
            <p className="text-sm font-semibold text-[#111827] mb-1">3. Auto-booked</p>
            <p className="text-xs text-[#6B7280]">AI extracts details and adds to your books</p>
          </div>
        </div>
      </div>

      {/* Current status */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <h2 className="font-inter font-bold text-base text-[#111827] mb-4 flex items-center gap-2">
          <Phone size={18} className="text-[#5B21B6]" />
          Linked Phone Number
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#5B21B6]" />
          </div>
        ) : verifiedLink ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">{verifiedLink.phone_number}</p>
                <p className="text-xs text-[#059669] flex items-center gap-1">
                  <Shield size={10} /> Verified and active
                </p>
              </div>
            </div>
            <button
              onClick={() => handleUnlink(verifiedLink.phone_number)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FECACA] transition-colors"
            >
              Unlink
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingLink ? (
              <>
                {/* Pending verification — show code input */}
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                  <p className="text-sm font-medium text-[#92400E] mb-1">
                    Verification code sent to {pendingLink.phone_number}
                  </p>
                  <p className="text-xs text-[#D97706]">
                    Check your WhatsApp and enter the 6-digit code below.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Enter Verification Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/20 focus:border-[#5B21B6]/40 tracking-[0.3em] text-center font-mono text-lg"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={verifying || codeInput.length !== 6}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20BD5A] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {verifying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={handleResendCode}
                    disabled={linking}
                    className="text-xs text-[#5B21B6] hover:underline font-medium disabled:opacity-50"
                  >
                    {linking ? 'Sending...' : 'Resend code'}
                  </button>
                  <span className="text-xs text-[#D1D5DB]">|</span>
                  <button
                    onClick={() => handleUnlink(pendingLink.phone_number)}
                    className="text-xs text-[#9CA3AF] hover:text-[#DC2626] hover:underline"
                  >
                    Use a different number
                  </button>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  WhatsApp Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/20 focus:border-[#5B21B6]/40"
                  />
                  <button
                    onClick={handleLink}
                    disabled={linking || !phoneInput}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20BD5A] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {linking ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    {linking ? 'Sending...' : 'Link'}
                  </button>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1.5">
                  Include country code (e.g. +234 for Nigeria). We&apos;ll send a verification code.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <h2 className="font-inter font-bold text-base text-[#111827] mb-3">What you can send</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">📸</span>
            <div>
              <p className="font-medium text-[#111827]">Photos of invoices &amp; receipts</p>
              <p className="text-xs text-[#6B7280]">AI reads the image and extracts amount, vendor, date, and tax details</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <div>
              <p className="font-medium text-[#111827]">Text descriptions</p>
              <p className="text-xs text-[#6B7280]">e.g. &quot;paid 50k for diesel&quot; or &quot;received 200k from Client ABC&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📊</span>
            <div>
              <p className="font-medium text-[#111827]">Quick commands</p>
              <p className="text-xs text-[#6B7280]">Type &quot;summary&quot; for monthly financials, or &quot;help&quot; for available commands</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

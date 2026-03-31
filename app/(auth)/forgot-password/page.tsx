'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/hooks/use-supabase';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-8">
      <div className="text-center mb-8">
        <h1 className="font-instrument-serif italic text-3xl text-white mb-2">
          Reset Password
        </h1>
        <p className="text-[#71717a] text-sm">
          {sent ? 'Check your inbox' : 'Enter your email to receive a reset link'}
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <p className="text-sm text-[#a1a1aa]">
            We sent a password reset link to <strong className="text-white">{email}</strong>. Check your inbox and follow the instructions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#7b39fc] hover:underline mt-4"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/30 focus:border-[#7b39fc]/50 text-sm text-white placeholder:text-[#52525b] transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-[#7b39fc] hover:bg-[#6d28d9] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[#71717a] hover:text-white transition-colors mt-6"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

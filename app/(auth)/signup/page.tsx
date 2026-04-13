'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/hooks/use-supabase';
import { Eye, EyeOff, Building2, Calculator, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'SME_OWNER' as 'SME_OWNER' | 'ACCOUNTANT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        },
      });

      if (signUpError) throw signUpError;
      if (data.user) {
        setEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/30 focus:border-[#5B21B6]/50 text-sm text-white placeholder:text-[#52525b] transition-all";

  // Email confirmation screen
  if (emailSent) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-8 mx-4 sm:mx-0">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#5B21B6]/10 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-inter font-bold text-2xl text-white mb-2">
            Check your email
          </h1>
          <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">
            We&apos;ve sent a confirmation link to<br />
            <span className="text-white font-medium">{formData.email}</span>
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 size={18} className="text-[#5B21B6] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">What&apos;s next?</p>
                <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                  Click the link in your email to verify your account. Once confirmed, sign in and you&apos;ll be guided through setting up your business.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEmailSent(false)}
            className="text-sm text-[#5B21B6] hover:underline"
          >
            Didn&apos;t receive it? Try again
          </button>
        </div>

        <p className="text-sm text-[#71717a] text-center mt-6">
          Already confirmed?{' '}
          <Link href="/login" className="text-[#5B21B6] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-8 mx-4 sm:mx-0">
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Emiday" className="h-14 w-auto mx-auto mb-4 brightness-0 invert" />
        <p className="text-[#71717a] text-sm font-inter">
          Create your account to get started
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${inputClass} pr-11`}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#a1a1aa] mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'SME_OWNER' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.role === 'SME_OWNER'
                  ? 'border-[#5B21B6] bg-[#5B21B6]/10'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <Building2 size={20} className={formData.role === 'SME_OWNER' ? 'text-[#a78bfa]' : 'text-[#52525b]'} />
              <p className="text-sm font-medium mt-2 text-white">Business Owner</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'ACCOUNTANT' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.role === 'ACCOUNTANT'
                  ? 'border-[#5B21B6] bg-[#5B21B6]/10'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <Calculator size={20} className={formData.role === 'ACCOUNTANT' ? 'text-[#a78bfa]' : 'text-[#52525b]'} />
              <p className="text-sm font-medium mt-2 text-white">Accountant</p>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-[#5B21B6] hover:bg-[#4C1D95] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-[#52525b]">or continue with</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] transition-all text-sm font-medium text-white"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-xs text-[#52525b] text-center mt-6">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline hover:text-[#5B21B6]">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-[#5B21B6]">Privacy Policy</Link>
      </p>

      <p className="text-sm text-[#71717a] text-center mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-[#5B21B6] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

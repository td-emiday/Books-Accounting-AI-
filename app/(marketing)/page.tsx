'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Check, X, Menu,
  TrendingUp, TrendingDown, DollarSign, PieChart,
  Bell, Search, Plus, MoreHorizontal,
  Bot, FileText, Upload, Link2, BarChart3,
  Shield, Zap, Clock, Send, Mail, User, Building2, MessageSquare,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   LOGO SVG
   ═══════════════════════════════════════════════════════════════ */
function LogoSvg() {
  return (
    <svg width="140" height="32" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#E040A0" />
        </linearGradient>
      </defs>
      {/* "e" mark */}
      <circle cx="14" cy="16" r="11" stroke="url(#logoGrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="55 14" />
      <path d="M14 5C8.5 5 4 9.5 4 16h21" stroke="url(#logoGrad)" strokeWidth="0" fill="none" />
      <line x1="4" y1="15" x2="22" y2="15" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* "miday" text */}
      <text x="30" y="22" fill="#E040A0" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="18" letterSpacing="-0.5">
        emiday
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD SCREENSHOT (Inline SVG dashboard mockup)
   ═══════════════════════════════════════════════════════════════ */
function DashboardScreenshot() {
  const barData = [
    { m: 'Jan', income: 72, expense: 45 },
    { m: 'Feb', income: 85, expense: 52 },
    { m: 'Mar', income: 65, expense: 48 },
    { m: 'Apr', income: 90, expense: 55 },
    { m: 'May', income: 78, expense: 42 },
    { m: 'Jun', income: 95, expense: 60 },
    { m: 'Jul', income: 88, expense: 50 },
    { m: 'Aug', income: 82, expense: 47 },
  ];

  const recentTx = [
    { desc: 'Paystack Settlement', amount: '+₦1,250,000', type: 'income', date: 'Today' },
    { desc: 'AWS Hosting — March', amount: '-₦120,000', type: 'expense', date: 'Yesterday' },
    { desc: 'ERP Project — Gamma Inc', amount: '+₦3,200,000', type: 'income', date: 'Mar 18' },
    { desc: 'Staff Salary — March', amount: '-₦900,000', type: 'expense', date: 'Mar 15' },
    { desc: 'Figma & GitHub Licenses', amount: '-₦85,000', type: 'expense', date: 'Mar 12' },
  ];

  return (
    <div className="w-full bg-[#0c0c0f] rounded-lg overflow-hidden text-white select-none" style={{ fontSize: 11 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#7b39fc] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">E</span>
          </div>
          <span className="font-semibold text-white/90 text-xs">Emiday Demo Company</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#7b39fc]/15 text-[#a78bfa] font-medium">Growth Plan</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Search size={12} className="text-white/30" />
            <span className="text-white/25 text-[10px]">Search transactions...</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center relative">
            <Bell size={13} className="text-white/40" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7b39fc]" />
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7b39fc] to-[#a78bfa]" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-[180px] border-r border-white/[0.06] py-4 px-3 flex-shrink-0 hidden sm:block">
          {[
            { label: 'Dashboard', active: true },
            { label: 'Transactions' },
            { label: 'Compliance' },
            { label: 'Reports' },
            { label: 'AI Chat' },
            { label: 'Settings' },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-3 py-2 rounded-lg mb-0.5 text-[11px] font-medium ${
                item.active ? 'bg-[#7b39fc]/10 text-[#a78bfa]' : 'text-white/35'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Dashboard</h2>
              <p className="text-[10px] text-white/30 mt-0.5">March 2026 Overview</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-[#7b39fc] text-white text-[10px] font-semibold flex items-center gap-1">
              <Plus size={11} /> Add Transaction
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            {[
              { label: 'Revenue', value: '₦14.15M', change: '+18.4%', up: true, icon: <TrendingUp size={13} /> },
              { label: 'Expenses', value: '₦5.32M', change: '+7.2%', up: false, icon: <TrendingDown size={13} /> },
              { label: 'Net Profit', value: '₦8.83M', change: '+24.1%', up: true, icon: <DollarSign size={13} /> },
              { label: 'Tax Liability', value: '₦1.06M', change: 'Due Apr 21', up: null, icon: <PieChart size={13} /> },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-white/40 font-medium">{kpi.label}</span>
                  <span className="text-white/20">{kpi.icon}</span>
                </div>
                <p className="text-base font-bold text-white">{kpi.value}</p>
                <span className={`text-[9px] font-medium ${
                  kpi.up === true ? 'text-emerald-400' : kpi.up === false ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>

          {/* Chart + Transactions */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold text-white/70">Cash Flow</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#7b39fc]" />
                    <span className="text-[9px] text-white/30">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-400/60" />
                    <span className="text-[9px] text-white/30">Expenses</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-[120px]">
                {barData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-[100px]">
                      <div className="flex-1 rounded-t-sm" style={{ height: `${d.income}%`, background: 'linear-gradient(to top, #7b39fc, #a78bfa)' }} />
                      <div className="flex-1 rounded-t-sm bg-rose-400/40" style={{ height: `${d.expense}%` }} />
                    </div>
                    <span className="text-[8px] text-white/25">{d.m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-white/70">Recent Transactions</span>
                <MoreHorizontal size={14} className="text-white/20" />
              </div>
              <div className="space-y-2.5">
                {recentTx.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] ${
                        tx.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                      }`}>
                        {tx.type === 'income' ? '↑' : '↓'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/70 truncate">{tx.desc}</p>
                        <p className="text-[8px] text-white/20">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold flex-shrink-0 ml-2 ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: <Bot size={20} />,
    title: 'Ask your books anything',
    body: "\"What\'s my VAT liability?\" \"Am I profitable this quarter?\" Get instant answers in plain English — no spreadsheet digging required.",
    tag: 'Powered by AI',
  },
  {
    icon: <FileText size={20} />,
    title: 'Never miss a tax deadline',
    body: 'VAT, WHT, PAYE — calculated automatically from your transactions. Get alerts before every FIRS deadline so you\'re never caught off guard.',
    tag: 'FIRS · GRA · SARS',
  },
  {
    icon: <Upload size={20} />,
    title: '60 seconds from statement to books',
    body: 'Upload any bank statement PDF. AI reads every line, categorises each transaction, detects the currency, and flags duplicates — no manual data entry.',
    tag: 'Any bank · Any currency',
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'Manage your books from WhatsApp',
    body: 'Send a bank statement, log an expense, or ask \"what\'s my cash position?\" — all from a WhatsApp message. No app download needed.',
    tag: 'WhatsApp Bot',
  },
  {
    icon: <Link2 size={20} />,
    title: 'Your payments, auto-imported',
    body: 'Connect Paystack or Flutterwave. Every transaction is pulled in, categorised, and VAT-flagged automatically — updated daily.',
    tag: 'Paystack · Flutterwave',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Board-ready reports in seconds',
    body: 'P&L, Cash Flow, and VAT returns — generated instantly. Download as PDF or share a link directly with your accountant.',
    tag: 'PDF · CSV · Share',
  },
];

const TRUST_BADGES = [
  { label: 'UPTIME', value: '99.99%', icon: <Zap size={16} /> },
  { label: 'ENCRYPTION', value: 'AES-256', icon: <Shield size={16} /> },
  { label: 'COMPLIANCE', value: 'NDPC', icon: <Check size={16} /> },
  { label: 'RESPONSE', value: '<200ms', icon: <Clock size={16} /> },
];

const STEPS = [
  { num: '01', title: 'Upload or Connect', desc: 'Sign up in under 5 minutes. Upload a bank statement PDF or connect Paystack and Flutterwave.' },
  { num: '02', title: 'AI Does the Work', desc: 'Every transaction is categorised, VAT is flagged, and your tax liabilities are calculated automatically.' },
  { num: '03', title: 'You Stay in Control', desc: 'Review your books, download reports, and get alerts before every deadline. Ask your AI accountant anything.' },
];

const SME_PLANS = [
  { name: 'Starter', price: 55000, annual: 55000 * 10, desc: 'For sole traders and micro businesses', popular: false, features: ['Income & expense tracking (unlimited)', 'AI-assisted categorisation', 'Bank statement PDF upload (3/month)', 'VAT calculator + basic FIRS compliance', 'P&L report (PDF)', 'AI Chat — 50 queries/month', 'Email support'] },
  { name: 'Growth', price: 80000, annual: 80000 * 10, desc: 'For SMEs with ₦50m–₦300m revenue', popular: true, features: ['Everything in Starter, plus:', 'Unlimited bank statement imports', 'Full FIRS compliance (VAT, WHT, PAYE)', 'Paystack & Flutterwave auto-sync', 'All financial reports', 'Tax calendar with email alerts', 'AI Chat — unlimited queries', 'Priority email + chat support'] },
  { name: 'Business', price: 150000, annual: 150000 * 10, desc: 'For scaling businesses', popular: false, features: ['Everything in Growth, plus:', 'Multi-user access (up to 5)', 'Full audit trail', 'Employee PAYE (up to 20)', 'Accountant collaboration', 'Custom categories', 'Dedicated account manager'] },
];

const ACCOUNTANT_PLANS = [
  { name: 'Pro', price: 75000, annual: 75000 * 10, desc: 'For freelance bookkeepers', popular: false, features: ['Up to 5 client workspaces', 'Full compliance per client', 'White-label PDF reports', 'Client portal (read-only)', 'Team access (1 user)', 'AI Chat per workspace'] },
  { name: 'Firm', price: 165000, annual: 165000 * 10, desc: 'For accounting firms', popular: true, features: ['Up to 10 client workspaces', 'Team access (up to 5 users)', 'Bulk report generation', 'Client invitation portal', 'Internal notes per workspace', 'Priority support + onboarding'] },
  { name: 'Enterprise', price: 0, annual: 0, desc: 'For large firms and audit houses', popular: false, features: ['Unlimited workspaces & team', 'Full API access', 'Custom integrations', 'ICAN/ICAG/SAICA compliance add-on', 'Dedicated success manager', 'Custom pricing'] },
];

const LOGOS = ['Flutterwave', 'Paystack', 'GTBank', 'Access Bank', 'Zenith Bank', 'Sterling', 'Kuda'];

/* ═══════════════════════════════════════════════════════════════
   CONTACT SECTION
   ═══════════════════════════════════════════════════════════════ */
function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
      setForm({ name: '', email: '', company: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-14 md:py-24 px-5 md:px-6 bg-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 md:mb-14">
          <p className="section-label mb-2 md:mb-3 text-[10px] md:text-xs">GET IN TOUCH</p>
          <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">
            Let&apos;s talk about your <span className="gradient-text">numbers</span>
          </h2>
          <p className="section-desc mt-3 md:mt-4 max-w-xl mx-auto text-[13px] md:text-base">
            Questions about Emiday? Want to see it handle your actual books? Drop us a message — we respond within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="dark-card p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-1/10 flex items-center justify-center mb-3">
                <Mail size={20} className="text-brand-3" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Email us</p>
              <a href="mailto:hello@emiday.africa" className="text-sm text-[#7b39fc] hover:underline">hello@emiday.africa</a>
            </div>
            <div className="dark-card p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-1/10 flex items-center justify-center mb-3">
                <Clock size={20} className="text-brand-3" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Response time</p>
              <p className="text-sm text-[#71717a]">We respond within 24 hours on business days</p>
            </div>
            <div className="dark-card p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-1/10 flex items-center justify-center mb-3">
                <Building2 size={20} className="text-brand-3" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Enterprise &amp; Firms</p>
              <p className="text-sm text-[#71717a]">Need a custom plan? Reach out for tailored pricing and onboarding.</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 dark-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input
                    required type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                  placeholder="Your company (optional)"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Message</label>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-3 top-3 text-[#52525b]" />
                <textarea
                  required rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#7b39fc]/30 resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full inline-flex items-center justify-center font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 text-[13px] md:text-[15px] py-2.5 md:py-3.5 rounded-xl bg-[#7b39fc]"
            >
              {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Message Sent!' : 'Send Message'}
              {status === 'idle' && <Send size={16} className="ml-2" />}
            </button>
            {status === 'sent' && (
              <p className="text-center text-sm text-green-400">Thanks! We&apos;ll be in touch soon.</p>
            )}
            {status === 'error' && (
              <p className="text-center text-sm text-red-400">Something went wrong. Please email us directly at hello@emiday.africa</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [planTab, setPlanTab] = useState<'sme' | 'accountant'>('sme');
  const [annual, setAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const plans = planTab === 'sme' ? SME_PLANS : ACCOUNTANT_PLANS;

  return (
    <div className="relative bg-black">

      {/* ════════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-black">
        {/* Background Video */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260215_121759_424f8e9c-d8bd-4974-9567-52709dfb6842.mp4"
          autoPlay loop muted playsInline
          className="absolute inset-0 pointer-events-none"
          style={{ width: '120%', height: '120%', left: '50%', transform: 'translateX(-50%)', objectFit: 'cover', objectPosition: 'center bottom', zIndex: 0 }}
        />

        {/* Blurred Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[90vw] md:w-[801px] h-[200px] md:h-[384px] top-[120px] md:top-[215px]" style={{ borderRadius: 9999, background: '#000000', filter: 'blur(77.5px)', zIndex: 1 }} />

        <div className="relative" style={{ zIndex: 2 }}>
          {/* NAVBAR */}
          <nav className="mx-auto flex items-center justify-between px-5 md:px-10 xl:px-[120px] py-4 h-[60px] lg:h-[102px] relative z-[60]" style={{ maxWidth: 1440 }}>
            <div className="flex items-center gap-8 xl:gap-[80px]">
              <Link href="/" aria-label="Home"><LogoSvg /></Link>
              <div className="hidden lg:flex items-center" style={{ gap: 10 }}>
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Contact us', href: '#contact' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center font-medium text-white hover:opacity-80 transition-opacity" style={{ fontSize: 14, lineHeight: '22px', paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4, gap: 3 }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex items-center" style={{ gap: 12 }}>
              <Link href="/login" className="font-semibold transition-opacity hover:opacity-80" style={{ fontSize: 14, lineHeight: '22px', color: '#171717', background: '#ffffff', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: '1px solid #d4d4d4' }}>Sign In</Link>
              <Link href="/signup" className="font-semibold transition-opacity hover:opacity-90" style={{ fontSize: 14, lineHeight: '22px', color: '#fafafa', background: '#7b39fc', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, boxShadow: '0px 4px 16px rgba(23,23,23,0.04)' }}>Get Started</Link>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-white p-2 -mr-2" aria-label="Menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>

          {/* MOBILE MENU */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed top-[60px] left-0 right-0 bottom-0 bg-black/[0.97] backdrop-blur-xl z-50">
              <div className="flex flex-col px-6 py-6 gap-1">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Contact us', href: '#contact' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="font-medium text-white/80 hover:text-white py-3 text-[15px] border-b border-white/[0.04] last:border-0 transition-colors">
                    {item.label}
                  </Link>
                ))}
                <div className="flex gap-3 mt-4 pt-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center font-semibold text-sm text-white py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.04]">Sign In</Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center font-semibold text-sm text-white py-2.5 rounded-xl bg-[#7b39fc]">Get Started</Link>
                </div>
              </div>
            </div>
          )}

          {/* HERO CONTENT */}
          <div className="mx-auto flex flex-col items-center text-center px-6 md:px-6 mt-12 md:mt-24 lg:mt-[162px] gap-4 md:gap-6" style={{ maxWidth: 871 }}>
            <div className="flex flex-col items-center gap-0.5 md:gap-2.5">
              <h1 className="font-medium text-white text-[38px] md:text-[clamp(48px,5.5vw,76px)] tracking-[-1px] md:tracking-[-2px] leading-[1.05]">Meet Your</h1>
              <h1 className="font-instrument-serif italic text-white text-[38px] md:text-[clamp(48px,5.5vw,76px)] tracking-[-1px] md:tracking-[-2px] leading-[1.05]">AI Accountant</h1>
            </div>
            <p className="text-[14px] md:text-[18px] leading-[22px] md:leading-[26px] text-[#f6f7f9]/80 max-w-[320px] md:max-w-[613px]">
              Emiday handles your bookkeeping, tax compliance and FIRS filings, so you can run your business.
            </p>
            <div className="flex flex-row items-center gap-2.5 w-full max-w-[320px] md:max-w-none md:w-auto">
              <Link href="/signup" className="font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 flex-1 md:flex-none text-center text-[13px] md:text-[15px] py-2.5 md:py-3.5 px-5 md:px-7 rounded-full bg-[#7b39fc]">Start for Free</Link>
              <Link href="#features" className="font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 flex-1 md:flex-none text-center text-[13px] md:text-[15px] text-[#f6f7f9] py-2.5 md:py-3.5 px-5 md:px-7 rounded-full bg-white/[0.08] border border-white/[0.12]">How It Works</Link>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="mx-auto px-4 md:px-6 mt-8 md:mt-16 lg:mt-20" style={{ maxWidth: 1163 }}>
            <div className="mx-auto rounded-xl md:rounded-3xl overflow-hidden" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(6px, 2vw, 22.5px)' }}>
              <DashboardScreenshot />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          LOGO MARQUEE
          ════════════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12 border-t border-b border-white/[0.04] bg-black overflow-hidden">
        <p className="text-center text-[11px] text-[#52525b] uppercase tracking-[0.2em] font-semibold mb-8">
          Works with the tools you already use
        </p>
        <div className="relative">
          <div className="flex animate-slide-left" style={{ width: 'max-content' }}>
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span key={i} className="text-base font-semibold text-white/[0.15] whitespace-nowrap mx-10">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TRUST BADGES (like cranston security indicators)
          ════════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 px-5 md:px-6 bg-black">
        <div className="max-w-[900px] mx-auto grid grid-cols-4 gap-2 md:gap-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center p-3 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/[0.04] flex items-center justify-center text-[#71717a] mb-2 md:mb-3">
                {badge.icon}
              </div>
              <span className="text-[8px] md:text-[10px] font-semibold uppercase tracking-wider text-[#52525b]">{badge.label}</span>
              <span className="text-sm md:text-lg font-bold text-white mt-0.5 md:mt-1">{badge.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES
          ════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-14 md:py-24 px-5 md:px-6 bg-[#030303]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="section-label mb-2 md:mb-3 text-[10px] md:text-xs">WHAT EMIDAY DOES</p>
            <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">
              Your finance team,<br className="hidden md:block" /> without the headcount
            </h2>
            <p className="section-desc mt-3 md:mt-4 max-w-lg mx-auto text-[13px] md:text-base">
              Bookkeeping, tax compliance, and financial reporting — handled by AI, reviewed by you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {FEATURES.map((feature, i) => (
              <div key={i} className="dark-card p-5 md:p-6 group">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#7b39fc]/10 flex items-center justify-center mb-3 md:mb-5 group-hover:bg-[#7b39fc]/20 transition-colors">
                  <span className="text-[#a78bfa]">{feature.icon}</span>
                </div>
                <h3 className="font-semibold text-white text-[15px] md:text-[17px] mb-1.5 md:mb-2">{feature.title}</h3>
                <p className="text-[13px] md:text-sm leading-relaxed text-[#71717a]">{feature.body}</p>
                <span className="inline-block mt-3 md:mt-5 text-[10px] md:text-[11px] font-semibold px-2.5 md:px-3 py-1 rounded-full bg-[#7b39fc]/8 text-[#a78bfa]/80 border border-[#7b39fc]/10">
                  {feature.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          COMPLIANCE
          ════════════════════════════════════════════════════════════ */}
      <section id="compliance" className="py-14 md:py-24 px-5 md:px-6 bg-black">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="section-label mb-2 md:mb-3 text-[10px] md:text-xs">COMPLIANCE</p>
            <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">
              We speak FIRS, GRA, and SARS
            </h2>
            <p className="section-desc mt-3 md:mt-4 max-w-lg mx-auto text-[13px] md:text-base">
              Tax rules change by jurisdiction. Emiday stays current so you don&apos;t have to.
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
            {[
              { flag: '🇳🇬', name: 'Nigeria', authority: 'FIRS', status: 'Available', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', items: ['VAT at 7.5% — auto-calculated', 'WHT — 10% on services, rent', 'PAYE — graduated bands per employee', 'Stamp Duty flagging', 'CAC annual return reminders', 'Tax calendar with FIRS deadlines'] },
              { flag: '🇬🇭', name: 'Ghana', authority: 'GRA', status: 'Coming Soon', statusColor: 'text-[#a78bfa] bg-[#7b39fc]/10 border-[#7b39fc]/20', items: ['VAT at 15% + NHIL + GETFund', 'Corporate Income Tax (25%)', 'PAYE under Ghana bands', 'WHT on dividends, rent, services', 'GRA e-Tax exports'] },
              { flag: '🇿🇦', name: 'South Africa', authority: 'SARS', status: 'Coming Soon', statusColor: 'text-[#a78bfa] bg-[#7b39fc]/10 border-[#7b39fc]/20', items: ['VAT at 15% — SARS-compliant', 'Provisional Tax (IRP6)', 'PAYE, UIF (1%), SDL (1%)', 'Company Tax at 27%', 'eFiling-compatible formats'] },
            ].map((country) => (
              <div key={country.name} className="dark-card p-5 md:p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="font-semibold text-white text-base">{country.name} — {country.authority}</h3>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${country.statusColor}`}>{country.status}</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {country.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#a1a1aa]">
                      <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-24 px-5 md:px-6 bg-[#030303]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="section-label mb-2 md:mb-3 text-[10px] md:text-xs">HOW IT WORKS</p>
            <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">From sign-up to compliant in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {STEPS.map((step, i) => (
              <div key={step.num} className="dark-card p-5 md:p-6 relative flex md:flex-col items-start gap-4 md:gap-0">
                <span className="text-3xl md:text-5xl font-bold bg-gradient-to-b from-[#7b39fc] to-[#7b39fc]/20 bg-clip-text text-transparent flex-shrink-0">{step.num}</span>
                <div>
                  <h3 className="font-semibold text-white text-[15px] md:mt-4 mb-1 md:mb-2">{step.title}</h3>
                  <p className="text-[13px] md:text-sm text-[#71717a] leading-relaxed">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 text-[#3f3f46]">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PRICING
          ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-14 md:py-24 px-5 md:px-6 bg-black">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <p className="section-label mb-2 md:mb-3 text-[10px] md:text-xs">PRICING</p>
            <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">Simple pricing. Start free.</h2>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-5 md:mb-6">
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button onClick={() => setPlanTab('sme')} className={`px-4 md:px-5 py-2 rounded-lg text-[13px] md:text-sm font-medium transition-all ${planTab === 'sme' ? 'bg-[#7b39fc] text-white' : 'text-[#71717a] hover:text-white'}`}>SME Plans</button>
              <button onClick={() => setPlanTab('accountant')} className={`px-4 md:px-5 py-2 rounded-lg text-[13px] md:text-sm font-medium transition-all ${planTab === 'accountant' ? 'bg-[#7b39fc] text-white' : 'text-[#71717a] hover:text-white'}`}>Accountant Plans</button>
            </div>
          </div>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-2.5 md:gap-3 mb-8 md:mb-10">
            <span className={`text-[13px] md:text-sm ${!annual ? 'font-medium text-white' : 'text-[#71717a]'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-11 h-[22px] md:w-12 md:h-6 rounded-full transition-all ${annual ? 'bg-[#7b39fc]' : 'bg-[#27272a]'}`}>
              <div className={`w-[18px] h-[18px] md:w-5 md:h-5 bg-white rounded-full absolute top-0.5 transition-all ${annual ? 'left-[22px] md:left-[26px]' : 'left-0.5'}`} />
            </button>
            <span className={`text-[13px] md:text-sm ${annual ? 'font-medium text-white' : 'text-[#71717a]'}`}>Annual</span>
            <span className="text-[9px] md:text-[10px] font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Save 2 months</span>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl bg-white/[0.02] border p-5 md:p-7 relative transition-all duration-300 hover:-translate-y-1 ${plan.popular ? 'border-[#7b39fc]' : 'border-white/[0.06]'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-bold px-3 md:px-4 py-1 rounded-full bg-[#7b39fc] text-white">MOST POPULAR</span>
                )}
                <h3 className="font-semibold text-lg md:text-xl text-white">{plan.name}</h3>
                <p className="text-[11px] md:text-xs text-[#71717a] mt-1">{plan.desc}</p>
                <div className="mt-4 md:mt-5 mb-4 md:mb-6">
                  {plan.price > 0 ? (
                    <>
                      <span className="font-bold text-2xl md:text-3xl text-white">₦{(annual ? plan.annual / 12 : plan.price).toLocaleString()}</span>
                      <span className="text-[13px] md:text-sm text-[#52525b]">/month</span>
                      {annual && <p className="text-[11px] md:text-xs text-emerald-400 mt-1">₦{plan.annual.toLocaleString()}/year</p>}
                    </>
                  ) : (
                    <span className="font-bold text-2xl md:text-3xl text-white">Custom</span>
                  )}
                </div>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 md:py-3 rounded-xl text-[13px] md:text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-[#7b39fc] text-white hover:bg-[#6d28d9]'
                      : 'bg-white/[0.04] text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {plan.price > 0 ? 'Start Free Trial' : 'Contact Sales'}
                </Link>
                <ul className="mt-4 md:mt-6 space-y-2.5 md:space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 md:gap-2.5 text-[13px] md:text-sm text-[#a1a1aa]">
                      <Check size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#3f3f46] text-center mt-8 max-w-xl mx-auto">
            All prices in Nigerian Naira (NGN). Annual billing saves 2 months. No setup fees. Cancel anytime. Early-access pricing — locked in for life.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          CONTACT
          ════════════════════════════════════════════════════════════ */}
      <ContactSection />

      {/* ════════════════════════════════════════════════════════════
          CTA
          ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-28 px-5 md:px-6 text-center bg-[#030303] relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[150px] md:h-[250px] rounded-full opacity-[0.08]" style={{ background: '#7b39fc', filter: 'blur(100px)' }} />
        <div className="max-w-2xl mx-auto relative">
          <h2 className="section-heading text-[26px] md:text-[36px] leading-[1.15]">
            Your next tax deadline{' '}
            <span className="gradient-text">won&apos;t wait</span>
          </h2>
          <p className="text-[#71717a] mt-3 md:mt-5 mb-6 md:mb-8 text-[13px] md:text-base max-w-sm md:max-w-none mx-auto">
            Built for African businesses who refuse to leave compliance to chance. Set up in minutes, not weeks.
          </p>
          <div className="flex flex-row items-center justify-center gap-2.5 max-w-[320px] md:max-w-none mx-auto">
            <Link href="/signup" className="inline-flex items-center justify-center font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 flex-1 md:flex-none text-[13px] md:text-[15px] py-2.5 md:py-3.5 px-5 md:px-7 rounded-full bg-[#7b39fc]">
              Get Started <ArrowRight size={14} className="ml-1.5" />
            </Link>
            <Link href="#pricing" className="inline-flex items-center justify-center font-semibold transition-all hover:opacity-90 flex-1 md:flex-none text-[13px] md:text-[15px] text-[#a1a1aa] py-2.5 md:py-3.5 px-5 md:px-7 rounded-full border border-white/[0.08]">
              View Pricing
            </Link>
          </div>
          <p className="text-[11px] md:text-xs text-[#3f3f46] mt-4 md:mt-5">Free to start · No credit card required</p>
        </div>
      </section>
    </div>
  );
}

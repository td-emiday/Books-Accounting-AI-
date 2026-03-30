'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#compliance', label: 'Compliance' },
  { href: '#pricing', label: 'Pricing' },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-navbar px-6 py-3 flex items-center gap-6 w-fit">
        {/* Logo */}
        <Link href="/" className="font-instrument-serif italic text-xl gradient-text whitespace-nowrap">
          Emiday Books
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[13.5px] font-medium text-text-secondary hover:text-brand-1 transition-colors rounded-lg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 ml-4">
          <Link href="/login" className="text-[13.5px] font-medium text-text-secondary hover:text-brand-1 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary px-5 py-2 text-[13px] font-semibold">
            Get Started <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 rounded-lg hover:bg-brand-1/5 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="glass-navbar absolute top-full mt-2 left-4 right-4 p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-brand-1 hover:bg-brand-1/5 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[rgba(108,63,232,0.1)] my-1" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-medium text-text-secondary">
              Sign In
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-primary px-4 py-2.5 text-sm text-center">
              Get Started <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

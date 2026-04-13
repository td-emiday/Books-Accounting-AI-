'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingNavbar } from '@/components/marketing/navbar';

export default function AboutPage() {
  return (
    <>
      <MarketingNavbar />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-instrument-serif italic tracking-[-1px] mb-6"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1.1 }}
          >
            About <span className="gradient-text">Emiday AI</span>
          </h1>

          <div className="prose prose-lg max-w-none space-y-6 text-text-secondary">
            <p className="text-lg leading-relaxed">
              Emiday AI is a Lagos-based technology company building AI-native tools for African businesses.
              Our flagship product, Emiday, is an accounting and tax compliance platform purpose-built
              for Nigeria, Ghana, and South Africa.
            </p>

            <p>
              We believe that business owners in Africa should never need accounting knowledge to stay legally
              compliant, understand their finances, or prepare tax returns. Emiday combines an intelligent
              AI assistant, a jurisdiction-specific compliance engine, and optional access to certified human
              accountants to make this a reality.
            </p>

            <h2 className="font-bold text-2xl text-text-primary mt-10">Our Mission</h2>
            <p>
              To democratize financial compliance across Africa, making it as easy as having a conversation
              with an AI assistant that truly understands FIRS, GRA, and SARS regulations.
            </p>

            <h2 className="font-inter font-bold text-2xl text-text-primary mt-10">Why We Exist</h2>
            <p>
              Every year, thousands of Nigerian businesses pay avoidable penalties for late VAT returns,
              incorrect WHT deductions, or missed PAYE remittances. Not because they&apos;re negligent — because
              the compliance burden is overwhelming for small and growing businesses.
            </p>
            <p>
              We&apos;re changing that. With Emiday, a sole trader in Lagos can be as compliant as a
              multinational with a full finance team — all powered by AI.
            </p>

            <div className="mt-10">
              <Link href="/signup" className="btn-primary px-6 py-3 text-sm font-semibold inline-flex">
                Join 1,200+ businesses on Emiday <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

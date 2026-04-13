'use client';

import { useEffect, useState } from 'react';

interface ComplianceScoreProps {
  score: number;
  vatStatus: 'ok' | 'warning' | 'missing';
  whtStatus: 'ok' | 'warning' | 'missing';
  payeStatus: 'ok' | 'warning' | 'missing';
}

export function ComplianceScore({ score, vatStatus, whtStatus, payeStatus }: ComplianceScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const targetOffset = circumference - (score / 100) * circumference;

  const label = score >= 80 ? 'Good Standing' : score >= 50 ? 'Needs Attention' : 'Critical';
  const bgColor = score >= 80 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2';
  const labelColor = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';

  // Gradient IDs and colors based on score
  const gradientId = 'compliance-gradient';
  const gradientColors =
    score >= 80
      ? { start: '#059669', end: '#14B8A6' }
      : score >= 50
      ? { start: '#D97706', end: '#F59E0B' }
      : { start: '#DC2626', end: '#FB7185' };

  // Animate on mount
  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedOffset(targetOffset), 100);
    return () => clearTimeout(timeout);
  }, [targetOffset]);

  const statusLabel = (s: string) => (s === 'ok' ? 'Filed' : s === 'warning' ? 'Due Soon' : 'Missing');
  const dotColor = (s: string) =>
    s === 'ok' ? 'bg-[#059669]' : s === 'warning' ? 'bg-[#D97706]' : 'bg-[#DC2626]';
  const textColor = (s: string) =>
    s === 'ok' ? 'text-[#059669]' : s === 'warning' ? 'text-[#D97706]' : 'text-[#DC2626]';

  return (
    <div className="flex flex-col items-center">
      {/* Ring */}
      <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-[#111827]">{score}</span>
        </div>
      </div>

      {/* Label badge */}
      <div
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-3"
        style={{ background: bgColor, color: labelColor }}
      >
        {label} &middot; {score}/100
      </div>

      {/* Status items */}
      <div className="w-full mt-4 space-y-2">
        {[
          { label: 'VAT Returns', status: vatStatus },
          { label: 'WHT Remittance', status: whtStatus },
          { label: 'PAYE Filing', status: payeStatus },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-[#F8FAFC] transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(item.status)}`} />
            <span className="text-sm text-[#374151] font-medium flex-1">{item.label}</span>
            <span className={`text-xs font-semibold ${textColor(item.status)}`}>
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

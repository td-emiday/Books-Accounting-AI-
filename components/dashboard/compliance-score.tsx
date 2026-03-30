'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ComplianceScoreProps {
  score: number;
  vatStatus: 'ok' | 'warning' | 'missing';
  whtStatus: 'ok' | 'warning' | 'missing';
  payeStatus: 'ok' | 'warning' | 'missing';
}

export function ComplianceScore({ score, vatStatus, whtStatus, payeStatus }: ComplianceScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const label = score >= 80 ? 'Good Standing' : score >= 50 ? 'Needs Attention' : 'Critical';
  const color = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';
  const bgColor = score >= 80 ? '#ECFDF5' : score >= 50 ? '#FFFBEB' : '#FEF2F2';

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 size={16} className="text-[#059669]" />;
    if (status === 'warning') return <AlertTriangle size={16} className="text-[#D97706]" />;
    return <XCircle size={16} className="text-[#DC2626]" />;
  };

  const statusLabel = (s: string) => s === 'ok' ? 'Filed' : s === 'warning' ? 'Due Soon' : 'Missing';

  return (
    <div>
      <h3 className="font-bold text-sm md:text-base text-[#111827] mb-3 md:mb-4">Compliance Health</h3>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#111827]">{score}</span>
            <span className="text-xs text-[#6B7280]">/100</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-2" style={{ background: bgColor, color }}>
            {label}
          </div>
          <div className="space-y-2">
            {[
              { label: 'VAT Returns', status: vatStatus },
              { label: 'WHT Remittance', status: whtStatus },
              { label: 'PAYE Filing', status: payeStatus },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <StatusIcon status={item.status} />
                <span className="text-sm text-[#374151] font-medium">{item.label}</span>
                <span className={`text-xs ml-auto ${
                  item.status === 'ok' ? 'text-[#059669]' : item.status === 'warning' ? 'text-[#D97706]' : 'text-[#DC2626]'
                }`}>{statusLabel(item.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'Emiday — Your AI Accountant, Built for Africa',
  description:
    'AI-native accounting and tax compliance platform for businesses in Nigeria, Ghana, and South Africa. Automate bookkeeping, VAT, WHT, and PAYE.',
  keywords: [
    'accounting software Nigeria',
    'tax compliance Africa',
    'FIRS',
    'VAT calculator',
    'AI accountant',
    'bookkeeping Nigeria',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-inter text-white bg-black antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

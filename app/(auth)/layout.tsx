export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background glow blobs */}
      <div
        className="absolute top-[-200px] left-[-200px] w-[780px] h-[780px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'rgba(123, 57, 252, 0.12)', filter: 'blur(100px)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'rgba(123, 57, 252, 0.08)', filter: 'blur(80px)', animationDelay: '2s' }}
      />
      <div className="relative z-10 w-full max-w-[440px] mx-auto px-4">
        {children}
      </div>
    </div>
  );
}

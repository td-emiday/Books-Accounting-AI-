import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6 px-4">
        <div className="text-8xl font-instrument-serif italic gradient-text">404</div>
        <h1 className="text-2xl font-bold text-text-primary">Page Not Found</h1>
        <p className="text-text-secondary max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary px-6 py-3 text-sm">
            Go to Dashboard
          </Link>
          <Link href="/" className="btn-secondary px-6 py-3 text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

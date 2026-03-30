export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-brand-1/10 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card">
            <div className="h-4 w-20 bg-brand-1/10 rounded mb-3" />
            <div className="h-8 w-32 bg-brand-1/10 rounded mb-2" />
            <div className="h-3 w-16 bg-brand-1/10 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="h-4 w-32 bg-brand-1/10 rounded mb-4" />
          <div className="h-48 bg-brand-1/10 rounded-xl" />
        </div>
        <div className="glass-card p-6">
          <div className="h-4 w-32 bg-brand-1/10 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-brand-1/10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

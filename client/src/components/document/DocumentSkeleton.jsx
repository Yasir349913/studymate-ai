export default function DocumentSkeleton() {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div>
            <div className="h-4 w-36 bg-white/10 rounded mb-2" />
            <div className="h-3 w-24 bg-white/10 rounded" />
          </div>
        </div>
        <div className="w-16 h-5 bg-white/10 rounded-full" />
      </div>
      <div className="h-3 w-full bg-white/10 rounded mb-2" />
      <div className="h-3 w-3/4 bg-white/10 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 bg-white/10 rounded-lg" />
        <div className="h-8 flex-1 bg-white/10 rounded-lg" />
        <div className="h-8 w-8 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

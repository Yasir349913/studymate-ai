export default function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 animate-pulse" />
          <div
            className={`space-y-2 max-w-sm ${i % 2 === 0 ? "items-end" : ""}`}
          >
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

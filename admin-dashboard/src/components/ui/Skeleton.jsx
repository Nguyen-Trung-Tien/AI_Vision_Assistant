export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className}`}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 pt-2">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-end gap-2 px-2 pb-8">
      {[...Array(12)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="w-full rounded-t-lg" 
          style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

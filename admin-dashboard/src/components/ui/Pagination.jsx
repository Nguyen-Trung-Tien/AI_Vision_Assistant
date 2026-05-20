import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn("flex items-center justify-center gap-6 mt-10", className)}
    >
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex items-center gap-2 min-h-[44px] px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl border border-border-primary bg-text-primary/2 text-text-secondary hover:text-text-primary hover:border-indigo-500/40 hover:bg-text-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        Trước
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-text-primary">{page}</span>
        <span className="text-sm font-bold text-text-secondary opacity-30">
          /
        </span>
        <span className="text-sm font-bold text-text-secondary/60">
          {totalPages}
        </span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="flex items-center gap-2 min-h-[44px] px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl border border-border-primary bg-text-primary/2 text-text-secondary hover:text-text-primary hover:border-indigo-500/40 hover:bg-text-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        Sau
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

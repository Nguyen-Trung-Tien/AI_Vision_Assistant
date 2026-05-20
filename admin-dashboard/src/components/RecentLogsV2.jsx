import { useState } from "react";
import { useLogs } from "@/hooks/use-queries";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scan,
  Type,
  AlertTriangle,
  Target,
  Clock,
} from "lucide-react";

const typeBadgeColors = {
  OCR: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  CAPTION: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  DANGER: "bg-red-500/10 text-red-500 border-red-500/20",
};

const typeIcons = {
  OCR: Type,
  CAPTION: Scan,
  DANGER: AlertTriangle,
};

export default function RecentLogsV2() {
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useLogs(page, 10);

  const logs = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="bg-bg-card rounded-3xl p-4 sm:p-6 border border-border-primary shadow-2xl hover:border-accent-purple/30 transition-all duration-500 mt-6 group">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover:rotate-12 transition-transform">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">
            Lịch sử nhận diện
          </h3>
          <p className="text-[11px] text-text-secondary mt-1 font-bold opacity-60">
            Dữ liệu gần đây nhất từ thiết bị người dùng
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 text-accent-purple animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-text-secondary animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="block md:hidden space-y-4">
            {logs.length === 0 ? (
              <p className="py-12 text-center text-text-secondary/30 italic text-sm">
                Chưa có dữ liệu hoạt động
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border-primary bg-white/2 p-5 space-y-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary/50 font-mono text-[10px] font-bold">
                      #{log.id}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeBadgeColors[log.action_type] || "bg-white/5 text-text-secondary border-white/10"}`}
                    >
                      {(() => {
                        const Icon = typeIcons[log.action_type] || Search;
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {log.action_type}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary font-bold leading-relaxed break-words">
                    {log.result_text || "—"}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-secondary/40">
                    <span className="flex items-center gap-1.5 text-accent-cyan">
                      <Target className="w-3 h-3" />
                      {log.confidence_score != null
                        ? `${(log.confidence_score * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {log.created_at
                        ? new Date(log.created_at).toLocaleTimeString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary text-text-secondary/40">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                    Loại hình
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                    Kết quả nhận diện
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                    Độ tin cậy
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-4 py-3.5 text-xs text-text-secondary/60 font-mono font-bold">
                      #{log.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`flex items-center w-fit gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeBadgeColors[log.action_type] || "bg-white/5 text-text-secondary border-white/10"}`}
                      >
                        {(() => {
                          const Icon = typeIcons[log.action_type] || Search;
                          return <Icon className="w-3 h-3" />;
                        })()}
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-primary font-bold max-w-xs truncate">
                      {log.result_text || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {log.confidence_score != null ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-accent-cyan shadow-[0_0_8px_rgba(0,212,255,0.5)]"
                              style={{
                                width: `${log.confidence_score * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-accent-cyan tabular-nums">
                            {(log.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-5 text-[11px] text-text-secondary/50 text-right font-bold group-hover:text-text-secondary transition-colors">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-20 text-center text-text-secondary/30 italic text-sm"
                    >
                      Chưa có dữ liệu hoạt động
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-2 min-h-[40px] px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-xl border border-border-primary bg-text-primary/2 text-text-secondary hover:text-text-primary hover:border-accent-purple/40 hover:bg-text-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">
                {page}
              </span>
              <span className="text-sm font-bold text-text-secondary opacity-30">
                /
              </span>
              <span className="text-sm font-bold text-text-secondary/60">
                {totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-2 min-h-[40px] px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-xl border border-border-primary bg-text-primary/2 text-text-secondary hover:text-text-primary hover:border-accent-purple/40 hover:bg-text-primary/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLogs } from "@/hooks/use-queries";

const typeBadgeColors = {
  OCR: "bg-accent-cyan/10 text-cyan-600 dark:text-accent-cyan border border-cyan-500/20",
  CAPTION: "bg-accent-purple/10 text-purple-600 dark:text-accent-purple border border-purple-500/20",
  DANGER: "bg-accent-red/10 text-red-600 dark:text-accent-red border border-red-500/20",
};

export default function RecentLogsV2() {
  const [page, setPage] = useState(1);
  const { data: result, isLoading } = useLogs(page, 10);

  const logs = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-border-primary shadow-lg hover:border-accent-purple/30 transition-all duration-300 mt-6">
      <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-6">Lịch sử nhận diện gần đây</h3>

      {isLoading ? (
        <div className="py-8">
          <div className="flex items-center justify-center mb-6 text-text-secondary text-sm">
            <div className="loader-ring mr-3" />
            Đang tải danh sách
          </div>
          <div className="space-y-3">
            <div className="h-12 rounded-xl bg-text-primary/5 animate-pulse" />
            <div className="h-12 rounded-xl bg-text-primary/5 animate-pulse" />
            <div className="h-12 rounded-xl bg-text-primary/5 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="block md:hidden space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-text-secondary/40 text-sm italic">Chưa có dữ liệu</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-border-primary bg-text-primary/3 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary/50 font-mono text-[10px] font-bold">#{log.id}</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadgeColors[log.action_type] || "bg-text-primary/10 text-text-secondary"}`}
                    >
                      {log.action_type}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary font-medium leading-relaxed break-words">{log.result_text || "--"}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-secondary/40">
                    <span className="flex items-center gap-1">
                      🎯 {log.confidence_score != null
                        ? `${(log.confidence_score * 100).toFixed(1)}%`
                        : "--"}
                    </span>
                    <span>
                      📅 {log.created_at
                        ? new Date(log.created_at).toLocaleString("vi-VN")
                        : "--"}
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
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">ID</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Loại</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Kết quả</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Độ tin cậy</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-text-primary/5 transition-colors group">
                    <td className="px-4 py-4 text-xs text-text-secondary/60 font-mono font-bold">#{log.id}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadgeColors[log.action_type] || "bg-text-primary/10 text-text-secondary"}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-primary font-medium max-w-xs truncate">{log.result_text || "--"}</td>
                    <td className="px-4 py-4 text-sm text-text-secondary font-semibold">
                      {log.confidence_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 bg-text-primary/10 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className="h-full bg-accent-cyan" 
                              style={{ width: `${log.confidence_score * 100}%` }}
                            />
                          </div>
                          <span>{(log.confidence_score * 100).toFixed(1)}%</span>
                        </div>
                      ) : "--"}
                    </td>
                    <td className="px-4 py-4 text-xs text-text-secondary/50 text-right font-medium">
                      {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "--"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-text-secondary/30 italic italic text-sm">
                      Chưa có dữ liệu hoạt động
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-[40px] px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border-primary bg-bg-card text-text-secondary hover:text-text-primary hover:border-accent-purple/40 hover:bg-bg-card-hover disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              ← Trước
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-text-primary">{page}</span>
              <span className="text-xs font-medium text-text-secondary/40">/</span>
              <span className="text-xs font-medium text-text-secondary/60">{totalPages}</span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-[40px] px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border-primary bg-bg-card text-text-secondary hover:text-text-primary hover:border-accent-purple/40 hover:bg-bg-card-hover disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              Sau →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { fetchLogs } from "../services/api";

const typeBadgeColors = {
  OCR: "bg-accent-cyan/15 text-accent-cyan",
  CAPTION: "bg-accent-purple/15 text-accent-purple",
  DANGER: "bg-accent-red/15 text-accent-red",
};

export default function RecentLogsV2() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLogs(page, 10).then((res) => {
      setLogs(res.data || []);
      setTotalPages(res.totalPages || 1);
      setLoading(false);
    });
  }, [page]);

  return (
    <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-accent-purple/10 shadow-lg hover:border-accent-purple/30 transition-all duration-300 mt-6">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Lịch sử nhận diện gần đây</h3>

      {loading ? (
        <div className="py-8">
          <div className="flex items-center justify-center mb-4 text-white/40">
            <div className="loader-ring mr-3" />
            Đang tải danh sách
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-lg loading-shimmer" />
            <div className="h-10 rounded-lg loading-shimmer" />
            <div className="h-10 rounded-lg loading-shimmer" />
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: card list — Desktop: table */}
          <div className="block md:hidden space-y-3">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-white/30 text-sm">Chưa có dữ liệu</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-mono text-xs">#{log.id}</span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeColors[log.action_type] || "bg-white/10 text-white/60"}`}
                    >
                      {log.action_type}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 wrap-break-word">{log.result_text || "--"}</p>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>
                      {log.confidence_score != null
                        ? `${(log.confidence_score * 100).toFixed(1)}%`
                        : "--"}
                    </span>
                    <span>
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("vi-VN")
                        : "--"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Loại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Kết quả</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Độ tin cậy</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/3 hover:bg-accent-purple/5 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-white/50 font-mono">#{log.id}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${typeBadgeColors[log.action_type] || "bg-white/10 text-white/60"}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/60 max-w-xs truncate">{log.result_text || "--"}</td>
                    <td className="px-4 py-3.5 text-sm text-white/60">
                      {log.confidence_score != null ? `${(log.confidence_score * 100).toFixed(1)}%` : "--"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/40">
                      {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "--"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-white/30">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-xl border border-accent-purple/15 bg-bg-card text-white hover:border-accent-purple/40 hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
            >
              Trước
            </button>
            <span className="text-sm text-white/50">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-xl border border-accent-purple/15 bg-bg-card text-white hover:border-accent-purple/40 hover:bg-bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}

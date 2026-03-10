import { useEffect, useState } from "react";
import {
  fetchFeedback,
  fetchFeedbackStats,
  reviewFeedback,
  exportFeedbackDataset,
} from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

function AccBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-16">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-white/60 text-xs w-10 text-right">{value}%</span>
    </div>
  );
}

export default function FeedbackPage() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
  });
  const [onlyWrong, setOnlyWrong] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [label, setLabel] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async (p = 1, wrong = onlyWrong) => {
    setLoading(true);
    const [res, s] = await Promise.all([
      fetchFeedback(p, 15, wrong),
      fetchFeedbackStats(),
    ]);
    setData(res.data ?? []);
    setTotal(res.total ?? 0);
    setStats(s);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleFilter = () => {
    const next = !onlyWrong;
    setOnlyWrong(next);
    load(1, next);
  };

  const doReview = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await reviewFeedback(confirm.id, confirm.label);
      toast.success("Đã lưu nhãn đúng thành công");
      setReviewing(null);
      setLabel("");
      setConfirm(null);
      load(page);
    } catch {
      toast.error("Lưu nhãn thất bại, vui lòng thử lại");
    }
    setActionLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportFeedbackDataset();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedback-yolo-dataset.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export dataset thành công");
    } catch {
      toast.error("Export dataset thất bại");
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title="Lưu nhãn đúng?"
        message={
          <>
            Gán nhãn{" "}
            <span className="text-white font-semibold">"{confirm?.label}"</span>{" "}
            cho kết quả AI sai này?
          </>
        }
        confirmLabel="Lưu nhãn"
        confirmClass="bg-purple-600 hover:bg-purple-500"
        loading={actionLoading}
        onConfirm={doReview}
        onCancel={() => setConfirm(null)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng phản hồi", value: stats.total, color: "text-white" },
          { label: "Đúng", value: stats.correct, color: "text-green-400" },
          { label: "Sai", value: stats.wrong, color: "text-red-400" },
          {
            label: "Độ chính xác",
            value: `${stats.accuracy}%`,
            color: "text-purple-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="text-white/70 text-sm font-semibold mb-3">
          Độ chính xác AI
        </h3>
        <AccBar label="Đúng" value={stats.accuracy} color="bg-green-400" />
        <AccBar label="Sai" value={100 - stats.accuracy} color="bg-red-400" />
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🤖 Feedback AI</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            {exporting ? "Dang export..." : "Export dataset"}
          </button>
          <button
            onClick={toggleFilter}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              onlyWrong
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-white/5 border-white/10 text-white/60"
            }`}
          >
            {onlyWrong ? "Chỉ kết quả sai" : "Tất cả"}
          </button>
          <button
            onClick={() => load(page)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-white/40 text-sm">
            <div className="loader-ring" /> Đang tải...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-white/30">Chưa có dữ liệu</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Loại AI</th>
                <th className="text-left p-4">Kết quả AI</th>
                <th className="text-left p-4">Phản hồi</th>
                <th className="text-left p-4">Nhãn đúng</th>
                <th className="text-left p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.map((fb) => (
                <tr
                  key={fb.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white/50 font-mono">#{fb.id}</td>
                  <td className="p-4 text-white/70 text-xs">
                    {fb.detection?.action_type ?? "—"}
                  </td>
                  <td className="p-4 text-white/60 text-xs max-w-[200px] truncate">
                    {fb.detection?.result_text ?? "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${
                        fb.is_correct
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {fb.is_correct ? "Đúng" : "Sai"}
                    </span>
                  </td>
                  <td className="p-4 text-white/60 text-xs">
                    {fb.correct_label ?? "—"}
                  </td>
                  <td className="p-4">
                    {!fb.is_correct &&
                      fb.review_status !== "reviewed" &&
                      (reviewing === fb.id ? (
                        <div className="flex gap-2">
                          <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Nhãn đúng..."
                            className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs w-32 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!label.trim()) return;
                              setConfirm({ id: fb.id, label: label.trim() });
                            }}
                            className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/30 transition-all"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setReviewing(null);
                              setLabel("");
                            }}
                            className="px-2 py-1 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all"
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReviewing(fb.id);
                            setLabel(fb.correct_label ?? "");
                          }}
                          className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/20 transition-all"
                        >
                          Gán nhãn
                        </button>
                      ))}
                    {fb.review_status === "reviewed" && (
                      <span className="text-green-400/50 text-xs">
                        Đã duyệt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 15 && (
        <div className="flex justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            ← Trước
          </button>
          <span className="px-4 py-2 text-white/50 text-sm">Trang {page}</span>
          <button
            disabled={page * 15 >= total}
            onClick={() => load(page + 1)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { fetchBroadcasts, sendBroadcast } from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const PRIORITIES = [
  {
    value: "low",
    label: "🔵 Thấp",
    color: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  },
  {
    value: "normal",
    label: "⚪ Bình thường",
    color: "text-white/70 border-white/20 bg-white/5",
  },
  {
    value: "high",
    label: "🟡 Cao",
    color: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  },
  {
    value: "urgent",
    label: "🔴 Khẩn cấp",
    color: "text-red-300 border-red-500/30 bg-red-500/10",
  },
];

export default function BroadcastPage() {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState("all");
  const [targetEmails, setTargetEmails] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    const res = await fetchBroadcasts(p, 10);
    setHistory(res.data ?? []);
    setTotal(res.total ?? 0);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const parsedEmails = targetEmails
    .split(/[,\n]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  const canSend =
    message.trim() && (targetType === "all" || parsedEmails.length > 0);

  const doSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setShowConfirm(false);
    try {
      await sendBroadcast(message.trim(), targetType, parsedEmails, priority);
      toast.success("📢 Broadcast đã được gửi thành công!");
      setMessage("");
      setCharCount(0);
      setTargetEmails("");
      load(1);
    } catch {
      toast.error("Gửi broadcast thất bại, vui lòng thử lại");
    }
    setSending(false);
  };

  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <div className="space-y-6">
      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Xác nhận gửi broadcast?"
        message={
          <span>
            Sẽ gửi đến{" "}
            <strong className="text-white">
              {targetType === "all"
                ? "tất cả người dùng"
                : `${parsedEmails.length} user cụ thể`}
            </strong>{" "}
            với mức độ{" "}
            <strong className="text-white">{selectedPriority?.label}</strong>.
          </span>
        }
        confirmLabel="Gửi ngay 📢"
        confirmClass="bg-purple-600 hover:bg-purple-500"
        loading={sending}
        onConfirm={doSend}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">📢 Broadcast TTS</h2>
        <p className="text-white/40 text-sm mt-1">
          Gửi thông báo — app người dùng sẽ tự đọc bằng giọng nói
        </p>
      </div>

      {/* Compose */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <h3 className="text-white/80 font-semibold text-sm">
          ✍️ Soạn thông báo mới
        </h3>

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Nhập nội dung thông báo sẽ được đọc cho người dùng..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-white/30 text-xs">
            {charCount}/500
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-white/40 text-xs mb-2">
              Đối tượng
            </label>
            <div className="flex gap-2">
              {[
                { v: "all", label: "👥 Tất cả" },
                { v: "specific", label: "👤 Cụ thể" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTargetType(v)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                    targetType === v
                      ? "bg-purple-600/30 border-purple-500/50 text-purple-200"
                      : "bg-white/3 border-white/8 text-white/35 hover:bg-white/6"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-white/40 text-xs mb-2">
              Mức độ ưu tiên
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    priority === p.value
                      ? p.color + " ring-1 ring-current"
                      : "bg-white/5 border-white/10 text-white/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email input — only when specific */}
        {targetType === "specific" && (
          <div>
            <label className="block text-white/40 text-xs mb-1.5 font-medium">
              Danh sách email cần nhận{" "}
              {parsedEmails.length > 0 && (
                <span className="text-purple-400 font-semibold">
                  ({parsedEmails.length} địa chỉ)
                </span>
              )}
            </label>
            <textarea
              value={targetEmails}
              onChange={(e) => setTargetEmails(e.target.value)}
              placeholder={
                "user1@gmail.com, user2@gmail.com\nHoặc mỗi email mỗi dòng..."
              }
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {parsedEmails.length === 0 && (
              <p className="text-orange-400/80 text-xs mt-1">
                ⚠ Nhập ít nhất một email để gửi
              </p>
            )}
          </div>
        )}

        {message.trim() && (
          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <p className="text-white/30 text-xs mb-2">
              👁 Preview — App sẽ đọc:
            </p>
            <p className="text-white/80 text-sm italic">
              "Thông báo hệ thống: {message.trim()}"
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if (canSend) setShowConfirm(true);
          }}
          disabled={sending || !canSend}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-linear-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {sending && (
            <span className="loader-ring" style={{ width: 16, height: 16 }} />
          )}
          {sending ? "Đang gửi..." : "📢 Gửi thông báo"}
        </button>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white/70 font-semibold text-sm">
            📋 Lịch sử broadcast ({total})
          </h3>
          <button
            onClick={() => load(page)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            🔄 Làm mới
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-white/40 text-sm">
              <div className="loader-ring" /> Đang tải...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              Chưa có broadcast nào
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((b) => {
                const pri = PRIORITIES.find((p) => p.value === b.priority);
                return (
                  <div
                    key={b.id}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">{b.message}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-white/30 text-xs">
                            👤 {b.admin?.email ?? "admin"}
                          </span>
                          <span className="text-white/30 text-xs">
                            🎯 {b.target_type === "all" ? "Tất cả" : "Cụ thể"}
                          </span>
                          <span className="text-white/30 text-xs">
                            📅 {new Date(b.created_at).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${pri?.color ?? ""}`}
                      >
                        {pri?.label ?? b.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {total > 10 && (
          <div className="flex justify-center gap-3 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 text-white/50 text-sm">
              Trang {page}
            </span>
            <button
              disabled={page * 10 >= total}
              onClick={() => load(page + 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

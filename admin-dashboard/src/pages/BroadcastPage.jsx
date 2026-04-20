import { useEffect, useState } from "react";
import { fetchBroadcasts, sendBroadcast, deleteBroadcast, bulkDeleteBroadcasts } from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";
import { Trash2, CheckSquare, Square, RefreshCw } from "lucide-react";

const PRIORITIES = [
  {
    value: "low",
    label: "🔵 Thấp",
    color: "text-blue-600 dark:text-blue-300 border-blue-500/30 bg-blue-500/10",
  },
  {
    value: "normal",
    label: "⚪ Bình thường",
    color: "text-text-primary/70 border-border-primary bg-text-primary/5",
  },
  {
    value: "high",
    label: "🟡 Cao",
    color: "text-yellow-600 dark:text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  },
  {
    value: "urgent",
    label: "🔴 Khẩn cấp",
    color: "text-red-600 dark:text-red-300 border-red-500/30 bg-red-500/10",
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
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  
  // Selection & Deletion
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    const res = await fetchBroadcasts(p, 10);
    setHistory(res.data ?? []);
    setTotal(res.total ?? 0);
    setPage(p);
    setSelectedIds([]); // Reset selection on load
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
    setShowConfirmSend(false);
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

  const doDeleteSingle = async () => {
    if (!deletingId) return;
    try {
      await deleteBroadcast(deletingId);
      toast.success("Đã xóa thông báo thành công");
      load(page);
    } catch {
      toast.error("Xóa thông báo thất bại");
    }
    setDeletingId(null);
  };

  const doDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteBroadcasts(selectedIds);
      toast.success(`Đã xóa ${selectedIds.length} thông báo thành công`);
      load(page);
    } catch {
      toast.error("Xóa hàng loạt thất bại");
    }
    setShowConfirmBulkDelete(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(b => b.id));
    }
  };

  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Confirm Send */}
      <ConfirmDialog
        open={showConfirmSend}
        title="Xác nhận gửi broadcast?"
        message={
          <span>
            Sẽ gửi đến{" "}
            <strong className="text-text-primary">
              {targetType === "all"
                ? "tất cả người dùng"
                : `${parsedEmails.length} user cụ thể`}
            </strong>{" "}
            với mức độ{" "}
            <strong className="text-text-primary">{selectedPriority?.label}</strong>.
          </span>
        }
        confirmLabel="Gửi ngay 📢"
        confirmClass="bg-purple-600 hover:bg-purple-500"
        loading={sending}
        onConfirm={doSend}
        onCancel={() => setShowConfirmSend(false)}
      />

      {/* Confirm Single Delete */}
      <ConfirmDialog
        open={!!deletingId}
        title="Xóa lịch sử thông báo?"
        message="Hành động này sẽ xóa vĩnh viễn bản ghi này khỏi lịch sử hệ thống."
        confirmLabel="Xóa bản ghi"
        confirmClass="bg-red-600 hover:bg-red-500"
        onConfirm={doDeleteSingle}
        onCancel={() => setDeletingId(null)}
      />

      {/* Confirm Bulk Delete */}
      <ConfirmDialog
        open={showConfirmBulkDelete}
        title={`Xóa ${selectedIds.length} thông báo?`}
        message="Bạn có chắc chắn muốn xóa tất cả các thông báo đã chọn không? Hành động này không thể hoàn tác."
        confirmLabel={`Xóa ${selectedIds.length} mục`}
        confirmClass="bg-red-600 hover:bg-red-500"
        onConfirm={doDeleteBulk}
        onCancel={() => setShowConfirmBulkDelete(false)}
      />

      <PageHeader 
        title="THÔNG BÁO" 
        highlight="BROADCAST" 
        description="Gửi thông báo giọng nói tức thì đến toàn bộ ứng dụng người dùng"
      />


      {/* Compose */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-text-primary/80 font-semibold text-sm">
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
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-primary placeholder-text-secondary/30 text-sm resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <span className="absolute bottom-3 right-4 text-text-secondary/30 text-xs">
            {charCount}/500
          </span>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-2">
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
                  className={`flex-1 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    targetType === v
                      ? "bg-purple-600/20 border-purple-500/50 text-purple-600 dark:text-purple-200"
                      : "bg-text-primary/3 border-border-primary text-text-secondary hover:bg-text-primary/6"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-2">
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
                      : "bg-text-primary/5 border-border-primary text-text-secondary hover:bg-text-primary/10"
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
            <label className="block text-text-secondary text-xs mb-1.5 font-medium">
              Danh sách email cần nhận{" "}
              {parsedEmails.length > 0 && (
                <span className="text-purple-500 font-semibold">
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
              className="w-full px-3 py-2.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-primary text-sm placeholder-text-secondary/25 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {parsedEmails.length === 0 && (
              <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                ⚠ Nhập ít nhất một email để gửi
              </p>
            )}
          </div>
        )}

        {message.trim() && (
          <div className="bg-text-primary/5 border border-border-primary rounded-xl p-4">
            <p className="text-text-secondary text-xs mb-2">
              👁 Preview — App sẽ đọc:
            </p>
            <p className="text-text-primary/80 text-sm italic">
              "Thông báo hệ thống: {message.trim()}"
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if (canSend) setShowConfirmSend(true);
          }}
          disabled={sending || !canSend}
          className="w-full py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 flex items-center justify-center gap-2.5"
        >
          {sending && <Loading variant="inline" size="xs" />}
          {sending ? "Đang gửi..." : "📢 Gửi thông báo"}
        </button>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-text-primary/70 font-semibold text-sm uppercase tracking-wider text-[10px]">
              📋 Lịch sử ({total})
            </h3>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                  Đã chọn {selectedIds.length}
                </span>
                <button
                  onClick={() => setShowConfirmBulkDelete(true)}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-tight transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => load(page)}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-text-primary/5 border-b border-border-primary p-3 flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="text-text-secondary hover:text-purple-500 transition-colors"
            >
              {selectedIds.length === history.length && history.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-purple-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 text-[10px] uppercase font-bold tracking-widest text-text-secondary/50">
              Nội dung thông báo
            </div>
            <div className="w-24 text-right text-[10px] uppercase font-bold tracking-widest text-text-secondary/50 mr-12">
              Ưu tiên
            </div>
          </div>

          {loading ? (
            <Loading size="md" text="Đang đồng bộ..." className="py-12" />
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm">
              Chưa có broadcast nào
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              {history.map((b) => {
                const pri = PRIORITIES.find((p) => p.value === b.priority);
                const isSelected = selectedIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3 flex items-start gap-4 transition-all ${isSelected ? 'bg-purple-500/5' : 'hover:bg-text-primary/5'}`}
                  >
                    <button 
                      onClick={() => toggleSelect(b.id)}
                      className="mt-0.5 text-text-secondary hover:text-purple-500 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary/80 text-sm font-medium leading-relaxed">{b.message}</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2.5">
                        <span className="text-text-secondary text-[11px] flex items-center gap-1.5">
                          <span className="opacity-40">👤 Gửi bởi:</span> 
                          <span className="text-text-primary/60 font-medium">{b.admin?.email ?? "admin"}</span>
                        </span>
                        <span className="text-text-secondary text-[11px] flex items-center gap-1.5">
                          <span className="opacity-40">👥 Đối tượng:</span> 
                          <span className="text-text-primary/60 font-medium">{b.target_type === "all" ? "Tất cả" : "Cụ thể"}</span>
                        </span>
                        <span className="text-text-secondary text-[11px] flex items-center gap-1.5">
                          <span className="opacity-40">⏰ Lúc:</span>
                          <span className="text-text-primary/60 font-medium">{new Date(b.created_at).toLocaleString("vi-VN")}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${pri?.color ?? ""}`}
                      >
                        {pri?.label ?? b.priority}
                      </span>
                      <button
                        onClick={() => setDeletingId(b.id)}
                        className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Xóa bản ghi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              className="px-4 py-1.5 rounded-xl bg-bg-card border border-border-primary text-text-secondary text-sm font-medium disabled:opacity-30 hover:bg-text-primary/5 transition-all shadow-sm"
            >
              ← Trước
            </button>
            <div className="flex items-center px-5 bg-text-primary/5 rounded-xl border border-border-primary text-text-secondary text-[10px] font-bold uppercase tracking-widest">
              Trang {page}
            </div>
            <button
              disabled={page * 10 >= total}
              onClick={() => load(page + 1)}
              className="px-4 py-1.5 rounded-xl bg-bg-card border border-border-primary text-text-secondary text-sm font-medium disabled:opacity-30 hover:bg-text-primary/5 transition-all shadow-sm"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  fetchFeedback,
  fetchFeedbackStats,
  reviewFeedback,
  exportFeedbackDataset,
  suggestFeedbackLabel,
  getFileUrl,
  deleteFeedback,
  deleteFeedbackBulk,
  deleteAllFeedback,
} from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

import PageHeader from "../components/ui/PageHeader";
import StatsCard from "../components/ui/StatsCard";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import { 
  Trash2, 
  Trash, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical
} from "lucide-react";
import Loading from "../components/ui/Loading";

function AccBar({ label, value, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full bg-text-primary/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--color-primary),0.3)]`}
          style={{ width: `${value}%` }}
        />
      </div>
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async (p = 1, wrong = onlyWrong) => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        fetchFeedback(p, 15, wrong),
        fetchFeedbackStats(),
      ]);
      setData(res.data ?? []);
      setTotal(res.total ?? 0);
      setStats(s);
      setPage(p);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Không thể tải dữ liệu phản hồi");
    }
    setLoading(false);
  };

  const handleSingleDelete = (id) => {
    setDeleteConfirm({ type: "single", id });
  };

  const handleBulkDeleteRequest = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirm({ type: "bulk", count: selectedIds.length });
  };

  const handleDeleteAllRequest = (wrongOnly = false) => {
    setDeleteConfirm({ type: wrongOnly ? "wrong" : "all" });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      const { type, id } = deleteConfirm;
      if (type === "single") {
        await deleteFeedback(id);
        toast.success("Đã xoá thành công");
      } else if (type === "bulk") {
        await deleteFeedbackBulk(selectedIds);
        toast.success(`Đã xoá ${selectedIds.length} mục`);
      } else if (type === "wrong") {
        await deleteAllFeedback(true);
        toast.success("Đã xoá tất cả phản hồi sai");
      } else if (type === "all") {
        await deleteAllFeedback(false);
        toast.success("Đã xoá toàn bộ dữ liệu phản hồi");
      }
      load(type === "all" ? 1 : page);
    } catch {
      toast.error("Thao tác thất bại, vui lòng thử lại");
    }
    setActionLoading(false);
    setDeleteConfirm(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((fb) => fb.id));
    }
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

  const tableHeaders = [
    { label: <button onClick={toggleSelectAll}>{selectedIds.length === data.length && data.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}</button>, className: "w-10" },
    { label: "ID" },
    { label: "Ảnh" },
    { label: "Loại AI" },
    { label: "Kết quả AI" },
    { label: "Phản hồi" },
    { label: "Nhãn đúng" },
    { label: "Thao tác", className: "text-right" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="USER" 
        highlight="FEEDBACK" 
        description="Phân tích các báo cáo và góp ý từ người dùng về độ chính xác của AI"
      />

      <ConfirmDialog
        open={!!confirm}
        title="Lưu nhãn đúng?"
        message={<>Gán nhãn <span className="text-text-primary font-semibold">"{confirm?.label}"</span> cho kết quả AI sai này?</>}
        confirmLabel="Lưu nhãn"
        confirmClass="bg-indigo-600 hover:bg-indigo-500"
        loading={actionLoading}
        onConfirm={doReview}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title={deleteConfirm?.type === "single" ? "Xoá phản hồi?" : deleteConfirm?.type === "bulk" ? `Xoá ${deleteConfirm.count} phản hồi?` : deleteConfirm?.type === "wrong" ? "Xoá nhãn sai?" : "Xoá TẤT CẢ dữ liệu?"}
        message={<div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div className="text-sm">{deleteConfirm?.type === "single" && "Bạn có chắc chắn muốn xoá bản ghi này? Hành động này không thể hoàn tác."}{deleteConfirm?.type === "bulk" && `Xác nhận xoá vĩnh viễn ${deleteConfirm.count} bản ghi đã chọn khỏi hệ thống.`}{deleteConfirm?.type === "wrong" && "Tất cả các phản hồi được đánh dấu là SAI sẽ bị xoá vĩnh viễn khỏi cơ sở dữ liệu."}{deleteConfirm?.type === "all" && "CẢNH BÁO: Toàn bộ dữ liệu phản hồi sẽ bị xoá sạch. Đây là hành động nguy hiểm và không thể khôi phục."}</div></div>}
        confirmLabel={deleteConfirm?.type === "all" ? "Xoá sạch sành sanh" : "Xác nhận xoá"}
        confirmClass="bg-red-600 hover:bg-red-500"
        loading={actionLoading}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Tổng phản hồi" value={stats.total} />
        <StatsCard label="Đúng" value={stats.correct} color="text-green-500" />
        <StatsCard label="Sai" value={stats.wrong} color="text-red-500" />
        <StatsCard label="Độ chính xác" value={`${stats.accuracy}%`} color="text-purple-500" />
      </div>

      <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-text-primary text-sm font-semibold mb-3">Độ chính xác AI</h3>
        <AccBar label="Đúng" value={stats.accuracy} color="bg-green-500" />
        <AccBar label="Sai" value={100 - stats.accuracy} color="bg-red-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-primary">Dữ liệu Feedback</h2>
          <span className="px-2 py-0.5 rounded-lg bg-text-primary/5 border border-border-primary text-text-secondary text-[10px] font-bold">{total} BẢN GHI</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all disabled:opacity-50"><Download className="w-4 h-4" /> Export Dataset</button>
          <button onClick={() => handleDeleteAllRequest(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/20 transition-all"><Filter className="w-4 h-4" /> Xoá nhãn sai</button>
          <button onClick={() => handleDeleteAllRequest(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all"><Trash className="w-4 h-4" /> Xoá tất cả</button>
          <div className="w-[1px] h-8 bg-border-primary mx-1 hidden sm:block" />
          <button onClick={toggleFilter} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${onlyWrong ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-500" : "bg-bg-card border-border-primary text-text-secondary hover:text-text-primary"}`}>{onlyWrong ? "Đang lọc sai" : "Tất cả"}</button>
          <button onClick={() => load(page)} className="p-2 rounded-xl bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary transition-all active:scale-95">
            {loading ? <Loading variant="inline" size="sm" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-2"><span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedIds.length}</span><span className="text-sm font-bold tracking-wide">mục đã chọn</span></div>
          <div className="w-[1px] h-4 bg-white/20" />
          <div className="flex gap-2">
            <button onClick={handleBulkDeleteRequest} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white text-indigo-600 text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all"><Trash2 className="w-4 h-4" /> Xoá đã chọn</button>
            <button onClick={() => setSelectedIds([])} className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all">Huỷ</button>
          </div>
        </div>
      )}

      <DataTable 
        headers={tableHeaders} 
        loading={loading} 
        empty={data.length === 0}
      >
        {data.map((fb) => (
          <tr key={fb.id} className={`border-b border-border-primary hover:bg-white/[0.02] transition-colors group ${selectedIds.includes(fb.id) ? "bg-indigo-500/5" : ""}`}>
            <td className="p-4">
              <button onClick={() => toggleSelect(fb.id)} className="text-text-secondary hover:text-indigo-500 transition-colors">
                {selectedIds.includes(fb.id) ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
              </button>
            </td>
            <td className="p-4 text-text-secondary font-mono text-[10px]">#{fb.id}</td>
            <td className="p-4">
              {fb.image_url ? (
                <a href={getFileUrl(fb.image_url)} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-border-primary hover:scale-105 transition-transform">
                  <img src={getFileUrl(fb.image_url)} alt="Feedback" className="w-full h-full object-cover" />
                </a>
              ) : <div className="w-12 h-12 rounded-lg bg-text-primary/5 flex items-center justify-center text-[10px] text-text-secondary">No image</div>}
            </td>
            <td className="p-4 text-text-primary text-xs">{fb.detection?.action_type ?? "—"}</td>
            <td className="p-4 text-text-secondary text-xs max-w-[200px] truncate">{fb.detection?.result_text ?? "—"}</td>
            <td className="p-4">
              <span className={`px-2 py-0.5 rounded-full text-xs border ${fb.is_correct ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"}`}>
                {fb.is_correct ? "Đúng" : "Sai"}
              </span>
            </td>
            <td className="p-4 text-text-secondary text-xs">{fb.correct_label ?? "—"}</td>
            <td className="p-4">
              <div className="flex justify-end">
                {!fb.is_correct && fb.review_status !== "reviewed" && (reviewing === fb.id ? (
                  <div className="flex gap-2">
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nhãn đúng..." className="px-2 py-1 rounded-lg bg-text-primary/5 border border-border-primary text-text-primary text-xs w-32 focus:outline-none focus:border-purple-500/50" />
                    <button onClick={() => { if (!label.trim()) return; setConfirm({ id: fb.id, label: label.trim() }); }} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs hover:bg-purple-500/20 transition-all">Lưu</button>
                    <button onClick={async () => { try { const { suggestion } = await suggestFeedbackLabel(fb.id); setLabel(suggestion); toast.success("Gemini đã gợi ý nhãn!"); } catch { toast.error("Không thể lấy gợi ý từ Gemini"); } }} title="Gợi ý bởi Gemini" className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all flex items-center gap-1">🪄 AI</button>
                    <button onClick={() => { setReviewing(null); setLabel(""); }} className="px-2 py-1 rounded-lg bg-text-primary/5 text-text-secondary text-xs hover:bg-text-primary/10 transition-all">Huỷ</button>
                  </div>
                ) : (
                  <button onClick={() => { setReviewing(fb.id); setLabel(fb.correct_label ?? ""); }} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs hover:bg-purple-500/20 transition-all">Gán nhãn</button>
                ))}
                {fb.review_status === "reviewed" && <span className="flex items-center gap-1 text-green-500/70 text-[10px] font-bold uppercase tracking-wider bg-green-500/5 px-2 py-1 rounded-lg"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>}
                <div className="h-6 w-[1px] bg-border-primary mx-2 opacity-50" />
                <button onClick={() => handleSingleDelete(fb.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all" title="Xoá phản hồi này"><Trash2 className="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Pagination 
        page={page} 
        totalPages={Math.ceil(total / 15)} 
        onPageChange={(p) => load(p)} 
      />
    </div>
  );
}

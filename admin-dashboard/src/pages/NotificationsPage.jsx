import {
  Bell,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNotificationContext } from "../providers/NotificationProvider";

export default function NotificationsPage() {
  const { notifications, handleMarkAllRead, handleDelete, handleBulkDelete, handleDeleteAll } = useNotificationContext();
  const toast = useToast();
  const [filter, setFilter] = useState("all"); // all, SOS, INFO
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null,
    id: null,
  });

  const filtered = notifications.filter((n) => {
    const matchesFilter = filter === "all" || n.type === filter;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((n) => n.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const confirmDelete = (type, id = null) => {
    setDeleteDialog({ isOpen: true, type, id });
  };

  const executeDelete = async () => {
    try {
      if (deleteDialog.type === "single") {
        await handleDelete(deleteDialog.id);
        toast.success("Đã xóa thông báo");
      } else if (deleteDialog.type === "bulk") {
        await handleBulkDelete(selectedIds);
        toast.success(`Đã xóa ${selectedIds.length} thông báo`);
        setSelectedIds([]);
      } else if (deleteDialog.type === "all") {
        await handleDeleteAll();
        toast.success("Đã xóa tất cả thông báo");
        setSelectedIds([]);
      }
    } catch (error) {
      toast.error("Xóa thông báo thất bại");
    }
    setDeleteDialog({ isOpen: false, type: null, id: null });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="THÔNG BÁO"
        highlight="HỆ THỐNG"
        description="Theo dõi toàn bộ thông báo và cảnh báo từ hệ thống"
      >
          {isAllSelected && (
            <button
              onClick={() => confirmDelete("all")}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tất cả
            </button>
          )}
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all group"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đánh dấu tất cả đã đọc
          </button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls */}
        <div className="w-full lg:w-64 space-y-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">
                Tìm kiếm
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tiêu đề, nội dung..."
                  className="w-full h-9 pl-9 pr-4 bg-bg-primary border border-border-primary rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">
                Lọc theo loại
              </label>
              <div className="space-y-1">
                {[
                  { id: "all", label: "Tất cả", icon: Bell },
                  {
                    id: "SOS",
                    label: "Cảnh báo SOS",
                    icon: ShieldAlert,
                    color: "text-red-500",
                  },
                  {
                    id: "INFO",
                    label: "Thông tin hệ thống",
                    icon: Bell,
                    color: "text-indigo-500",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                      filter === item.id
                        ? "bg-indigo-500 text-white"
                        : "text-text-secondary hover:bg-text-primary/5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon
                        className={cn(
                          "w-3.5 h-3.5",
                          filter === item.id ? "text-white" : item.color,
                        )}
                      />
                      {item.label}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full",
                        filter === item.id
                          ? "bg-white/20 text-white"
                          : "bg-text-primary/5 text-text-secondary",
                      )}
                    >
                      {item.id === "all"
                        ? notifications.length
                        : notifications.filter((n) => n.type === item.id)
                            .length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 space-y-3">
          {filtered.length > 0 && (
            <div className="flex items-center justify-between bg-bg-card border border-border-primary rounded-2xl p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-bg-primary border-border-primary cursor-pointer"
                />
                <span className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                  Chọn tất cả
                </span>
              </label>

              {selectedIds.length > 0 && (
                <button
                  onClick={() => confirmDelete("bulk")}
                  className="flex items-center gap-2 h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa {selectedIds.length} đã chọn
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-bg-card border border-border-primary border-dashed rounded-[2rem] p-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-bg-primary flex items-center justify-center mx-auto border border-border-primary">
                <Bell className="w-8 h-8 text-text-secondary opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Không tìm thấy thông báo
                </p>
                <p className="text-xs text-text-secondary font-medium">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "bg-bg-card border rounded-2xl p-5 flex gap-5 transition-all hover:border-indigo-500/30 group",
                  !n.isRead
                    ? "border-indigo-500/30 bg-indigo-500/[0.02]"
                    : "border-border-primary",
                  selectedIds.includes(n.id) && "ring-1 ring-indigo-500"
                )}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(n.id)}
                    onChange={() => toggleSelect(n.id)}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-bg-primary border-border-primary cursor-pointer"
                  />
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    n.type === "SOS"
                      ? "bg-red-500 text-white shadow-red-500/20"
                      : "bg-indigo-500 text-white shadow-indigo-500/20",
                  )}
                >
                  {n.type === "SOS" ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <Bell className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3
                      className={cn(
                        "text-sm uppercase tracking-wide truncate",
                        !n.isRead
                          ? "font-black text-text-primary"
                          : "font-bold text-text-secondary",
                      )}
                    >
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-medium text-text-secondary opacity-50 flex items-center gap-1 whitespace-nowrap italic">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed font-medium opacity-80">
                    {n.message}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between py-1">
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                  <button 
                    onClick={() => confirmDelete("single", n.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={
          deleteDialog.type === "all"
            ? "Xóa TẤT CẢ thông báo?"
            : deleteDialog.type === "bulk"
              ? `Xóa ${selectedIds.length} thông báo đã chọn?`
              : "Xóa thông báo này?"
        }
        message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Xóa"
        confirmClass="bg-red-500 hover:bg-red-600"
        onConfirm={executeDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, type: null, id: null })}
      />
    </div>
  );
}

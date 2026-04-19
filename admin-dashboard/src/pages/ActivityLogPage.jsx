import { useState, useEffect } from "react";
import { fetchAuditLogs, exportActivityReport } from "../services/api";
import { useToast } from "../components/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import { 
  History, 
  Filter, 
  Search, 
  User as UserIcon, 
  Target, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Shield,
  Activity,
  ArrowRight,
  Download
} from "lucide-react";
import Loading from "../components/ui/Loading";


export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
  });
  const toast = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(page, 20, filters);
      setLogs(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast?.error?.("Không thể lấy danh sách log");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportActivityReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast?.success?.("Báo cáo đã được tải xuống");
    } catch (err) {
      toast?.error?.("Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const getActionStyles = (action) => {
    if (action.includes("SOS")) return "text-red-400 bg-red-400/10 border-red-400/20";
    if (action.includes("USER")) return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    if (action.includes("BROADCAST")) return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    if (action.includes("SETTINGS")) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  };

  const formatDetails = (details) => {
    if (!details) return "-";
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
    } catch {
      return JSON.stringify(details);
    }
  };

  const tableHeaders = [
    { label: "Thời gian" },
    { label: "Quản trị viên" },
    { label: "Hành động" },
    { label: "Đối tượng" },
    { label: "Chi tiết", className: "text-right" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="NHẬT KÝ" 
        highlight="HOẠT ĐỘNG" 
        description="Theo dõi mọi hành động của quản trị viên trên hệ thống Vision Assistant"
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="min-h-[44px] bg-bg-card border border-border-primary text-text-primary text-[10px] font-black rounded-xl pl-11 pr-8 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all cursor-pointer uppercase tracking-widest"
            >
              <option value="">Hành động</option>
              <option value="RESOLVE_SOS">Resolve SOS</option>
              <option value="ACKNOWLEDGE_SOS">Acknowledge SOS</option>
              <option value="CREATE_USER">Tạo người dùng</option>
              <option value="DELETE_USER">Xóa người dùng</option>
              <option value="SEND_BROADCAST">Gửi Broadcast</option>
            </select>
          </div>

          <div className="relative group">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={filters.targetType}
              onChange={(e) =>
                setFilters({ ...filters, targetType: e.target.value })
              }
              className="min-h-[44px] bg-bg-card border border-border-primary text-text-primary text-[10px] font-black rounded-xl pl-11 pr-8 appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all cursor-pointer uppercase tracking-widest"
            >
              <option value="">Đối tượng</option>
              <option value="sos">SOS</option>
              <option value="user">Người dùng</option>
              <option value="broadcast">Broadcast</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
          Export CSV
        </button>
      </div>

      <DataTable 
        headers={tableHeaders} 
        loading={loading} 
        empty={logs.length === 0}
        emptyMessage="Không tìm thấy bản ghi hoạt động nào"
      >
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-text-primary/5 transition-colors group border-b border-border-primary last:border-0">
            <td className="px-6 py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary italic">
                <Clock className="w-3.5 h-3.5 opacity-40" />
                {new Date(log.created_at).toLocaleString("vi-VN")}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-black text-text-primary block truncate">
                    {log.admin?.email?.split('@')[0] || "System"}
                  </span>
                  <span className="text-[10px] text-text-secondary font-bold opacity-50 uppercase tracking-wider">Admin</span>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getActionStyles(log.action)}`}>
                {log.action.replace(/_/g, " ")}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-text-primary uppercase tracking-tighter">
                  {log.target_type}
                </span>
                <span className="px-1.5 py-0.5 bg-text-primary/5 rounded text-[10px] font-mono text-text-secondary opacity-50">
                  #{log.target_id?.slice(0, 8)}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2 text-xs text-text-secondary font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{formatDetails(log.details)}</span>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Pagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={(p) => setPage(p)} 
      />
    </div>
  );
}

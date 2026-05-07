import { useEffect, useState, useRef } from "react";
import {
  useSosAlerts,
  useAcknowledgeSos,
  useResolveSos,
} from "@/hooks/use-queries";
import { socket } from "../services/socket";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import Loading from "../components/ui/Loading";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  Download,
  Phone,
  Heart,
  X
} from "lucide-react";
import { exportSosReport } from "../services/api";

const STATUS_COLORS = {
  pending: "bg-red-500/20 text-red-400 border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function SosPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [incoming, setIncoming] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type:'ack'|'resolve', id, label }
  const [exporting, setExporting] = useState(false);
  const [viewingUser, setViewingUser] = useState(null); // { email, contacts: [] }

  const { data, isLoading, refetch } = useSosAlerts(page, 15);
  const alerts = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportSosReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sos_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast?.success?.("Báo cáo SOS đã được tải xuống");
    } catch (err) {
      toast?.error?.("Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  const ackMutation = useAcknowledgeSos();
  const resolveMutation = useResolveSos();
  const actionLoading = ackMutation.isPending || resolveMutation.isPending;

  useEffect(() => {
    const handleSosIncoming = (data) => {
      setIncoming(data);
      try {
        const audio = new Audio("/sos-alarm.mp3");
        audio.play();
      } catch {}
      refetch();
    };

    socket.on("sos_incoming", handleSosIncoming);
    return () => {
      socket.off("sos_incoming", handleSosIncoming);
    };
  }, [refetch]);

  const doAction = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "ack") {
        await ackMutation.mutateAsync({ id: confirm.id });
        toast.success("Đã xác nhận nhận SOS");
      } else {
        await resolveMutation.mutateAsync({
          id: confirm.id,
          note: "Đã xử lý bởi admin",
        });
        toast.success("Đã đánh dấu xử lý xong");
      }
      setIncoming(null);
    } catch {
      toast.error("Thao tác thất bại, vui lòng thử lại");
    }
    setConfirm(null);
  };

  const handleAckDirect = async (id) => {
    if (!id) return;
    try {
      await ackMutation.mutateAsync({ id });
      toast.success("Đã xác nhận nhận SOS");
      setIncoming(null);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };
  const handleResolveDirect = async (id) => {
    if (!id) return;
    try {
      await resolveMutation.mutateAsync({ id, note: "Đã xử lý bởi admin" });
      toast.success("Đã xử lý SOS thành công");
      setIncoming(null);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const tableHeaders = [
    { label: "Mã số" },
    { label: "Người dùng" },
    { label: "Tọa độ" },
    { label: "Trạng thái" },
    { label: "Thời gian" },
    { label: "Thao tác", className: "text-right" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === "ack" ? "Xác nhận nhận SOS?" : "Đánh dấu đã xử lý?"
        }
        message={
          confirm?.type === "ack"
            ? "Bạn sẽ xác nhận đã nhận tín hiệu SOS này."
            : "Bạn sẽ đánh dấu SOS này là đã được xử lý xong."
        }
        confirmLabel={confirm?.type === "ack" ? "Đã nhận" : "Đã xử lý  "}
        confirmClass={
          confirm?.type === "ack"
            ? "bg-yellow-500 hover:bg-yellow-400"
            : "bg-green-600 hover:bg-green-500"
        }
        loading={actionLoading}
        onConfirm={doAction}
        onCancel={() => setConfirm(null)}
      />

      {/* Emergency Contacts Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-bg-card border border-border-primary rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-primary flex items-center justify-between bg-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Người thân</h3>
                  <p className="text-xs text-text-secondary font-medium italic">{viewingUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingUser(null)}
                className="p-2 hover:bg-text-primary/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {viewingUser.contacts && viewingUser.contacts.length > 0 ? (
                viewingUser.contacts.map((contact, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-text-primary/5 border border-border-primary flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-text-primary uppercase tracking-tight">{contact.name}</span>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-bold">{contact.relationship}</span>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 opacity-40" />
                          {contact.phone}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={`tel:${contact.phone}`}
                      className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/0 hover:shadow-emerald-500/20"
                    >
                      <Phone className="w-4 h-4 fill-current" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-40">
                  <UserIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Không tìm thấy thông tin người thân</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-text-primary/5 text-center">
              <button 
                onClick={() => setViewingUser(null)}
                className="w-full py-3 rounded-xl bg-text-primary/10 text-text-primary text-xs font-black uppercase tracking-widest hover:bg-text-primary/20 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {incoming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-red-950/90 border-2 border-red-500 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-50" />
            
            {/* Nút đóng popup tạm thời */}
            <button 
              onClick={() => setIncoming(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 animate-pulse">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white uppercase">SOS <span className="text-red-500">KHẨN CẤP</span></h1>
                <p className="text-red-200/80 font-medium text-sm">Phát hiện yêu cầu trợ giúp từ người dùng Vision Assistant</p>
              </div>
              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => setViewingUser({ email: incoming.userEmail || "Unknown", contacts: incoming.emergencyContacts || [] })}
                  className="w-full flex items-center justify-center gap-2 text-white/90 text-sm font-bold bg-white/5 rounded-xl py-2 px-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/user"
                >
                  <UserIcon className="w-4 h-4 text-red-400 group-hover/user:text-white" />
                  <span className="truncate max-w-[200px] underline decoration-dotted underline-offset-4">{incoming.userEmail ?? incoming.userId ?? "Unknown User"}</span>
                </button>
                <div className="flex flex-col gap-2 text-red-200/80 text-xs font-medium">
                  <a 
                    href={`https://www.google.com/maps?q=${incoming.latitude},${incoming.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500 hover:text-white transition-all group"
                  >
                    <MapPin className="w-4 h-4 group-hover:animate-bounce" /> 
                    <span className="font-mono font-black">{incoming.latitude?.toFixed(5)}, {incoming.longitude?.toFixed(5)}</span>
                  </a>
                  <div className="flex items-center justify-center gap-2 opacity-70"><Clock className="w-3.5 h-3.5" /> <span>{incoming.timestamp}</span></div>
                </div>
              </div>
              {incoming.imageBase64 && (
                <div className="relative mb-8 rounded-2xl overflow-hidden border-2 border-red-500/30 group-hover:border-red-500/60 transition-colors">
                  <img src={`data:image/jpeg;base64,${incoming.imageBase64}`} alt="SOS capture" className="w-full h-48 object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 to-transparent" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAckDirect(incoming.sosId ?? incoming.id)} className="min-h-[42px] rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-white/20 active:scale-95 transition-all">Xác nhận</button>
                <button onClick={() => handleResolveDirect(incoming.sosId ?? incoming.id)} className="min-h-[42px] rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 transition-all">Đã xử lý</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader 
        title="SOS" 
        highlight="KHẨN CẤP" 
        description={`Danh sách cảnh báo (${total} tổng)`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"><Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} /> Export report</button>
          <button onClick={() => refetch()} className="flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-xl bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary transition-all active:scale-95">
            {isLoading ? <Loading variant="inline" size="xs" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <DataTable 
        headers={tableHeaders} 
        loading={isLoading} 
        empty={alerts.length === 0}
        emptyMessage={
          <>
            <ShieldAlert className="w-16 h-16 mx-auto opacity-10" />
            <p className="font-bold text-lg">Không có cảnh báo SOS nào</p>
          </>
        }
      >
        {alerts.map((a) => (
          <tr key={a.id} className="hover:bg-text-primary/5 transition-colors group border-b border-border-primary last:border-0">
            <td className="px-4 py-3 text-text-secondary font-mono text-xs">#{a.id}</td>
            <td className="px-4 py-3">
              <button 
                onClick={() => setViewingUser({ email: a.user?.email || "—", contacts: a.user?.emergencyContacts || [] })}
                className="flex items-center gap-2 hover:bg-indigo-500/10 p-1 rounded-lg transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-text-primary font-medium truncate max-w-[150px] underline decoration-dotted underline-offset-4">{a.user?.email ?? a.userId ?? "—"}</span>
              </button>
            </td>
            <td className="px-4 py-3">
              {a.latitude ? (
                <a 
                  href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-500 hover:text-indigo-400 font-mono text-[11px] font-black group/link"
                >
                  <MapPin className="w-3 h-3 group-hover/link:animate-bounce" />
                  {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                </a>
              ) : "—"}
            </td>
            <td className="px-4 py-3">
              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[a.status] ?? ""}`}>
                {a.status}
              </span>
            </td>
            <td className="px-4 py-4 text-text-secondary text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 opacity-40" />
                {new Date(a.created_at).toLocaleString("vi-VN", {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex justify-end gap-2">
                {a.status === "pending" && (
                  <button onClick={() => setConfirm({ type: "ack", id: a.id })} className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all">Xác nhận</button>
                )}
                {a.status !== "resolved" && (
                  <button onClick={() => setConfirm({ type: "resolve", id: a.id })} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all">Xong</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Pagination 
        page={page} 
        totalPages={Math.ceil(total / 15)} 
        onPageChange={(p) => setPage(p)} 
      />
    </div>
  );
}

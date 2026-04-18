import { useEffect, useState, useRef } from "react";
import {
  useSosAlerts,
  useAcknowledgeSos,
  useResolveSos,
} from "@/hooks/use-queries";
import { socket } from "../services/socket";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { TableSkeleton } from "../components/ui/Skeleton";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon
} from "lucide-react";

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

  const { data, isLoading, refetch } = useSosAlerts(page, 15);
  const alerts = data?.data ?? [];
  const total = data?.total ?? 0;

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

  // Direct actions from incoming popup
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

  return (
    <div className="space-y-6">
      {/* ConfirmDialog */}
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

      {/* Incoming SOS Popup — mobile-friendly */}
      {incoming && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        >
          <div className="bg-red-950/90 border-2 border-red-500 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-50" />
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 animate-pulse">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary uppercase">
                  SOS <span className="text-red-600">KHẨN CẤP</span>
                </h1>
                <p className="text-text-secondary font-medium text-sm">
                  Phát hiện yêu cầu trợ giúp từ người dùng Vision Assistant
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-text-primary/70 text-sm font-bold bg-text-primary/5 rounded-xl py-2 px-4 border border-border-primary">
                  <UserIcon className="w-4 h-4 text-red-400" />
                  <span className="truncate max-w-[200px]">{incoming.userId ?? "Unknown User"}</span>
                </div>
                
                <div className="flex flex-col gap-1 text-text-secondary text-xs font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-mono">{incoming.latitude?.toFixed(5)}, {incoming.longitude?.toFixed(5)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{incoming.timestamp}</span>
                  </div>
                </div>
              </div>

              {incoming.imageBase64 && (
                <div className="relative mb-8 rounded-2xl overflow-hidden border-2 border-red-500/30 group-hover:border-red-500/60 transition-colors">
                  <img
                    src={`data:image/jpeg;base64,${incoming.imageBase64}`}
                    alt="SOS capture"
                    className="w-full h-48 object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 to-transparent" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAckDirect(incoming.sosId ?? incoming.id)}
                  className="min-h-[42px] rounded-xl bg-text-primary/10 border border-border-primary text-text-primary text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-text-primary/20 active:scale-95 transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => handleResolveDirect(incoming.sosId ?? incoming.id)}
                  className="min-h-[42px] rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 transition-all"
                >
                  Đã xử lý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header — stack trên mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            SOS Khẩn Cấp
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Danh sách cảnh báo ({total} tổng)
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-bg-card border border-border-primary text-text-secondary text-sm font-bold hover:bg-text-primary/5 active:scale-[0.98] transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-2xl border border-border-primary overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-4 sm:p-6">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-24 text-text-secondary space-y-4">
            <ShieldAlert className="w-12 h-12 mx-auto opacity-20" />
            <p className="font-medium">Chưa có tín hiệu SOS nào được ghi nhận</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-text-secondary text-[10px] font-black uppercase tracking-widest bg-text-primary/2">
                <th className="text-left px-4 py-3">Mã số</th>
                <th className="text-left px-4 py-3">Người dùng</th>
                <th className="text-left px-4 py-3">Tọa độ</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Thời gian</th>
                <th className="text-left px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/50">
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-text-primary/5 transition-colors group"
                >
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">#{a.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-text-primary font-medium">{a.user?.email ?? a.userId ?? "—"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-text-secondary font-mono text-[11px]">
                    {a.latitude
                      ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[a.status] ?? ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-text-secondary text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 opacity-40" />
                      {new Date(a.created_at).toLocaleString("vi-VN", {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {a.status === "pending" && (
                        <button
                          onClick={() => setConfirm({ type: "ack", id: a.id })}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
                        >
                          Xác nhận
                        </button>
                      )}
                      {a.status !== "resolved" && (
                        <button
                          onClick={() =>
                            setConfirm({ type: "resolve", id: a.id })
                          }
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all"
                        >
                          Xong
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-bg-card border border-border-primary text-text-secondary text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>
          <span className="px-4 py-2 text-text-primary text-sm font-black italic">
            {page} <span className="text-text-secondary not-italic opacity-30">/ {Math.ceil(total / 15)}</span>
          </span>
          <button
            disabled={page * 15 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-bg-card border border-border-primary text-text-secondary text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-white/5 transition-all"
          >
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

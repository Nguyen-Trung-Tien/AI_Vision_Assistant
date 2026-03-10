import { useEffect, useState, useRef, useCallback } from "react";
import { fetchSosAlerts, acknowledgeSos, resolveSos } from "../services/api";
import { io } from "socket.io-client";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const STATUS_COLORS = {
  pending: "bg-red-500/20 text-red-400 border-red-500/30",
  acknowledged: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function SosPage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type:'ack'|'resolve', id, label }
  const [actionLoading, setActionLoading] = useState(false);
  const audioRef = useRef(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await fetchSosAlerts(p, 15);
    setAlerts(res.data ?? []);
    setTotal(res.total ?? 0);
    setPage(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const socket = io("http://127.0.0.1:3000", {
      path: "/socket.io/",
      reconnectionDelayMax: 10000,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socket.emit("join_admin");
    socket.on("sos_incoming", (data) => {
      setIncoming(data);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        setTimeout(() => osc.stop(), 800);
      } catch {}
      load();
    });
    return () => socket.disconnect();
  }, [load]);

  const doAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "ack") {
        await acknowledgeSos(confirm.id);
        toast.success("Đã xác nhận nhận SOS");
      } else {
        await resolveSos(confirm.id, "Đã xử lý bởi admin");
        toast.success("Đã đánh dấu xử lý xong");
      }
      setIncoming(null);
      await load(page);
    } catch {
      toast.error("Thao tác thất bại, vui lòng thử lại");
    }
    setActionLoading(false);
    setConfirm(null);
  };

  // Direct actions from incoming popup (no extra confirm needed for already visible popup)
  const handleAckDirect = async (id) => {
    if (!id) return;
    try {
      await acknowledgeSos(id);
      toast.success("Đã xác nhận nhận SOS");
      setIncoming(null);
      load(page);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };
  const handleResolveDirect = async (id) => {
    if (!id) return;
    try {
      await resolveSos(id, "Đã xử lý bởi admin");
      toast.success("Đã xử lý SOS thành công");
      setIncoming(null);
      load(page);
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

      {/* Incoming SOS Popup */}
      {incoming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-red-900/90 border-2 border-red-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-red-500/50">
            <div className="text-5xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-300 mb-2">
              SOS KHẨN CẤP!
            </h2>
            <p className="text-white/80 mb-1 text-sm">
              User: {incoming.userId ?? "Unknown"}
            </p>
            <p className="text-white/80 mb-1 text-sm">
              📍 {incoming.latitude?.toFixed(5)},{" "}
              {incoming.longitude?.toFixed(5)}
            </p>
            <p className="text-white/50 text-xs mb-6">{incoming.timestamp}</p>
            {incoming.imageBase64 && (
              <img
                src={`data:image/jpeg;base64,${incoming.imageBase64}`}
                alt="SOS capture"
                className="mb-4 rounded-lg w-full max-h-48 object-cover border border-red-500/40"
              />
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleAckDirect(incoming.sosId ?? incoming.id)}
                className="px-5 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-sm font-medium hover:bg-yellow-500/30 transition-all"
              >
                Đã nhận
              </button>
              <button
                onClick={() => handleResolveDirect(incoming.sosId ?? incoming.id)}
                className="px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-medium hover:bg-green-500/30 transition-all"
              >
                Đã xử lý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🚨 SOS Khẩn Cấp</h2>
          <p className="text-white/40 text-sm mt-1">
            Danh sách cảnh báo từ người dùng ({total} tổng)
          </p>
        </div>
        <button
          onClick={() => load(page)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-all"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-white/40 text-sm">
            <div className="loader-ring" /> Đang tải...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-white/30">Chưa có SOS nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Tọa độ</th>
                <th className="text-left p-4">Trạng thái</th>
                <th className="text-left p-4">Thời gian</th>
                <th className="text-left p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white/50 font-mono">#{a.id}</td>
                  <td className="p-4 text-white/70">
                    {a.user?.email ?? a.userId ?? "—"}
                  </td>
                  <td className="p-4 text-white/60 font-mono text-xs">
                    {a.latitude
                      ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-xs ${STATUS_COLORS[a.status] ?? ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-white/40 text-xs">
                    {new Date(a.created_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {a.status === "pending" && (
                        <button
                          onClick={() => setConfirm({ type: "ack", id: a.id })}
                          className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs hover:bg-yellow-500/20 transition-all"
                        >
                          Nhận
                        </button>
                      )}
                      {a.status !== "resolved" && (
                        <button
                          onClick={() =>
                            setConfirm({ type: "resolve", id: a.id })
                          }
                          className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs hover:bg-green-500/20 transition-all"
                        >
                          Xử lý
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

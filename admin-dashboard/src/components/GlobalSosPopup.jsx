import { useState } from "react";

import { ShieldAlert, MapPin, Clock, User as UserIcon, X, Phone, Heart } from "lucide-react";
import { useAcknowledgeSos, useResolveSos } from "@/hooks/use-queries";
import { useToast } from "./Toast";
import { useNotificationContext } from "../providers/NotificationProvider";

export default function GlobalSosPopup() {
  const toast = useToast();
  const ackMutation = useAcknowledgeSos();
  const resolveMutation = useResolveSos();
  const { incomingSos, setIncomingSos } = useNotificationContext();
  const [viewingUser, setViewingUser] = useState(null);

  // if (!incomingSos && !viewingUser) return null;

  const handleAckDirect = async (id) => {
    if (!id) return;
    try {
      await ackMutation.mutateAsync({ id });
      toast?.success?.("Đã xác nhận nhận SOS");
      setIncomingSos(null);
    } catch {
      toast?.error?.("Thao tác thất bại");
    }
  };

  const handleResolveDirect = async (id) => {
    if (!id) return;
    try {
      await resolveMutation.mutateAsync({ id, note: "Đã xử lý bởi admin" });
      toast?.success?.("Đã xử lý SOS thành công");
      setIncomingSos(null);
    } catch {
      toast?.error?.("Thao tác thất bại");
    }
  };

  return (
    <>
      {/* Emergency Contacts Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border-primary rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-primary flex items-center justify-between bg-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Người thân
                  </h3>
                  <p className="text-xs text-text-secondary font-medium italic">
                    {viewingUser.email}
                  </p>
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
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-text-primary/5 border border-border-primary flex items-center justify-between group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-text-primary uppercase tracking-tight">
                        {contact.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-bold">
                          {contact.relationship}
                        </span>
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
                  <p className="text-sm font-medium">
                    Không tìm thấy thông tin người thân
                  </p>
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

      {/* Main Incoming Modal */}
      {incomingSos && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-red-950/90 border-2 border-red-500 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-50" />

            <button
              onClick={() => setIncomingSos(null)}
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
                <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                  SOS <span className="text-red-500">KHẨN CẤP</span>
                </h1>
                <p className="text-red-200/80 font-medium text-sm">
                  Phát hiện yêu cầu trợ giúp từ người dùng Vision Assistant
                </p>
              </div>
              <div className="space-y-4 mb-8">
                <button
                  onClick={() =>
                    setViewingUser({
                      email: incomingSos.userEmail || "Unknown",
                      contacts: incomingSos.emergencyContacts || [],
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 text-white/90 text-sm font-bold bg-white/5 rounded-xl py-2 px-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/user"
                >
                  <UserIcon className="w-4 h-4 text-red-400 group-hover/user:text-white" />
                  <span className="truncate max-w-[200px] underline decoration-dotted underline-offset-4">
                    {incomingSos.userEmail ?? incomingSos.userId ?? "Unknown User"}
                  </span>
                </button>
                <div className="flex flex-col gap-2 text-red-200/80 text-xs font-medium">
                  <a
                    href={`https://www.google.com/maps?q=${incomingSos.latitude},${incomingSos.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500 hover:text-white transition-all group"
                  >
                    <MapPin className="w-4 h-4 group-hover:animate-bounce" />
                    <span className="font-mono font-black">
                      {typeof incomingSos.latitude === 'number' || !isNaN(Number(incomingSos.latitude))
                        ? Number(incomingSos.latitude).toFixed(5)
                        : "Unknown"},{" "}
                      {typeof incomingSos.longitude === 'number' || !isNaN(Number(incomingSos.longitude))
                        ? Number(incomingSos.longitude).toFixed(5)
                        : "Unknown"}
                    </span>
                  </a>
                  <div className="flex items-center justify-center gap-2 opacity-70">
                    <Clock className="w-3.5 h-3.5" />{" "}
                    <span>{incomingSos.timestamp}</span>
                  </div>
                </div>
              </div>
              {incomingSos.imageBase64 && (
                <div className="relative mb-8 rounded-2xl overflow-hidden border-2 border-red-500/30 group-hover:border-red-500/60 transition-colors">
                  <img
                    src={`data:image/jpeg;base64,${incomingSos.imageBase64}`}
                    alt="SOS capture"
                    className="w-full h-48 object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 to-transparent" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAckDirect(incomingSos.sosId ?? incomingSos.id)}
                  className="min-h-[42px] rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-white/20 active:scale-95 transition-all"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => handleResolveDirect(incomingSos.sosId ?? incomingSos.id)}
                  className="min-h-[42px] rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 transition-all"
                >
                  Đã xử lý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

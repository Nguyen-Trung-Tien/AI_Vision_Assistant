import { useState, useEffect } from "react";
import { fetchSystemSettings, updateSystemSetting } from "../services/api";
import { useToast } from "../components/Toast";
import { 
  Settings as SettingsIcon, 
  Sliders, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Info,
  ShieldCheck,
  Zap,
  Bell,
  HardDrive
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (err) {
      toast?.error?.("Không thể tải cấu hình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key, value) => {
    try {
      await updateSystemSetting(key, value);
      toast?.success?.(`Cập nhật "${key}" thành công`);
      fetchSettings();
    } catch (err) {
      toast?.error?.("Cập nhật thất bại");
    }
  };

  const getIcon = (key) => {
    if (key.includes('ALERT')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (key.includes('NOTIFICATION')) return <Bell className="w-5 h-5 text-indigo-500" />;
    if (key.includes('STORAGE')) return <HardDrive className="w-5 h-5 text-cyan-500" />;
    if (key.includes('SECURITY')) return <ShieldCheck className="w-5 h-5 text-green-500" />;
    return <Sliders className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary uppercase">
            SYSTEM <span className="text-indigo-500">SETTINGS</span>
          </h1>
          <p className="text-text-secondary font-medium text-sm">
            Tinh chỉnh tham số vận hành lõi và mạng lưới an toàn
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 py-2 rounded-xl bg-text-primary/5 border border-border-primary text-text-secondary text-xs font-black uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="bg-bg-card border border-border-primary rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Zap className="w-48 h-48 text-indigo-500" />
        </div>

        <div className="p-1 sm:p-4 md:p-10 space-y-6">
          {loading && settings.length === 0 ? (
            <div className="space-y-4 py-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
              ))}
            </div>
          ) : (
            settings.map((s) => (
              <div
                key={s.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-text-primary/5 border border-border-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                    {getIcon(s.key)}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-text-primary group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                      {s.key.replace(/_/g, " ")}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold opacity-60">
                      <Info className="w-3.5 h-3.5" />
                      <p className="italic">{s.description || "Không có mô tả cho tham số này"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative group/input">
                    <input
                      type="text"
                      defaultValue={s.value}
                      onBlur={(e) => {
                        if (e.target.value !== s.value) {
                          handleUpdate(s.key, e.target.value);
                        }
                      }}
                      className="min-h-[48px] bg-bg-primary border-2 border-border-primary text-white text-sm font-black rounded-2xl px-6 w-full md:w-40 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-center tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          
          {settings.length === 0 && !loading && (
            <div className="py-20 text-center text-text-secondary/30 italic text-sm">
              Không tìm thấy tham số cấu hình nào
            </div>
          )}
        </div>

        <div className="px-10 py-8 bg-white/[0.03] border-t border-border-primary flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60">
              Cấu hình được bảo vệ bởi lớp bảo mật Admin
            </p>
          </div>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic animate-pulse">
            Tự động lưu khi mất focus (Blur)
          </p>
        </div>
      </div>
    </div>
  );
}


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
  HardDrive,
  Cpu,
  Shield,
  Activity,
  Globe,
  CheckCircle2
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: SettingsIcon },
  { id: 'ai', name: 'AI & Nhận diện', icon: Cpu },
  { id: 'sos', name: 'SOS & An toàn', icon: Shield },
  { id: 'notif', name: 'Thông báo', icon: Bell },
  { id: 'system', name: 'Hệ thống', icon: HardDrive },
];


export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(null); // Key being saved
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
    setSaving(key);
    try {
      await updateSystemSetting(key, value);
      setSaving('done');
      setTimeout(() => setSaving(null), 2000);
    } catch (err) {
      toast?.error?.("Cập nhật thất bại");
      setSaving(null);
    }
  };

  const getIcon = (key) => {
    if (key.includes('ALERT') || key.includes('RADIUS')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (key.includes('NOTIFICATION')) return <Bell className="w-5 h-5 text-indigo-500" />;
    if (key.includes('STORAGE')) return <HardDrive className="w-5 h-5 text-cyan-500" />;
    if (key.includes('SECURITY') || key.includes('AUTH')) return <ShieldCheck className="w-5 h-5 text-green-500" />;
    if (key.includes('AI') || key.includes('CONFIDENCE')) return <Cpu className="w-5 h-5 text-pink-500" />;
    return <Sliders className="w-5 h-5 text-indigo-500" />;
  };

  const getCategory = (key) => {
    if (key.includes('AI') || key.includes('CONFIDENCE')) return 'ai';
    if (key.includes('SOS') || key.includes('RADIUS') || key.includes('ALERT')) return 'sos';
    if (key.includes('NOTIF') || key.includes('PUSH')) return 'notif';
    if (key.includes('STORAGE') || key.includes('DB') || key.includes('SYSTEM')) return 'system';
    return 'system';
  };

  const filteredSettings = settings.filter(s => 
    activeCategory === 'all' || getCategory(s.key) === activeCategory
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="SYSTEM" 
        highlight="CONFIGURATION" 
        description="Quản trị các tham số vận hành lõi và thiết lập mạng lưới an toàn"
      >
        <div className="flex items-center gap-3">
          {saving === 'done' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã lưu thay đổi
            </div>
          )}
          <button
            onClick={fetchSettings}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all active:scale-95 group shadow-sm"
          >
            {loading ? <Loading variant="inline" size="xs" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
            Sync Data
          </button>
        </div>
      </PageHeader>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                activeCategory === cat.id 
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20 translate-x-1' 
                : 'bg-text-primary/5 text-text-secondary border-border-primary hover:bg-text-primary/10 hover:text-text-primary'
              }`}
            >
              <cat.icon className={`w-5 h-5 ${activeCategory === cat.id ? 'text-white' : 'text-indigo-500'}`} />
              <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
            </button>
          ))}

          <div className="mt-8 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
             <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Security Info</span>
             </div>
             <p className="text-[11px] font-medium text-text-secondary leading-relaxed">
                Mọi thay đổi tại đây sẽ ảnh hưởng trực tiếp đến hiệu năng AI và độ trễ của hệ thống SOS. Hãy cẩn trọng khi điều chỉnh.
             </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-9 space-y-4">
          {loading && settings.length === 0 ? (
            <Loading size="xl" text="Đang chuẩn bị dữ liệu cấu hình..." className="py-32 bg-text-primary/5 rounded-[3rem] border border-border-primary border-dashed" />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSettings.map((s) => (
                <div
                  key={s.id}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-7 rounded-[2rem] border transition-all duration-500 ${
                    saving === s.key 
                    ? 'bg-indigo-500/10 border-indigo-500 ring-4 ring-indigo-500/5' 
                    : 'bg-bg-card border-border-primary hover:border-text-primary/20 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-bg-primary border border-border-primary flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-500">
                      {getIcon(s.key)}
                    </div>
                    <div className="space-y-1.5 py-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                          {s.key.replace(/_/g, " ")}
                        </h3>
                        {saving === s.key && (
                          <div className="flex items-center gap-2">
                            <Loading variant="inline" size="xs" />
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Saving...</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-text-secondary opacity-60 max-w-md italic">
                         {s.description || "Tham số cấu hình hệ thống chưa được định nghĩa mô tả chi tiết."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group/input flex-1 md:flex-none">
                      <input
                        type="text"
                        defaultValue={s.value}
                        onBlur={(e) => {
                          if (e.target.value !== s.value) {
                            handleUpdate(s.key, e.target.value);
                          }
                        }}
                        className="h-14 bg-bg-primary border-2 border-border-primary text-text-primary text-base font-black rounded-2xl px-8 w-full md:w-44 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all text-center tabular-nums placeholder:opacity-20"
                        placeholder="Giá trị..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSettings.length === 0 && (
                <div className="py-32 bg-white/[0.01] border border-dashed border-border-primary rounded-[3rem] text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-text-secondary opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-text-primary uppercase tracking-widest">No Settings Found</p>
                    <p className="text-xs font-medium text-text-secondary italic">Không có tham số nào trong danh mục này</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-bg-card border border-border-primary rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black text-text-primary uppercase tracking-widest">Auto-Sync Protocol Active</p>
            <p className="text-[11px] font-medium text-text-secondary">Các thay đổi sẽ được áp dụng ngay lập tức cho toàn bộ người dùng sau khi lưu.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">Status</span>
              <span className="text-[11px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Connection
              </span>
           </div>
           <button 
             onClick={fetchSettings}
             className="px-6 py-2.5 bg-text-primary text-bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-black/20"
           >
             Reload All
           </button>
        </div>
      </div>
    </div>
  );
}

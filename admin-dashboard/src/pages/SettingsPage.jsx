import { useState, useEffect } from "react";
import {
  fetchSystemSettings,
  updateSystemSetting,
  getStoredRole,
} from "../services/api";
import { useAiModels } from "../hooks/use-queries";
import { useToast } from "../components/Toast";
import {
  Settings as SettingsIcon,
  Sliders,
  Save,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Bell,
  HardDrive,
  Cpu,
  Shield,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";
import ConfirmDialog from "../components/ConfirmDialog";

const CATEGORIES = [
  { id: "all", name: "Tất cả", icon: SettingsIcon },
  { id: "ai", name: "AI & Nhận diện", icon: Cpu },
  { id: "sos", name: "SOS & An toàn", icon: Shield },
  { id: "notif", name: "Thông báo", icon: Bell },
  { id: "system", name: "Hệ thống", icon: HardDrive },
];

const SETTING_OPTIONS = {
  AI_FPS_LIMIT: ["1", "2", "5", "10", "15", "30"],
  AI_CONFIDENCE_THRESHOLD: ["0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"],
  SYSTEM_MAINTENANCE: ["true", "false"],
};

export default function SettingsPage() {
  const toast = useToast();
  const myRole = getStoredRole();
  const isSuperAdmin = myRole === "SUPER_ADMIN";
  const { data: aiModels = [] } = useAiModels();
  const [settings, setSettings] = useState([]);
  const [localValues, setLocalValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [saving, setSaving] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
      const initialLocal = {};
      data.forEach((s) => (initialLocal[s.key] = s.value));
      setLocalValues(initialLocal);
    } catch (err) {
      toast?.error?.("Không thể tải cấu hình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const initiateUpdate = (key, value) => {
    if (!isSuperAdmin) {
      toast?.error?.("Bạn không có quyền thay đổi cấu hình hệ thống");
      return;
    }
    setPendingUpdate({ key, value });
    setConfirmOpen(true);
  };

  const handleUpdate = async () => {
    if (!pendingUpdate || !isSuperAdmin) return;
    const { key, value } = pendingUpdate;
    setConfirmOpen(false);
    setSaving(key);
    try {
      await updateSystemSetting(key, value);
      toast?.success?.(`Đã cập nhật ${key.replace(/_/g, " ")}`);
      setSaving("done");
      setTimeout(() => setSaving(null), 2000);
      // Refresh settings to ensure sync
      const updatedData = await fetchSystemSettings();
      setSettings(updatedData);
    } catch (err) {
      toast?.error?.("Cập nhật thất bại");
      setSaving(null);
    }
    setPendingUpdate(null);
  };

  const getIcon = (key) => {
    if (key.includes("ALERT") || key.includes("RADIUS"))
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (key.includes("NOTIFICATION"))
      return <Bell className="w-4 h-4 text-indigo-400" />;
    if (key.includes("STORAGE"))
      return <HardDrive className="w-4 h-4 text-cyan-400" />;
    if (key.includes("SECURITY") || key.includes("AUTH"))
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (
      key.includes("AI") ||
      key.includes("CONFIDENCE") ||
      key.includes("CLASSES")
    )
      return <Cpu className="w-4 h-4 text-pink-400" />;
    return <Sliders className="w-4 h-4 text-indigo-400" />;
  };

  const getCategory = (key) => {
    if (
      key.includes("AI") ||
      key.includes("CONFIDENCE") ||
      key.includes("CLASSES")
    )
      return "ai";
    if (key.includes("SOS") || key.includes("RADIUS") || key.includes("ALERT"))
      return "sos";
    if (key.includes("NOTIF") || key.includes("PUSH")) return "notif";
    if (key.includes("STORAGE") || key.includes("DB") || key.includes("SYSTEM"))
      return "system";
    return "system";
  };

  const filteredSettings = settings.filter(
    (s) => activeCategory === "all" || getCategory(s.key) === activeCategory,
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận thay đổi?"
        message={`Bạn có chắc chắn muốn thay đổi tham số "${pendingUpdate?.key?.replace(/_/g, " ")}" thành "${pendingUpdate?.value}"?`}
        confirmLabel="Xác nhận"
        onConfirm={handleUpdate}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingUpdate(null);
        }}
      />

      <PageHeader
        title="SYSTEM"
        highlight="CONFIGURATION"
        description="Quản trị tham số vận hành lõi"
      >
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all group"
        >
          {loading ? (
            <Loading variant="inline" size="xs" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          )}
          Làm mới
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-[10px] font-black uppercase tracking-wider ${
                activeCategory === cat.id
                  ? "bg-indigo-500 text-white border-indigo-400 shadow-md"
                  : "bg-bg-card text-text-secondary border-border-primary hover:border-indigo-500/30"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}

          <div className="mt-6 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[9px] font-black text-text-primary uppercase tracking-widest">
                Lưu ý bảo mật
              </span>
            </div>
            <p className="text-[10px] font-medium text-text-secondary leading-relaxed opacity-70">
              Thay đổi có hiệu lực ngay lập tức. Hãy kiểm tra kỹ trước khi xác
              nhận.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          {loading && settings.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-bg-card border border-border-primary rounded-3xl border-dashed">
              <Loading size="lg" text="Đang tải cấu hình..." />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSettings.map((s) => {
                const hasChanged = localValues[s.key] !== s.value;
                const options = SETTING_OPTIONS[s.key];

                return (
                  <div
                    key={s.id}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 px-4 rounded-2xl border transition-all ${
                      hasChanged
                        ? "bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/10"
                        : "bg-bg-card border-border-primary hover:border-text-primary/20"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4 flex-1">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                          hasChanged
                            ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20"
                            : "bg-bg-primary border border-border-primary text-text-secondary group-hover:border-indigo-500/30 group-hover:text-indigo-500"
                        }`}
                      >
                        {getIcon(s.key)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-black text-text-primary uppercase tracking-wider">
                          {s.key.replace(/_/g, " ")}
                        </h3>
                        <p className="text-[10px] font-medium text-text-secondary opacity-60 truncate">
                          {s.description || "Không có mô tả."}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex gap-4 w-full sm:w-auto justify-end ${s.key.includes("CLASSES") ? "items-start" : "items-center"}`}
                    >
                      {s.key === "ACTIVE_OBJECT_MODEL" ||
                      s.key === "ACTIVE_MONEY_MODEL" ||
                      s.key === "ACTIVE_AI_MODEL" ? (
                        <select
                          value={localValues[s.key] ?? s.value ?? ""}
                          disabled={!isSuperAdmin}
                          onChange={(e) =>
                            setLocalValues({
                              ...localValues,
                              [s.key]: e.target.value,
                            })
                          }
                          className={`h-9 w-full sm:w-64 bg-bg-primary border border-border-primary text-text-primary text-[11px] font-black rounded-lg px-3 outline-none focus:border-indigo-500 transition-all appearance-none ${isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        >
                          {aiModels.length === 0 && (
                            <option value={localValues[s.key] ?? s.value ?? ""}>
                              {localValues[s.key] ?? s.value ?? "Loading..."}
                            </option>
                          )}
                          {aiModels
                            .filter((m) =>
                              s.key === "ACTIVE_OBJECT_MODEL"
                                ? m.category === "object"
                                : s.key === "ACTIVE_MONEY_MODEL"
                                  ? m.category === "money"
                                  : true,
                            )
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          {aiModels.length > 0 &&
                            !aiModels.some(
                              (m) => m.id === (localValues[s.key] ?? s.value),
                            ) && (
                              <option
                                value={localValues[s.key] ?? s.value ?? ""}
                              >
                                {localValues[s.key] ?? s.value} (Không xác định)
                              </option>
                            )}
                        </select>
                      ) : options ? (
                        <select
                          value={localValues[s.key] ?? s.value}
                          disabled={!isSuperAdmin}
                          onChange={(e) =>
                            setLocalValues({
                              ...localValues,
                              [s.key]: e.target.value,
                            })
                          }
                          className={`h-9 w-32 bg-bg-primary border border-border-primary text-text-primary text-[11px] font-black rounded-lg px-3 outline-none focus:border-indigo-500 transition-all appearance-none ${isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === "true"
                                ? "BẬT (True)"
                                : opt === "false"
                                  ? "TẮT (False)"
                                  : opt}
                            </option>
                          ))}
                        </select>
                      ) : s.key.includes("CLASSES") ? (
                        <textarea
                          value={localValues[s.key] ?? s.value ?? ""}
                          disabled={!isSuperAdmin}
                          onChange={(e) =>
                            setLocalValues({
                              ...localValues,
                              [s.key]: e.target.value,
                            })
                          }
                          rows={3}
                          className={`w-full sm:w-64 bg-bg-primary border border-border-primary text-text-primary text-[11px] font-medium rounded-lg p-2 outline-none focus:border-indigo-500 transition-all ${isSuperAdmin ? "" : "cursor-not-allowed opacity-50"}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={localValues[s.key] ?? s.value ?? ""}
                          disabled={!isSuperAdmin}
                          onChange={(e) =>
                            setLocalValues({
                              ...localValues,
                              [s.key]: e.target.value,
                            })
                          }
                          className={`h-9 w-32 bg-bg-primary border border-border-primary text-text-primary text-[11px] font-black rounded-lg px-3 outline-none focus:border-indigo-500 transition-all text-center ${isSuperAdmin ? "" : "cursor-not-allowed opacity-50"}`}
                        />
                      )}

                      <button
                        disabled={
                          !hasChanged || saving === s.key || !isSuperAdmin
                        }
                        onClick={() =>
                          initiateUpdate(s.key, localValues[s.key])
                        }
                        className={`flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          hasChanged && isSuperAdmin
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
                            : "bg-text-primary/5 text-text-secondary opacity-30 grayscale cursor-not-allowed"
                        }`}
                        title={
                          isSuperAdmin
                            ? "Lưu thay đổi"
                            : "Bạn không có quyền thay đổi"
                        }
                      >
                        {saving === s.key ? (
                          <Loading variant="inline" size="xs" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Lưu
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 bg-bg-card border border-border-primary rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-border-primary bg-indigo-500/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
                    Hướng dẫn cấu hình
                  </h2>
                  <p className="text-[11px] font-medium text-text-secondary">
                    Chi tiết các tham số vận hành hệ thống
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <DocItem
                title="AI FPS Limit"
                content="Giới hạn số khung hình AI phân tích mỗi giây. Giá trị cao (15-30) giúp nhận diện mượt mà nhưng tốn pin và băng thông. Khuyến nghị: 2-5 cho đi bộ thông thường."
              />
              <DocItem
                title="Confidence Threshold"
                content="Ngưỡng tin cậy để AI đưa ra thông báo. 0.5 nghĩa là AI chắc chắn trên 50% mới báo. Tăng lên để giảm báo động nhầm, giảm xuống để nhạy hơn với vật cản mờ."
              />
              <DocItem
                title="SOS Radius"
                content="Bán kính (km) tìm kiếm tình nguyện viên khi người dùng cần hỗ trợ khẩn cấp. Nên đặt phù hợp với mật độ dân cư (Thành phố: 2-5km, Nông thôn: 10km)."
              />
              <DocItem
                title="Maintenance Mode"
                content="Khi bật (True), hệ thống sẽ từ chối các yêu cầu mới từ app mobile để thực hiện bảo trì. Chỉ nên sử dụng khi cần nâng cấp hạ tầng quan trọng."
              />
              <DocItem
                title="Object Detection Classes"
                content="13 Lớp: bang_hieu, cau_thang, den_xanh, den_do, nap_cong, nguoi, o_ga, rao_chan, thung_rac, vach_qua_duong, xe_may, xe_dap, xe_lon."
              />
              <DocItem
                title="Currency Recognition Classes"
                content="9 Mệnh giá: 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocItem({ title, content }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
        <ArrowRight className="w-3 h-3" />
        {title}
      </h4>
      <p className="text-[11px] font-medium text-text-secondary leading-relaxed pl-5 border-l border-indigo-500/20">
        {content}
      </p>
    </div>
  );
}

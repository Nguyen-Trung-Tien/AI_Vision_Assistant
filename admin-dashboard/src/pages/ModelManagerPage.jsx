import { useState } from "react";
import { useAiModels, useAiLogs, useSwitchAiModel } from "../hooks/use-queries";
import { useToast } from "../components/Toast";
import {
  Brain,
  Database,
  Activity,
  RefreshCw,
  Zap,
  ShieldCheck,
  Clock,
  User as UserIcon,
  Tag,
  Target,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";

export default function ModelManagerPage() {
  const [page, setPage] = useState(1);
  const toast = useToast();

  const {
    data: models = [],
    isLoading: loadingModels,
    refetch: refetchModels,
  } = useAiModels();
  const {
    data: logsData,
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useAiLogs(page, 10);
  const switchMutation = useSwitchAiModel();

  const logs = logsData?.items || [];
  const loading = loadingModels || loadingLogs;

  const handleRefresh = () => {
    refetchModels();
    refetchLogs();
  };

  const handleSwitch = async (modelId) => {
    try {
      await switchMutation.mutateAsync({ modelId });
      toast?.success?.(`Đã chuyển sang model ${modelId}`);
    } catch {
      toast?.error?.("Chuyển đổi thất bại");
    }
  };

  const tableHeaders = [
    { label: "Time" },
    { label: "User" },
    { label: "Task" },
    { label: "Result" },
    { label: "Confidence", className: "text-right" },
  ];

  const renderModelCard = (m) => {
    const isObject = m.category === "object";
    const ThemeIcon = isObject ? Target : Zap;
    const themeColor = isObject ? "text-pink-500" : "text-green-500";
    const themeBorder = isObject ? "border-pink-500/50" : "border-green-500/50";
    const themeShadow = isObject ? "shadow-pink-500/5" : "shadow-green-500/5";
    const themeBg = isObject ? "bg-pink-500/[0.01]" : "bg-green-500/[0.01]";
    const activeBgColor = isObject
      ? "bg-pink-500 text-white border-pink-400"
      : "bg-green-500 text-white border-green-400";
    const buttonHover = isObject ? "hover:bg-pink-500" : "hover:bg-green-500";

    return (
      <div
        key={m.id}
        className={`group relative overflow-hidden bg-bg-card border p-6 rounded-2xl transition-all duration-500 hover:translate-y-[-2px] flex flex-col justify-between min-h-[160px] ${
          m.status === "ACTIVE"
            ? `${themeBorder} shadow-xl ${themeShadow} ${themeBg}`
            : "border-border-primary hover:border-white/20"
        }`}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
          {isObject ? (
            <Zap className={`w-40 h-40 ${themeColor}`} />
          ) : (
            <Database className={`w-40 h-40 ${themeColor}`} />
          )}
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2 rounded-xl bg-text-primary/5 border border-border-primary`}
              >
                <ThemeIcon className={`w-4 h-4 ${themeColor}`} />
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                  m.status === "ACTIVE"
                    ? activeBgColor
                    : "bg-text-primary/5 text-text-secondary border-border-primary"
                }`}
              >
                {m.status}
              </span>
            </div>

            <h3 className="text-lg font-black text-text-primary tracking-tight mb-3">
              {m.name}
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-text-secondary flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 opacity-60" />{" "}
                <span className="uppercase tracking-wider">{m.id}</span>
              </p>
              <p className="text-[11px] font-mono text-text-secondary/60 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 opacity-60" /> {m.path}
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
            <div className="text-right flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-50 mb-1">
                  Accuracy
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${themeColor}`} />
                  <p className="text-xl font-bold text-text-primary tabular-nums leading-none">
                    {m.accuracy}
                  </p>
                </div>
              </div>
              {m.classes && (
                <span className="px-2.5 py-1 bg-text-primary/5 rounded-lg border border-border-primary text-[10px] text-text-secondary font-bold uppercase tracking-wider h-fit">
                  {m.classes} CLS
                </span>
              )}
            </div>

            {m.status !== "ACTIVE" ? (
              <button
                onClick={() => handleSwitch(m.id)}
                className={`mt-2 px-6 py-2.5 bg-text-primary text-bg-primary ${buttonHover} hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md`}
              >
                DEPLOY
              </button>
            ) : (
              <div className={`mt-2 flex items-center gap-2 ${themeColor}`}>
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Running
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="AI MODEL"
        highlight="MANAGEMENT"
        description="Quản lý các phiên bản AI Model và kiểm soát chất lượng nhận diện"
      >
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-1.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </PageHeader>

      <div className="space-y-12">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-500" /> Nhận diện Vật thể
              (Object Detection)
            </h2>
            <span className="px-3 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-black rounded-full uppercase tracking-widest">
              {models.filter((m) => m.category === "object").length} Models
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading && models.length === 0
              ? [1, 2].map((i) => (
                  <div
                    key={`loader-obj-${i}`}
                    className="h-40 rounded-2xl bg-white/5 animate-pulse border border-border-primary"
                  />
                ))
              : models
                  .filter((m) => m.category === "object")
                  .map(renderModelCard)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" /> Nhận diện Tiền
              (Currency Recognition)
            </h2>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase tracking-widest">
              {models.filter((m) => m.category === "money").length} Models
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading && models.length === 0
              ? [1, 2].map((i) => (
                  <div
                    key={`loader-money-${i}`}
                    className="h-40 rounded-2xl bg-white/5 animate-pulse border border-border-primary"
                  />
                ))
              : models
                  .filter((m) => m.category === "money")
                  .map(renderModelCard)}
          </div>
        </section>
      </div>

      <DataTable
        headers={tableHeaders}
        loading={loading && logs.length === 0}
        empty={logs.length === 0}
        emptyMessage="Không có dữ liệu log nào được ghi nhận"
        title="Recent Detection Logs"
        icon={<Database className="w-5 h-5 text-pink-500" />}
        actions={
          <span className="px-3 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-black rounded-full uppercase tracking-widest">
            Live Monitoring
          </span>
        }
      >
        {logs.map((log) => (
          <tr
            key={log.id}
            className="hover:bg-text-primary/5 transition-colors group border-b border-border-primary last:border-0"
          >
            <td className="px-8 py-5">
              <div className="flex items-center gap-2 text-text-secondary font-bold text-xs italic">
                <Clock className="w-3 h-3 opacity-40" />
                {new Date(log.created_at).toLocaleTimeString("vi-VN")}
              </div>
            </td>
            <td className="px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-text-primary/5 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-text-secondary" />
                </div>
                <span className="text-xs font-black text-text-primary">
                  {log.user?.email?.split("@")[0] || "Guest"}
                </span>
              </div>
            </td>
            <td className="px-8 py-5">
              <span className="px-3 py-1 bg-text-primary/5 border border-border-primary rounded-full text-[10px] font-black text-text-secondary uppercase tracking-widest">
                {log.action_type}
              </span>
            </td>
            <td className="px-8 py-5">
              <p className="text-xs text-text-primary font-bold truncate max-w-[200px] sm:max-w-xs group-hover:text-pink-400 transition-colors">
                {log.result_text || "—"}
              </p>
            </td>
            <td className="px-8 py-5">
              <div className="flex items-center justify-end gap-3">
                <div className="flex-1 h-1.5 w-20 bg-text-primary/5 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full shadow-[0_0_8px] ${
                      log.confidence_score > 0.8
                        ? "bg-green-500 shadow-green-500/50"
                        : "bg-yellow-500 shadow-yellow-500/50"
                    }`}
                    style={{ width: `${(log.confidence_score || 0) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 min-w-[45px] justify-end">
                  <Target className="w-3 h-3 text-text-secondary opacity-40" />
                  <span className="text-[11px] font-black text-text-primary tabular-nums">
                    {Math.round((log.confidence_score || 0) * 100)}%
                  </span>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {logsData?.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={logsData.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

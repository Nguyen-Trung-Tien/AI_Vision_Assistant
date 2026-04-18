import { useState, useEffect } from "react";
import { fetchAiModels, fetchAiLogs, switchAiModel } from "../services/api";
import { useToast } from "../components/Toast";
import { 
  Brain, 
  Database, 
  Activity, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User as UserIcon,
  Tag,
  Target
} from "lucide-react";
import { TableSkeleton } from "../components/ui/Skeleton";

export default function ModelManagerPage() {
  const [models, setModels] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeModel, setActiveModel] = useState("");
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const mData = await fetchAiModels();
      setModels(mData);
      setActiveModel(mData.find(m => m.status === 'ACTIVE')?.id || "");

      const lData = await fetchAiLogs(page, 10);
      setLogs(lData.items || []);
    } catch (err) {
      toast?.error?.("Không thể tải dữ liệu AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleSwitch = async (modelId) => {
    try {
      await switchAiModel(modelId);
      toast?.success?.(`Đã chuyển sang model ${modelId}`);
      fetchData();
    } catch (err) {
      toast?.error?.("Chuyển đổi thất bại");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary uppercase">
            AI MODEL <span className="text-indigo-500">MANAGEMENT</span>
          </h1>
          <p className="text-text-secondary font-medium text-sm">
            Quản lý các phiên bản AI Model và kiểm soát chất lượng nhận diện
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-1.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && models.length === 0 ? (
          [1, 2, 3].map(i => (
             <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-border-primary" />
          ))
        ) : models.map((m) => (
          <div 
            key={m.id}
            className={`group relative overflow-hidden bg-bg-card border-2 p-5 rounded-2xl transition-all duration-500 hover:translate-y-[-4px] ${
              m.status === 'ACTIVE' ? 'border-pink-500/50 shadow-xl shadow-pink-500/5 bg-pink-500/[0.01]' : 'border-border-primary hover:border-white/20'
            }`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-16 h-16 text-pink-500" />
            </div>

            <div className="flex justify-between items-start mb-4">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                m.status === 'ACTIVE' ? 'bg-pink-500 text-white border-pink-400' : 'bg-text-primary/5 text-text-secondary border-border-primary'
              }`}>
                {m.status}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-50">Type</span>
                <span className="text-xs font-black text-text-primary">{m.type}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-text-primary tracking-tight">{m.name}</h3>
            <p className="text-xs font-bold text-text-secondary mt-2 flex items-center gap-2">
              <Tag className="w-3 h-3" /> {m.id}
            </p>
            
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">Accuracy</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <p className="text-2xl font-bold text-text-primary tabular-nums">{m.accuracy}</p>
                </div>
              </div>
              {m.status !== 'ACTIVE' ? (
                <button 
                  onClick={() => handleSwitch(m.id)}
                  className="px-4 py-2 bg-text-primary text-bg-primary hover:bg-pink-500 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md"
                >
                  DEPLOY
                </button>
              ) : (
                <div className="flex items-center gap-2 text-pink-500">
                  <Activity className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Running</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-border-primary rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-6 py-4.5 border-b border-border-primary bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-pink-500" />
            <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">Recent Detection Logs</h2>
          </div>
          <span className="px-3 py-1 bg-pink-500/10 text-pink-500 text-[10px] font-black rounded-full uppercase tracking-widest">
            Live Monitoring
          </span>
        </div>
        <div className="overflow-x-auto">
          {loading && logs.length === 0 ? (
            <div className="p-8">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-primary text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  <th className="px-8 py-5">Time</th>
                  <th className="px-8 py-5">User</th>
                  <th className="px-8 py-5">Task</th>
                  <th className="px-8 py-5">Result</th>
                  <th className="px-8 py-5 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-text-secondary font-bold text-xs italic">
                        <Clock className="w-3 h-3 opacity-40" />
                        {new Date(log.created_at).toLocaleTimeString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-text-secondary" />
                        </div>
                        <span className="text-xs font-black text-text-primary">
                          {log.user?.email?.split('@')[0] || "Guest"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-text-secondary uppercase tracking-widest">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-text-primary font-bold truncate max-w-[200px] sm:max-w-xs group-hover:text-pink-400 transition-colors">
                        {log.result_text || "—"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex-1 h-1.5 w-20 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full shadow-[0_0_8px] ${
                              log.confidence_score > 0.8 ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'
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
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-text-secondary/30 italic text-sm">
                      Không có dữ liệu log nào được ghi nhận
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


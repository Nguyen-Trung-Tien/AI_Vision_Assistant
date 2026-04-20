import { useState, useEffect } from "react";
import { fetchSystemHealth, fetchSystemMetrics } from "../services/api";
import { socket } from "../services/socket";
import { useToast } from "../components/Toast";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { 
  Server, 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Clock, 
  Users, 
  RefreshCw,
  HardDrive
} from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";

export default function SystemPage() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchInitialData = async () => {
    try {
      const [hData, mData] = await Promise.all([
        fetchSystemHealth(),
        fetchSystemMetrics()
      ]);
      if (hData) setHealth(hData);
      if (mData) {
        setMetrics(mData);
        updateHistory(mData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateHistory = (data) => {
    const newPoint = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpu: data.cpu.loadAvg * 10, // Scaled for display
      mem: data.memory.usagePercent,
    };
    setMetricsHistory((prev) => [...prev.slice(-29), newPoint]);
  };

  useEffect(() => {
    fetchInitialData();

    socket.on("system_metrics", (data) => {
      setMetrics(data);
      updateHistory(data);
    });

    return () => {
      socket.off("system_metrics");
    };
  }, []);

  const StatusCard = ({ title, status, desc, icon: Icon }) => (
    <div className="bg-bg-card border border-border-primary p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status === "UP" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary">
            {title}
          </h3>
        </div>
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            status === "UP" ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse" : "bg-red-500"
          }`}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-black text-text-primary tracking-tighter">{status}</p>
        <p className="text-[10px] font-bold text-text-secondary uppercase opacity-40">
          {desc}
        </p>
      </div>
    </div>
  );

  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="GIÁM SÁT" 
        highlight="HỆ THỐNG" 
        description="Giám sát trạng thái hạ tầng và hiệu năng thời gian thực qua WebSocket"
      >
        <button
          onClick={fetchInitialData}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-black uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary transition-all active:scale-95"
        >
          {loading ? <Loading variant="inline" size="xs" /> : <RefreshCw className="w-4 h-4" />}
          Force Refresh
        </button>
      </PageHeader>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatusCard
          title="PostgreSQL"
          status={health?.database || "UP"}
          desc="Main Database"
          icon={Database}
        />
        <StatusCard
          title="RabbitMQ"
          status={health?.rabbitmq || "UP"}
          desc="Message Broker"
          icon={Activity}
        />
        <StatusCard
          title="AI Worker"
          status={health?.aiWorker || "UP"}
          desc="Vision Engine"
          icon={Cpu}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-bg-card border border-border-primary p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-text-primary flex items-center gap-3 uppercase tracking-widest">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Resource Performance
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black text-text-secondary uppercase">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-[10px] font-black text-text-secondary uppercase">CPU Load</span>
              </div>
            </div>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                  itemStyle={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}
                />
                <Area
                  type="monotone"
                  dataKey="mem"
                  name="Memory %"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU Load"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border border-border-primary p-5 rounded-2xl shadow-2xl space-y-5">
          <h2 className="text-sm font-black text-text-primary flex items-center gap-3 uppercase tracking-widest">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            Server Blueprint
          </h2>
          
          <div className="space-y-4">
            <InfoRow 
              label="OS Platform" 
              value={`${metrics?.os?.platform || '—'} ${metrics?.os?.arch || ''}`} 
              icon={Globe}
              sub={metrics?.os?.release}
            />
            <InfoRow 
              label="System Uptime" 
              value={formatUptime(metrics?.os?.uptime)} 
              icon={Clock}
              sub="Since last reboot"
            />
            <InfoRow 
              label="Node Version" 
              value={metrics?.process?.nodeVersion || '—'} 
              icon={Server}
              sub="Runtime Engine"
            />
            <InfoRow 
              label="Active Sessions" 
              value={metrics?.activeConnections ? `${metrics.activeConnections} Connections` : '—'} 
              icon={Users}
              sub="Real-time WebSocket clients"
            />
            <div className="pt-4 border-t border-border-primary/50">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Disk Usage</span>
                  <span className="text-[10px] font-black text-text-primary">Simulated</span>
               </div>
               <div className="h-2 w-full bg-text-primary/5 rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, sub }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-text-primary/[0.02] rounded-xl border border-border-primary group hover:bg-text-primary/[0.04] transition-colors">
      <div className="w-9 h-9 rounded-xl bg-text-primary/5 flex items-center justify-center text-text-secondary group-hover:text-indigo-400 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-0.5 opacity-50">{label}</p>
        <p className="text-sm font-black text-text-primary truncate">{value}</p>
        {sub && <p className="text-[9px] font-bold text-text-secondary truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

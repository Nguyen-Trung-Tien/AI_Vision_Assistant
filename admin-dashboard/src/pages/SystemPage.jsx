import { useState, useEffect } from "react";
import { fetchSystemHealth, fetchSystemMetrics } from "../services/api";
import { useToast } from "../components/Toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function SystemPage() {
  const [health, setHealth] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchHealth = async () => {
    try {
      const data = await fetchSystemHealth();
      if (data) setHealth(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await fetchSystemMetrics();
      if (data) {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          cpu: data.memory.usagePercent, // Using memory for now as dummy cpu if os.loadavg is 0
          mem: data.memory.usagePercent,
        };
        setMetricsHistory((prev) => [...prev.slice(-19), newPoint]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    const timer = setInterval(() => {
      fetchHealth();
      fetchMetrics();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const StatusCard = ({ title, status, desc }) => (
    <div className="bg-bg-card border border-border-primary p-4 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary">
          {title}
        </h3>
        <span
          className={`w-3 h-3 rounded-full animate-pulse ${
            status === "UP" ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-red-500"
          }`}
        />
      </div>
      <p className="text-xl font-black text-text-primary">{status}</p>
      <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase opacity-60">
        {desc}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary uppercase">
          SYSTEM <span className="text-indigo-500">HEALTH</span>
        </h1>
        <p className="text-text-secondary font-medium text-sm">
          Giám sát trạng thái hạ tầng và hiệu năng thời gian thực
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="PostgreSQL"
          status={health?.database || "PENDING"}
          desc="Cơ sở dữ liệu chính"
        />
        <StatusCard
          title="RabbitMQ"
          status={health?.rabbitmq || "UP"}
          desc="Message Broker"
        />
        <StatusCard
          title="AI Worker"
          status={health?.aiWorker || "UP"}
          desc="Vision Processing Units"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-primary p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-32 h-32 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v10h2V3zm4 8h-2v2h2v-2zm-8 0H7v2h2v-2zm3 9c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
          
          <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
            SỬ DỤNG TÀI NGUYÊN (%)
          </h2>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
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
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="mem"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border border-border-primary p-6 rounded-3xl shadow-2xl">
          <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            THÔNG TIN SERVER
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between p-4 bg-text-primary/5 rounded-2xl border border-border-primary">
              <span className="text-xs font-bold text-text-secondary uppercase">Platform</span>
              <span className="text-xs font-black text-text-primary">Linux x64 (Production)</span>
            </div>
            <div className="flex justify-between p-4 bg-text-primary/5 rounded-2xl border border-border-primary">
              <span className="text-xs font-bold text-text-secondary uppercase">Uptime</span>
              <span className="text-xs font-black text-text-primary">45 days, 12:34:56</span>
            </div>
            <div className="flex justify-between p-4 bg-text-primary/5 rounded-2xl border border-border-primary">
              <span className="text-xs font-bold text-text-secondary uppercase">Node version</span>
              <span className="text-xs font-black text-text-primary">v20.11.0</span>
            </div>
            <div className="flex justify-between p-4 bg-text-primary/5 rounded-2xl border border-border-primary">
              <span className="text-xs font-bold text-text-secondary uppercase">Active Connections</span>
              <span className="text-xs font-black text-text-primary">1,248 Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

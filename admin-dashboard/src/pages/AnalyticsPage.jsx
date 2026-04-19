import { useState, useEffect } from "react";
import { fetchAccuracyTrend, fetchPeakHours } from "../services/api";
import { useToast } from "../components/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Activity, 
  Zap,
  Calendar,
  Layers,
  Cpu,
  MousePointer2
} from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";

export default function AnalyticsPage() {
  const [accuracyData, setAccuracyData] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const toast = useToast();

  const fetchData = async (days) => {
    setLoading(true);
    try {
      const accData = await fetchAccuracyTrend(days);
      setAccuracyData(accData);

      const peakData = await fetchPeakHours();
      setPeakHours(peakData);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu phân tích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDays);
  }, [selectedDays]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="PHÂN TÍCH" 
        highlight="CHUYÊN SÂU" 
        description={`Phân tích hiệu năng và xu hướng trong ${selectedDays} ngày gần nhất`}
      >
        <div className="flex items-center gap-2 bg-text-primary/5 border border-border-primary rounded-2xl p-1.5">
          <button 
            onClick={() => setSelectedDays(7)}
            className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${
              selectedDays === 7 
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
              : "text-text-secondary hover:text-text-primary"
            }`}
          >
            7 Ngày
          </button>
          <button 
            onClick={() => setSelectedDays(30)}
            className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${
              selectedDays === 30 
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
              : "text-text-secondary hover:text-text-primary"
            }`}
          >
            30 Ngày
          </button>
        </div>
      </PageHeader>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accuracy Trend */}
        <div className="bg-bg-card border border-border-primary p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-cyan-500" />
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">
                Xu hướng độ chính xác
              </h2>
              <p className="text-[10px] text-text-secondary font-bold opacity-60 uppercase tracking-widest">Đơn vị: %</p>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {loading ? (
              <Loading size="lg" text="Đang phân tính xu hướng..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                    opacity={0.1}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-secondary)" 
                    fontSize={10} 
                    fontWeight="bold"
                    tick={{fill: 'var(--text-secondary)'}}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={10} 
                    fontWeight="bold"
                    tick={{fill: 'var(--text-secondary)'}}
                    domain={[0, 100]} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '4 4'}}
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      padding: "12px 16px"
                    }}
                    itemStyle={{
                      fontSize: '12px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: "var(--text-primary)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#22d3ee"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorAcc)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-bg-card border border-border-primary p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-24 h-24 text-orange-500" />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">
                Giờ cao điểm sử dụng
              </h2>
              <p className="text-[10px] text-text-secondary font-bold opacity-60 uppercase tracking-widest">Đơn vị: Requests/h</p>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {loading ? (
              <Loading size="lg" text="Đang tính toán giờ cao điểm..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    fontWeight="bold"
                    tick={{fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={10} 
                    fontWeight="bold"
                    tick={{fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{fill: 'rgba(251, 146, 60, 0.05)'}}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      padding: "12px 16px"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#fb923c" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-primary p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.2em]">
            Tóm tắt hiệu năng <span className="text-indigo-500 italic">(30 ngày gần nhất)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng số Detection",
              value: "1.2M+",
              color: "text-blue-400",
              icon: <MousePointer2 className="w-4 h-4" />
            },
            {
              label: "Thời gian xử lý TB",
              value: "145ms",
              color: "text-green-400",
              icon: <Zap className="w-4 h-4" />
            },
            {
              label: "Tỷ lệ Phản hồi",
              value: "3.2%",
              color: "text-purple-400",
              icon: <Activity className="w-4 h-4" />
            },
            { 
              label: "Accuracy Trung bình", 
              value: "94.8%", 
              color: "text-cyan-400",
              icon: <Target className="w-4 h-4" />
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="group bg-white/[0.02] p-4.5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all hover:translate-y-[-4px]"
            >
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold mt-2 tracking-tighter tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


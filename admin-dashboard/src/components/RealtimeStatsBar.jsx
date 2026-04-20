import {
  Activity,
  Users,
  Target,
  RefreshCw,
  Clock,
  TrendingUp,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useByDay, useOverview } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";

/** Auto-refresh interval */
const REFRESH_INTERVAL = 30_000;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl px-4 py-2 shadow-xl text-sm">
      <p className="text-text-secondary mb-1 font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-extrabold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function RealtimeStatsBar() {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const countdownRef = useRef(null);

  const {
    data: rawByDay,
    isLoading: loadingByDay,
    isFetching: fetchingByDay,
    dataUpdatedAt,
    refetch: refetchByDay,
  } = useByDay(14);

  const {
    data: overview,
    refetch: refetchOverview,
  } = useOverview();

  const isRefreshing = fetchingByDay;

  const data = (rawByDay ?? []).map((r) => ({
    date: new Date(r.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    "Lượt nhận diện": r.count,
  }));

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const handleRefresh = () => {
    refetchByDay();
    refetchOverview();
    setCountdown(REFRESH_INTERVAL / 1000);
  };

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          handleRefresh();
          return REFRESH_INTERVAL / 1000;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, []);

  return (
    <div className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border-primary shadow-2xl hover:border-indigo-500/30 transition-all duration-500 mb-6 group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">
              Hoạt động Hệ thống
            </h3>
            {lastUpdated && (
              <p className="text-[11px] text-text-secondary mt-1 font-bold flex items-center gap-2 italic opacity-60">
                <Clock className="w-3 h-3" />
                Cập nhật {lastUpdated.toLocaleTimeString("vi-VN")} · Tiếp theo trong{" "}
                <span className="text-indigo-400 tabular-nums">{countdown}s</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-1.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-text-primary/10 hover:text-text-primary active:scale-95 transition-all disabled:opacity-30"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Làm mới
        </button>
      </div>

      {/* Mini stats */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Tổng nhận diện",
              value: overview.totalDetections?.toLocaleString() ?? "—",
              color: "#6C63FF",
              icon: Activity,
            },
            {
              label: "Người dùng",
              value: overview.totalUsers?.toLocaleString() ?? "—",
              color: "#00D4FF",
              icon: Users,
            },
            {
              label: "Độ tin cậy TB",
              value: overview.avgConfidence
                ? `${Math.round(overview.avgConfidence * 100)}%`
                : "—",
              color: "#00E676",
              icon: Target,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl p-3 border transition-all hover:translate-y-[-4px] group/card"
              style={{
                background: `${color}05`,
                borderColor: `${color}15`,
              }}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity">
                <Icon className="w-10 h-10" style={{ color }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-1" style={{ color }}>{label}</p>
              <p className="text-xl font-bold tracking-tighter" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Area chart */}
      {loadingByDay || data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] bg-text-primary/3 rounded-2xl border border-dashed border-border-primary text-text-secondary/40 text-sm italic">
          {isRefreshing ? "Đang tải dữ liệu..." : "Không có dữ liệu thống kê"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 600 }}
              axisLine={{ stroke: "var(--border-color)" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6C63FF', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}
            />
            <Area
              type="monotone"
              dataKey="Lượt nhận diện"
              stroke="#6C63FF"
              strokeWidth={3}
              fill="url(#rtGrad)"
              dot={{ r: 4, fill: "#6C63FF", stroke: "var(--bg-card)", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#00D4FF",
                stroke: "var(--bg-card)",
                strokeWidth: 3,
              }}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

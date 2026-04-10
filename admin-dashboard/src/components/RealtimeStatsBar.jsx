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
    <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-border-primary shadow-lg hover:border-accent-purple/30 transition-all duration-300 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            📊 Hoạt động Realtime — 14 ngày qua
          </h3>
          {lastUpdated && (
            <p className="text-[11px] text-text-secondary/40 mt-1 font-medium">
              Cập nhật {lastUpdated.toLocaleTimeString("vi-VN")} · Sau{" "}
              <span className="text-accent-cyan font-bold tabular-nums">{countdown}s</span>
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 min-h-[40px] px-4 py-1.5 rounded-xl border border-border-primary bg-text-primary/5 text-text-secondary text-xs font-bold uppercase tracking-wider hover:border-accent-purple/50 hover:text-text-primary active:scale-[0.98] transition-all duration-200 disabled:opacity-40 shrink-0"
        >
          <span className={isRefreshing ? "inline-block animate-spin" : ""}>↻</span>
          Làm mới
        </button>
      </div>

      {/* Mini stats */}
      {overview && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            {
              label: "Tổng nhận diện",
              value: overview.totalDetections?.toLocaleString() ?? "—",
              color: "#6C63FF",
            },
            {
              label: "Người dùng",
              value: overview.totalUsers?.toLocaleString() ?? "—",
              color: "#00D4FF",
            },
            {
              label: "Độ tin cậy TB",
              value: overview.avgConfidence
                ? `${Math.round(overview.avgConfidence * 100)}%`
                : "—",
              color: "#00E676",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4 text-center border shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: `${color}10`,
                borderColor: `${color}25`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color }}>{label}</p>
              <p className="text-2xl font-black tracking-tight" style={{ color }}>
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
        <ResponsiveContainer width="100%" height={240}>
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

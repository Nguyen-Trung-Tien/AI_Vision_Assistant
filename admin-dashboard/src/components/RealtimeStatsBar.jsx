import { useEffect, useRef, useState, useCallback } from "react";
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
import { fetchByDay, fetchOverview } from "../services/api";

/** Auto-refresh mỗi REFRESH_INTERVAL ms */
const REFRESH_INTERVAL = 30_000;

/** Custom tooltip cho biểu đồ */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#13132b] border border-white/10 rounded-xl px-4 py-2 shadow-xl text-sm">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function RealtimeStatsBar() {
  const [data, setData] = useState([]);
  const [overview, setOverview] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [byDay, ov] = await Promise.all([fetchByDay(14), fetchOverview()]);
      setData(
        byDay.map((r) => ({
          date: new Date(r.date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          }),
          "Lượt nhận diện": r.count,
        })),
      );
      setOverview(ov);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("[RealtimeStatsBar] load error", e);
    } finally {
      setIsRefreshing(false);
      setCountdown(REFRESH_INTERVAL / 1000);
    }
  }, []);

  // Initial load + interval
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, REFRESH_INTERVAL);

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [load]);

  return (
    <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-accent-purple/10 shadow-lg hover:border-accent-purple/30 transition-all duration-300 mb-6">
      {/* Header — stack trên mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            📊 Realtime — 14 ngày qua
          </h3>
          {lastUpdated && (
            <p className="text-[11px] text-white/30 mt-0.5">
              Cập nhật {lastUpdated.toLocaleTimeString("vi-VN")} · Sau{" "}
              <span className="text-accent-cyan font-bold">{countdown}s</span>
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 sm:py-1.5 rounded-xl border border-accent-purple/20 bg-bg-card text-white/70 text-xs font-medium hover:border-accent-purple/50 hover:text-white active:scale-[0.98] transition-all duration-200 disabled:opacity-40 shrink-0"
        >
          <span
            className={isRefreshing ? "inline-block animate-spin" : ""}
            style={{ display: "inline-block" }}
          >
            ↻
          </span>
          Làm mới ngay
        </button>
      </div>

      {/* Mini stats row */}
      {overview && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-5">
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
              className="rounded-xl px-4 py-3 text-center"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <p className="text-[11px] text-white/40 mb-0.5">{label}</p>
              <p className="text-2xl font-extrabold" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Area chart */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[180px] sm:h-[220px] text-white/40 text-sm">
          {isRefreshing ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(240,240,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(240,240,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}
            />
            <Area
              type="monotone"
              dataKey="Lượt nhận diện"
              stroke="#6C63FF"
              strokeWidth={2.5}
              fill="url(#rtGrad)"
              dot={{ r: 3, fill: "#6C63FF", stroke: "#0a0a1a", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#00D4FF",
                stroke: "#0a0a1a",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

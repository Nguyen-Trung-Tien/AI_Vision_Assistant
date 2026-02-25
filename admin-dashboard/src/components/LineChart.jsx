import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { fetchByDay } from "../services/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-lg font-bold text-accent-purple">
        {payload[0].value} lượt
      </div>
    </div>
  );
};

export default function LineChartCard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchByDay(30).then((res) => {
      setData(
        res.map((r) => ({
          date: new Date(r.date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          }),
          count: r.count,
        })),
      );
    });
  }, []);

  if (!data.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 border border-accent-purple/10 shadow-lg">
        <div className="flex items-center justify-center h-[340px] text-white/30">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-bg-card rounded-2xl p-6 border border-accent-purple/10 shadow-lg
                    hover:border-accent-purple/30 hover:shadow-accent-purple/10 transition-all duration-300"
    >
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
        📈 Lượt nhận diện theo ngày (30 ngày)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(240,240,255,0.4)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(240,240,255,0.4)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6C63FF"
            strokeWidth={2.5}
            fill="url(#colorCount)"
            dot={{ r: 3, fill: "#6C63FF", stroke: "#0a0a1a", strokeWidth: 2 }}
            activeDot={{
              r: 6,
              fill: "#00D4FF",
              stroke: "#0a0a1a",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

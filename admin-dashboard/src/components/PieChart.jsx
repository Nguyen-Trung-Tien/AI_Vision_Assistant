import { useState, useEffect } from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchByType } from "../services/api";

const COLORS = [
  "#6C63FF",
  "#00D4FF",
  "#FF6B9D",
  "#00E676",
  "#FF9800",
  "#FF5252",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="text-sm text-white/60">{payload[0].name}</div>
      <div className="text-lg font-bold text-accent-purple">
        {payload[0].value} lượt
      </div>
    </div>
  );
};

export default function PieChartCard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchByType().then((res) => {
      setData(res.map((r) => ({ name: r.type, value: r.count })));
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
        📊 Phân bổ theo loại nhận diện
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: "rgba(240,240,255,0.7)", fontSize: 13 }}>
                {value}
              </span>
            )}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

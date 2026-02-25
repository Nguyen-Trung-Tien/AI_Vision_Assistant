import { useEffect, useState } from "react";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchByType } from "../services/api";

const COLORS = ["#6C63FF", "#00D4FF", "#FF6B9D", "#00E676", "#FF9800", "#FF5252"];

export default function PieChartV2() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchByType().then((res) => setData(res.map((r) => ({ id: r.type, name: r.type, value: r.count }))));
  }, []);

  if (!data.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 border border-accent-purple/10 shadow-lg">
        <div className="flex flex-col items-center justify-center h-[340px] text-white/50">
          <div className="loader-ring mb-3" />
          Đang tải dữ liệu biểu đồ
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-accent-purple/10 shadow-lg hover:border-accent-purple/30 transition-all duration-300">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Phân bố theo loại nhận diện</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RePieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
            {data.map((entry, i) => (
              <Cell key={entry.id} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" iconType="circle" />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

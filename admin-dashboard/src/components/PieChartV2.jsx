import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useByType } from "@/hooks/use-queries";
import { ChartSkeleton } from "./ui/Skeleton";

const COLORS = ["#6C63FF", "#00D4FF", "#FF6B9D", "#00E676", "#FF9800", "#FF5252"];

export default function PieChartV2({ onNavigate }) {
  const { data: raw, isLoading } = useByType();

  const data = (raw ?? []).map((r) => ({ id: r.type, name: r.type, value: r.count }));

  if (isLoading) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-accent-purple/10 shadow-lg">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Phân bố theo loại nhận diện</h3>
        <ChartSkeleton />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-accent-purple/10 shadow-lg">
        <div className="flex flex-col items-center justify-center h-[300px] text-text-secondary/50 text-sm">
          Chưa có dữ liệu biểu đồ
        </div>
      </div>
    );
  }

  const handleClick = (entry) => {
    if (!onNavigate) return;
    const type = entry.name.toLowerCase();
    if (type.includes("sos") || type.includes("danger")) {
      onNavigate("sos");
    } else {
      onNavigate("heatmap");
    }
  };

  return (
    <div className="bg-bg-card rounded-2xl p-4 sm:p-5 border border-accent-purple/10 shadow-lg hover:border-accent-purple/30 transition-all duration-300">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Phân bố theo loại nhận diện</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RePieChart>
          <Pie 
            data={data} 
            cx="50%" cy="50%" 
            innerRadius={70} outerRadius={110} 
            paddingAngle={4} dataKey="value" stroke="none"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, i) => (
              <Cell key={entry.id} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ 
               backgroundColor: 'var(--bg-card)', 
               borderColor: 'var(--border-color)',
               borderRadius: '12px',
               border: '1px solid var(--border-color)',
               boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
             }}
             itemStyle={{
               color: 'var(--text-primary)',
               fontSize: '12px',
               fontWeight: 'bold',
               textTransform: 'uppercase'
             }}
          />
          <Legend 
            verticalAlign="bottom" 
            iconType="circle" 
            formatter={(value) => (
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                {value}
              </span>
            )}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

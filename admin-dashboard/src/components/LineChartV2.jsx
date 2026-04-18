import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useByDay } from "@/hooks/use-queries";
import { ChartSkeleton } from "./ui/Skeleton";

export default function LineChartV2() {
  const { data: raw, isLoading } = useByDay(30);

  const data = (raw ?? []).map((r) => ({
    id: r.date,
    date: new Date(r.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    count: r.count,
  }));

  if (isLoading) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-border-primary shadow-lg">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4">Xu hướng nhận diện (30 ngày)</h3>
        <ChartSkeleton />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 sm:p-6 border border-border-primary shadow-lg">
        <div className="flex flex-col items-center justify-center h-[300px] text-text-secondary/40 text-sm italic">
          Không có dữ liệu thống kê
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-2xl p-4 sm:p-5 border border-border-primary shadow-lg hover:border-accent-purple/30 transition-all duration-300">
      <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-6">Xu hướng nhận diện (30 ngày)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="colorCountV2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
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
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-primary)'
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Lượt nhận diện"
            stroke="#6C63FF"
            strokeWidth={3}
            fill="url(#colorCountV2)"
            dot={{ r: 4, fill: "#6C63FF", stroke: "var(--bg-card)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#00D4FF", stroke: "var(--bg-card)", strokeWidth: 2 }}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

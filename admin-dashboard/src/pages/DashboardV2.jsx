import StatsCardsV2 from "../components/StatsCardsV2";
import PieChartV2 from "../components/PieChartV2";
import LineChartV2 from "../components/LineChartV2";
import RecentLogsV2 from "../components/RecentLogsV2";
import { getStoredEmail } from "../services/api";

export default function DashboardV2({ onLogout }) {
  const email = getStoredEmail();

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            AI Vision Dashboard
          </h1>
          <p className="text-sm text-white/50 mt-1">Theo dõi hoạt động nhận diện</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent-purple/15 bg-bg-card text-white text-sm font-medium hover:border-accent-purple/40 hover:shadow-lg hover:shadow-accent-purple/10 hover:-translate-y-0.5 transition-all duration-300"
        >
          Làm mới
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-white/40">{email ? `Tài khoản: ${email}` : "Chưa có tài khoản"}</p>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl border border-accent-red/30 bg-accent-red/10 text-accent-red text-sm font-medium hover:bg-accent-red/20 transition-all duration-300"
        >
          Đăng xuất
        </button>
      </div>

      <StatsCardsV2 />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PieChartV2 />
        <LineChartV2 />
      </div>

      <RecentLogsV2 />
    </div>
  );
}

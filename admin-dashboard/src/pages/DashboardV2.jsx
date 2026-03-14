import StatsCardsV2 from "../components/StatsCardsV2";
import PieChartV2 from "../components/PieChartV2";
import LineChartV2 from "../components/LineChartV2";
import RecentLogsV2 from "../components/RecentLogsV2";
import RealtimeStatsBar from "../components/RealtimeStatsBar";
import { getStoredEmail } from "../services/api";

export default function DashboardV2({ onLogout }) {
  const email = getStoredEmail();

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Header — stack trên mobile, row trên desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-linear-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            AI Vision Dashboard
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Theo dõi hoạt động nhận diện
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl border border-accent-purple/15 bg-bg-card text-white text-sm font-medium hover:border-accent-purple/40 active:scale-[0.98] transition-all duration-200"
          >
            Làm mới
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-accent-red/30 bg-accent-red/10 text-accent-red text-sm font-medium hover:bg-accent-red/20 active:scale-[0.98] transition-all duration-200"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="mb-4 lg:mb-6">
        <p className="text-xs text-white/40 truncate max-w-full" title={email || ""}>
          {email ? `Tài khoản: ${email}` : "Chưa có tài khoản"}
        </p>
      </div>

      <RealtimeStatsBar />

      <StatsCardsV2 />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <PieChartV2 />
        <LineChartV2 />
      </div>

      <RecentLogsV2 />
    </div>
  );
}

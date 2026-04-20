import PageHeader from "../components/ui/PageHeader";
import PieChartV2 from "../components/PieChartV2";
import LineChartV2 from "../components/LineChartV2";
import RecentLogsV2 from "../components/RecentLogsV2";
import RealtimeStatsBar from "../components/RealtimeStatsBar";
import { motion } from "framer-motion";

export default function DashboardV2() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="SYSTEM" 
        highlight="OVERVIEW" 
        description="Giám sát thời gian thực các hoạt động nhận diện AI và cảnh báo SOS"
      />


      {/* Stats Bar */}
      <RealtimeStatsBar />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PieChartV2 />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LineChartV2 />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <RecentLogsV2 />
      </motion.div>
    </div>
  );
}

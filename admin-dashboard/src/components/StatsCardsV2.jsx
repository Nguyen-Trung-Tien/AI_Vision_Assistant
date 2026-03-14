import { useEffect, useState } from "react";
import { fetchOverview } from "../services/api";

function SkeletonCard() {
  return (
    <div className="bg-bg-card rounded-2xl p-5 sm:p-7 border border-accent-purple/10 h-32 sm:h-36 loading-shimmer" />
  );
}

export default function StatsCardsV2() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOverview().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const cards = [
    {
      gradient: "from-accent-purple to-accent-cyan",
      iconBg: "bg-accent-purple/15",
      valueColor: "text-accent-purple",
      icon: "U",
      value: data.totalUsers?.toLocaleString() ?? "0",
      label: "Người dùng",
    },
    {
      gradient: "from-accent-cyan to-accent-green",
      iconBg: "bg-accent-cyan/15",
      valueColor: "text-accent-cyan",
      icon: "AI",
      value: data.totalDetections?.toLocaleString() ?? "0",
      label: "Lượt nhận diện",
    },
    {
      gradient: "from-accent-pink to-accent-orange",
      iconBg: "bg-accent-pink/15",
      valueColor: "text-accent-pink",
      icon: "%",
      value: data.avgConfidence
        ? `${(data.avgConfidence * 100).toFixed(1)}%`
        : "N/A",
      label: "Độ tin cậy TB",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative bg-bg-card rounded-2xl p-5 sm:p-7 border border-accent-purple/10
                     shadow-lg hover:border-accent-purple/40 hover:shadow-accent-purple/20
                     hover:-translate-y-1 transition-all duration-300 overflow-hidden active:scale-[0.99]"
        >
          <div
            className={`absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r ${card.gradient}`}
          />
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-sm font-bold mb-3 sm:mb-4`}
          >
            {card.icon}
          </div>
          <div
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 ${card.valueColor}`}
          >
            {card.value}
          </div>
          <div className="text-sm text-white/60 font-medium">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";

export default function StatsCard({ label, value, color, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group",
        className
      )}
    >
      <div className="relative z-10">
        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
          {label}
        </p>
        <div className="flex items-end justify-between">
          <p className={cn("text-3xl font-black tracking-tighter", color || "text-text-primary")}>
            {value}
          </p>
          {Icon && (
            <div className={cn("p-2 rounded-xl bg-text-primary/5 text-text-secondary group-hover:scale-110 transition-transform", color)}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-text-primary/5 rounded-full blur-2xl group-hover:bg-text-primary/10 transition-colors" />
    </div>
  );
}

export function RoleBadge({ role }) {
  const configs = {
    SUPER_ADMIN: {
      label: "👑 Super Admin",
      classes: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    ADMIN: {
      label: "⚡ Admin",
      classes: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    MODERATOR: {
      label: "🛡️ Moderator",
      classes: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    USER: {
      label: "👤 User",
      classes: "bg-text-primary/5 text-text-secondary border-border-primary",
    },
  };

  const config = configs[role] || configs.USER;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

export function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
      🔒 Đã khoá
    </span>
  );
}

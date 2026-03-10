export function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        role === "ADMIN"
          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
          : "bg-white/8 text-white/50 border border-white/10"
      }`}
    >
      {role === "ADMIN" ? "⚡ Admin" : "👤 User"}
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

export default function RoleToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[
        {
          v: "USER",
          label: "👤 User",
          active: "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/20",
        },
        {
          v: "MODERATOR",
          label: "🛡️ Moderator",
          active: "bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-600/20",
        },
        {
          v: "ADMIN",
          label: "⚡ Admin",
          active: "bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-600/20",
        },
        {
          v: "SUPER_ADMIN",
          label: "👑 Super Admin",
          active: "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20",
        },
      ].map(({ v, label, active }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === v
              ? active
              : "bg-bg-primary border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-card-hover shadow-sm"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

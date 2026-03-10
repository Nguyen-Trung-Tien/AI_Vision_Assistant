export default function RoleToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[
        {
          v: "USER",
          label: "👤 User",
          active: "bg-white/10 border-white/25 text-white",
        },
        {
          v: "ADMIN",
          label: "⚡ Admin",
          active: "bg-purple-600/30 border-purple-500/50 text-purple-200",
        },
      ].map(({ v, label, active }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === v
              ? active
              : "bg-white/3 border-white/8 text-white/35 hover:bg-white/6"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

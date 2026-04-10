//  NavItem 
function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative overflow-hidden ${
        active
          ? "text-white"
          : "text-text-secondary/90 hover:text-text-primary hover:bg-text-primary/5"
      }`}
    >
      {/* Active glow background */}
      {active && (
        <span className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30 rounded-xl" />
      )}
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full z-20" />
      )}
      <span
        className={`relative z-10 shrink-0 transition-all duration-300 ${active ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"}`}
      >
        {item.icon}
      </span>
      <span className="relative z-10 flex-1 text-left tracking-tight">{item.label}</span>
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-white/40 text-xs mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export const INPUT_STYLES =
  "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/50 transition-colors";

export default function Modal({ title, icon, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ animation: "fadeIn .18s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{icon}</span>
            <h3 className="text-white font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/8 flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

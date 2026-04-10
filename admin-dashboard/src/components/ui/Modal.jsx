export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-text-secondary/60 text-[10px] uppercase font-bold tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export const INPUT_STYLES =
  "w-full px-3 py-2.5 rounded-xl bg-text-primary/5 border border-border-primary text-text-primary text-sm placeholder-text-secondary/30 focus:outline-none focus:border-purple-500/50 transition-colors";

export default function Modal({ title, icon, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-bg-card border border-border-primary rounded-2xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ animation: "fadeIn .18s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{icon}</span>
            <h3 className="text-text-primary font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary/40 hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-text-primary/5"
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
          <div className="px-6 py-4 border-t border-border-primary flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

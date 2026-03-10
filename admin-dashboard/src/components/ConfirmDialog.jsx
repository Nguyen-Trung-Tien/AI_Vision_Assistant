export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  confirmClass = "bg-purple-600 hover:bg-purple-500",
  cancelLabel = "Huỷ",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-bg-card border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ animation: "fadeIn .15s ease" }}
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-full bg-white/6 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-5 h-5 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h3 className="text-white font-bold text-base text-center mb-2">
          {title}
        </h3>
        <p className="text-white/45 text-sm text-center mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClass}`}
          >
            {loading && (
              <span className="loader-ring" style={{ width: 14, height: 14 }} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

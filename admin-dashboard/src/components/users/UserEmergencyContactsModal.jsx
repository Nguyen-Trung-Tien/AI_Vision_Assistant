import { useEffect, useState } from "react";
import { fetchUserEmergencyContacts } from "../../services/api";

export default function UserEmergencyContactsModal({ user, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res = await fetchUserEmergencyContacts(user.id);
      if (mounted) {
        setContacts(res);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-bg-card rounded-2xl border border-border-primary shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              Liên hệ khẩn cấp
            </h3>
            <p className="text-sm text-text-secondary mt-1">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary/40 hover:text-text-primary hover:bg-text-primary/5 rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        {loading ? (
          <div className="py-12 flex justify-center text-text-secondary/40 text-sm">
            <div className="loader-ring mr-2" /> Đang tải dữ liệu...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-12 text-center text-text-secondary/40 text-sm bg-text-primary/5 rounded-xl border border-border-primary">
            Không có người liên hệ khẩn cấp nào.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-text-primary/5 border border-border-primary flex items-center justify-between"
              >
                <div>
                  <h4 className="text-text-primary font-bold truncate max-w-[200px]">
                    {contact.name || contact.phone}
                  </h4>
                  {contact.name && (
                    <p className="text-text-secondary text-sm mt-0.5">
                      {contact.phone}
                    </p>
                  )}
                  <p className="text-[10px] text-text-secondary/40 uppercase font-bold tracking-wider mt-1">
                    Tạo: {new Date(contact.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  {contact.notify_sms ? (
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 flex items-center gap-1.5 shadow-sm">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Gửi SMS
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-text-primary/5 text-text-secondary/40 text-[10px] font-bold uppercase tracking-wider border border-border-primary">
                      Không gửi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

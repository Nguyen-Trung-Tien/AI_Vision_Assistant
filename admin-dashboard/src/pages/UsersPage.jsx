import { useEffect, useState, useCallback } from "react";
import {
  fetchUsers,
  toggleUserRole,
  deleteUser,
  createUser,
  updateUser,
  lockUser,
  unlockUser,
} from "../services/api";
import { getStoredEmail } from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

//  Avatar
function Avatar({ email }) {
  const letter = (email?.[0] ?? "?").toUpperCase();
  const colors = [
    "from-purple-500 to-indigo-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-orange-500 to-amber-500",
    "from-green-500 to-emerald-500",
  ];
  const idx = email ? email.charCodeAt(0) % colors.length : 0;
  return (
    <div
      className={`w-9 h-9 rounded-full bg-linear-to-br ${colors[idx]} flex items-center justify-center text-white text-sm font-bold shrink-0`}
    >
      {letter}
    </div>
  );
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
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

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
      🔒 Đã khoá
    </span>
  );
}

//  Field helper
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-white/40 text-xs mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-purple-500/50 transition-colors";

// Custom role toggle
function RoleToggle({ value, onChange }) {
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

//  Modal shell
function Modal({ title, icon, onClose, children, footer }) {
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

//  AddUserModal
function AddUserModal({ onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "", role: "USER" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Email không hợp lệ";
    if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      await createUser(form.email.trim(), form.password, form.role);
      toast.success(`Đã tạo tài khoản ${form.email.trim()}`);
      onSuccess();
    } catch (err) {
      toast.error(err.message ?? "Tạo tài khoản thất bại");
    }
    setLoading(false);
  };

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  return (
    <Modal
      title="Thêm người dùng"
      icon="👤"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="loader-ring" style={{ width: 14, height: 14 }} />
            )}
            Tạo tài khoản
          </button>
        </>
      }
    >
      <Field label="Email *">
        <input
          value={form.email}
          onChange={set("email")}
          placeholder="user@example.com"
          className={INPUT}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </Field>
      <Field label="Mật khẩu *">
        <input
          value={form.password}
          onChange={set("password")}
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          className={INPUT}
        />
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </Field>
      <Field label="Role">
        <RoleToggle
          value={form.role}
          onChange={(v) => {
            setForm((p) => ({ ...p, role: v }));
          }}
        />
      </Field>
    </Modal>
  );
}

// ── EditUserModal
function EditUserModal({ user, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ role: user.role, password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { role: form.role };
      if (form.password.trim()) data.password = form.password.trim();
      await updateUser(user.id, data);
      toast.success(`Đã cập nhật tài khoản ${user.email}`);
      onSuccess();
    } catch {
      toast.error("Cập nhật thất bại, vui lòng thử lại");
    }
    setLoading(false);
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Modal
      title="Chỉnh sửa người dùng"
      icon="✏️"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="loader-ring" style={{ width: 14, height: 14 }} />
            )}
            Lưu thay đổi
          </button>
        </>
      }
    >
      {/* User info banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
        <Avatar email={user.email} />
        <div>
          <p className="text-white text-sm font-medium">{user.email}</p>
          <p className="text-white/30 text-xs">
            Tham gia {new Date(user.created_at).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      <Field label="Role">
        <RoleToggle
          value={form.role}
          onChange={(v) => setForm((p) => ({ ...p, role: v }))}
        />
      </Field>

      <Field label="Đặt lại mật khẩu (để trống nếu không đổi)">
        <input
          value={form.password}
          onChange={set("password")}
          type="password"
          placeholder="Mật khẩu mới..."
          className={INPUT}
        />
      </Field>
    </Modal>
  );
}

// ── Main Page
export default function UsersPage() {
  const toast = useToast();
  const myEmail = getStoredEmail(); // current logged-in admin's email
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchUsers(page, 20, search);
    setUsers(res.data ?? []);
    setTotal(res.total ?? 0);
    setTotalPages(res.totalPages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const doConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "toggle") {
        const updated = await toggleUserRole(confirm.user.id);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updated.id ? { ...u, role: updated.role } : u,
          ),
        );
        toast.success(`Đã chuyển "${confirm.user.email}" → ${updated.role}`);
      } else if (confirm.type === "lock") {
        const updated = await lockUser(confirm.user.id);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updated.id ? { ...u, is_active: false } : u,
          ),
        );
        toast.warning(`Đã khoá tài khoản "${confirm.user.email}"`);
      } else if (confirm.type === "unlock") {
        const updated = await unlockUser(confirm.user.id);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updated.id ? { ...u, is_active: true } : u,
          ),
        );
        toast.success(`Đã mở khoá tài khoản "${confirm.user.email}"`);
      } else {
        await deleteUser(confirm.user.id);
        toast.success(`Đã xoá tài khoản "${confirm.user.email}"`);
        await load();
      }
    } catch (err) {
      toast.error(err?.message ?? "Thao tác thất bại, vui lòng thử lại");
    }
    setActionLoading(false);
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/*  Modals  */}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            load();
          }}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === "toggle"
            ? "Thay đổi quyền?"
            : confirm?.type === "lock"
              ? "Khoá tài khoản?"
              : confirm?.type === "unlock"
                ? "Mở khoá tài khoản?"
                : "Xoá tài khoản?"
        }
        message={
          confirm?.type === "toggle" ? (
            <>
              Chuyển{" "}
              <strong className="text-white">{confirm.user.email}</strong> sang{" "}
              <strong className="text-white">
                {confirm.user.role === "ADMIN" ? "USER" : "ADMIN"}
              </strong>
              ?
            </>
          ) : confirm?.type === "lock" ? (
            <>
              Khoá tài khoản{" "}
              <strong className="text-white">{confirm?.user?.email}</strong> —
              người dùng sẽ không thể đăng nhập.
            </>
          ) : confirm?.type === "unlock" ? (
            <>
              Mở khoá tài khoản{" "}
              <strong className="text-white">{confirm?.user?.email}</strong> —
              người dùng có thể đăng nhập lại.
            </>
          ) : (
            <>
              Tài khoản{" "}
              <strong className="text-white">{confirm?.user?.email}</strong> sẽ
              bị xoá vĩnh viễn.
            </>
          )
        }
        confirmLabel={
          confirm?.type === "toggle"
            ? "Đổi quyền"
            : confirm?.type === "lock"
              ? "Khoá ngay 🔒"
              : confirm?.type === "unlock"
                ? "Mở khoá 🔓"
                : "Xoá vĩnh viễn"
        }
        confirmClass={
          confirm?.type === "lock"
            ? "bg-orange-500 hover:bg-orange-400"
            : confirm?.type === "delete"
              ? "bg-red-500 hover:bg-red-400"
              : "bg-purple-600 hover:bg-purple-500"
        }
        loading={actionLoading}
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/*  Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý người dùng</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {total} tài khoản đã đăng ký
          </p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm email..."
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 w-48"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-white/70 text-sm font-medium transition-colors border border-white/10"
            >
              Tìm
            </button>
          </form>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Thêm
          </button>
        </div>
      </div>

      {/*  Table  */}
      <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/8 text-xs font-semibold text-white/30 uppercase tracking-wider">
          <span>Avatar</span>
          <span>Email</span>
          <span className="text-center">Role</span>
          <span className="text-right">Hành động</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-white/40 text-sm">
            <div className="loader-ring" /> Đang tải...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            Không tìm thấy người dùng
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/3 transition-colors"
              >
                <Avatar email={user.email} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {user.email}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    Tham gia{" "}
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  {!user.is_active && <LockedBadge />}
                </div>
                <div className="flex items-center gap-1">
                  {/* Edit */}
                  <button
                    onClick={() => setEditUser(user)}
                    title="Chỉnh sửa"
                    className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-blue-400 transition-colors"
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  {/* Toggle role */}
                  <button
                    onClick={() => setConfirm({ type: "toggle", user })}
                    title={
                      user.role === "ADMIN" ? "Hạ xuống User" : "Nâng lên Admin"
                    }
                    className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-purple-400 transition-colors"
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
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </button>
                  {/* Lock / Unlock — hide for self */}
                  {user.email !== myEmail &&
                    (user.is_active ? (
                      <button
                        onClick={() => setConfirm({ type: "lock", user })}
                        title="Khoá tài khoản"
                        className="p-1.5 rounded-lg hover:bg-orange-500/10 text-white/40 hover:text-orange-400 transition-colors"
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirm({ type: "unlock", user })}
                        title="Mở khoá tài khoản"
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
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
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    ))}
                  {/* Delete — hide for self */}
                  {user.email !== myEmail && (
                    <button
                      onClick={() => setConfirm({ type: "delete", user })}
                      title="Xoá"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination  */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm disabled:opacity-30 transition-colors"
          >
            ← Trước
          </button>
          <span className="text-white/40 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm disabled:opacity-30 transition-colors"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}

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

import Avatar from "../components/ui/Avatar";
import { RoleBadge, LockedBadge } from "../components/ui/Badge";
import AddUserModal from "../components/users/AddUserModal";
import EditUserModal from "../components/users/EditUserModal";

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

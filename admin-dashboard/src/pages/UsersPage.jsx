import { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  toggleUserRole,
  deleteUser,
  createUser,
  updateUser,
  lockUser,
  unlockUser,
  exportUsersReport,
} from "../services/api";
import { getStoredEmail } from "../services/api";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import Avatar from "../components/ui/Avatar";
import { RoleBadge, LockedBadge } from "../components/ui/Badge";
import Loading from "../components/ui/Loading";
import AddUserModal from "../components/users/AddUserModal";
import EditUserModal from "../components/users/EditUserModal";
import UserEmergencyContactsModal from "../components/users/UserEmergencyContactsModal";
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Lock, 
  Unlock, 
  Users2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Calendar,
  Download
} from "lucide-react";
import { TableSkeleton } from "../components/ui/Skeleton";

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
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [contactsUser, setContactsUser] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers(page, 20, search);
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportUsersReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast?.success?.("Danh sách người dùng đã được tải xuống");
    } catch (err) {
      toast?.error?.("Không thể xuất danh sách");
    } finally {
      setExporting(false);
    }
  };

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

  const tableHeaders = [
    { label: "Thành viên" },
    { label: "Vai trò & Trạng thái" },
    { label: "Ngày tham gia" },
    { label: "Thao tác", className: "text-right" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
      {contactsUser && (
        <UserEmergencyContactsModal
          user={contactsUser}
          onClose={() => setContactsUser(null)}
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
            <div className="text-sm">
              Chuyển <strong className="text-text-primary">{confirm.user.email}</strong> sang{" "}
              <strong className="text-indigo-400">
                {confirm.user.role === "ADMIN" ? "USER" : "ADMIN"}
              </strong>
              ?
            </div>
          ) : confirm?.type === "lock" ? (
            <div className="text-sm">
              Khoá tài khoản <strong className="text-text-primary">{confirm?.user?.email}</strong> —
              người dùng sẽ không thể đăng nhập vào hệ thống.
            </div>
          ) : confirm?.type === "unlock" ? (
            <div className="text-sm">
              Mở khoá tài khoản <strong className="text-text-primary">{confirm?.user?.email}</strong> —
              người dùng có thể đăng nhập lại bình thường.
            </div>
          ) : (
            <div className="text-sm">
              Tài khoản <strong className="text-text-primary">{confirm?.user?.email}</strong> sẽ
              bị xoá vĩnh viễn khỏi cơ sở dữ liệu.
            </div>
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
              : "bg-indigo-600 hover:bg-indigo-500"
        }
        loading={actionLoading}
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />

      <PageHeader 
        title="USER" 
        highlight="ACCOUNTS" 
        description={`${total} tài khoản người dùng đã đăng ký trong hệ thống`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <form onSubmit={handleSearch} className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-indigo-500 transition-colors" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm theo email..."
              className="min-h-[40px] bg-bg-card border border-border-primary rounded-xl pl-11 pr-4 py-1.5 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all w-full sm:w-64"
            />
          </form>
          
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/10"><Plus className="w-5 h-5" /> Thêm mới</button>
            <button onClick={handleExport} disabled={exporting} className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"><Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} /> Export</button>
            <button onClick={load} className="p-2 rounded-xl bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary transition-all active:scale-95">
              {loading ? <Loading variant="inline" size="xs" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <DataTable 
        headers={tableHeaders} 
        loading={loading} 
        empty={users.length === 0}
        emptyMessage={
          <>
            <Users2 className="w-16 h-16 mx-auto opacity-10" />
            <p className="font-bold text-lg">Không tìm thấy người dùng nào</p>
            <button onClick={() => { setSearchInput(""); setSearch(""); }} className="text-indigo-400 hover:underline text-sm font-bold">Xoá bộ lọc tìm kiếm</button>
          </>
        }
      >
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group border-b border-border-primary last:border-0">
            <td className="px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar email={user.email} className="w-10 h-10 rounded-2xl border-2 border-border-primary group-hover:border-indigo-500/50 transition-colors" />
                  {!user.is_active && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-bg-card flex items-center justify-center">
                      <Lock className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-text-primary truncate flex items-center gap-2">
                    {user.email}
                    {user.email === myEmail && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] uppercase tracking-widest text-text-secondary">Tôi</span>
                    )}
                  </p>
                  <p className="text-[10px] text-text-secondary font-bold opacity-60 flex items-center gap-1 mt-1 uppercase tracking-wider">
                    <Mail className="w-3 h-3" /> UID: {user.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <RoleBadge role={user.role} />
                {!user.is_active && <LockedBadge />}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <Calendar className="w-3.5 h-3.5 opacity-40" />
                {new Date(user.created_at).toLocaleDateString("vi-VN", {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex justify-end items-center gap-2">
                <button onClick={() => setEditUser(user)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-indigo-400 hover:border-indigo-400/30 transition-all" title="Chỉnh sửa thông tin"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setContactsUser(user)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-cyan-400 hover:border-cyan-400/30 transition-all" title="Danh bạ khẩn cấp"><Users2 className="w-4 h-4" /></button>
                <div className="h-6 w-[1px] bg-white/10 mx-1" />
                <button onClick={() => setConfirm({ type: "toggle", user })} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-amber-400 hover:border-amber-400/30 transition-all" title={user.role === "ADMIN" ? "Gỡ quyền Admin" : "Cấp quyền Admin"}><Shield className="w-4 h-4" /></button>
                {user.email !== myEmail && (
                  <>
                    <button onClick={() => setConfirm({ type: user.is_active ? "lock" : "unlock", user })} className={`w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-all ${user.is_active ? 'text-text-secondary hover:text-orange-400 hover:border-orange-400/30' : 'text-green-500 hover:bg-green-500/10 border-green-500/20'}`} title={user.is_active ? "Khoá tài khoản" : "Mở khoá tài khoản"}>{user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button>
                    <button onClick={() => setConfirm({ type: "delete", user })} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-500/30 transition-all" title="Xoá vĩnh viễn"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Pagination 
        page={page} 
        totalPages={totalPages} 
        onPageChange={(p) => setPage(p)} 
      />
    </div>
  );
}

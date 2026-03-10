import { useState } from "react";
import { updateUser } from "../../services/api";
import { useToast } from "../Toast";
import Modal, { Field, INPUT_STYLES } from "../ui/Modal";
import RoleToggle from "./RoleToggle";
import Avatar from "../ui/Avatar";

export default function EditUserModal({ user, onClose, onSuccess }) {
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
          className={INPUT_STYLES}
        />
      </Field>
    </Modal>
  );
}

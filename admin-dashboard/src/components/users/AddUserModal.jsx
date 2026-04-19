import { useState } from "react";
import { createUser } from "../../services/api";
import { useToast } from "../Toast";
import Modal, { Field, INPUT_STYLES } from "../ui/Modal";
import RoleToggle from "./RoleToggle";
import { Eye, EyeOff } from "lucide-react";

export default function AddUserModal({ onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "", role: "USER" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
            className="flex-1 py-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary text-sm font-medium transition-colors"
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
          className={INPUT_STYLES}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </Field>
      <Field label="Mật khẩu *">
        <div className="relative group">
          <input
            value={form.password}
            onChange={set("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Tối thiểu 6 ký tự"
            className={`${INPUT_STYLES} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-text-primary/5 transition-all"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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

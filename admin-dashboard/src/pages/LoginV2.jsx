import { useState } from "react";
import { loginAdmin, registerAdmin } from "../services/api";

export default function LoginV2({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    try {
      if (isRegisterMode) {
        if (password !== confirmPassword) {
          throw new Error("Mật khẩu xác nhận không khớp");
        }
        await registerAdmin(email.trim(), password);
      } else {
        await loginAdmin(email.trim(), password);
      }
      onLoginSuccess?.();
    } catch (err) {
      setError(
        err?.message ||
          (isRegisterMode ? "Đăng ký thất bại" : "Đăng nhập thất bại"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-28 -left-24 w-72 h-72 rounded-full bg-accent-purple/15 blur-3xl" />
      <div className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full bg-accent-cyan/10 blur-3xl" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-bg-card/95 backdrop-blur border border-accent-purple/20 rounded-2xl p-7 shadow-xl relative z-10"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-white/60 mb-6">
          {isRegisterMode ? "Tạo tài khoản mới" : "Đăng nhập để xem dashboard"}
        </p>

        <label htmlFor="email" className="block text-white/70 text-sm mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-accent-cyan/50"
          placeholder="Vui lòng nhập email"
        />

        <label htmlFor="password" className="block text-white/70 text-sm mb-2">
          Mật khẩu
        </label>
        <div className="relative mb-4">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-16 text-white outline-none focus:border-accent-cyan/50"
            placeholder="Vui lòng nhập mật khẩu"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-4 text-xs text-white/70 hover:text-white"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>

        {isRegisterMode ? (
          <>
            <label
              htmlFor="confirm-password"
              className="block text-white/70 text-sm mb-2"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative mb-4">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-16 text-white outline-none focus:border-accent-cyan/50"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 text-xs text-white/70 hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "Ẩn mật khẩu xác nhận"
                    : "Hiện mật khẩu xác nhận"
                }
              >
                {showConfirmPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="mb-4 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-linear-to-r from-accent-purple to-accent-cyan py-3 font-semibold text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="loader-ring" />
              {isRegisterMode ? "Đang tạo tài khoản" : "Đang đăng nhập"}
              <span className="loading-dots" />
            </>
          ) : isRegisterMode ? (
            "Đăng ký"
          ) : (
            "Đăng nhập"
          )}
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            setError("");
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
            setIsRegisterMode((v) => !v);
          }}
          className="mt-3 w-full text-sm text-white/70 hover:text-white disabled:opacity-50"
        >
          {isRegisterMode
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </button>
      </form>
    </div>
  );
}

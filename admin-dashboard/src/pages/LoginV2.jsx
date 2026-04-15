import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useRegister } from "@/hooks/use-queries";
import { useToast } from "../components/Toast";
import { loginSchema, registerSchema } from "@/lib/form-schemas";

export default function LoginV2({ onLoginSuccess }) {
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const submitting = loginMutation.isPending || registerMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    if (submitting) return;

    try {
      if (isRegisterMode) {
        await registerMutation.mutateAsync({
          email: data.email.trim(),
          password: data.password,
        });
        toast?.success?.("Đăng ký thành công");
      } else {
        await loginMutation.mutateAsync({
          email: data.email.trim(),
          password: data.password,
        });
        toast?.success?.("Đăng nhập thành công");
      }
      onLoginSuccess?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isRegisterMode ? "Đăng ký thất bại" : "Đăng nhập thất bại");
      toast?.error?.(msg);
    }
  };

  const toggleMode = () => {
    reset();
    setIsRegisterMode((v) => !v);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background decorations */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-accent-purple/10 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-accent-cyan/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-[380px] bg-bg-card/90 backdrop-blur-xl border border-border-primary rounded-[1.5rem] p-6 sm:p-8 shadow-xl relative z-10 animate-slide-in"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-purple/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">
              VISION ADMIN
            </h1>
            <p className="text-[9px] text-text-secondary font-semibold tracking-widest opacity-50 uppercase">
              Security Portal
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1 tracking-tight">
          {isRegisterMode ? "Đăng ký" : "Đăng nhập"}
        </h2>
        <p className="text-text-secondary mb-6 text-xs font-medium">
          {isRegisterMode
            ? "Tạo tài khoản quản trị mới"
            : "Truy cập hệ thống điều hành AI"}
        </p>

        {/* Email Field */}
        <div className="space-y-1.5 mb-4">
          <label
            htmlFor="email"
            className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider ml-1"
          >
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              {...register("email")}
              className={`w-full rounded-xl bg-text-primary/5 border ${errors.email ? "border-accent-red/50" : "border-border-primary"} px-4 py-2.5 text-text-primary font-medium text-sm outline-none focus:border-accent-cyan/50 focus:bg-bg-card transition-all placeholder:text-text-secondary/30`}
              placeholder="admin@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-accent-red text-[10px] mt-1 ml-1 font-bold">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 mb-4">
          <label
            htmlFor="password"
            className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider ml-1"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`w-full rounded-xl bg-text-primary/5 border ${errors.password ? "border-accent-red/50" : "border-border-primary"} px-4 py-2.5 pr-12 text-text-primary font-medium text-sm outline-none focus:border-accent-cyan/50 focus:bg-bg-card transition-all placeholder:text-text-secondary/30`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-4 text-text-secondary/40 hover:text-text-primary transition-colors"
            >
              {showPassword ? (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-accent-red text-[10px] mt-1 ml-1 font-bold">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field (Register Only) */}
        {isRegisterMode && (
          <div className="space-y-1.5 mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider ml-1"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={`w-full rounded-xl bg-text-primary/5 border ${errors.confirmPassword ? "border-accent-red/50" : "border-border-primary"} px-4 py-2.5 pr-12 text-text-primary font-medium text-sm outline-none focus:border-accent-cyan/50 focus:bg-bg-card transition-all placeholder:text-text-secondary/30`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 text-text-secondary/40 hover:text-text-primary transition-colors"
              >
                {showConfirmPassword ? (
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-accent-red text-[10px] mt-1 ml-1 font-bold">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        {(loginMutation.error || registerMutation.error) && (
          <div className="mb-4 flex items-start gap-2 text-[11px] text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
            <svg
              className="w-3.5 h-3.5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-bold leading-tight">
              {loginMutation.error?.response?.data?.message ||
                registerMutation.error?.response?.data?.message ||
                loginMutation.error?.message ||
                registerMutation.error?.message}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] rounded-xl bg-linear-to-r from-accent-purple to-accent-cyan py-3 font-bold uppercase tracking-widest text-white text-[11px] shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all duration-300"
        >
          {submitting ? (
            <>
              <span
                className="loader-ring border-white/30 border-t-white"
                style={{ width: 14, height: 14 }}
              />
              <span>Đang xử lý</span>
            </>
          ) : (
            <span>{isRegisterMode ? "Đăng ký" : "Đăng nhập"}</span>
          )}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={submitting}
            onClick={toggleMode}
            className="text-[10px] text-text-secondary/60 hover:text-accent-cyan transition-colors disabled:opacity-50 group font-bold uppercase tracking-wider"
          >
            {isRegisterMode ? (
              <>
                Đã có tài khoản?{" "}
                <span className="text-accent-purple group-hover:text-accent-cyan transition-colors underline underline-offset-4 decoration-2">
                  Đăng nhập
                </span>
              </>
            ) : (
              <>
                Chưa có tài khoản?{" "}
                <span className="text-accent-purple group-hover:text-accent-cyan transition-colors underline underline-offset-4 decoration-2">
                  Yêu cầu quyền
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sun, Moon, RefreshCw } from "lucide-react";
import { useLogin, useRegister } from "@/hooks/use-queries";
import { useToast } from "../components/Toast";
import { loginSchema, registerSchema } from "@/lib/form-schemas";

export default function LoginV2({ onLoginSuccess }) {
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Theme state synchronized with document and localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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
        toast?.success?.("Đăng ký thành công! Hãy đăng nhập.");
        setIsRegisterMode(false);
        reset();
      } else {
        await loginMutation.mutateAsync({
          email: data.email.trim(),
          password: data.password,
        });
        toast?.success?.("Chào mừng trở lại!");
        onLoginSuccess?.();
      }
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || err?.message || "Thao tác thất bại");
    }
  };

  const toggleMode = () => {
    reset();
    setIsRegisterMode((v) => !v);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30 transition-colors duration-500">
      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-bg-card/40 backdrop-blur-md border border-white/10 shadow-lg hover:bg-bg-card/60 transition-all text-text-primary group"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </motion.button>

      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 mb-3 p-1 rounded-2xl bg-linear-to-br from-indigo-500/20 to-cyan-500/20 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center group"
          >
            <img 
              src="/logo.png" 
              alt="Vision Assistant Logo" 
              className="w-11 h-11 object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-xl font-black text-text-primary tracking-tighter uppercase">
              Vision <span className="text-indigo-500">Admin</span>
            </h1>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.3em] opacity-50">
              Cổng Quản Trị Hệ Thống AI
            </p>
          </motion.div>
        </div>

        {/* Main Card */}
        <div className="bg-bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-7 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-500">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegisterMode ? "register" : "login"}
              initial={{ opacity: 0, x: isRegisterMode ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRegisterMode ? -20 : 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="text-lg font-bold text-text-primary mb-1">
                {isRegisterMode ? "Bắt đầu ngay" : "Chào mừng trở lại"}
              </h2>
              <p className="text-xs text-text-secondary mb-6 opacity-70 leading-relaxed">
                {isRegisterMode 
                  ? "Tạo tài khoản quản trị để tiếp tục" 
                  : "Đăng nhập để quản lý AI Vision"}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-indigo-500 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      className={`w-full bg-text-primary/5 border ${errors.email ? "border-red-500/50" : "border-white/5"} rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 outline-none focus:border-indigo-500/50 focus:bg-text-primary/10 transition-all`}
                      placeholder="Địa chỉ Email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-red-500 font-bold ml-4 animate-in fade-in slide-in-from-left-2">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-indigo-500 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className={`w-full bg-text-primary/5 border ${errors.password ? "border-red-500/50" : "border-white/5"} rounded-xl py-3 pl-11 pr-11 text-sm text-text-primary placeholder:text-text-secondary/30 outline-none focus:border-indigo-500/50 focus:bg-text-primary/10 transition-all`}
                      placeholder="Mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-text-secondary/40 hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-red-500 font-bold ml-4 animate-in fade-in slide-in-from-left-2">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password (Register Only) */}
                {isRegisterMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-indigo-500 transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("confirmPassword")}
                        className={`w-full bg-text-primary/5 border ${errors.confirmPassword ? "border-red-500/50" : "border-white/5"} rounded-xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 outline-none focus:border-indigo-500/50 focus:bg-text-primary/10 transition-all`}
                        placeholder="Xác nhận mật khẩu"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 font-bold ml-4 animate-in fade-in slide-in-from-left-2">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </motion.div>
                )}

                {!isRegisterMode && (
                  <div className="flex justify-end px-1">
                    <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider opacity-60 hover:opacity-100">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full group relative overflow-hidden rounded-xl bg-indigo-600 py-3.5 font-black uppercase tracking-[0.2em] text-white text-[10px] shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="flex items-center justify-center gap-2">
                    {submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        {isRegisterMode ? "Tham gia" : "Truy cập"}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Footer Toggle */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[11px] text-text-secondary font-medium hover:text-indigo-400 transition-colors group"
            >
              {isRegisterMode ? (
                <>Đã có tài khoản? <span className="text-indigo-500 font-bold group-hover:underline">Đăng nhập</span></>
              ) : (
                <>Chưa có quyền? <span className="text-indigo-500 font-bold group-hover:underline">Đăng ký ngay</span></>
              )}
            </button>
          </div>
        </div>

        {/* System Info */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-[9px] text-text-secondary/30 font-bold uppercase tracking-widest"
        >
          © 2026 Vision Assistant • AI Safety Portal v4.2.0
        </motion.p>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { loginAdmin } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await loginAdmin(email.trim(), password);
      onLoginSuccess?.();
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
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
        <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
        <p className="text-white/60 mb-6">Đăng nhập xem dashboard.</p>

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
          placeholder="Please enter your email!"
        />

        <label htmlFor="password" className="block text-white/70 text-sm mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-accent-cyan/50"
          placeholder="Please enter your password!"
        />

        {error ? (
          <div className="mb-4 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan py-3 font-semibold text-white disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="loader-ring" />
              Đang đăng nhập
              <span className="loading-dots" />
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </div>
  );
}

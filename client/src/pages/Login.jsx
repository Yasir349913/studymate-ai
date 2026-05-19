import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { useQuizStore } from "@/store/quiz.store";
import { useFlashcardStore } from "@/store/flashcard.store";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const { data } = await authAPI.login(form);

      // React Query cache clear — purane user ka data hatao
      queryClient.clear();

      // Zustand stores reset
      useQuizStore.getState().reset();
      useFlashcardStore.getState().clear();

      // Auth set karo
      setAuth(data.user, data.accessToken);

      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* ── Left Panel ── */}
          <div className="relative bg-[#0f0a1e] p-10 flex flex-col justify-between overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 z-10">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium text-base tracking-tight">
                StudyMate AI
              </span>
            </div>

            <div className="z-10 mt-12">
              <h2 className="text-white text-2xl font-medium leading-snug mb-3">
                Study smarter,
                <br />
                not harder.
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Upload your notes and let AI help you understand, quiz, and
                master any topic.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  "Chat with your PDF notes",
                  "Auto-generate MCQ quizzes",
                  "Smart flashcard review system",
                  "Instant document summaries",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                    <span className="text-white/50 text-sm">{f}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-8">
                <div className="flex">
                  {["AK", "SR", "MF", "ZH"].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-7 h-7 rounded-full border-2 border-[#0f0a1e] flex items-center justify-center text-white text-[10px] font-medium -ml-2 first:ml-0"
                      style={{
                        background: [
                          "#6342ff",
                          "#1d9e75",
                          "#d4537e",
                          "#ef9f27",
                        ][i],
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-white/30 text-xs">
                  Joined by 500+ students
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="bg-white dark:bg-[#111118] p-10 flex flex-col justify-center">
            <div className="mb-7">
              <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/40">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {errors.general}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="ali@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all
                    ${
                      errors.email
                        ? "border-red-400 dark:border-red-500/50"
                        : "border-gray-200 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500"
                    }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    disabled={loading}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all
                      ${
                        errors.password
                          ? "border-red-400 dark:border-red-500/50"
                          : "border-gray-200 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-white/30 mt-6">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

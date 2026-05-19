import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/api/auth.api";

const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
};

const strengthConfig = [
  { label: "", color: "" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-orange-400" },
  { label: "Good", color: "bg-yellow-400" },
  { label: "Strong", color: "bg-emerald-500" },
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const { checks, score } = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    if (score < 3) {
      setError("Password is too weak");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong";
      toast.error(msg);
      setError(msg);
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
        className="w-full max-w-md"
      >
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white dark:bg-[#111118]">
          <div className="p-8">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium text-base tracking-tight">
                StudyMate AI
              </span>
            </div>

            {!done ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                    Set new password
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-white/40">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all
                          ${
                            error
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

                    {/* Strength bar — same as Signup */}
                    {password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= score
                                  ? strengthConfig[score].color
                                  : "bg-gray-200 dark:bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 dark:text-white/30">
                            Strength:{" "}
                            <span className="font-medium text-gray-600 dark:text-white/50">
                              {strengthConfig[score].label}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            ["8+ characters", checks.length],
                            ["Uppercase letter", checks.uppercase],
                            ["Lowercase letter", checks.lowercase],
                            ["Number", checks.number],
                          ].map(([label, passed]) => (
                            <div
                              key={label}
                              className="flex items-center gap-1.5"
                            >
                              {passed ? (
                                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <X className="w-3 h-3 text-gray-300 dark:text-white/20 flex-shrink-0" />
                              )}
                              <span
                                className={`text-xs ${passed ? "text-gray-600 dark:text-white/60" : "text-gray-400 dark:text-white/25"}`}
                              >
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Resetting...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Success State ── */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Password updated!
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/40">
                  Redirecting you to login...
                </p>
              </div>
            )}

            {!done && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

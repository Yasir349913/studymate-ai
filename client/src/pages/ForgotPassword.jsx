import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, BookOpen, ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent!");
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

            {!sent ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                    Forgot password?
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-white/40">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="ali@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all
                        ${
                          error
                            ? "border-red-400 dark:border-red-500/50"
                            : "border-gray-200 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500"
                        }`}
                    />
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
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Success State ── */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Check your inbox
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
                  If <span className="text-gray-700 dark:text-white/70">{email}</span> is registered,
                  you'll receive a password reset link shortly.
                </p>
                <p className="text-xs text-gray-400 dark:text-white/25">
                  Didn't receive it? Check spam or{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
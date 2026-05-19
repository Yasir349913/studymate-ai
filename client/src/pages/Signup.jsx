import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return { score };
};

const strengthConfig = [
  { label: "", color: "" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-orange-400" },
  { label: "Good", color: "bg-yellow-400" },
  { label: "Strong", color: "bg-emerald-500" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { score } = getPasswordStrength(form.password);

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = "Name is required";

    if (!form.email) errs.email = "Email is required";

    if (!form.password) errs.password = "Password is required";
    else if (score < 3) errs.password = "Password is too weak";

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
      const { data } = await authAPI.signup(form);

      setAuth(data.user, data.accessToken);

      toast.success(`Welcome, ${data.user.name}!`);

      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Signup failed";

      toast.error(msg);

      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all ${
      errors[field]
        ? "border-red-400 dark:border-red-500/50"
        : "border-gray-200 dark:border-white/10 focus:border-violet-500 dark:focus:border-violet-500"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Left Panel */}
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
                Your notes.
                <br />
                Your AI tutor.
              </h2>

              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Upload notes, generate quizzes, create flashcards, and study
                smarter with AI.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  "Chat with your PDF notes",
                  "Auto-generate MCQ quizzes",
                  "Smart flashcard review",
                  "Instant AI summaries",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />

                    <span className="text-white/50 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <span className="text-xs text-white/25 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full">
                  Built for modern students
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white dark:bg-[#111118] p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">
                Create account
              </h1>

              <p className="text-sm text-gray-500 dark:text-white/40">
                Upload notes. Learn faster with AI.
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

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
                  Full name
                </label>

                <input
                  placeholder="Ali Khan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  className={inputClass("name")}
                />

                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
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
                  className={inputClass("email")}
                />

                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mb-1.5">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    disabled={loading}
                    className={`${inputClass("password")} pr-10`}
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

                {/* Password Strength */}
                {form.password && (
                  <div className="mt-3 space-y-2">
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
                        Password strength
                      </span>

                      <span
                        className={`text-xs font-medium ${
                          score <= 1
                            ? "text-red-400"
                            : score === 2
                              ? "text-orange-400"
                              : score === 3
                                ? "text-yellow-400"
                                : "text-emerald-400"
                        }`}
                      >
                        {strengthConfig[score].label}
                      </span>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-white/30 mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  MessageSquare,
  Trophy,
  CreditCard,
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  FileText,
  Brain,
  Target,
  Menu,
  X,
  ChevronRight,
  Lock,
  Cpu,
  Rocket,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// ── Smooth scroll helper ──────────────────────────────
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Nav links config ──────────────────────────────────
const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "FAQ", id: "faq" },
];

// ── Feature Card ──────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="group relative p-6 rounded-2xl border border-white/[0.06] bg-[#0f0f1a] hover:border-violet-500/20 hover:bg-[#11111f] transition-all duration-300 cursor-default"
    >
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-violet-500/0 to-transparent group-hover:via-violet-500/40 transition-all duration-500" />
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-white/90 font-semibold text-sm mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Step Card ─────────────────────────────────────────
function StepCard({ step, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex gap-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 text-xs font-bold">
        {step}
      </div>
      <div>
        <h3 className="text-white/90 font-semibold text-sm mb-1 tracking-tight">
          {title}
        </h3>
        <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── FAQ Item ──────────────────────────────────────────
function FAQItem({ question, answer, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#0f0f1a]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-white/75 text-sm font-medium">{question}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/25 flex-shrink-0 ml-4 text-lg leading-none"
        >
          +
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-5 pb-4 text-white/35 text-sm leading-relaxed border-t border-white/[0.04] pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Dashboard Mockup ──────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16">
      <div className="absolute inset-0 bg-violet-600/10 blur-[60px] rounded-3xl" />
      <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a12] shadow-2xl shadow-black/60">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#080810]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/[0.05] border border-white/[0.06] rounded-md px-4 py-1 text-white/25 text-xs">
              app.studymate.ai/dashboard
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-[320px]">
          {/* Sidebar */}
          <div className="w-44 border-r border-white/[0.05] p-3 flex flex-col gap-1 bg-[#09090f]">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/70 text-xs font-semibold">
                StudyMate
              </span>
            </div>
            {[
              { icon: FileText, label: "Documents", active: true },
              { icon: MessageSquare, label: "Chats", active: false },
              { icon: Trophy, label: "Quizzes", active: false },
              { icon: CreditCard, label: "Flashcards", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                  active ? "bg-violet-600/20 text-violet-300" : "text-white/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <p className="text-white/50 text-xs font-medium mb-3">
              Your Documents
            </p>
            <div className="space-y-2 mb-4">
              {[
                {
                  name: "Chapter5_DataStructures.pdf",
                  status: "ready",
                  color: "text-red-400 bg-red-500/10",
                },
                {
                  name: "Lecture_Notes_Week3.pptx",
                  status: "ready",
                  color: "text-orange-400 bg-orange-500/10",
                },
                {
                  name: "Algorithms_Summary.docx",
                  status: "processing",
                  color: "text-blue-400 bg-blue-500/10",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${doc.color}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/65 text-xs truncate font-medium">
                      {doc.name}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      doc.status === "ready"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {doc.status === "ready" ? "Ready" : "Processing..."}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                {
                  label: "Chat",
                  icon: MessageSquare,
                  color:
                    "bg-violet-500/10 text-violet-300 border-violet-500/20",
                },
                {
                  label: "Quiz",
                  icon: Trophy,
                  color:
                    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                },
                {
                  label: "Flashcards",
                  icon: CreditCard,
                  color: "bg-blue-500/10 text-blue-300 border-blue-500/20",
                },
              ].map(({ label, icon: Icon, color }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${color}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-4 top-12 bg-[#12121e] border border-white/10 rounded-xl p-3 shadow-xl hidden lg:block"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          </div>
          <span className="text-white/70 text-xs font-medium">Quiz done!</span>
        </div>
        <p className="text-white/35 text-[10px]">Score: 9/10 ✨</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute -left-4 bottom-12 bg-[#12121e] border border-white/10 rounded-xl p-3 shadow-xl hidden lg:block"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Brain className="w-2.5 h-2.5 text-violet-400" />
          </div>
          <span className="text-white/70 text-xs font-medium">AI Ready</span>
        </div>
        <p className="text-white/35 text-[10px]">115 sections indexed</p>
      </motion.div>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────
export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: "#08080e" }}
    >
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-[#08080e]/90 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo — click scrolls to top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              StudyMate AI
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-white/40 text-sm hover:text-white/80 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-white/45 text-sm hover:text-white/70 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30"
            >
              Get started free
            </Link>
            <button
              className="md:hidden text-white/50 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-[#08080e]/95 backdrop-blur-xl"
            >
              <div className="px-6 py-4 space-y-1">
                {NAV_LINKS.map(({ label, id }) => (
                  <button
                    key={id}
                    onClick={() => {
                      scrollTo(id);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-white/50 text-sm hover:text-white transition-colors py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    {label}
                  </button>
                ))}
                <Link
                  to="/login"
                  className="block text-white/50 text-sm hover:text-white transition-colors py-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-700/8 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-700/5 rounded-full blur-[120px]" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Radial fade over grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#08080e_80%)]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-300/80 text-xs font-medium mb-6"
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered Study Assistant
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-[-0.03em] mb-5 text-white"
          >
            Study smarter,
            <br />
            <span className="text-violet-400">not harder.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/40 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-3"
          >
            Upload your notes, lecture slides, or textbooks. Chat with your
            documents, generate MCQ quizzes, and create flashcards — all in one
            place.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/20 text-sm mb-8"
          >
            No credit card required · Works with PDF, PPTX, DOCX · Free forever
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <Link
              to="/signup"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all text-sm shadow-xl shadow-violet-600/25 hover:shadow-violet-500/35"
            >
              Start studying for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/55 font-medium transition-all text-sm"
            >
              Sign in to your account
            </Link>
          </motion.div>

          {/* Honest early access tag — no fake numbers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.07] bg-white/[0.02] text-white/30 text-xs"
          >
            <Rocket className="w-3 h-3 text-violet-400" />
            Now in early access — free for all students
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative w-full max-w-4xl mx-auto"
        >
          <DashboardMockup />
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="py-24 px-6 border-t border-white/[0.05]"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/35 text-xs mb-4">
              <Zap className="w-3 h-3" />
              Everything you need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4 text-white">
              One app for all your study needs
            </h2>
            <p className="text-white/35 text-base max-w-xl mx-auto">
              Upload any document and instantly get AI-powered study tools built
              from your own notes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: Upload,
                title: "Smart Document Upload",
                desc: "Upload PDF, PPTX, or DOCX files. AI automatically extracts and indexes all content for instant access.",
                color: "bg-violet-500/12 text-violet-400",
                delay: 0,
              },
              {
                icon: MessageSquare,
                title: "Chat with Your Notes",
                desc: "Ask any question and get answers sourced directly from your uploaded documents. No hallucinations — only your notes.",
                color: "bg-blue-500/12 text-blue-400",
                delay: 0.08,
              },
              {
                icon: Brain,
                title: "Auto Summary",
                desc: "Every document gets an instant AI-generated summary highlighting key topics, main points, and important terms.",
                color: "bg-emerald-500/12 text-emerald-400",
                delay: 0.16,
              },
              {
                icon: Trophy,
                title: "MCQ Quiz Generator",
                desc: "Generate 5–20 multiple choice questions at Easy, Medium, or Hard difficulty. Review wrong answers with explanations.",
                color: "bg-orange-500/12 text-orange-400",
                delay: 0.24,
              },
              {
                icon: CreditCard,
                title: "Smart Flashcards",
                desc: "Auto-generate term/definition flashcard decks. Track progress with Got it / Review system and spaced repetition.",
                color: "bg-pink-500/12 text-pink-400",
                delay: 0.32,
              },
              {
                icon: Target,
                title: "Syllabus-Focused AI",
                desc: "AI stays within your document's context only. No off-topic answers — perfect for exam preparation.",
                color: "bg-teal-500/12 text-teal-400",
                delay: 0.4,
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="py-24 px-6 border-t border-white/[0.05]"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4 text-white">
              Up and running in 3 steps
            </h2>
            <p className="text-white/35 text-base max-w-lg mx-auto">
              No complex setup. Just upload and start studying.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Upload your document",
                  desc: "Drag and drop any PDF, PPTX, or DOCX file. AI processes and indexes your content in seconds.",
                  delay: 0,
                },
                {
                  step: "2",
                  title: "Choose your study mode",
                  desc: "Chat with your notes, take a quiz, or review flashcards — all generated from your own document.",
                  delay: 0.1,
                },
                {
                  step: "3",
                  title: "Study smarter",
                  desc: "Get accurate answers, test your knowledge, and track your progress toward exam readiness.",
                  delay: 0.2,
                },
              ].map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>

            {/* Visual panel */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-red-500/12 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/65 text-xs font-medium">
                    Chapter5_DataStructures.pdf
                  </p>
                  <p className="text-white/25 text-xs">115 sections indexed</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>

              {[
                {
                  label: "Chat with notes",
                  icon: MessageSquare,
                  color:
                    "bg-violet-500/8 text-violet-300 border-violet-500/15 hover:border-violet-500/30",
                },
                {
                  label: "Generate Quiz",
                  icon: Trophy,
                  color:
                    "bg-emerald-500/8 text-emerald-300 border-emerald-500/15 hover:border-emerald-500/30",
                },
                {
                  label: "Create Flashcards",
                  icon: CreditCard,
                  color:
                    "bg-blue-500/8 text-blue-300 border-blue-500/15 hover:border-blue-500/30",
                },
              ].map(({ label, color, icon: Icon }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 p-3 rounded-xl border ${color} text-sm transition-all cursor-pointer`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-xs">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why StudyMate ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4 text-white">
              Built for students who
              <br />
              <span className="text-violet-400">actually want to learn</span>
            </h2>
            <p className="text-white/35 text-base max-w-xl mx-auto mb-12">
              Unlike ChatGPT, StudyMate AI only answers from your uploaded
              documents. No distractions. No off-topic answers. Just your
              syllabus.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                title: "Before exam",
                desc: "Upload chapter notes → Take a quiz → See what you know and what needs review",
                emoji: "📚",
              },
              {
                title: "During lectures",
                desc: "Upload professor slides → Chat with them → Get instant clarity on confusing topics",
                emoji: "🎓",
              },
              {
                title: "Group study",
                desc: "Share document insights → Everyone quizzes on the same material → Learn together",
                emoji: "👥",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl border border-white/[0.06] bg-[#0f0f1a] text-left"
              >
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="text-white/85 font-semibold text-sm mb-2">
                  {item.title}
                </h3>
                <p className="text-white/35 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Early Access Banner ── */}
      <section className="py-12 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-violet-500/15 bg-violet-600/5 p-8 text-center overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-violet-600/10 blur-[50px] rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-xs font-medium mb-4">
                <Rocket className="w-3 h-3" />
                Early Access
              </div>
              <h3 className="text-white font-bold text-xl mb-2 tracking-tight">
                Be among the first to use it
              </h3>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
                StudyMate AI is in early access. Sign up now — completely free,
                no credit card needed. Your feedback directly shapes the
                product.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-5">
                {[
                  "Free forever",
                  "No credit card",
                  "Your feedback shapes the product",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 text-white/35 text-xs"
                  >
                    <Check className="w-3 h-3 text-violet-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="py-12 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: Lock,
                label: "Private & Secure",
                sub: "Your docs, only yours",
              },
              {
                icon: Cpu,
                label: "Powered by AI",
                sub: "Latest language models",
              },
              {
                icon: Zap,
                label: "Instant Results",
                sub: "Indexed in seconds",
              },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-white/60 text-xs font-semibold">{label}</p>
                <p className="text-white/25 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-[-0.02em] text-center mb-12 text-white"
          >
            Common questions
          </motion.h2>
          <div className="space-y-2">
            {[
              {
                q: "What file types are supported?",
                a: "StudyMate AI supports PDF, PPTX (PowerPoint), and DOCX (Word) files up to 10MB. Text-based files work best — scanned image PDFs are not supported yet.",
              },
              {
                q: "Does the AI use information outside my document?",
                a: "No. StudyMate AI strictly answers from your uploaded document only. If the answer is not in your notes, it will say so. This keeps your study focused on your syllabus.",
              },
              {
                q: "Is my data private?",
                a: "Yes. Your documents are stored securely and only accessible to you. We do not share your content with anyone.",
              },
              {
                q: "How many documents can I upload?",
                a: "You can upload multiple documents. Each document gets its own chat, quiz, and flashcard set so you can study different subjects separately.",
              },
              {
                q: "Is it really free?",
                a: "Yes — StudyMate AI is completely free during early access. No credit card required.",
              },
            ].map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 rounded-2xl bg-violet-600/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-violet-400" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3 text-white">
              Ready to study smarter?
            </h2>
            <p className="text-white/35 text-base mb-2">
              Sign up free and start in under 60 seconds.
            </p>
            <p className="text-white/20 text-sm mb-8">
              Free forever · No credit card needed · Works with any document
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all text-base shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/40"
            >
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/35 text-sm font-medium">
              StudyMate AI
            </span>
          </div>
          <p className="text-white/15 text-xs">
            Built for students. Powered by AI.
          </p>
          <div className="flex gap-6">
            <Link
              to="/login"
              className="text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

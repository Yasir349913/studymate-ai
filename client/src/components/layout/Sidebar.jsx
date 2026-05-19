import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Trophy,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { chatAPI } from "@/api/chat.api";
import { cn, truncate } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: MessageSquare, label: "Chat", to: "/chat" },
  { icon: Trophy, label: "Quiz", to: "/quiz" },
  { icon: CreditCard, label: "Flashcards", to: "/flashcards" },
];

// ── Shared sidebar content ────────────────────────────
function SidebarContent({ collapsed, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatAPI.getAll().then((r) => r.data),
  });

  const chats = chatsData?.chats || [];

  const handleNav = (to) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-medium text-sm tracking-tight whitespace-nowrap">
            StudyMate AI
          </span>
        )}
      </div>

      {/* New Chat Button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => handleNav("/chat")}
          className={cn(
            "flex items-center gap-2 w-full rounded-xl py-2 px-3 text-sm font-medium transition-all",
            "bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20",
            collapsed && "justify-center px-2",
          )}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 px-3 py-2">
        {navItems.map(({ icon: Icon, label, to }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center gap-3 rounded-xl py-2.5 px-3 text-sm transition-all",
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Recent Chats */}
      {!collapsed && chats.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-xs font-medium text-white/20 uppercase tracking-wider px-3 mb-2">
            Recent Chats
          </p>
          <div className="flex flex-col gap-0.5">
            {chats.slice(0, 10).map((chat) => (
              <Link
                key={chat._id}
                to={`/chat/${chat._id}`}
                onClick={() => onNavigate?.()}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-2 px-3 text-xs transition-all group",
                  location.pathname === `/chat/${chat._id}`
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/60 hover:bg-white/5",
                )}
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{truncate(chat.title, 28)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User */}
      <div className="mt-auto border-t border-white/8 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2",
            collapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-300 text-xs font-medium flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.name}
              </p>
              {/* <p className="text-white/30 text-xs truncate">{user?.email}</p> */}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-white/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Desktop Sidebar ───────────────────────────────────
function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative hidden md:flex flex-col h-screen bg-[#0f0a1e] border-r border-white/8 flex-shrink-0"
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-[-12px] top-6 z-30 w-7 h-7 rounded-full border border-white/10 bg-violet-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <SidebarContent collapsed={collapsed} />
    </motion.aside>
  );
}

// ── Mobile Sidebar ────────────────────────────────────
function MobileSidebar() {
  const [open, setOpen] = useState(false);

  // Close on route change
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar — mobile only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[#0f0a1e] border-b border-white/8">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-white" />
          </div>
          <span className="text-white font-medium text-sm">StudyMate AI</span>
        </div>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0f0a1e] border-r border-white/8 flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <SidebarContent
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Export ───────────────────────────────────────
export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}

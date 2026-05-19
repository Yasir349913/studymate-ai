import Sidebar from "./Sidebar";

export default function PageWrapper({ children }) {
  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar />
      {/* md:pt-0 — desktop pe top bar nahi, mobile pe hai (h-14 = 56px) */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}

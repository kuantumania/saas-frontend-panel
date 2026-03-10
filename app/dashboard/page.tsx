"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, LogOut, Users, Package, Clock, CheckCircle2,
  MoreHorizontal, Check, X, MessageCircle, Upload, UserPlus,
  Activity, ChevronRight, Copy, Eye, EyeOff, Gamepad2,
  CreditCard, ExternalLink, Layers, ArrowUpRight,
  FileText, Image, Box, Volume2, Folder,
} from "lucide-react";
import * as api from "@/lib/api";

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatSize(kb?: number) {
  if (!kb) return "—";
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function fileIcon(type?: string) {
  if (!type) return <FileText className="w-4 h-4" strokeWidth={1.5} />;
  if (type.includes("image")) return <Image className="w-4 h-4" strokeWidth={1.5} />;
  if (type.includes("fbx") || type.includes("model") || type.includes("obj")) return <Box className="w-4 h-4" strokeWidth={1.5} />;
  if (type.includes("audio")) return <Volume2 className="w-4 h-4" strokeWidth={1.5} />;
  return <FileText className="w-4 h-4" strokeWidth={1.5} />;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  staging: { label: "Staging", bg: "bg-zinc-500/10", text: "text-zinc-400", ring: "ring-zinc-500/20" },
  in_review: { label: "Review", bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/20" },
  approved: { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/20" },
  rejected: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-400", ring: "ring-rose-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const c = statusConfig[status] || statusConfig.staging;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#EDEDED] shadow-2xl shadow-black/50 backdrop-blur-md"
    >
      {message}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════

export default function DashboardPage() {
  // ── Auth ──
  const [token, setToken] = useState<string | null>(null);
  const [studio, setStudio] = useState<{ name?: string; slug?: string }>({});

  // ── Data ──
  const [stats, setStats] = useState({ totalMembers: 0, totalAssets: 0, pendingReview: 0, approved: 0 });
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [libraryPagination, setLibraryPagination] = useState({ page: 1, total_pages: 1, total: 0, has_prev: false, has_next: false });
  const [members, setMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [billing, setBilling] = useState<any>(null);

  // ── UI State ──
  const [loading, setLoading] = useState(true);
  const [libFilter, setLibFilter] = useState("all");
  const [libSearch, setLibSearch] = useState("");
  const [libPage, setLibPage] = useState(1);
  const [showNotifs, setShowNotifs] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("lead_session_token");
    const s = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
    setStudio(s);
  }, []);

  // ── Keyboard shortcut ⌘K ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Load Data ──
  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, p, l, m, a, n, b] = await Promise.all([
        api.fetchStats(token),
        api.fetchPendingReview(token),
        api.fetchLibrary(token, { page: 1, status: "all" }),
        api.fetchMembers(token),
        api.fetchActivity(token),
        api.fetchNotifications(token),
        api.fetchBilling(token),
      ]);
      setStats(s);
      setPendingAssets(p);
      setLibraryAssets(l.assets || []);
      setLibraryPagination(l.pagination || {});
      setMembers(m);
      setActivities(a);
      setNotifications(n.notifications || []);
      setUnreadCount(n.unread_count || 0);
      setBilling(b);
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Library reload ──
  const loadLibrary = useCallback(async () => {
    if (!token) return;
    const data = await api.fetchLibrary(token, { page: libPage, status: libFilter, search: libSearch });
    setLibraryAssets(data.assets || []);
    setLibraryPagination(data.pagination || {});
  }, [token, libPage, libFilter, libSearch]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  // ── Actions ──
  const handleApprove = async (id: string) => {
    if (!token) return;
    const ok = await api.approveAsset(token, id);
    if (ok) { setToast("Asset approved"); loadAll(); }
  };

  const handleReject = async () => {
    if (!token || !rejectingId) return;
    const ok = await api.rejectAsset(token, rejectingId, rejectReason);
    if (ok) { setToast("Asset rejected"); setRejectingId(null); setRejectReason(""); loadAll(); }
  };

  const handleInvite = async (role: string) => {
    if (!token) return;
    const data = await api.inviteMember(token, role);
    if (data?.pin) {
      setToast(`Invite PIN: ${data.pin}`);
      loadAll();
    }
  };

  const handleMarkRead = async () => {
    if (!token) return;
    await api.markNotificationsRead(token);
    setUnreadCount(0);
    const n = await api.fetchNotifications(token);
    setNotifications(n.notifications || []);
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setToast("Session token copied");
  };

  const logout = () => {
    localStorage.removeItem("lead_session_token");
    localStorage.removeItem("lead_studio");
    window.location.href = "/login";
  };

  const handleSearch = (val: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLibSearch(val);
      setLibPage(1);
    }, 300);
  };

  if (!token) return null;

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-[family-name:var(--font-geist-sans)]">

      {/* ── COMMAND HUB (Top Bar) ─────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#1E1E1E] bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#3B82F6]" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              {studio.name || "Studio"}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B] group-focus-within:text-[#71717A] transition-colors" strokeWidth={1.5} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search assets..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-14 rounded-lg bg-[#121212] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-[#52525B] border border-[#27272A]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <Bell className="w-4 h-4 text-[#A1A1AA]" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F43F5E] ring-2 ring-[#0A0A0A]" />
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#121212] border border-[#27272A] shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#71717A]">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkRead} className="text-[10px] font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-[#52525B] py-8">No notifications</p>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors ${!n.is_read ? "bg-[#3B82F6]/[0.03]" : ""}`}
                          >
                            <p className="text-xs text-[#EDEDED] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-[#52525B] mt-1 block">{timeAgo(n.created_at)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-[#52525B]" strokeWidth={1.5} />
            </button>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-[10px] font-bold text-white ml-1">
              {(studio.name || "S")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close notifs */}
      {showNotifs && <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />}

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* ── METRICS ROW ────────────────────────── */}
        <section className="grid grid-cols-4 gap-4 mb-10 stagger">
          {[
            { label: "Members", value: stats.totalMembers, icon: Users, color: "text-[#3B82F6]" },
            { label: "Total Assets", value: stats.totalAssets, icon: Package, color: "text-[#A1A1AA]" },
            { label: "Pending", value: stats.pendingReview, icon: Clock, color: "text-[#F59E0B]" },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-[#10B981]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="group p-5 rounded-xl bg-[#121212] border border-[#1E1E1E] hover:border-[#27272A] transition-all duration-200 cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#52525B]">
                  {label}
                </span>
                <Icon className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-80 transition-opacity`} strokeWidth={1.5} />
              </div>
              <span className="text-3xl font-light tracking-tight text-[#EDEDED]">
                {loading ? <span className="skeleton inline-block w-10 h-8" /> : value}
              </span>
            </div>
          ))}
        </section>

        {/* ── TWO COLUMNS: REVIEW + ACTIVITY ─────── */}
        <section className="grid grid-cols-5 gap-6 mb-10">

          {/* Pending Review — 3 cols */}
          <div className="col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Pending Review</h2>
              {pendingAssets.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                  {pendingAssets.length}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {loading ? (
                <div className="space-y-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                      <div className="skeleton w-10 h-10 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-32" />
                        <div className="skeleton h-2.5 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                  <p className="text-sm font-medium text-[#52525B]">All caught up</p>
                  <p className="text-xs text-[#3F3F46] mt-1">No assets pending review</p>
                </div>
              ) : (
                <div>
                  {pendingAssets.slice(0, 6).map((a: any) => {
                    const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                    const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "");
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {isImg && a.preview_url ? (
                            <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                          <p className="text-xs text-[#52525B] mt-0.5">
                            {a.uploader_name || "Unknown"} · {formatSize(a.file_size_kb)}
                          </p>
                        </div>

                        {/* Actions — ghost buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApprove(a.id)}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-[#52525B] hover:text-emerald-400 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => { setRejectingId(a.id); setRejectReason(""); }}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed — 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Activity</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {loading ? (
                <div className="space-y-0">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                      <div className="skeleton w-6 h-6 rounded-full" />
                      <div className="skeleton h-3 flex-1" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                  <p className="text-xs text-[#52525B]">No activity yet</p>
                </div>
              ) : (
                <div>
                  {activities.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {activityIcon(a.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          <span className="font-medium text-[#EDEDED]">{a.user_name || "Someone"}</span>
                          {" "}{activityVerb(a.action)}{" "}
                          {a.metadata?.filename && <span className="text-[#71717A] font-mono text-[11px]">{a.metadata.filename}</span>}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#3F3F46] whitespace-nowrap mt-0.5">{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── ASSET LIBRARY ──────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Asset Library</h2>
              <span className="text-xs text-[#52525B]">{libraryPagination.total}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 mb-4">
            {["all", "staging", "in_review", "approved", "rejected"].map(f => (
              <button
                key={f}
                onClick={() => { setLibFilter(f); setLibPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  libFilter === f
                    ? "bg-white/[0.08] text-[#EDEDED]"
                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                }`}
              >
                {f === "all" ? "All" : f === "in_review" ? "Review" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
              <span />
              <span>Name</span>
              <span>Uploader</span>
              <span>Size</span>
              <span>Status</span>
              <span>Time</span>
            </div>

            {loading ? (
              <div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                    <div className="skeleton w-10 h-10 rounded-md" />
                    <div className="skeleton h-3 w-40 my-auto" />
                    <div className="skeleton h-3 w-16 my-auto" />
                    <div className="skeleton h-3 w-12 my-auto" />
                    <div className="skeleton h-3 w-14 my-auto" />
                    <div className="skeleton h-3 w-8 my-auto" />
                  </div>
                ))}
              </div>
            ) : libraryAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                <p className="text-sm font-medium text-[#52525B]">No assets found</p>
                <p className="text-xs text-[#3F3F46] mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                {libraryAssets.map((a: any) => {
                  const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                  const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
                  return (
                    <div
                      key={a.id}
                      className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors cursor-default group"
                    >
                      <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {isImg && a.preview_url ? (
                          <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                        )}
                      </div>
                      <div className="flex items-center min-w-0">
                        <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[#52525B] truncate">{a.uploader_name || "—"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[#52525B] font-mono">{formatSize(a.file_size_kb)}</span>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center">
                        <span className="text-[10px] text-[#3F3F46]">{a.created_at ? timeAgo(a.created_at) : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {libraryPagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E1E1E]">
                <button
                  disabled={!libraryPagination.has_prev}
                  onClick={() => setLibPage(p => Math.max(1, p - 1))}
                  className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[10px] text-[#3F3F46] font-mono">
                  {libraryPagination.page} / {libraryPagination.total_pages}
                </span>
                <button
                  disabled={!libraryPagination.has_next}
                  onClick={() => setLibPage(p => p + 1)}
                  className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── BOTTOM ROW: TEAM + BILLING + UNITY ── */}
        <section className="grid grid-cols-3 gap-6 mb-10">

          {/* Team Members */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Team</h2>
              </div>
              {/* Inline invite */}
              <div className="relative group/invite">
                <button className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors">
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {/* Invite dropdown */}
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#121212] border border-[#27272A] shadow-xl shadow-black/40 opacity-0 pointer-events-none group-hover/invite:opacity-100 group-hover/invite:pointer-events-auto transition-all z-10">
                  {["2D_Artist", "3D_Modeler", "3D_Animator", "Technical_Art", "QA_Tester"].map(role => (
                    <button
                      key={role}
                      onClick={() => handleInvite(role)}
                      className="w-full px-3 py-2 text-xs text-left text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#EDEDED] transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {role.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <UserPlus className="w-6 h-6 text-[#27272A] mb-2" strokeWidth={1} />
                  <p className="text-xs text-[#52525B]">Invite your first teammate</p>
                </div>
              ) : (
                members.map((m: any) => (
                  <div key={m.id || m.pin} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#52525B] flex-shrink-0">
                      {(m.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#EDEDED] truncate">{m.name || "Unclaimed"}</p>
                      <p className="text-[10px] text-[#52525B]">{m.role?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${
                      m.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Plan & Billing */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Plan</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              {billing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ring-1 ${
                      billing.plan === "pro"
                        ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        : billing.plan === "studio"
                        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}>
                      {(billing.plan || "free").toUpperCase()}
                    </span>
                  </div>
                  {billing.usage && billing.limits && (
                    <div className="space-y-3">
                      {[
                        { label: "Members", current: billing.usage.member_count, max: billing.limits.max_members },
                        { label: "Assets", current: billing.usage.asset_count, max: billing.limits.max_assets },
                        { label: "Storage", current: Math.round(billing.usage.storage_bytes / 1024 / 1024), max: billing.limits.max_storage_mb, unit: "MB" },
                      ].map(({ label, current, max, unit }) => {
                        const unlimited = max === -1;
                        const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-[#52525B] uppercase tracking-wider">{label}</span>
                              <span className="text-[10px] text-[#71717A] font-mono">
                                {current}{unit || ""} / {unlimited ? "∞" : `${max}${unit || ""}`}
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-[#18181B]">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-[#F43F5E]" : "bg-[#3B82F6]"}`}
                                style={{ width: unlimited ? "0%" : `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="skeleton h-6 w-16" />
                  <div className="skeleton h-2 w-full" />
                  <div className="skeleton h-2 w-full" />
                </div>
              )}
            </div>
          </div>

          {/* Unity Plugin Token */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Unity Plugin</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                Copy your session token and paste it into the Unity CoPilot plugin to sync approved assets.
              </p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#27272A] font-mono text-[11px] text-[#71717A] truncate">
                  {showToken ? token : "••••••••••••••••••••••••"}
                </div>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="p-2 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                  title={showToken ? "Hide" : "Show"}
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                </button>
                <button
                  onClick={copyToken}
                  className="p-2 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#3F3F46]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected to production
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── REJECT MODAL ─────────────────────────── */}
      <AnimatePresence>
        {rejectingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-[#121212] border border-[#27272A] p-6 shadow-2xl shadow-black/50"
            >
              <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">Reject Asset</h3>
              <p className="text-xs text-[#52525B] mb-4">Provide a reason for rejection:</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Naming convention not followed..."
                className="w-full h-24 px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] resize-none focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setRejectingId(null)}
                  className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ─────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ACTIVITY HELPERS
// ═══════════════════════════════════════════════════

function activityIcon(action: string) {
  const cls = "w-3 h-3 text-[#52525B]";
  switch (action) {
    case "upload": return <Upload className={cls} strokeWidth={1.5} />;
    case "submit_review": return <ArrowUpRight className={cls} strokeWidth={1.5} />;
    case "approve": return <Check className={cls + " !text-emerald-500"} strokeWidth={2} />;
    case "reject": return <X className={cls + " !text-rose-500"} strokeWidth={2} />;
    case "comment": return <MessageCircle className={cls} strokeWidth={1.5} />;
    case "invite": return <UserPlus className={cls} strokeWidth={1.5} />;
    case "join": return <ChevronRight className={cls} strokeWidth={1.5} />;
    default: return <Activity className={cls} strokeWidth={1.5} />;
  }
}

function activityVerb(action: string) {
  switch (action) {
    case "upload": return "uploaded";
    case "submit_review": return "submitted for review";
    case "approve": return "approved";
    case "reject": return "rejected";
    case "comment": return "commented on";
    case "invite": return "invited a member";
    case "join": return "joined the team";
    default: return "performed an action";
  }
}

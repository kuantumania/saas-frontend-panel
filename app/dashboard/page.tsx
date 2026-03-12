"use client";

import { useEffect, useState, useCallback, useRef, Suspense, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Bounds, Center, Environment, ContactShadows, Html, useGLTF, useFBX } from "@react-three/drei";
import { EffectComposer, Bloom, SSAO } from "@react-three/postprocessing";
import { OBJLoader } from "three-stdlib";
import * as THREE from "three";
import {
  Search, Bell, LogOut, Users, Package, Clock, CheckCircle2,
  MoreHorizontal, Check, X, MessageCircle, Upload, UserPlus,
  Activity, ChevronRight, Copy, Eye, EyeOff, Gamepad2,
  CreditCard, ExternalLink, Layers, ArrowUpRight,
  FileText, Image, Box, Volume2, Folder, Shield,
  AlertTriangle, Trash2, Plus, Info, Cpu, Zap, Play, Pause, Repeat,
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

const MODEL_PREVIEWABLE_FORMATS = new Set(["glb", "gltf", "obj", "fbx"]);
const KNOWN_3D_FORMATS = new Set(["glb", "gltf", "fbx", "obj", "stl", "blend", "dae"]);

function getFilenameExtension(name?: string) {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() || "";
}

function inferAssetKind(asset: any, metadata?: any): "3d" | "image" | "audio" | "other" {
  const mime = String(asset?.file_type || "").toLowerCase();
  const ext = getFilenameExtension(asset?.filename);
  const format = String(metadata?.format || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (KNOWN_3D_FORMATS.has(ext) || KNOWN_3D_FORMATS.has(format) || mime.includes("model") || mime.includes("fbx") || mime.includes("gltf")) {
    return "3d";
  }
  return "other";
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
  const [sessionUser, setSessionUser] = useState<any>(null);

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

  // ── FAZ 9: Rules ──
  const [rules, setRules] = useState<any[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleType, setNewRuleType] = useState("max_resolution");
  const [newRuleSeverity, setNewRuleSeverity] = useState("error");
  const [newRuleFolderId, setNewRuleFolderId] = useState("");
  const [newRuleConfig, setNewRuleConfig] = useState<Record<string, any>>({});
  const [folders, setFolders] = useState<any[]>([]);

  // ── FAZ 10: Inspector ──
  const [inspectAsset, setInspectAsset] = useState<any>(null);
  const [assetMeta, setAssetMeta] = useState<any>(null);
  const [metaLoading, setMetaLoading] = useState(false);

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
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const inviteMenuRef = useRef<HTMLDivElement>(null);
  const memberUploadInputRef = useRef<HTMLInputElement>(null);

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("lead_session_token");
    const s = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const u = JSON.parse(localStorage.getItem("session_user") || "null");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
    setStudio(s);
    setSessionUser(u);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      const ctx = await api.fetchSessionContext(token);
      if (!active || !ctx?.success) return;
      setSessionUser((prev: any) => {
        const merged = {
          ...(prev || {}),
          name: ctx.user_name || prev?.name || "",
          role: ctx.user_role || prev?.role || "",
          workspace: ctx.workspace || prev?.workspace || "",
        };
        localStorage.setItem("session_user", JSON.stringify(merged));
        return merged;
      });
      setStudio((prev: any) => ({
        ...prev,
        slug: prev?.slug || ctx.workspace || "",
        name: prev?.name || ctx.studio_name || "Studio",
      }));
    })();
    return () => {
      active = false;
    };
  }, [token]);

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
      const isLeadRole = (sessionUser?.role || "").toLowerCase() === "lead";
      if (isLeadRole) {
        const [s, p, l, m, a, n, b, r, fld] = await Promise.all([
          api.fetchStats(token),
          api.fetchPendingReview(token),
          api.fetchLibrary(token, { page: 1, status: "all" }),
          api.fetchMembers(token),
          api.fetchActivity(token),
          api.fetchNotifications(token),
          api.fetchBilling(token),
          api.fetchRules(token),
          api.fetchFolders(token),
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
        setRules(r);
        setFolders(fld);
      } else {
        const [l, a, n] = await Promise.all([
          api.fetchLibrary(token, { page: 1, status: "all" }),
          api.fetchActivity(token),
          api.fetchNotifications(token),
        ]);
        const assets = l.assets || [];
        setLibraryAssets(assets);
        setLibraryPagination(l.pagination || {});
        setActivities(a || []);
        setNotifications(n.notifications || []);
        setUnreadCount(n.unread_count || 0);
        setPendingAssets([]);
        setMembers([]);
        setBilling(null);
        setRules([]);
        setFolders([]);
        setStats({
          totalMembers: 0,
          totalAssets: l.pagination?.total || assets.length || 0,
          pendingReview: assets.filter((x: any) => x.status === "in_review").length,
          approved: assets.filter((x: any) => x.status === "approved").length,
        });
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setLoading(false);
  }, [token, sessionUser?.role]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!inviteMenuRef.current) return;
      if (!inviteMenuRef.current.contains(e.target as Node)) setShowInviteMenu(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
    setShowInviteMenu(false);
    if ((data as any)?.error) {
      setToast(`Invite failed: ${(data as any).error}`);
      return;
    }
    if (data?.pin) {
      setToast(`Invite PIN: ${data.pin}`);
      loadAll();
      return;
    }
    setToast("Invite failed");
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
    localStorage.removeItem("session_user");
    window.location.href = "/login";
  };

  const handleSearch = (val: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLibSearch(val);
      setLibPage(1);
    }, 300);
  };

  // ── FAZ 9: Rules Handlers ──
  const handleCreateRule = async () => {
    if (!token) return;
    try {
      const result = await api.createRule(
        token, newRuleType, newRuleConfig, newRuleSeverity,
        newRuleFolderId || undefined
      );
      if (result?.error) {
        setToast(`Error: ${result.error}`);
        return;
      }
      if (result?.success) {
        setToast("Rule created");
        setShowRuleForm(false);
        setNewRuleConfig({});
        const r = await api.fetchRules(token);
        setRules(r);
      }
    } catch (e: any) {
      setToast(`Error: ${e.message || 'Network error'}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!token) return;
    const ok = await api.deleteRule(token, ruleId);
    if (ok) {
      setToast("Rule deleted");
      setRules(prev => prev.filter(r => r.id !== ruleId));
    }
  };

  // ── FAZ 10: Inspector Handler ──
  const openInspector = async (asset: any) => {
    if (!token) return;
    setInspectAsset(asset);
    setMetaLoading(true);
    const data = await api.fetchAssetMetadata(token, asset.id);
    setAssetMeta(data);
    setMetaLoading(false);
  };

  if (!token) return null;
  const inspectKind = inspectAsset ? inferAssetKind(inspectAsset, assetMeta?.metadata) : "other";
  const conversionStatus = assetMeta?.metadata?.conversion?.status || null;
  const convertedReady = assetMeta?.metadata?.conversion?.status === "ready";
  const inspectFormat = convertedReady
    ? "glb"
    : (String(assetMeta?.metadata?.format || getFilenameExtension(inspectAsset?.filename))).toLowerCase();
  const canRender3DPreview =
    inspectKind === "3d" &&
    MODEL_PREVIEWABLE_FORMATS.has(inspectFormat) &&
    Boolean(inspectAsset?.preview_url);
  const isLead = (sessionUser?.role || "").toLowerCase() === "lead";
  const memberName = (sessionUser?.name || "").trim();
  const memberAssets = (() => {
    if (!libraryAssets?.length) return [];
    if (isLead) return libraryAssets;
    if (sessionUser?.id) {
      return libraryAssets.filter((a: any) => String(a.uploader_id || "") === String(sessionUser.id));
    }
    if (memberName) {
      return libraryAssets.filter((a: any) => (a.uploader_name || "").trim().toLowerCase() === memberName.toLowerCase());
    }
    return libraryAssets;
  })();

  const handleMemberUploadFile = async (file: File) => {
    if (!token || !file) return;
    if (!studio.slug) {
      setToast("Studio context missing. Please log in again.");
      return;
    }
    setIsUploading(true);
    const result = await api.uploadAsset(token, file, {
      role: sessionUser?.role || "General",
      userCode: memberName || "Member",
      workspace: studio.slug,
    });
    setIsUploading(false);
    if ((result as any)?.error) {
      setToast(`Upload failed: ${(result as any).error}`);
      return;
    }
    setToast(`Uploaded: ${file.name}`);
    await loadLibrary();
  };

  const handleMemberSubmitReview = async (asset: any) => {
    if (!token || !asset?.s3_key) return;
    const res = await api.submitAssetForReview(token, asset.s3_key);
    if ((res as any)?.error) {
      setToast(`Submit failed: ${(res as any).error}`);
      return;
    }
    setToast("Sent to review");
    await loadLibrary();
  };

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
        {!isLead ? (
          <>
            <section className="grid grid-cols-3 gap-6 mb-10">
              <div className="col-span-2 rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Upload Workspace</h2>
                </div>
                <p className="text-xs text-[#52525B] mb-4">
                  Drag & drop your file, then send it to review in one click.
                </p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingUpload(true);
                  }}
                  onDragLeave={() => setIsDraggingUpload(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingUpload(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleMemberUploadFile(file);
                  }}
                  className={`rounded-lg border border-dashed p-8 text-center transition-colors ${
                    isDraggingUpload
                      ? "border-[#3B82F6] bg-[#3B82F6]/10"
                      : "border-[#27272A] bg-[#0A0A0A]"
                  }`}
                >
                  <Upload className="w-6 h-6 text-[#52525B] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-[#A1A1AA]">Drop file here or</p>
                  <button
                    onClick={() => memberUploadInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-3 px-3 py-1.5 rounded-md text-xs font-medium bg-[#3B82F6]/15 text-[#60A5FA] ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6]/25 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Choose File"}
                  </button>
                  <input
                    ref={memberUploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMemberUploadFile(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>

              <div className="col-span-1 rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Session</h2>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-[#71717A]">Name: <span className="text-[#EDEDED]">{memberName || "Member"}</span></p>
                  <p className="text-[#71717A]">Role: <span className="text-[#EDEDED]">{(sessionUser?.role || "member").replace(/_/g, " ")}</span></p>
                  <p className="text-[#71717A]">Studio: <span className="text-[#EDEDED]">{studio.slug || sessionUser?.workspace || "—"}</span></p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">My Uploads</h2>
                  <span className="text-xs text-[#52525B]">{memberAssets.length}</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
                  <span />
                  <span>Name</span>
                  <span>Size</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {memberAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <Package className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                    <p className="text-sm font-medium text-[#52525B]">No uploads yet</p>
                    <p className="text-xs text-[#3F3F46] mt-1">Upload your first asset from the panel above</p>
                  </div>
                ) : (
                  memberAssets.map((a: any) => {
                    const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                    const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
                    return (
                      <div key={a.id} className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                        <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center">
                          {isImg && a.preview_url ? (
                            <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                          )}
                        </div>
                        <button onClick={() => openInspector(a)} className="text-left min-w-0">
                          <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                          <p className="text-[10px] text-[#52525B]">{a.created_at ? timeAgo(a.created_at) : ""}</p>
                        </button>
                        <span className="text-xs text-[#71717A] font-mono">{formatSize(a.file_size_kb)}</span>
                        <StatusBadge status={a.status} />
                        {a.status === "staging" ? (
                          <button
                            onClick={() => handleMemberSubmitReview(a)}
                            className="justify-self-start px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            Submit Review
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#52525B]">{a.status === "in_review" ? "Waiting lead" : "—"}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        ) : (
          <>

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
                      onClick={() => openInspector(a)}
                      className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
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

        {/* ── FAZ 9: ASSET RULES ──────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Asset Rules</h2>
              <span className="text-xs text-[#52525B]">{rules.length}</span>
            </div>
            <button
              onClick={() => setShowRuleForm(!showRuleForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Add Rule
            </button>
          </div>

          {/* Rule Creation Form */}
          <AnimatePresence>
            {showRuleForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="rounded-xl border border-[#27272A] bg-[#121212] p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* Rule Type */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Rule Type</label>
                      <select
                        value={newRuleType}
                        onChange={e => { setNewRuleType(e.target.value); setNewRuleConfig({}); }}
                        className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                      >
                        <option value="max_resolution">Max Resolution</option>
                        <option value="min_resolution">Min Resolution</option>
                        <option value="allowed_formats">Allowed Formats</option>
                        <option value="max_file_size">Max File Size</option>
                        <option value="max_poly_count">Max Poly Count</option>
                        <option value="max_vertex_count">Max Vertex Count</option>
                        <option value="naming_pattern">Naming Pattern</option>
                        <option value="sample_rate">Sample Rate</option>
                        <option value="max_duration">Max Duration</option>
                        <option value="aspect_ratio">Aspect Ratio</option>
                        <option value="required_alpha">Require Alpha</option>
                      </select>
                    </div>

                    {/* Folder */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Folder</label>
                      <select
                        value={newRuleFolderId}
                        onChange={e => setNewRuleFolderId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                      >
                        <option value="">All (Studio-wide)</option>
                        {folders.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Config based on type */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Value</label>
                      {(newRuleType === 'max_resolution' || newRuleType === 'min_resolution') && (
                        <div className="flex gap-1.5">
                          <input
                            type="number" placeholder="Width"
                            onChange={e => setNewRuleConfig(prev => ({ ...prev, [`${newRuleType === 'max_resolution' ? 'max' : 'min'}_width`]: parseInt(e.target.value) || 0 }))}
                            className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                          />
                          <input
                            type="number" placeholder="Height"
                            onChange={e => setNewRuleConfig(prev => ({ ...prev, [`${newRuleType === 'max_resolution' ? 'max' : 'min'}_height`]: parseInt(e.target.value) || 0 }))}
                            className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                          />
                        </div>
                      )}
                      {newRuleType === 'allowed_formats' && (
                        <input
                          type="text" placeholder="png, jpg, webp"
                          onChange={e => setNewRuleConfig({ allowed_formats: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'max_file_size' && (
                        <input
                          type="number" placeholder="KB"
                          onChange={e => setNewRuleConfig({ max_file_size_kb: parseInt(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {(newRuleType === 'max_poly_count' || newRuleType === 'max_vertex_count') && (
                        <input
                          type="number" placeholder="Count"
                          onChange={e => setNewRuleConfig({ [newRuleType]: parseInt(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'naming_pattern' && (
                        <input
                          type="text" placeholder="^TX_.*"
                          onChange={e => setNewRuleConfig({ naming_pattern: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] font-mono focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'max_duration' && (
                        <input
                          type="number" placeholder="Seconds"
                          onChange={e => setNewRuleConfig({ max_duration_seconds: parseFloat(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'aspect_ratio' && (
                        <input
                          type="text" placeholder="1:1 or 16:9"
                          onChange={e => setNewRuleConfig({ aspect_ratio: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'sample_rate' && (
                        <input
                          type="text" placeholder="44100, 48000"
                          onChange={e => setNewRuleConfig({ sample_rate: e.target.value.split(',').map(s => parseInt(s.trim())) })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'required_alpha' && (
                        <select
                          onChange={e => setNewRuleConfig({ required_alpha: e.target.value === 'true' })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        >
                          <option value="true">Required</option>
                          <option value="false">Not Required</option>
                        </select>
                      )}
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Severity</label>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setNewRuleSeverity('error')}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                            newRuleSeverity === 'error'
                              ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                              : 'bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]'
                          }`}
                        >
                          Block
                        </button>
                        <button
                          onClick={() => setNewRuleSeverity('warning')}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                            newRuleSeverity === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                              : 'bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]'
                          }`}
                        >
                          Warn
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRuleForm(false)} className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleCreateRule} className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors">
                      Create Rule
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rules List */}
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                <p className="text-sm font-medium text-[#52525B]">No rules defined</p>
                <p className="text-xs text-[#3F3F46] mt-1">Set upload rules for your folders</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
                  <span>Rule</span>
                  <span>Folder</span>
                  <span>Value</span>
                  <span>Severity</span>
                  <span />
                </div>
                {rules.map((r: any) => (
                  <div key={r.id} className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-[#EDEDED]">{r.rule_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-[#52525B] truncate">
                      {r.folder_id ? (folders.find((f: any) => f.id === r.folder_id)?.name || 'Folder') : 'All'}
                    </span>
                    <span className="text-xs text-[#71717A] font-mono truncate">
                      {JSON.stringify(r.rule_config).slice(1, -1).slice(0, 20)}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${
                      r.severity === 'error'
                        ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                    }`}>
                      {r.severity === 'error' ? 'Block' : 'Warn'}
                    </span>
                    <button
                      onClick={() => handleDeleteRule(r.id)}
                      className="p-1 rounded-md hover:bg-rose-500/10 text-[#3F3F46] hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
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
              <div className="relative" ref={inviteMenuRef}>
                <button
                  onClick={() => setShowInviteMenu(v => !v)}
                  className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {/* Invite dropdown */}
                <div className={`absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#121212] border border-[#27272A] shadow-xl shadow-black/40 transition-all z-10 ${
                  showInviteMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}>
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
          </>
        )}

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

      {/* ── FAZ 10: ASSET INSPECTOR MODAL ────────── */}
      <AnimatePresence>
        {inspectAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setInspectAsset(null); setAssetMeta(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl rounded-xl bg-[#121212] border border-[#27272A] shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-[#EDEDED]">Asset Inspector</span>
                </div>
                <button onClick={() => { setInspectAsset(null); setAssetMeta(null); }} className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Asset Info */}
              <div className="px-5 py-3 border-b border-[#1E1E1E] flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                  {fileIcon(inspectAsset.file_type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#EDEDED]">{inspectAsset.filename}</p>
                  <p className="text-xs text-[#52525B]">{formatSize(inspectAsset.file_size_kb)} · {inspectAsset.uploader_name || 'Unknown'}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={inspectAsset.status} /></div>
              </div>

              {/* FAZ 11: 3D Preview */}
              {inspectKind === "3d" && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] overflow-hidden h-64">
                    {canRender3DPreview ? (
                      <ModelPreviewCanvas
                        src={inspectAsset.preview_url}
                        format={inspectFormat}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center px-5">
                        <Box className="w-5 h-5 text-[#3F3F46] mb-2" strokeWidth={1.5} />
                        <p className="text-xs text-[#71717A]">
                          {conversionStatus === "pending"
                            ? "Model is converting to GLB for web preview..."
                            : "3D preview will be supported for this format soon."}
                        </p>
                        <p className="text-[10px] text-[#52525B] mt-1">
                          Current format: {inspectFormat || "unknown"} · Supported now: glb, gltf, obj, fbx
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#52525B] mt-2">FAZ 11 Preview (v2): React Three Fiber + Drei + PostProcessing.</p>
                </div>
              )}

              {inspectKind === "image" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <TextureInspectorPanel
                    imageUrl={inspectAsset.preview_url}
                    metadata={assetMeta?.metadata}
                  />
                </div>
              )}

              {inspectKind === "audio" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <AudioInspectorPanel audioUrl={inspectAsset.preview_url} />
                </div>
              )}

              {/* Metadata */}
              <div className="px-5 py-4 max-h-96 overflow-y-auto">
                {metaLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-4 w-full rounded" />)}
                  </div>
                ) : assetMeta?.metadata ? (
                  <div className="space-y-4">
                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#3B82F6]/10 text-[#3B82F6] ring-1 ring-[#3B82F6]/20">
                        {assetMeta.metadata.type || 'Unknown'}
                      </span>
                      {assetMeta.metadata.format && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-[#71717A] ring-1 ring-white/[0.06]">
                          {assetMeta.metadata.format}
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(assetMeta.metadata)
                        .filter(([k]) => !['type', 'format', 'error'].includes(k))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E]/50">
                            <span className="text-[10px] font-medium text-[#52525B] uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-mono text-[#EDEDED]">
                              {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Violations */}
                    {assetMeta.violations && assetMeta.violations.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-400">Rule Violations</span>
                        </div>
                        <div className="space-y-1.5">
                          {assetMeta.violations.map((v: any, i: number) => (
                            <div key={i} className={`px-3 py-2 rounded-lg text-xs ${
                              v.severity === 'error'
                                ? 'bg-rose-500/5 text-rose-300 ring-1 ring-rose-500/10'
                                : 'bg-amber-500/5 text-amber-300 ring-1 ring-amber-500/10'
                            }`}>
                              {v.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="w-6 h-6 text-[#27272A] mb-2" strokeWidth={1} />
                    <p className="text-xs text-[#52525B]">No metadata available</p>
                    <p className="text-[10px] text-[#3F3F46] mt-1">Upload a new version to extract metadata</p>
                  </div>
                )}
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
// FAZ 11: 3D PREVIEW HELPERS
// ═══════════════════════════════════════════════════

function ModelPreviewCanvas({ src, format }: { src: string; format: string }) {
  return (
    <Canvas camera={{ position: [2.8, 1.8, 2.8], fov: 50 }}>
      <color attach="background" args={["#0A0A0A"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 3]} intensity={1.2} />

      <Suspense fallback={<PreviewLoader />}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <Loaded3DModel src={src} format={format} />
          </Center>
        </Bounds>
        <Environment preset="city" />
        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={0.45}
          scale={10}
          blur={2}
          far={5}
        />
      </Suspense>

      <EffectComposer multisampling={4}>
        <SSAO
          samples={12}
          radius={0.22}
          intensity={16}
          luminanceInfluence={0.45}
        />
        <Bloom intensity={0.18} luminanceThreshold={0.45} mipmapBlur />
      </EffectComposer>

      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.6} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

function PreviewLoader() {
  return (
    <Html center>
      <div className="text-[11px] text-[#71717A] px-2 py-1 rounded bg-[#121212] border border-[#27272A]">
        Loading model...
      </div>
    </Html>
  );
}

function Loaded3DModel({ src, format }: { src: string; format: string }) {
  const normalized = format.toLowerCase();

  if (normalized === "fbx") {
    const fbx = useFBX(src);
    const cloned = useMemo(() => fbx.clone(true), [fbx]);
    normalizeScene(cloned);
    return <primitive object={cloned} />;
  }

  if (normalized === "obj") {
    const obj = useLoader(OBJLoader, src);
    const cloned = useMemo(() => obj.clone(true), [obj]);
    normalizeScene(cloned);
    return <primitive object={cloned} />;
  }

  const gltf = useGLTF(src);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  normalizeScene(cloned);
  return <primitive object={cloned} />;
}

function normalizeScene(root: THREE.Object3D) {
  root.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!mesh.material) {
        mesh.material = new THREE.MeshStandardMaterial({ color: "#B4B4B8", metalness: 0.2, roughness: 0.65 });
      }
    }
  });
}

// ═══════════════════════════════════════════════════
// FAZ 11: TEXTURE + AUDIO INSPECTOR
// ═══════════════════════════════════════════════════

type TextureChannel = "rgba" | "r" | "g" | "b" | "a";

function TextureInspectorPanel({
  imageUrl,
  metadata,
}: {
  imageUrl: string;
  metadata?: Record<string, any>;
}) {
  const osdContainerRef = useRef<HTMLDivElement | null>(null);
  const channelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const sourceDataRef = useRef<ImageData | null>(null);
  const [channel, setChannel] = useState<TextureChannel>("rgba");
  const [channelPreviewUrl, setChannelPreviewUrl] = useState("");
  const [pixel, setPixel] = useState<{ x: number; y: number; r: number; g: number; b: number; a: number } | null>(null);
  const [mips, setMips] = useState<Array<{ level: number; width: number; height: number }>>([]);
  const [pixelReadable, setPixelReadable] = useState(true);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const metadataSize = useMemo(() => {
    const toPositiveInt = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    return {
      width: toPositiveInt(metadata?.width ?? metadata?.resolution_width ?? metadata?.resolution?.width),
      height: toPositiveInt(metadata?.height ?? metadata?.resolution_height ?? metadata?.resolution?.height),
    };
  }, [metadata]);

  const buildMipmaps = useCallback((baseWidth: number, baseHeight: number) => {
    const levels: Array<{ level: number; width: number; height: number }> = [];
    let w = Math.max(1, Math.floor(baseWidth));
    let h = Math.max(1, Math.floor(baseHeight));
    for (let i = 0; i < 8; i += 1) {
      levels.push({ level: i, width: w, height: h });
      if (w <= 1 && h <= 1) break;
      w = Math.max(1, Math.floor(w / 2));
      h = Math.max(1, Math.floor(h / 2));
    }
    setMips(levels);
  }, []);

  const renderChannelCanvas = useCallback((mode: TextureChannel) => {
    const canvas = channelCanvasRef.current;
    const img = sourceImageRef.current;
    const source = sourceDataRef.current;
    if (!canvas || !img || !source) return;

    const maxW = 520;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (mode === "rgba") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        setChannelPreviewUrl(canvas.toDataURL("image/png"));
      } catch {
        setChannelPreviewUrl("");
      }
      return;
    }

    const out = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    for (let i = 0; i < out.data.length; i += 4) {
      const r = out.data[i];
      const g = out.data[i + 1];
      const b = out.data[i + 2];
      const a = out.data[i + 3];
      if (mode === "r") {
        out.data[i] = r; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 255;
      } else if (mode === "g") {
        out.data[i] = 0; out.data[i + 1] = g; out.data[i + 2] = 0; out.data[i + 3] = 255;
      } else if (mode === "b") {
        out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = b; out.data[i + 3] = 255;
      } else if (mode === "a") {
        out.data[i] = a; out.data[i + 1] = a; out.data[i + 2] = a; out.data[i + 3] = 255;
      }
    }

    const tmp = document.createElement("canvas");
    tmp.width = source.width;
    tmp.height = source.height;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(out, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
    try {
      setChannelPreviewUrl(canvas.toDataURL("image/png"));
    } catch {
      setChannelPreviewUrl("");
    }
  }, []);

  useEffect(() => {
    if (!osdContainerRef.current) return;
    let viewer: any = null;
    let cancelled = false;

    (async () => {
      const mod: any = await import("openseadragon");
      if (cancelled || !osdContainerRef.current) return;
      const OSD = mod.default || mod;
      viewer = OSD({
        element: osdContainerRef.current,
        prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
        tileSources: { type: "image", url: imageUrl },
        showNavigator: true,
        animationTime: 0.8,
        blendTime: 0.1,
        maxZoomPixelRatio: 2.5,
        zoomPerScroll: 1.25,
        constrainDuringPan: true,
        visibilityRatio: 1,
      } as any);
    })();

    return () => {
      cancelled = true;
      try {
        if (viewer) viewer.destroy();
      } catch (_) {
        // no-op
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      sourceImageRef.current = img;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      const temp = document.createElement("canvas");
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      const tctx = temp.getContext("2d", { willReadFrequently: true });
      if (!tctx) return;
      tctx.drawImage(img, 0, 0);
      try {
        sourceDataRef.current = tctx.getImageData(0, 0, temp.width, temp.height);
        setPixelReadable(true);
        requestAnimationFrame(() => renderChannelCanvas(channel));
      } catch {
        sourceDataRef.current = null;
        setPixelReadable(false);
        setChannelPreviewUrl("");
      }
      buildMipmaps(img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => {
      if (!active) return;
      sourceImageRef.current = null;
      sourceDataRef.current = null;
      setPixelReadable(false);
      setChannelPreviewUrl("");
      if (metadataSize.width > 0 && metadataSize.height > 0) {
        setNaturalSize({ width: metadataSize.width, height: metadataSize.height });
        buildMipmaps(metadataSize.width, metadataSize.height);
      }
    };
    img.src = imageUrl;
    return () => {
      active = false;
    };
  }, [imageUrl, channel, renderChannelCanvas, buildMipmaps, metadataSize.width, metadataSize.height]);

  useEffect(() => {
    if (mips.length === 0 && metadataSize.width > 0 && metadataSize.height > 0) {
      if (naturalSize.width === 0 || naturalSize.height === 0) {
        setNaturalSize({ width: metadataSize.width, height: metadataSize.height });
      }
      buildMipmaps(metadataSize.width, metadataSize.height);
    }
  }, [mips.length, metadataSize.width, metadataSize.height, naturalSize.width, naturalSize.height, buildMipmaps]);

  useEffect(() => {
    renderChannelCanvas(channel);
  }, [channel, renderChannelCanvas]);

  const onPreviewHover = (e: ReactMouseEvent<HTMLImageElement>) => {
    const source = sourceDataRef.current;
    if (!source) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * source.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * source.height);
    const ix = Math.min(source.width - 1, Math.max(0, x));
    const iy = Math.min(source.height - 1, Math.max(0, y));
    const idx = (iy * source.width + ix) * 4;
    setPixel({
      x: ix,
      y: iy,
      r: source.data[idx],
      g: source.data[idx + 1],
      b: source.data[idx + 2],
      a: source.data[idx + 3],
    });
  };

  const channelFilter = (mode: TextureChannel) => {
    if (mode === "r") return "contrast(1.1) sepia(1) saturate(8) hue-rotate(-45deg)";
    if (mode === "g") return "contrast(1.1) sepia(1) saturate(6) hue-rotate(35deg)";
    if (mode === "b") return "contrast(1.2) saturate(3) hue-rotate(170deg)";
    if (mode === "a") return "grayscale(1) contrast(1.5)";
    return "none";
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-2">
          <div ref={osdContainerRef} className="h-64 rounded-md overflow-hidden" />
          <p className="text-[10px] text-[#52525B] mt-2">Deep zoom (OpenSeadragon)</p>
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
          <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Channel Isolation + Pixel Inspector</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(["rgba", "r", "g", "b", "a"] as TextureChannel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors ${
                  channel === c
                    ? "bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30"
                    : "bg-[#121212] text-[#71717A] border-[#27272A] hover:text-[#A1A1AA]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <canvas ref={channelCanvasRef} className="hidden" />
          {pixelReadable ? (
            <img
              src={channelPreviewUrl || imageUrl}
              alt="channel-preview"
              onMouseMove={onPreviewHover}
              className="w-full rounded border border-[#27272A] bg-[#121212] object-contain max-h-56 cursor-crosshair"
              style={{
                imageRendering: "pixelated",
                filter: channelPreviewUrl ? "none" : channelFilter(channel),
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt="channel-preview"
              className="w-full rounded border border-[#27272A] bg-[#121212] object-contain max-h-56"
              style={{ filter: channelFilter(channel), imageRendering: "pixelated" }}
            />
          )}
          <div className="mt-2 text-[10px] text-[#71717A] font-mono">
            {pixelReadable && pixel
              ? `x:${pixel.x} y:${pixel.y} | R:${pixel.r} G:${pixel.g} B:${pixel.b} A:${pixel.a}`
              : pixelReadable
                ? "Hover to inspect pixel values"
                : "Pixel read disabled by cross-origin policy. Channel preview fallback active."}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Mipmap Grid</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {mips.map((m) => (
            <div key={`mip-${m.level}`} className="rounded border border-[#27272A] bg-[#121212] p-1">
              <img src={imageUrl} alt={`mip-${m.level}`} className="w-full h-14 object-contain" style={{ imageRendering: "pixelated" }} />
              <p className="text-[9px] text-[#52525B] text-center mt-1">L{m.level} · {m.width}x{m.height}</p>
            </div>
          ))}
        </div>
        {naturalSize.width > 0 && (
          <p className="text-[10px] text-[#52525B] mt-2 font-mono">
            Base: {naturalSize.width}x{naturalSize.height}
          </p>
        )}
      </div>
    </div>
  );
}

function AudioInspectorPanel({ audioUrl }: { audioUrl: string }) {
  const waveRef = useRef<HTMLDivElement | null>(null);
  const spectroRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [duration, setDuration] = useState(0);
  const loopRef = useRef(false);
  loopRef.current = loop;

  useEffect(() => {
    if (!waveRef.current || !spectroRef.current) return;
    let ws: any = null;
    let cancelled = false;

    (async () => {
      const wsMod: any = await import("wavesurfer.js");
      const spMod: any = await import("wavesurfer.js/dist/plugins/spectrogram.esm.js");
      if (cancelled || !waveRef.current || !spectroRef.current) return;

      const WaveSurferCtor = wsMod.default || wsMod;
      const SpectrogramPlugin = spMod.default || spMod;

      ws = WaveSurferCtor.create({
        container: waveRef.current,
        height: 72,
        waveColor: "#334155",
        progressColor: "#3B82F6",
        cursorColor: "#F59E0B",
        barWidth: 2,
        barGap: 1,
        url: audioUrl,
        normalize: true,
        plugins: [
          SpectrogramPlugin.create({
            container: spectroRef.current,
            labels: false,
            height: 96,
            splitChannels: false,
          }),
        ],
      });

      ws.on("ready", () => {
        setReady(true);
        setDuration(ws.getDuration());
      });
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => {
        if (loopRef.current) {
          ws.play();
        } else {
          setPlaying(false);
        }
      });

      wsRef.current = ws;
    })();
    return () => {
      cancelled = true;
      if (ws) ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!wsRef.current || !ready) return;
    wsRef.current.playPause();
  };

  const restart = () => {
    if (!wsRef.current || !ready) return;
    wsRef.current.seekTo(0);
    if (!playing) wsRef.current.play();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Waveform (WaveSurfer v7)</p>
        <div ref={waveRef} />
      </div>
      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Spectrum</p>
        <div ref={spectroRef} className="min-h-24" />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#3B82F6]/15 text-[#60A5FA] ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6]/20 transition-colors inline-flex items-center gap-1.5"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setLoop(v => !v)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ring-1 transition-colors inline-flex items-center gap-1.5 ${
            loop
              ? "bg-[#F59E0B]/15 text-[#FBBF24] ring-[#F59E0B]/30"
              : "bg-white/[0.04] text-[#71717A] ring-white/[0.08] hover:text-[#A1A1AA]"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          Loop
        </button>
        <button
          onClick={restart}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] text-[#A1A1AA] ring-1 ring-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          Restart
        </button>
        <span className="ml-auto text-[10px] font-mono text-[#52525B]">
          {duration > 0 ? `${duration.toFixed(2)}s` : "Loading..."}
        </span>
      </div>
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

"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Clock, CheckCircle2, XCircle,
  Box, Image, Volume2, FileText, Layers, RotateCcw,
  ChevronRight, Loader2, Play, Eye, Shield, Lock, Unlock,
  MessageCircle, Plus, Check, X, Send,
} from "lucide-react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { ModelPreviewCanvas } from "@/components/inspectors";

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatSize(kb: number) {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const MODEL_FORMATS = new Set(["glb", "gltf", "obj", "fbx"]);
const IMAGE_FORMATS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "tga", "psd", "exr", "hdr"]);
const AUDIO_FORMATS = new Set(["wav", "mp3", "ogg", "flac", "aiff"]);
const ALL_3D = new Set(["glb", "gltf", "fbx", "obj", "stl", "blend", "dae", "usd", "usda", "usdz"]);

function getAssetKind(filename: string): "3d" | "image" | "audio" | "other" {
  const ext = (filename || "").split(".").pop()?.toLowerCase() || "";
  if (ALL_3D.has(ext)) return "3d";
  if (IMAGE_FORMATS.has(ext)) return "image";
  if (AUDIO_FORMATS.has(ext)) return "audio";
  return "other";
}

function getExt(filename: string) {
  return (filename || "").split(".").pop()?.toLowerCase() || "";
}

function extractVersionNumber(filename: string): number | null {
  const match = (filename || "").match(/_v(\d+)\./i);
  return match ? parseInt(match[1], 10) : null;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
    in_review: { label: "In Review", cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
    rejected: { label: "Rejected", cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20" },
    staging: { label: "Staging", cls: "bg-blue-500/10 text-blue-400 ring-blue-500/20" },
  };
  const c = cfg[status] || { label: status, cls: "bg-white/[0.06] text-[#A1A1AA] ring-white/[0.08]" };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${c.cls}`}>{c.label}</span>;
}

// ═══════════════════════════════════════════════
// INNER COMPONENT (uses useSearchParams)
// ═══════════════════════════════════════════════

function AssetDetailInner() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get("id") || "";

  // Auth
  const [token, setToken] = useState("");
  const [studioName, setStudioName] = useState("Studio");
  const [userRole, setUserRole] = useState("member");
  const [isEnterprise, setIsEnterprise] = useState(false);

  // Asset data
  const [asset, setAsset] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);

  const isLead = userRole.toLowerCase() === "lead";
  const canManageVersions = isLead || userRole === "Technical_Art";
  const kind = asset ? getAssetKind(asset.filename) : "other";
  const ext = asset ? getExt(asset.filename) : "";
  const canPreview3D = kind === "3d" && MODEL_FORMATS.has(ext) && Boolean(asset?.preview_url);

  // Sort versions
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => {
      const va = extractVersionNumber(a.filename);
      const vb = extractVersionNumber(b.filename);
      if (va !== null && vb !== null) return vb - va;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [versions]);

  const activeVersionId = useMemo(() => {
    const active = versions.find((v: any) => v.metadata?.version_state === "active");
    return active ? String(active.id) : null;
  }, [versions]);

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("kuantum_token") || localStorage.getItem("lead_session_token") || "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const user = JSON.parse(localStorage.getItem("session_user") || "{}");
    const billing = JSON.parse(localStorage.getItem("kuantum_billing") || "{}");
    setToken(t);
    setStudioName(studio?.name || "Studio");
    setUserRole(user?.role || "member");
    setIsEnterprise((billing?.plan || "").startsWith("enterprise"));
    if (!t) { window.location.href = "/login"; return; }
    if (!assetId) return;

    setLoading(true);
    Promise.all([
      api.fetchAssetDetail(t, assetId),
      api.fetchAssetMetadata(t, assetId),
      api.fetchAssetVersions(t, assetId),
    ]).then(([a, m, v]) => {
      setAsset(a);
      setMetadata(m);
      setVersions(v || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [assetId]);

  // ── Version actions ──
  const handleActivate = async (versionId: string) => {
    setActivatingId(versionId);
    const res = await api.setActiveVersion(token, assetId, versionId);
    if (!res.error) {
      const v = await api.fetchAssetVersions(token, assetId);
      setVersions(v || []);
    }
    setActivatingId(null);
  };

  const handleRollback = async (versionId: string) => {
    setActivatingId(versionId);
    const res = await api.rollbackVersion(token, assetId, versionId);
    if (!res.error) {
      const [a, v] = await Promise.all([
        api.fetchAssetDetail(token, assetId),
        api.fetchAssetVersions(token, assetId),
      ]);
      setAsset(a);
      setVersions(v || []);
    }
    setActivatingId(null);
  };

  // ── Lock/Unlock ──
  const handleLock = async () => {
    setLocking(true);
    const res = await api.setAssetLockIntent(token, assetId);
    if (!res.error) {
      const m = await api.fetchAssetMetadata(token, assetId);
      setMetadata(m);
    }
    setLocking(false);
  };

  const handleUnlock = async (force = false) => {
    setLocking(true);
    const res = await api.releaseAssetLockIntent(token, assetId, { force });
    if (!res.error) {
      const m = await api.fetchAssetMetadata(token, assetId);
      setMetadata(m);
    }
    setLocking(false);
  };

  // ── Annotations ──
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [newAnnotationPos, setNewAnnotationPos] = useState<{ x: number; y: number } | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [creatingAnnotation, setCreatingAnnotation] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const imageContainerRef = useState<HTMLDivElement | null>(null);

  const loadAnnotations = useCallback(async () => {
    if (!token || !assetId) return;
    setAnnotationsLoading(true);
    const anns = await api.fetchAssetAnnotations(token, assetId);
    setAnnotations(Array.isArray(anns) ? anns : []);
    setAnnotationsLoading(false);
  }, [token, assetId]);

  useEffect(() => {
    if (token && assetId && kind === "image") {
      loadAnnotations();
    }
  }, [token, assetId, kind, loadAnnotations]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setNewAnnotationPos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
    setNewAnnotationText("");
  };

  const handleCreateAnnotation = async () => {
    if (!newAnnotationPos || !newAnnotationText.trim()) return;
    setCreatingAnnotation(true);
    const res = await api.createAssetAnnotation(token, assetId, {
      x: newAnnotationPos.x,
      y: newAnnotationPos.y,
      text: newAnnotationText.trim(),
    });
    if (!res?.error) {
      setNewAnnotationPos(null);
      setNewAnnotationText("");
      loadAnnotations();
    }
    setCreatingAnnotation(false);
  };

  const handleResolveAnnotation = async (annId: string, resolved: boolean) => {
    setResolvingId(annId);
    await api.updateAssetAnnotation(token, assetId, annId, { resolved });
    await loadAnnotations();
    setResolvingId(null);
  };

  const handleDeleteAnnotation = async (annId: string) => {
    await api.deleteAssetAnnotation(token, assetId, annId);
    loadAnnotations();
  };

  const unresolvedCount = annotations.filter((a: any) => !a.resolved).length;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
        <DashboardNav studioName={studioName} role={userRole} isEnterprise={isEnterprise} showSearch={false} />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-[#52525B] animate-spin" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
        <DashboardNav studioName={studioName} role={userRole} isEnterprise={isEnterprise} showSearch={false} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <FileText className="w-10 h-10 text-[#27272A] mb-4" />
          <h2 className="text-lg font-semibold text-[#52525B]">Asset not found</h2>
          <a href="/dashboard" className="mt-4 text-xs text-blue-400 hover:text-blue-300">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const meta = metadata?.metadata || {};
  const lockIntent = meta.lock_intent || {};
  const isLocked = Boolean(lockIntent.locked);
  const lockOwner = lockIntent.user_name || "";
  const lockOwnerId = String(lockIntent.user_id || "");
  const currentUserId = (() => {
    try { return String(JSON.parse(localStorage.getItem("session_user") || "{}").id || ""); } catch { return ""; }
  })();
  const isMyLock = isLocked && lockOwnerId === currentUserId;
  const isLockedByOther = isLocked && !isMyLock;
  const canForce = isLead || userRole === "Technical_Art";

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav studioName={studioName} role={userRole} isEnterprise={isEnterprise} showSearch={false} />

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#52525B] mb-6">
          <a href="/dashboard" className="hover:text-[#A1A1AA] transition-colors">Dashboard</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#EDEDED] truncate max-w-xs">{asset.filename}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* ═══ LEFT: Preview (2 cols) ═══ */}
          <div className="col-span-2 space-y-6">
            {/* Preview area */}
            <div className="rounded-2xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {/* 3D Preview */}
              {kind === "3d" && (
                <div className="h-[420px] bg-[#0A0A0A]">
                  {canPreview3D ? (
                    <ModelPreviewCanvas src={asset.preview_url} format={ext} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Box className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                      <p className="text-sm text-[#52525B]">3D preview not available for .{ext}</p>
                      <p className="text-xs text-[#3F3F46] mt-1">Supported: GLB, GLTF, OBJ, FBX</p>
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview with Annotations */}
              {kind === "image" && asset.preview_url && (
                <div
                  className={`relative bg-[#0A0A0A] flex items-center justify-center ${annotationMode ? "cursor-crosshair" : ""}`}
                  style={{ minHeight: "320px", maxHeight: "500px" }}
                  onClick={handleImageClick}
                >
                  <img
                    src={asset.preview_url}
                    alt={asset.filename}
                    className="max-w-full max-h-[500px] object-contain"
                    style={{ imageRendering: "auto" }}
                    draggable={false}
                  />
                  {/* Checkerboard for transparency */}
                  <div className="absolute inset-0 -z-10" style={{
                    backgroundImage: "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                  }} />

                  {/* Annotation pins */}
                  {annotations.map((ann: any) => (
                    <div
                      key={ann.id}
                      className="absolute z-10 group"
                      style={{ left: `${(ann.x * 100).toFixed(2)}%`, top: `${(ann.y * 100).toFixed(2)}%`, transform: "translate(-50%, -100%)" }}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      {/* Pin */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                        ann.resolved
                          ? "bg-emerald-500/80 ring-2 ring-emerald-400/30"
                          : "bg-blue-500/90 ring-2 ring-blue-400/30"
                      }`}>
                        <MessageCircle className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>

                      {/* Tooltip */}
                      {hoveredAnnotation === ann.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl z-20 pointer-events-none">
                          <p className="text-[10px] text-[#EDEDED] leading-relaxed">{ann.text}</p>
                          <p className="text-[9px] text-[#52525B] mt-1">
                            {ann.author_name || "Unknown"} &middot; {ann.created_at ? timeAgo(ann.created_at) : ""}
                            {ann.resolved && <span className="text-emerald-400 ml-1">Resolved</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New annotation placement */}
                  {newAnnotationPos && (
                    <div
                      className="absolute z-20"
                      style={{ left: `${(newAnnotationPos.x * 100).toFixed(2)}%`, top: `${(newAnnotationPos.y * 100).toFixed(2)}%`, transform: "translate(-50%, -100%)" }}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500 ring-2 ring-amber-400/50 flex items-center justify-center animate-pulse shadow-lg">
                        <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
                      </div>
                      {/* Input popover */}
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl z-30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          autoFocus
                          placeholder="Add your note..."
                          value={newAnnotationText}
                          onChange={(e) => setNewAnnotationText(e.target.value)}
                          className="w-full h-16 px-2 py-1.5 rounded-md bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCreateAnnotation(); }
                            if (e.key === "Escape") { setNewAnnotationPos(null); setNewAnnotationText(""); }
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => { setNewAnnotationPos(null); setNewAnnotationText(""); }}
                            className="text-[10px] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateAnnotation}
                            disabled={creatingAnnotation || !newAnnotationText.trim()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                          >
                            {creatingAnnotation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Annotation mode indicator */}
                  {annotationMode && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/90 text-white text-[10px] font-medium shadow-lg">
                      <MessageCircle className="w-3 h-3" />
                      Click to annotate
                    </div>
                  )}
                </div>
              )}

              {/* Audio Preview */}
              {kind === "audio" && asset.preview_url && (
                <div className="p-8 bg-[#0A0A0A] flex flex-col items-center justify-center" style={{ minHeight: "200px" }}>
                  <Volume2 className="w-10 h-10 text-[#3B82F6] mb-4" strokeWidth={1} />
                  <audio controls src={asset.preview_url} className="w-full max-w-md" />
                  <p className="text-xs text-[#52525B] mt-3">{asset.filename}</p>
                </div>
              )}

              {/* No preview */}
              {kind === "other" && (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-10 h-10 text-[#27272A] mb-3" strokeWidth={1} />
                  <p className="text-sm text-[#52525B]">No preview available</p>
                  <p className="text-xs text-[#3F3F46] mt-1">.{ext} files cannot be previewed in browser</p>
                </div>
              )}

              {/* Bottom bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#1E1E1E] bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                  <StatusBadge status={asset.status} />
                  <span className="text-[10px] text-[#52525B]">{formatSize(asset.file_size_kb)}</span>
                  <span className="text-[10px] text-[#52525B]">.{ext}</span>
                </div>
                {asset.preview_url && (
                  <a
                    href={asset.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[#71717A] hover:text-[#EDEDED] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              <h3 className="text-xs font-semibold text-[#EDEDED] mb-3">Asset Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  { label: "Category", value: meta.category || meta.type || "General" },
                  { label: "Uploaded by", value: asset.uploader_name || "Unknown" },
                  { label: "Uploaded", value: asset.created_at ? formatDate(asset.created_at) : "—" },
                  { label: "Status", value: asset.status },
                  ...(meta.dimensions ? [{ label: "Dimensions", value: meta.dimensions }] : []),
                  ...(meta.resolution ? [{ label: "Resolution", value: meta.resolution }] : []),
                  ...(meta.color_space ? [{ label: "Color Space", value: meta.color_space }] : []),
                  ...(meta.poly_count ? [{ label: "Poly Count", value: String(meta.poly_count) }] : []),
                  ...(meta.engine_target_path ? [{ label: "Unity Path", value: meta.engine_target_path }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1 border-b border-[#1E1E1E]/50 last:border-0">
                    <span className="text-[10px] text-[#52525B]">{label}</span>
                    <span className="text-[11px] text-[#EDEDED] font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT: Version Timeline (1 col) ═══ */}
          <div className="col-span-1 space-y-6">
            {/* Asset header */}
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              <h2 className="text-sm font-semibold text-[#EDEDED] truncate mb-1">{asset.filename}</h2>
              <p className="text-[10px] text-[#52525B] mb-3">
                {asset.uploader_name || "Unknown"} &middot; {asset.created_at ? timeAgo(asset.created_at) : ""}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={asset.status} />
                {activeVersionId && (
                  <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active version set
                  </span>
                )}
              </div>
            </div>

            {/* File Lock */}
            <div className={`rounded-xl border p-4 ${
              isLockedByOther ? "border-rose-500/30 bg-rose-500/[0.03]" :
              isMyLock ? "border-amber-500/30 bg-amber-500/[0.03]" :
              "border-[#1E1E1E] bg-[#121212]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <Lock className={`w-4 h-4 ${isMyLock ? "text-amber-400" : "text-rose-400"}`} strokeWidth={1.5} />
                  ) : (
                    <Unlock className="w-4 h-4 text-[#52525B]" strokeWidth={1.5} />
                  )}
                  <div>
                    <p className="text-xs font-medium text-[#EDEDED]">
                      {isLocked
                        ? isMyLock ? "Locked by you" : `Locked by ${lockOwner}`
                        : "Unlocked"
                      }
                    </p>
                    {isLocked && lockIntent.locked_at && (
                      <p className="text-[10px] text-[#52525B]">{timeAgo(lockIntent.locked_at)}</p>
                    )}
                    {lockIntent.note && (
                      <p className="text-[10px] text-[#71717A] mt-0.5">{lockIntent.note}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isLocked && (
                    <button
                      onClick={handleLock}
                      disabled={locking}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                      {locking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                      Lock
                    </button>
                  )}
                  {isMyLock && (
                    <button
                      onClick={() => handleUnlock(false)}
                      disabled={locking}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {locking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                      Unlock
                    </button>
                  )}
                  {isLockedByOther && canForce && (
                    <button
                      onClick={() => handleUnlock(true)}
                      disabled={locking}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                    >
                      {locking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                      Force Unlock
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Annotations Panel (image assets only) */}
            {kind === "image" && (
              <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-[#EDEDED]">Annotations</span>
                    {unresolvedCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 leading-none">
                        {unresolvedCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setAnnotationMode(!annotationMode); setNewAnnotationPos(null); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                      annotationMode
                        ? "bg-blue-600 text-white"
                        : "bg-white/[0.06] text-[#A1A1AA] hover:bg-white/[0.1]"
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    {annotationMode ? "Annotating..." : "Add"}
                  </button>
                </div>

                {annotationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-4 h-4 text-[#52525B] animate-spin" />
                  </div>
                ) : annotations.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageCircle className="w-6 h-6 text-[#27272A] mx-auto mb-2" strokeWidth={1} />
                    <p className="text-xs text-[#52525B]">No annotations yet</p>
                    <p className="text-[10px] text-[#3F3F46] mt-1">Click &quot;Add&quot; to start annotating</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1E1E1E]/50 max-h-[300px] overflow-y-auto">
                    {annotations.map((ann: any) => (
                      <div
                        key={ann.id}
                        className={`px-5 py-3 hover:bg-white/[0.02] transition-colors ${
                          ann.resolved ? "opacity-60" : ""
                        }`}
                        onMouseEnter={() => setHoveredAnnotation(ann.id)}
                        onMouseLeave={() => setHoveredAnnotation(null)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            ann.resolved ? "bg-emerald-500/20" : "bg-blue-500/20"
                          }`}>
                            <MessageCircle className={`w-2.5 h-2.5 ${ann.resolved ? "text-emerald-400" : "text-blue-400"}`} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#EDEDED] leading-relaxed">{ann.text}</p>
                            <p className="text-[9px] text-[#52525B] mt-1">
                              {ann.author_name || "Unknown"} &middot; {ann.created_at ? timeAgo(ann.created_at) : ""}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {!ann.resolved ? (
                                <button
                                  onClick={() => handleResolveAnnotation(ann.id, true)}
                                  disabled={resolvingId === ann.id}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                                >
                                  {resolvingId === ann.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                  Resolve
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResolveAnnotation(ann.id, false)}
                                  disabled={resolvingId === ann.id}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                                >
                                  Reopen
                                </button>
                              )}
                              {canManageVersions && (
                                <button
                                  onClick={() => handleDeleteAnnotation(ann.id)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-[#52525B] hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Version Timeline */}
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-[#EDEDED]">Version History</span>
                </div>
                <span className="text-[10px] text-[#52525B]">{sortedVersions.length} versions</span>
              </div>

              {sortedVersions.length === 0 ? (
                <div className="py-10 text-center">
                  <Layers className="w-6 h-6 text-[#27272A] mx-auto mb-2" strokeWidth={1} />
                  <p className="text-xs text-[#52525B]">No version history</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1E1E1E]/50">
                  {sortedVersions.map((v: any, i: number) => {
                    const vNum = extractVersionNumber(v.filename);
                    const isCurrent = String(v.id) === String(asset.id);
                    const isActive = activeVersionId ? String(v.id) === activeVersionId : false;
                    const isFirst = i === 0;
                    return (
                      <div key={v.id} className={`px-5 py-3 hover:bg-white/[0.02] transition-colors ${isCurrent ? "bg-blue-500/[0.03]" : ""}`}>
                        <div className="flex items-start gap-3">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-2.5 h-2.5 rounded-full ring-2 ${
                              isActive ? "bg-emerald-400 ring-emerald-400/30" :
                              isCurrent ? "bg-blue-400 ring-blue-400/30" :
                              "bg-[#3F3F46] ring-[#27272A]"
                            }`} />
                            {i < sortedVersions.length - 1 && (
                              <div className="w-px h-6 bg-[#1E1E1E] mt-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium text-[#EDEDED]">
                                {vNum !== null ? `v${vNum}` : isFirst ? "Latest" : "Version"}
                              </span>
                              {isCurrent && (
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 leading-none">VIEWING</span>
                              )}
                              {isActive && (
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 leading-none">ACTIVE</span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#52525B] truncate">{v.filename}</p>
                            <p className="text-[10px] text-[#3F3F46]">
                              {formatSize(v.file_size_kb)} &middot; {v.created_at ? timeAgo(v.created_at) : ""}
                            </p>

                            {/* Actions */}
                            {canManageVersions && !isActive && (
                              <div className="flex items-center gap-1.5 mt-2">
                                {!isCurrent && (
                                  <a
                                    href={`/dashboard/assets?id=${v.id}`}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium bg-white/[0.04] text-[#A1A1AA] hover:bg-white/[0.08] transition-colors"
                                  >
                                    <Eye className="w-3 h-3" /> View
                                  </a>
                                )}
                                <button
                                  onClick={() => handleActivate(String(v.id))}
                                  disabled={activatingId === String(v.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                                >
                                  {activatingId === String(v.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Set Active
                                </button>
                                <button
                                  onClick={() => handleRollback(String(v.id))}
                                  disabled={activatingId === String(v.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" /> Rollback
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!canManageVersions && (
              <p className="text-[10px] text-[#3F3F46] px-1">Only Lead or Technical Art can manage versions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN EXPORT (Suspense boundary for useSearchParams)
// ═══════════════════════════════════════════════

export default function AssetDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#52525B] animate-spin" />
      </div>
    }>
      <AssetDetailInner />
    </Suspense>
  );
}

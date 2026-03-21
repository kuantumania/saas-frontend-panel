"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, Folder, FileText, Image, Box, Volume2,
  X, CheckCircle2, AlertTriangle, Loader2, Plus, Trash2,
  ChevronDown, Shield,
} from "lucide-react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  category: string;
  status: "queued" | "uploading" | "success" | "failed" | "warning";
  progress: number;
  error?: string;
  violations?: any[];
  assetId?: string;
  s3Key?: string;
}

const CATEGORIES = [
  "3D Model", "Texture", "Material", "Audio", "Animation",
  "UI", "VFX", "Shader", "Prefab", "Scene", "Script", "General",
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function guessCategory(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["fbx", "obj", "gltf", "glb", "usd", "usda", "usdz", "blend", "ma", "mb", "max"].includes(ext)) return "3D Model";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "tga", "psd", "exr", "hdr"].includes(ext)) return "Texture";
  if (["mat", "sbsar", "sbs"].includes(ext)) return "Material";
  if (["wav", "mp3", "ogg", "flac", "aiff"].includes(ext)) return "Audio";
  if (["anim", "controller"].includes(ext)) return "Animation";
  if (["prefab"].includes(ext)) return "Prefab";
  if (["unity", "scene"].includes(ext)) return "Scene";
  if (["shader", "hlsl", "cginc", "compute"].includes(ext)) return "Shader";
  if (["cs"].includes(ext)) return "Script";
  if (["vfx", "particle"].includes(ext)) return "VFX";
  return "General";
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "tga", "psd", "exr", "hdr"].includes(ext))
    return <Image className="w-4 h-4 text-emerald-400" />;
  if (["fbx", "obj", "gltf", "glb", "usd", "usda", "usdz", "blend", "ma", "mb", "max"].includes(ext))
    return <Box className="w-4 h-4 text-purple-400" />;
  if (["wav", "mp3", "ogg", "flac", "aiff"].includes(ext))
    return <Volume2 className="w-4 h-4 text-amber-400" />;
  return <FileText className="w-4 h-4 text-zinc-400" />;
}

let _idCounter = 0;
function uid() { return `f_${Date.now()}_${++_idCounter}`; }

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function UploadPage() {
  const [token, setToken] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [userCode, setUserCode] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [isEnterprise, setIsEnterprise] = useState(false);

  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("kuantum_token") || localStorage.getItem("lead_session_token") || "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const user = JSON.parse(localStorage.getItem("session_user") || "{}");
    setToken(t);
    setWorkspace(studio?.slug || "default-studio");
    setUserCode(user?.name || user?.user_code || "Unknown");
    setUserRole(user?.role || "member");
    const billing = JSON.parse(localStorage.getItem("kuantum_billing") || "{}");
    setIsEnterprise((billing?.plan || "").startsWith("enterprise"));
    if (t) api.fetchFolders(t).then(setFolders).catch(() => {});
  }, []);

  // ── Add files to queue ──
  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: QueuedFile[] = Array.from(files).map((file) => ({
      id: uid(),
      file,
      name: file.name,
      size: file.size,
      category: guessCategory(file.name),
      status: "queued" as const,
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newFiles]);
  }, []);

  // ── Remove from queue ──
  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Update category ──
  const updateCategory = useCallback((id: string, category: string) => {
    setQueue((prev) => prev.map((f) => f.id === id ? { ...f, category } : f));
  }, []);

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // ── Upload all ──
  const uploadAll = useCallback(async () => {
    const pending = queue.filter((f) => f.status === "queued" || f.status === "failed");
    if (pending.length === 0 || !token) return;

    setUploading(true);

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, status: "uploading" as const, progress: 30 } : f)
      );

      try {
        const result = await api.uploadAsset(token, item.file, {
          role: item.category,
          userCode,
          workspace,
          folderId: selectedFolder || undefined,
          forceUpload: false,
        });

        if (result.error) {
          if (result.violations && result.violations.length > 0) {
            setQueue((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { ...f, status: "warning" as const, progress: 100, error: result.error, violations: result.violations }
                  : f
              )
            );
          } else {
            setQueue((prev) =>
              prev.map((f) =>
                f.id === item.id ? { ...f, status: "failed" as const, progress: 100, error: result.error } : f
              )
            );
          }
        } else {
          // Upload succeeded — optionally auto-submit for review
          const s3Key = result.s3_key || result.asset?.s3_key;
          if (autoSubmit && s3Key) {
            await api.submitAssetForReview(token, s3Key).catch(() => {});
          }

          setQueue((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "success" as const, progress: 100, assetId: result.asset?.id, s3Key }
                : f
            )
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "failed" as const, progress: 100, error: err.message } : f
          )
        );
      }
    }

    setUploading(false);
  }, [queue, token, userCode, workspace, selectedFolder, autoSubmit]);

  // ── Force upload (bypass QA) ──
  const forceUpload = useCallback(async (id: string) => {
    const item = queue.find((f) => f.id === id);
    if (!item || !token) return;

    setQueue((prev) =>
      prev.map((f) => f.id === id ? { ...f, status: "uploading" as const, progress: 30 } : f)
    );

    try {
      const result = await api.uploadAsset(token, item.file, {
        role: item.category,
        userCode,
        workspace,
        folderId: selectedFolder || undefined,
        forceUpload: true,
      });

      if (result.error) {
        setQueue((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: "failed" as const, progress: 100, error: result.error } : f)
        );
      } else {
        const s3Key = result.s3_key || result.asset?.s3_key;
        if (autoSubmit && s3Key) {
          await api.submitAssetForReview(token, s3Key).catch(() => {});
        }
        setQueue((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "success" as const, progress: 100, assetId: result.asset?.id, s3Key } : f
          )
        );
      }
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((f) => f.id === id ? { ...f, status: "failed" as const, progress: 100, error: err.message } : f)
      );
    }
  }, [queue, token, userCode, workspace, selectedFolder, autoSubmit]);

  // ── Stats ──
  const totalFiles = queue.length;
  const successCount = queue.filter((f) => f.status === "success").length;
  const failedCount = queue.filter((f) => f.status === "failed").length;
  const warningCount = queue.filter((f) => f.status === "warning").length;
  const pendingCount = queue.filter((f) => f.status === "queued").length;
  const totalSize = queue.reduce((sum, f) => sum + f.size, 0);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav studioName={workspace || "Studio"} role={userRole} isEnterprise={isEnterprise} showSearch={false} />

      {/* Page header */}
      <div className="border-b border-[#1E1E1E] bg-[#0A0A0A]/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Upload Assets</h1>
            <p className="text-[10px] text-[#52525B]">Drag & drop files or browse to upload to your workspace</p>
          </div>
          {totalFiles > 0 && (
            <span className="text-[10px] text-[#52525B]">
              {totalFiles} file{totalFiles !== 1 ? "s" : ""} ({formatBytes(totalSize)})
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ═══ DROP ZONE ═══ */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-8 ${
            dragOver
              ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
              : "border-[#27272A] bg-[#121212] hover:border-[#3F3F46] hover:bg-[#141414]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            className="hidden"
          />

          <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
            dragOver ? "bg-blue-500/10" : "bg-white/[0.04]"
          }`}>
            <Upload className={`w-6 h-6 transition-colors ${dragOver ? "text-blue-400" : "text-[#52525B]"}`} />
          </div>

          <h2 className="text-sm font-semibold mb-1">
            {dragOver ? "Drop files here" : "Drag & drop files"}
          </h2>
          <p className="text-xs text-[#52525B] mb-4">
            or <span className="text-blue-400 hover:text-blue-300">browse from your computer</span>
          </p>
          <p className="text-[9px] text-[#3F3F46]">
            FBX, OBJ, GLTF, PNG, PSD, WAV, MP3, and 30+ more formats supported
          </p>
        </div>

        {/* ═══ UPLOAD OPTIONS ═══ */}
        {queue.length > 0 && (
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {/* Folder selector */}
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-[#52525B]" />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none appearance-none pr-7"
              >
                <option value="">Root folder</option>
                {folders.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Auto-submit toggle */}
            <button
              onClick={() => setAutoSubmit(!autoSubmit)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#27272A] text-xs transition-colors hover:border-[#3F3F46]"
            >
              <div className={`w-7 h-4 rounded-full relative transition-colors ${
                autoSubmit ? "bg-blue-600" : "bg-[#27272A]"
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                  autoSubmit ? "left-3.5" : "left-0.5"
                }`} />
              </div>
              <span className="text-[#A1A1AA]">Auto-submit for review</span>
            </button>

            <div className="flex-1" />

            {/* Clear all */}
            <button
              onClick={() => setQueue([])}
              className="px-3 py-1.5 rounded-lg text-[10px] text-[#52525B] hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>

            {/* Upload button */}
            <button
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload {pendingCount > 0 ? `(${pendingCount})` : "All"}</>
              )}
            </button>
          </div>
        )}

        {/* ═══ FILE QUEUE ═══ */}
        <AnimatePresence>
          {queue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden"
            >
              {/* Header */}
              <div className="grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A]">
                <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider">File</span>
                <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider">Category</span>
                <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider text-right">Size</span>
                <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider text-center">Status</span>
                <span />
              </div>

              {/* Rows */}
              <div className="max-h-[480px] overflow-y-auto">
                <AnimatePresence>
                  {queue.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-[#1E1E1E]/50"
                    >
                      {/* Main row */}
                      <div className="grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-3 items-center">
                        {/* File name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {fileIcon(item.name)}
                          <span className="text-xs text-[#EDEDED] truncate">{item.name}</span>
                        </div>

                        {/* Category */}
                        <select
                          value={item.category}
                          onChange={(e) => updateCategory(item.id, e.target.value)}
                          disabled={item.status !== "queued"}
                          className="px-2 py-1 rounded-md bg-[#0A0A0A] border border-[#1E1E1E] text-[10px] text-[#A1A1AA] focus:border-[#3F3F46] focus:ring-0 focus:outline-none appearance-none disabled:opacity-50"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        {/* Size */}
                        <span className="text-[10px] text-[#52525B] text-right">{formatBytes(item.size)}</span>

                        {/* Status */}
                        <div className="flex justify-center">
                          {item.status === "queued" && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#27272A]/50 text-[#71717A]">Queued</span>
                          )}
                          {item.status === "uploading" && (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                          )}
                          {item.status === "success" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {item.status === "failed" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          {item.status === "warning" && (
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>

                        {/* Remove */}
                        <div className="flex justify-center">
                          {(item.status === "queued" || item.status === "failed" || item.status === "warning") && (
                            <button
                              onClick={() => removeFile(item.id)}
                              className="text-[#3F3F46] hover:text-rose-400 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {item.status === "uploading" && (
                        <div className="px-5 pb-2">
                          <div className="h-1 rounded-full bg-[#1E1E1E] overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "60%" }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error/Warning detail */}
                      {(item.status === "failed" || item.status === "warning") && item.error && (
                        <div className="px-5 pb-3">
                          <div className={`px-3 py-2 rounded-lg text-[10px] ${
                            item.status === "warning"
                              ? "bg-amber-500/5 border border-amber-500/15 text-amber-400"
                              : "bg-rose-500/5 border border-rose-500/15 text-rose-400"
                          }`}>
                            <p className="mb-1">{item.error}</p>
                            {item.violations && item.violations.length > 0 && (
                              <ul className="space-y-0.5 mt-1.5">
                                {item.violations.map((v: any, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-[8px] mt-0.5">&#9679;</span>
                                    <span>{v.message || v.rule || JSON.stringify(v)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {item.status === "warning" && (
                              <button
                                onClick={() => forceUpload(item.id)}
                                className="mt-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors text-[10px] font-medium"
                              >
                                Force Upload (Bypass QA)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer stats */}
              {(successCount > 0 || failedCount > 0) && (
                <div className="px-5 py-3 border-t border-[#1E1E1E] bg-[#0A0A0A] flex items-center gap-4">
                  {successCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">{successCount} uploaded</span>
                    </div>
                  )}
                  {failedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span className="text-[10px] text-rose-400">{failedCount} failed</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400">{warningCount} QA blocked</span>
                    </div>
                  )}
                  <div className="flex-1" />
                  {successCount > 0 && (
                    <a
                      href="/dashboard"
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View in Dashboard &rarr;
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ EMPTY STATE ═══ */}
        {queue.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-[#3F3F46]">No files queued. Drop files above or click to browse.</p>
          </div>
        )}

        {/* ═══ SUPPORTED FORMATS ═══ */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "3D Models", formats: "FBX, OBJ, GLTF, GLB, USD, Blend", icon: Box, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Textures", formats: "PNG, JPG, PSD, TGA, EXR, HDR", icon: Image, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Audio", formats: "WAV, MP3, OGG, FLAC, AIFF", icon: Volume2, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Other", formats: "Prefab, Shader, Anim, Script", icon: FileText, color: "text-zinc-400", bg: "bg-zinc-500/10" },
          ].map((cat) => (
            <div key={cat.label} className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center`}>
                  <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                </div>
                <span className="text-xs font-medium text-[#EDEDED]">{cat.label}</span>
              </div>
              <p className="text-[10px] text-[#52525B]">{cat.formats}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

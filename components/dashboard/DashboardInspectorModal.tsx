"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Box,
  Cpu,
  Info,
  Layers,
  Lock,
  Unlock,
  X,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/DashboardShared";
import {
  AudioInspectorPanel,
  ImageAnnotationPanel,
  ModelPreviewCanvas,
  TextureInspectorPanel,
  VersionComparePanel,
} from "@/components/inspectors";
import {
  activityVerb,
  dueLabel,
  extractVersionNumber,
  fileIcon,
  formatSize,
  formatTechValue,
  reviewActionBadge,
  timeAgo,
} from "@/lib/utils/dashboard";

interface DashboardInspectorModalProps {
  ctx: any;
}

export default function DashboardInspectorModal({
  ctx,
}: DashboardInspectorModalProps) {
  const {
    inspectAsset,
    closeInspector,
    inspectKind,
    canRender3DPreview,
    inspectFormat,
    conversionStatus,
    imageInspectorTab,
    setImageInspectorTab,
    assetMeta,
    compareAsset,
    canManageVersions,
    activeVersionId,
    handleRollbackVersion,
    activatingVersionId,
    token,
    canManageAnnotations,
    annotationRefreshTick,
    metaLoading,
    riskSummary,
    isLockHeld,
    lockOwnerName,
    activeLockIntent,
    lockIntentNote,
    setLockIntentNote,
    handleAcquireLockIntent,
    savingLockIntent,
    lockHeldByCurrentUser,
    handleReleaseLockIntent,
    canForceLockIntent,
    sortedVersions,
    unityTargetPath,
    unityCategory,
    lineagePrev,
    openInspector,
    lineageNext,
    handleActivateVersion,
    qaGuideLoading,
    assetQaGuidance,
    setQaProfile,
    qaProfile,
    handleCreateQaTask,
    creatingQaTaskKey,
    openAssignModal,
    qaTaskLoading,
    qaTasks,
    handleUpdateQaTaskStatus,
    updatingQaTaskId,
    setReviewHistoryFilter,
    reviewHistoryFilter,
    filteredReviewHistory,
  } = ctx;

  return (
    <AnimatePresence>
      {inspectAsset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeInspector}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-[#121212] border border-[#27272A] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-[#EDEDED]">
                  Asset Inspector
                </span>
              </div>
              <button
                onClick={closeInspector}
                className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Asset Info */}
              <div className="px-5 py-3 border-b border-[#1E1E1E] flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                  {fileIcon(inspectAsset.file_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={`/dashboard/assets?id=${inspectAsset.id}`}
                    className="text-sm font-medium text-[#EDEDED] hover:text-blue-400 transition-colors truncate block"
                  >
                    {inspectAsset.filename}
                  </a>
                  <p className="text-xs text-[#52525B]">
                    {formatSize(inspectAsset.file_size_kb)} ·{" "}
                    {inspectAsset.uploader_name || "Unknown"}
                  </p>
                </div>
                <a
                  href={`/dashboard/assets?id=${inspectAsset.id}`}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#52525B] hover:text-[#EDEDED] transition-colors"
                  title="Open full page"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <StatusBadge status={inspectAsset.status} />
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
                        <Box
                          className="w-5 h-5 text-[#3F3F46] mb-2"
                          strokeWidth={1.5}
                        />
                        <p className="text-xs text-[#71717A]">
                          {conversionStatus === "pending"
                            ? "Model is converting to GLB for web preview..."
                            : "3D preview will be supported for this format soon."}
                        </p>
                        <p className="text-[10px] text-[#52525B] mt-1">
                          Current format: {inspectFormat || "unknown"} ·
                          Supported now: glb, gltf, obj, fbx
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#52525B] mt-2">
                    FAZ 11 Preview (v2): React Three Fiber + Drei +
                    PostProcessing.
                  </p>
                </div>
              )}

              {inspectKind === "image" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <div className="flex items-center gap-1 mb-3">
                    {(["inspect", "compare", "annotate"] as const).map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setImageInspectorTab(tab)}
                          className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                            imageInspectorTab === tab
                              ? "bg-white/[0.08] text-[#EDEDED]"
                              : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                          }`}
                        >
                          {tab}
                        </button>
                      ),
                    )}
                  </div>

                  {imageInspectorTab === "inspect" && (
                    <TextureInspectorPanel
                      imageUrl={inspectAsset.preview_url}
                      metadata={assetMeta?.metadata}
                    />
                  )}

                  {imageInspectorTab === "compare" &&
                    (compareAsset?.preview_url ? (
                      <div className="space-y-3">
                        <VersionComparePanel
                          beforeUrl={compareAsset.preview_url}
                          afterUrl={inspectAsset.preview_url}
                          beforeLabel={compareAsset.filename || "Previous"}
                          afterLabel={inspectAsset.filename || "Current"}
                        />
                        {canManageVersions && (
                          <div className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2">
                            <div>
                              <p className="text-[11px] text-[#A1A1AA]">
                                Rollback target
                              </p>
                              <p className="text-[10px] text-[#52525B] truncate">
                                {compareAsset.filename}
                              </p>
                            </div>
                            {activeVersionId &&
                            String(compareAsset.id) ===
                              String(activeVersionId) ? (
                              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  handleRollbackVersion(String(compareAsset.id))
                                }
                                disabled={
                                  activatingVersionId ===
                                  String(compareAsset.id)
                                }
                                className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ring-1 ${
                                  activatingVersionId ===
                                  String(compareAsset.id)
                                    ? "bg-white/[0.04] text-[#52525B] ring-white/[0.06] cursor-not-allowed"
                                    : "bg-amber-500/10 text-amber-200 ring-amber-500/20 hover:bg-amber-500/20"
                                }`}
                              >
                                {activatingVersionId === String(compareAsset.id)
                                  ? "Rolling..."
                                  : "Rollback"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#52525B]">
                        Version Compare: previous version not found in current
                        asset page.
                      </p>
                    ))}

                  {imageInspectorTab === "annotate" && (
                    <ImageAnnotationPanel
                      assetId={inspectAsset.id}
                      imageUrl={inspectAsset.preview_url}
                      token={token}
                      canCreate={canManageAnnotations}
                      canModerate={canManageAnnotations}
                      refreshKey={annotationRefreshTick}
                    />
                  )}
                </div>
              )}

              {inspectKind === "audio" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <AudioInspectorPanel audioUrl={inspectAsset.preview_url} />
                </div>
              )}

              {/* Metadata */}
              <div className="px-5 py-4">
                {metaLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="skeleton h-4 w-full rounded" />
                    ))}
                  </div>
                ) : assetMeta?.metadata ? (
                  <div className="space-y-4">
                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#3B82F6]/10 text-[#3B82F6] ring-1 ring-[#3B82F6]/20">
                        {assetMeta.metadata.type || "Unknown"}
                      </span>
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ring-1 ${riskSummary.cls}`}
                      >
                        Risk {riskSummary.score} · {riskSummary.label}
                      </span>
                      {assetMeta.metadata.format && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-[#71717A] ring-1 ring-white/[0.06]">
                          {assetMeta.metadata.format}
                        </span>
                      )}
                    </div>

                    {/* Git-for-Artists Core: Lock Intent */}
                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {isLockHeld ? (
                            <Lock
                              className="w-3.5 h-3.5 text-amber-300"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Unlock
                              className="w-3.5 h-3.5 text-emerald-300"
                              strokeWidth={1.5}
                            />
                          )}
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">
                            Lock Intent
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${
                            isLockHeld
                              ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                          }`}
                        >
                          {isLockHeld ? "Locked" : "Available"}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#71717A]">
                        {isLockHeld
                          ? `Owner: ${lockOwnerName || "unknown"}${activeLockIntent?.locked_at ? ` · ${timeAgo(activeLockIntent.locked_at)}` : ""}`
                          : "No active lock. Claim intent before major changes to avoid collisions."}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={lockIntentNote}
                          onChange={(e) => setLockIntentNote(e.target.value)}
                          placeholder="Lock note (optional): e.g. updating UV + naming"
                          className="flex-1 h-8 px-2 rounded bg-[#121212] border border-[#27272A] text-[11px] text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:outline-none"
                        />
                        {!isLockHeld ? (
                          <button
                            onClick={() => handleAcquireLockIntent(false)}
                            disabled={savingLockIntent}
                            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                              savingLockIntent
                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            Claim
                          </button>
                        ) : lockHeldByCurrentUser ? (
                          <button
                            onClick={() => handleReleaseLockIntent(false)}
                            disabled={savingLockIntent}
                            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                              savingLockIntent
                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20"
                            }`}
                          >
                            Release
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            {canForceLockIntent && (
                              <>
                                <button
                                  onClick={() => handleAcquireLockIntent(true)}
                                  disabled={savingLockIntent}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    savingLockIntent
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                                  }`}
                                >
                                  Force Claim
                                </button>
                                <button
                                  onClick={() => handleReleaseLockIntent(true)}
                                  disabled={savingLockIntent}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    savingLockIntent
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-500/20 hover:bg-zinc-500/20"
                                  }`}
                                >
                                  Force Unlock
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Version Core v2 */}
                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Layers
                            className="w-3.5 h-3.5 text-[#60A5FA]"
                            strokeWidth={1.5}
                          />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">
                            Version Core
                          </span>
                        </div>
                        <span className="text-[10px] text-[#52525B]">
                          {sortedVersions.length} versions
                        </span>
                      </div>

                      <div className="mb-3 rounded-lg border border-[#1E1E1E] bg-[#0F0F12] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#52525B]">
                          Unity Target
                        </p>
                        <p className="text-[11px] text-[#EDEDED] truncate">
                          {unityTargetPath}
                        </p>
                        <p className="text-[9px] text-[#3F3F46]">
                          Category: {unityCategory}
                        </p>
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#52525B] mb-1">
                          Lineage
                        </p>
                        <div className="flex items-center gap-2 text-[10px]">
                          {lineagePrev ? (
                            <button
                              onClick={() => openInspector(lineagePrev)}
                              className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#A1A1AA] hover:text-[#EDEDED] transition-colors"
                            >
                              ← {lineagePrev.filename}
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#3F3F46]">
                              Start
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-200">
                            {inspectAsset?.filename || "Current"}
                          </span>
                          {lineageNext ? (
                            <button
                              onClick={() => openInspector(lineageNext)}
                              className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#A1A1AA] hover:text-[#EDEDED] transition-colors"
                            >
                              {lineageNext.filename} →
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#3F3F46]">
                              Latest
                            </span>
                          )}
                        </div>
                      </div>

                      {sortedVersions.length === 0 ? (
                        <p className="text-[11px] text-[#52525B]">
                          No version history found for this asset.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {sortedVersions.map((v: any) => {
                            const isActive = activeVersionId
                              ? String(v.id) === activeVersionId
                              : false;
                            const isCurrent =
                              String(v.id) === String(inspectAsset.id);
                            const versionNum = extractVersionNumber(v.filename);
                            return (
                              <div
                                key={v.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-[#1F1F22] bg-[#0F0F12] px-2.5 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] text-[#EDEDED] truncate">
                                    {v.filename}
                                  </p>
                                  <p className="text-[10px] text-[#52525B]">
                                    {versionNum !== null
                                      ? `v${versionNum}`
                                      : "version"}{" "}
                                    · {formatSize(v.file_size_kb)} ·{" "}
                                    {timeAgo(v.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isCurrent && (
                                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A1A1AA]">
                                      Current
                                    </span>
                                  )}
                                  {!isCurrent && (
                                    <button
                                      onClick={() => openInspector(v)}
                                      className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ring-1 bg-white/[0.03] text-[#A1A1AA] ring-white/[0.08] hover:bg-white/[0.06]"
                                    >
                                      Open
                                    </button>
                                  )}
                                  {isActive ? (
                                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                                      Active
                                    </span>
                                  ) : (
                                    canManageVersions && (
                                      <button
                                        onClick={() =>
                                          handleActivateVersion(String(v.id))
                                        }
                                        disabled={
                                          activatingVersionId === String(v.id)
                                        }
                                        className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ring-1 ${
                                          activatingVersionId === String(v.id)
                                            ? "bg-white/[0.04] text-[#52525B] ring-white/[0.06] cursor-not-allowed"
                                            : "bg-blue-500/10 text-blue-200 ring-blue-500/20 hover:bg-blue-500/20"
                                        }`}
                                      >
                                        {activatingVersionId === String(v.id)
                                          ? "Setting..."
                                          : "Set Active"}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!canManageVersions && (
                        <p className="text-[10px] text-[#3F3F46] mt-2">
                          Only Lead/Tech Art can change the active version.
                        </p>
                      )}
                    </div>

                    {/* Tech Art AI v1 */}
                    {(qaGuideLoading || assetQaGuidance?.guidance) && (
                      <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Zap
                              className="w-3.5 h-3.5 text-[#3B82F6]"
                              strokeWidth={1.5}
                            />
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">
                              Tech Art AI v1
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(["mobile", "pc", "console"] as const).map((p) => (
                              <button
                                key={`qa-profile-${p}`}
                                onClick={() => setQaProfile(p)}
                                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                  qaProfile === p
                                    ? "bg-white/[0.1] text-[#EDEDED]"
                                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          {assetQaGuidance?.guidance?.recommended_decision && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${
                                assetQaGuidance.guidance
                                  .recommended_decision === "block_fix_first"
                                  ? "bg-rose-500/10 text-rose-300 ring-rose-500/20"
                                  : assetQaGuidance.guidance
                                        .recommended_decision ===
                                      "review_with_caution"
                                    ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                              }`}
                            >
                              {assetQaGuidance.guidance.recommended_decision ===
                              "block_fix_first"
                                ? "Block + Fix"
                                : assetQaGuidance.guidance
                                      .recommended_decision ===
                                    "review_with_caution"
                                  ? "Review Carefully"
                                  : "Ready"}
                            </span>
                          )}
                        </div>
                        {qaGuideLoading ? (
                          <div className="space-y-2">
                            <div className="skeleton h-3 w-full rounded" />
                            <div className="skeleton h-3 w-3/4 rounded" />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-[#A1A1AA] leading-relaxed">
                              {assetQaGuidance?.guidance?.summary ||
                                "Guidance unavailable for this asset."}
                            </p>
                            {canManageAnnotations && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleCreateQaTask(
                                      "Review technical checklist and resolve failed checks.",
                                      "qa-summary",
                                    )
                                  }
                                  disabled={creatingQaTaskKey === "qa-summary"}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    creatingQaTaskKey === "qa-summary"
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                                  }`}
                                >
                                  {creatingQaTaskKey === "qa-summary"
                                    ? "Creating..."
                                    : "Add Tech Task"}
                                </button>
                                <button
                                  onClick={() => openAssignModal(inspectAsset)}
                                  className="px-2 py-1 rounded text-[10px] uppercase tracking-wide bg-white/[0.04] text-[#A1A1AA] ring-1 ring-white/[0.08] hover:text-[#EDEDED] hover:bg-white/[0.08] transition-colors"
                                >
                                  Assign Owner
                                </button>
                              </div>
                            )}

                            {assetQaGuidance?.guidance?.reviewer_suggestion
                              ?.name && (
                              <p className="text-[11px] text-[#71717A] mt-2">
                                Suggested reviewer:{" "}
                                <span className="text-[#EDEDED]">
                                  {
                                    assetQaGuidance.guidance.reviewer_suggestion
                                      .name
                                  }
                                </span>{" "}
                                (
                                {String(
                                  assetQaGuidance.guidance.reviewer_suggestion
                                    .role || "reviewer",
                                ).replace(/_/g, " ")}
                                )
                              </p>
                            )}

                            {Array.isArray(
                              assetQaGuidance?.guidance?.checklist,
                            ) &&
                              assetQaGuidance.guidance.checklist.length > 0 && (
                                <div className="mt-2 grid grid-cols-1 gap-1.5">
                                  {assetQaGuidance.guidance.checklist
                                    .slice(0, 4)
                                    .map((step: any, idx: number) => (
                                      <div
                                        key={`qa-step-${step.id || idx}`}
                                        className="flex items-start gap-2 rounded-md bg-white/[0.02] px-2 py-1.5 ring-1 ring-white/[0.06]"
                                      >
                                        <span
                                          className={`mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                            step.priority === "high"
                                              ? "bg-rose-500/10 text-rose-300"
                                              : step.priority === "medium"
                                                ? "bg-amber-500/10 text-amber-300"
                                                : "bg-emerald-500/10 text-emerald-300"
                                          }`}
                                        >
                                          {String(
                                            step.priority || "low",
                                          ).toUpperCase()}
                                        </span>
                                        <p className="text-[11px] text-[#A1A1AA] flex-1">
                                          {step.title}
                                        </p>
                                        {canManageAnnotations && (
                                          <button
                                            onClick={() =>
                                              handleCreateQaTask(
                                                step.title,
                                                `checklist-${step.id || idx}`,
                                              )
                                            }
                                            disabled={
                                              creatingQaTaskKey ===
                                              `checklist-${step.id || idx}`
                                            }
                                            className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ${
                                              creatingQaTaskKey ===
                                              `checklist-${step.id || idx}`
                                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                                : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                                            }`}
                                          >
                                            Task
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}

                            {assetQaGuidance?.deep_analysis && (
                              <div className="mt-2 rounded-md bg-white/[0.02] p-2.5 ring-1 ring-white/[0.06]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                                    Profile{" "}
                                    {String(
                                      assetQaGuidance.deep_analysis.profile ||
                                        qaProfile,
                                    ).toUpperCase()}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                      assetQaGuidance.deep_analysis
                                        .import_risk_band === "high"
                                        ? "bg-rose-500/10 text-rose-300"
                                        : assetQaGuidance.deep_analysis
                                              .import_risk_band === "medium"
                                          ? "bg-amber-500/10 text-amber-300"
                                          : "bg-emerald-500/10 text-emerald-300"
                                    }`}
                                  >
                                    Import Risk{" "}
                                    {
                                      assetQaGuidance.deep_analysis
                                        .import_risk_score
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2 text-[10px] text-[#71717A]">
                                  <span>
                                    Pass{" "}
                                    {assetQaGuidance.deep_analysis.health
                                      ?.pass ?? 0}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Fail{" "}
                                    {assetQaGuidance.deep_analysis.health
                                      ?.fail ?? 0}
                                  </span>
                                </div>
                                {Array.isArray(
                                  assetQaGuidance.deep_analysis.checks,
                                ) &&
                                  assetQaGuidance.deep_analysis.checks.length >
                                    0 && (
                                    <div className="space-y-1">
                                      {assetQaGuidance.deep_analysis.checks
                                        .slice(0, 6)
                                        .map((c: any, idx: number) => (
                                          <div
                                            key={`deep-check-${c.key || idx}`}
                                            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-[10px]"
                                          >
                                            <span className="text-[#A1A1AA] truncate">
                                              {c.label}
                                            </span>
                                            <span className="text-[#71717A] font-mono">
                                              actual{" "}
                                              {formatTechValue(c.actual, c.key)}
                                            </span>
                                            <span
                                              className={`font-medium ${c.status === "pass" ? "text-emerald-300" : "text-rose-300"}`}
                                            >
                                              {c.status === "pass"
                                                ? "PASS"
                                                : "FAIL"}{" "}
                                              /{" "}
                                              {formatTechValue(c.limit, c.key)}
                                            </span>
                                            {canManageAnnotations &&
                                            c.status === "fail" ? (
                                              <button
                                                onClick={() =>
                                                  handleCreateQaTask(
                                                    `${c.label}: actual ${formatTechValue(c.actual, c.key)} / target ${formatTechValue(c.limit, c.key)}`,
                                                    `deep-${c.key || idx}`,
                                                  )
                                                }
                                                disabled={
                                                  creatingQaTaskKey ===
                                                  `deep-${c.key || idx}`
                                                }
                                                className={`justify-self-end px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ${
                                                  creatingQaTaskKey ===
                                                  `deep-${c.key || idx}`
                                                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                                    : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                                                }`}
                                              >
                                                Fix Task
                                              </button>
                                            ) : (
                                              <span />
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                            )}

                            {(qaTaskLoading ||
                              qaTasks.length > 0 ||
                              canManageAnnotations) && (
                              <div className="mt-2 rounded-md bg-white/[0.02] p-2.5 ring-1 ring-white/[0.06]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                                    Tech Task Board
                                  </span>
                                  <span className="text-[10px] text-[#52525B]">
                                    {qaTasks.length} tasks
                                  </span>
                                </div>
                                {qaTaskLoading ? (
                                  <div className="space-y-1.5">
                                    <div className="skeleton h-3 w-full rounded" />
                                    <div className="skeleton h-3 w-4/5 rounded" />
                                  </div>
                                ) : qaTasks.length === 0 ? (
                                  <p className="text-[11px] text-[#52525B]">
                                    No tech tasks yet. Create from checklist or
                                    failed checks.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                    {(
                                      [
                                        { key: "open", label: "Open" },
                                        {
                                          key: "in_progress",
                                          label: "In Progress",
                                        },
                                        { key: "done", label: "Done" },
                                      ] as const
                                    ).map((col) => {
                                      const items = qaTasks.filter(
                                        (t: any) => t.status === col.key,
                                      );
                                      return (
                                        <div
                                          key={`task-col-${col.key}`}
                                          className="rounded border border-[#27272A] bg-[#0A0A0A] p-2"
                                        >
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">
                                              {col.label}
                                            </span>
                                            <span className="text-[10px] text-[#52525B]">
                                              {items.length}
                                            </span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {items.length === 0 ? (
                                              <p className="text-[10px] text-[#3F3F46]">
                                                No items
                                              </p>
                                            ) : (
                                              items
                                                .slice(0, 4)
                                                .map((task: any) => (
                                                  <div
                                                    key={`task-${task.id}`}
                                                    className="rounded border border-white/[0.08] bg-white/[0.02] p-1.5"
                                                  >
                                                    <p className="text-[10px] text-[#EDEDED] leading-relaxed">
                                                      {task.text}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1">
                                                      <span className="text-[9px] text-[#52525B]">
                                                        {timeAgo(
                                                          task.created_at,
                                                        )}
                                                      </span>
                                                      <div className="flex items-center gap-1">
                                                        {col.key !== "open" && (
                                                          <button
                                                            onClick={() =>
                                                              handleUpdateQaTaskStatus(
                                                                task,
                                                                "open",
                                                              )
                                                            }
                                                            disabled={
                                                              updatingQaTaskId ===
                                                              task.id
                                                            }
                                                            className="px-1 py-0.5 rounded text-[9px] bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500/20 disabled:opacity-50"
                                                          >
                                                            Open
                                                          </button>
                                                        )}
                                                        {col.key !==
                                                          "in_progress" && (
                                                          <button
                                                            onClick={() =>
                                                              handleUpdateQaTaskStatus(
                                                                task,
                                                                "in_progress",
                                                              )
                                                            }
                                                            disabled={
                                                              updatingQaTaskId ===
                                                              task.id
                                                            }
                                                            className="px-1 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                                                          >
                                                            WIP
                                                          </button>
                                                        )}
                                                        {col.key !== "done" && (
                                                          <button
                                                            onClick={() =>
                                                              handleUpdateQaTaskStatus(
                                                                task,
                                                                "done",
                                                              )
                                                            }
                                                            disabled={
                                                              updatingQaTaskId ===
                                                              task.id
                                                            }
                                                            className="px-1 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                                                          >
                                                            Done
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(assetMeta.metadata)
                        .filter(
                          ([k]) => !["type", "format", "error"].includes(k),
                        )
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E]/50"
                          >
                            <span className="text-[10px] font-medium text-[#52525B] uppercase tracking-wider">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs font-mono text-[#EDEDED]">
                              {typeof value === "boolean"
                                ? value
                                  ? "✓"
                                  : "✗"
                                : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Violations */}
                    {assetMeta.violations &&
                      assetMeta.violations.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-rose-400"
                              strokeWidth={1.5}
                            />
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-400">
                              Rule Violations
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {assetMeta.violations.map((v: any, i: number) => (
                              <div
                                key={i}
                                className={`px-3 py-2 rounded-lg text-xs ${
                                  v.severity === "error"
                                    ? "bg-rose-500/5 text-rose-300 ring-1 ring-rose-500/10"
                                    : "bg-amber-500/5 text-amber-300 ring-1 ring-amber-500/10"
                                }`}
                              >
                                {v.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Review Timeline */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Activity
                            className="w-3.5 h-3.5 text-[#71717A]"
                            strokeWidth={1.5}
                          />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">
                            Review Timeline
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(
                            [
                              "all",
                              "ownership",
                              "escalation",
                              "routing",
                              "decision",
                            ] as const
                          ).map((f) => (
                            <button
                              key={`rh-${f}`}
                              onClick={() => setReviewHistoryFilter(f)}
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                reviewHistoryFilter === f
                                  ? "bg-white/[0.08] text-[#EDEDED]"
                                  : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                              }`}
                            >
                              {f === "all" ? "All" : f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {filteredReviewHistory.length === 0 ? (
                          <div className="px-3 py-2 rounded-lg text-xs bg-white/[0.02] text-[#52525B] ring-1 ring-white/[0.06]">
                            No events for this filter.
                          </div>
                        ) : (
                          filteredReviewHistory.slice(0, 10).map((ev: any) => {
                            const badge = reviewActionBadge(ev.action);
                            const meta = ev.metadata || {};
                            const rerouteNote = meta.auto_rerouted
                              ? `Rerouted to ${meta.target_reviewer || "suggested reviewer"}`
                              : "";
                            return (
                              <div
                                key={ev.id}
                                className="px-3 py-2 rounded-lg text-xs bg-white/[0.02] ring-1 ring-white/[0.06]"
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${badge.cls}`}
                                  >
                                    {badge.label}
                                  </span>
                                  <span className="text-[10px] text-[#52525B]">
                                    {timeAgo(ev.created_at)}
                                  </span>
                                </div>
                                <p className="text-[#A1A1AA]">
                                  <span className="text-[#EDEDED] font-medium">
                                    {ev.user_name || "System"}
                                  </span>{" "}
                                  {activityVerb(ev.action)}{" "}
                                  <span className="text-[#71717A]">
                                    {meta?.filename || inspectAsset?.filename}
                                  </span>
                                </p>
                                {(meta.assignee_name ||
                                  meta.target_reviewer ||
                                  meta.due_at ||
                                  rerouteNote) && (
                                  <p className="text-[10px] text-[#52525B] mt-0.5">
                                    {meta.assignee_name
                                      ? `Owner: ${meta.assignee_name}`
                                      : ""}
                                    {meta.target_reviewer
                                      ? `${meta.assignee_name ? " · " : ""}Target: ${meta.target_reviewer}`
                                      : ""}
                                    {meta.due_at
                                      ? `${meta.assignee_name || meta.target_reviewer ? " · " : ""}Due: ${dueLabel(meta.due_at)}`
                                      : ""}
                                    {rerouteNote
                                      ? `${meta.assignee_name || meta.target_reviewer || meta.due_at ? " · " : ""}${rerouteNote}`
                                      : ""}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info
                      className="w-6 h-6 text-[#27272A] mb-2"
                      strokeWidth={1}
                    />
                    <p className="text-xs text-[#52525B]">
                      No metadata available
                    </p>
                    <p className="text-[10px] text-[#3F3F46] mt-1">
                      Upload a new version to extract metadata
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

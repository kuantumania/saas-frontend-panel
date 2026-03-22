"use client";

import { Folder, Lock, Package } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/DashboardShared";
import { fileIcon, formatSize, timeAgo } from "@/lib/utils/dashboard";

interface DashboardLeadLibrarySectionProps {
  ctx: any;
}

export default function DashboardLeadLibrarySection({
  ctx,
}: DashboardLeadLibrarySectionProps) {
  const {
    libraryPagination,
    libFilter,
    setLibFilter,
    setLibPage,
    loading,
    libraryAssets,
    openInspector,
  } = ctx;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
            Asset Library
          </h2>
          <span className="text-xs text-[#52525B]">
            {libraryPagination.total}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-4">
        {["all", "staging", "in_review", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setLibFilter(f);
              setLibPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              libFilter === f
                ? "bg-white/[0.08] text-[#EDEDED]"
                : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "in_review"
                ? "Review"
                : f.charAt(0).toUpperCase() + f.slice(1)}
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0"
              >
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
            <p className="text-sm font-medium text-[#52525B]">
              No assets found
            </p>
            <p className="text-xs text-[#3F3F46] mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div>
            {libraryAssets.map((a: any) => {
              const ext = (a.filename || "").split(".").pop()?.toLowerCase();
              const isImg = [
                "png",
                "jpg",
                "jpeg",
                "gif",
                "webp",
                "svg",
              ].includes(ext || "");
              const rowLock = a?.metadata?.lock_intent;
              const rowLocked = Boolean(rowLock?.locked);
              return (
                <div
                  key={a.id}
                  onClick={() => openInspector(a)}
                  className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center flex-shrink-0">
                    {isImg && a.preview_url ? (
                      <img
                        src={a.preview_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#3F3F46]">
                        {fileIcon(a.file_type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center min-w-0">
                    <p className="text-sm font-medium text-[#EDEDED] truncate">
                      {a.filename}
                    </p>
                    {rowLocked && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
                        <Lock className="w-2.5 h-2.5" strokeWidth={1.8} />
                        {rowLock?.user_name
                          ? `Locked by ${rowLock.user_name}`
                          : "Locked"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-[#52525B] truncate">
                      {a.uploader_name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-[#52525B] font-mono">
                      {formatSize(a.file_size_kb)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] text-[#3F3F46]">
                      {a.created_at ? timeAgo(a.created_at) : ""}
                    </span>
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
              onClick={() => setLibPage((p: number) => Math.max(1, p - 1))}
              className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-[10px] text-[#3F3F46] font-mono">
              {libraryPagination.page} / {libraryPagination.total_pages}
            </span>
            <button
              disabled={!libraryPagination.has_next}
              onClick={() => setLibPage((p: number) => p + 1)}
              className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

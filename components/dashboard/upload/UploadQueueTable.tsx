"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Shield, X } from "lucide-react";
import { CATEGORIES, type QueuedFile } from "@/components/dashboard/upload/types";
import { fileIcon, formatBytes } from "@/components/dashboard/upload/helpers";

type UploadQueueTableProps = {
  queue: QueuedFile[];
  onUpdateCategory: (id: string, category: string) => void;
  onRemoveFile: (id: string) => void;
  onForceUpload: (id: string) => void;
  successCount: number;
  failedCount: number;
  warningCount: number;
};

export default function UploadQueueTable({
  queue,
  onUpdateCategory,
  onRemoveFile,
  onForceUpload,
  successCount,
  failedCount,
  warningCount,
}: UploadQueueTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden"
    >
      <div className="grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A]">
        <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider">File</span>
        <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider">Category</span>
        <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider text-right">Size</span>
        <span className="text-[9px] text-[#3F3F46] font-medium uppercase tracking-wider text-center">Status</span>
        <span />
      </div>

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
              <div className="grid grid-cols-[1fr_120px_100px_80px_40px] gap-2 px-5 py-3 items-center">
                <div className="flex items-center gap-2.5 min-w-0">
                  {fileIcon(item.name)}
                  <span className="text-xs text-[#EDEDED] truncate">{item.name}</span>
                </div>

                <select
                  value={item.category}
                  onChange={(e) => onUpdateCategory(item.id, e.target.value)}
                  disabled={item.status !== "queued"}
                  className={[
                    "px-2 py-1 rounded-md bg-[#0A0A0A] border border-[#1E1E1E]",
                    "text-[10px] text-[#A1A1AA] focus:border-[#3F3F46]",
                    "focus:ring-0 focus:outline-none appearance-none disabled:opacity-50",
                  ].join(" ")}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <span className="text-[10px] text-[#52525B] text-right">{formatBytes(item.size)}</span>

                <div className="flex justify-center">
                  {item.status === "queued" && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#27272A]/50 text-[#71717A]">
                      Queued
                    </span>
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

                <div className="flex justify-center">
                  {(item.status === "queued" ||
                    item.status === "failed" ||
                    item.status === "warning") && (
                    <button
                      onClick={() => onRemoveFile(item.id)}
                      className="text-[#3F3F46] hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

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

              {(item.status === "failed" || item.status === "warning") && item.error && (
                <div className="px-5 pb-3">
                  <div
                    className={`px-3 py-2 rounded-lg text-[10px] ${
                      item.status === "warning"
                        ? "bg-amber-500/5 border border-amber-500/15 text-amber-400"
                        : "bg-rose-500/5 border border-rose-500/15 text-rose-400"
                    }`}
                  >
                    <p className="mb-1">{item.error}</p>
                    {item.violations && item.violations.length > 0 && (
                      <ul className="space-y-0.5 mt-1.5">
                        {item.violations.map((violation: any, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[8px] mt-0.5">&#9679;</span>
                            <span>
                              {violation.message || violation.rule || JSON.stringify(violation)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.status === "warning" && (
                      <button
                        onClick={() => onForceUpload(item.id)}
                        className={[
                          "mt-2 px-3 py-1 rounded-md bg-amber-500/10 border",
                          "border-amber-500/20 text-amber-300 hover:bg-amber-500/20",
                          "transition-colors text-[10px] font-medium",
                        ].join(" ")}
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
  );
}

"use client";

import type { RefObject } from "react";
import {
  CheckCircle2,
  Clock,
  Folder,
  Layers,
  Package,
  Upload,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/DashboardShared";
import { fileIcon, formatSize, timeAgo } from "@/lib/utils/dashboard";

interface DashboardMemberContentProps {
  memberName: string;
  sessionUser: any;
  studio: { slug?: string };
  memberAssets: any[];
  isDraggingUpload: boolean;
  isUploading: boolean;
  memberUploadInputRef: RefObject<HTMLInputElement | null>;
  setIsDraggingUpload: (value: boolean) => void;
  handleMemberUploadFile: (file: File) => Promise<void>;
  openInspector: (asset: any) => Promise<void>;
  handleMemberSubmitReview: (asset: any) => Promise<void>;
}

export default function DashboardMemberContent({
  memberName,
  sessionUser,
  studio,
  memberAssets,
  isDraggingUpload,
  isUploading,
  memberUploadInputRef,
  setIsDraggingUpload,
  handleMemberUploadFile,
  openInspector,
  handleMemberSubmitReview,
}: DashboardMemberContentProps) {
  return (
    <>
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#EDEDED] mb-1">
              Welcome back, {memberName || "Member"}
            </h1>
            <p className="text-xs text-[#52525B]">
              {(sessionUser?.role || "member").replace(/_/g, " ")} &middot;{" "}
              {studio.slug || sessionUser?.workspace || "Studio"}
            </p>
          </div>
          <a
            href="/dashboard/upload"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2} />
            Upload Assets
          </a>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-3 mb-8 stagger">
        {[
          {
            label: "My Uploads",
            value: memberAssets.length,
            icon: Package,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "In Review",
            value: memberAssets.filter((a: any) => a.status === "in_review")
              .length,
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Approved",
            value: memberAssets.filter((a: any) => a.status === "approved")
              .length,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Staging",
            value: memberAssets.filter((a: any) => a.status === "staging")
              .length,
            icon: Layers,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4 hover:border-[#27272A] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
                {label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#EDEDED]">
              {value}
            </span>
          </div>
        ))}
      </section>

      <section className="mb-8">
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
            if (file) {
              void handleMemberUploadFile(file);
            }
          }}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            isDraggingUpload
              ? "border-blue-500 bg-blue-500/5 scale-[1.005]"
              : "border-[#27272A] bg-[#121212] hover:border-[#3F3F46] hover:bg-[#141414]"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-colors ${
              isDraggingUpload ? "bg-blue-500/10" : "bg-white/[0.04]"
            }`}
          >
            <Upload
              className={`w-5 h-5 transition-colors ${isDraggingUpload ? "text-blue-400" : "text-[#52525B]"}`}
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-medium text-[#A1A1AA] mb-1">
            {isDraggingUpload ? "Drop to upload" : "Quick Upload"}
          </p>
          <p className="text-xs text-[#52525B] mb-3">
            Drag & drop a file or click to browse
          </p>
          <button
            onClick={() => memberUploadInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Uploading..." : "Choose File"}
          </button>
          <input
            ref={memberUploadInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleMemberUploadFile(file);
              }
              e.currentTarget.value = "";
            }}
          />
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              My Uploads
            </h2>
            {memberAssets.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                {memberAssets.length}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A] text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
            <span />
            <span>Name</span>
            <span>Size</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {memberAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-[#27272A]" strokeWidth={1} />
              </div>
              <p className="text-sm font-medium text-[#52525B]">
                No uploads yet
              </p>
              <p className="text-xs text-[#3F3F46] mt-1">
                Upload your first asset using the drop zone above
              </p>
            </div>
          ) : (
            memberAssets.map((a: any) => {
              const ext = (a.filename || "").split(".").pop()?.toLowerCase();
              const isImg = [
                "png",
                "jpg",
                "jpeg",
                "gif",
                "webp",
                "svg",
              ].includes(ext || "");
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-5 py-3 border-b border-[#1E1E1E]/50 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center">
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
                  <button
                    onClick={() => {
                      void openInspector(a);
                    }}
                    className="text-left min-w-0"
                  >
                    <p className="text-sm font-medium text-[#EDEDED] truncate">
                      {a.filename}
                    </p>
                    <p className="text-[10px] text-[#52525B]">
                      {a.created_at ? timeAgo(a.created_at) : ""}
                    </p>
                  </button>
                  <span className="text-xs text-[#71717A] font-mono">
                    {formatSize(a.file_size_kb)}
                  </span>
                  <StatusBadge status={a.status} />
                  {a.status === "staging" ? (
                    <button
                      onClick={() => {
                        void handleMemberSubmitReview(a);
                      }}
                      className="justify-self-start px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
                    >
                      Submit Review
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#52525B]">
                      {a.status === "in_review" ? "Waiting lead" : "—"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

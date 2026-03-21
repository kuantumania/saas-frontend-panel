"use client";

import { Folder, Loader2, Upload } from "lucide-react";

type UploadOptionsBarProps = {
  folders: any[];
  selectedFolder: string;
  onSelectedFolderChange: (value: string) => void;
  autoSubmit: boolean;
  onToggleAutoSubmit: () => void;
  onClearAll: () => void;
  onUploadAll: () => void;
  uploading: boolean;
  pendingCount: number;
};

export default function UploadOptionsBar({
  folders,
  selectedFolder,
  onSelectedFolderChange,
  autoSubmit,
  onToggleAutoSubmit,
  onClearAll,
  onUploadAll,
  uploading,
  pendingCount,
}: UploadOptionsBarProps) {
  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-2">
        <Folder className="w-3.5 h-3.5 text-[#52525B]" />
        <select
          value={selectedFolder}
          onChange={(e) => onSelectedFolderChange(e.target.value)}
          className={[
            "px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#27272A]",
            "text-xs text-[#EDEDED] focus:border-[#3F3F46]",
            "focus:ring-0 focus:outline-none appearance-none pr-7",
          ].join(" ")}
        >
          <option value="">Root folder</option>
          {folders.map((folder: any) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onToggleAutoSubmit}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#27272A] text-xs transition-colors hover:border-[#3F3F46]"
      >
        <div
          className={`w-7 h-4 rounded-full relative transition-colors ${
            autoSubmit ? "bg-blue-600" : "bg-[#27272A]"
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
              autoSubmit ? "left-3.5" : "left-0.5"
            }`}
          />
        </div>
        <span className="text-[#A1A1AA]">Auto-submit for review</span>
      </button>

      <div className="flex-1" />

      <button
        onClick={onClearAll}
        className="px-3 py-1.5 rounded-lg text-[10px] text-[#52525B] hover:text-rose-400 transition-colors"
      >
        Clear All
      </button>

      <button
        onClick={onUploadAll}
        disabled={uploading || pendingCount === 0}
        className={[
          "flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600",
          "text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40",
          "disabled:cursor-not-allowed transition-colors",
        ].join(" ")}
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            Upload {pendingCount > 0 ? `(${pendingCount})` : "All"}
          </>
        )}
      </button>
    </div>
  );
}

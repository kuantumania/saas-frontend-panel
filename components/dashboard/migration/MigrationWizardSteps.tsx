"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Folder,
  HardDrive,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { fileIcon, formatBytes, isAssetFile } from "@/components/dashboard/migration/helpers";
import type {
  BreadcrumbItem,
  CloudFile,
  ImportResult,
  Source,
  Step,
} from "@/components/dashboard/migration/types";

const STEP_ANIMATION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

type HeaderProps = {
  step: Step;
};

export function MigrationHeader({ step }: HeaderProps) {
  return (
    <div className="border-b border-[#1E1E1E] bg-[#0A0A0A]/50">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Migration Wizard</h1>
          <p className="text-[10px] text-[#52525B]">
            Import assets from cloud storage into your workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Source" },
            { n: 2, label: "Select Files" },
            { n: 3, label: "Import" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-8 h-px ${step >= n ? "bg-blue-500" : "bg-[#27272A]"}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                    step > n
                      ? "bg-emerald-500/20 text-emerald-400"
                      : step === n
                        ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40"
                        : "bg-[#1E1E1E] text-[#52525B]"
                  }`}
                >
                  {step > n ? <Check className="w-3 h-3" /> : n}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    step >= n ? "text-[#A1A1AA]" : "text-[#3F3F46]"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type SourceStepProps = {
  source: Source;
  oauthToken: string;
  onSelectSource: (source: Exclude<Source, null>) => void;
  onOauthTokenChange: (value: string) => void;
  onConnect: () => void;
};

export function MigrationSourceStep({
  source,
  oauthToken,
  onSelectSource,
  onOauthTokenChange,
  onConnect,
}: SourceStepProps) {
  return (
    <motion.div key="step1" {...STEP_ANIMATION}>
      <h2 className="text-lg font-semibold mb-1">Choose Import Source</h2>
      <p className="text-xs text-[#52525B] mb-8">
        Select where your assets are stored. We'll connect securely and let you browse files.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onSelectSource("google_drive")}
          className={`group relative rounded-xl border p-6 text-left transition-all ${
            source === "google_drive"
              ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
              : "border-[#1E1E1E] bg-[#121212] hover:border-[#27272A] hover:bg-[#141414]"
          }`}
        >
          {source === "google_drive" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#27272A] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d={[
                    "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06",
                    "-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                  ].join(" ")}
                  fill="#34A853"
                />
                <path
                  d={[
                    "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07",
                    "H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                  ].join(" ")}
                  fill="#FBBC05"
                />
                <path
                  d={[
                    "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1",
                    "7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                  ].join(" ")}
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Google Drive</h3>
              <p className="text-[10px] text-[#52525B]">Import from Google Workspace</p>
            </div>
          </div>
          <p className="text-[10px] text-[#3F3F46] leading-relaxed">
            Connect your Google account to browse and import assets directly from Drive.
            Supports shared drives and team folders.
          </p>
        </button>

        <button
          onClick={() => onSelectSource("dropbox")}
          className={`group relative rounded-xl border p-6 text-left transition-all ${
            source === "dropbox"
              ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
              : "border-[#1E1E1E] bg-[#121212] hover:border-[#27272A] hover:bg-[#141414]"
          }`}
        >
          {source === "dropbox" && (
            <div className="absolute top-3 right-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] border border-[#27272A] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7.004 2L1 6.391l4.996 3.997L12 6.394 7.004 2z" fill="#0061FF" />
                <path d="M1 14.385l6.004 4.391L12 14.782l-6.004-3.994L1 14.385z" fill="#0061FF" />
                <path d="M12 14.782l4.996 3.994L23 14.385l-5.004-3.597L12 14.782z" fill="#0061FF" />
                <path d="M23 6.391L16.996 2 12 6.394l6.004 3.994L23 6.391z" fill="#0061FF" />
                <path
                  d="M12.012 15.616l-5.008 3.973-2.004-1.308v1.464l7.012 4.21 7.012-4.21v-1.464l-2.004 1.308-5.008-3.973z"
                  fill="#0061FF"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Dropbox</h3>
              <p className="text-[10px] text-[#52525B]">Import from Dropbox storage</p>
            </div>
          </div>
          <p className="text-[10px] text-[#3F3F46] leading-relaxed">
            Connect your Dropbox account to browse and import assets.
            Supports personal and business accounts.
          </p>
        </button>
      </div>

      {source && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5 mb-6">
            <h3 className="text-xs font-semibold mb-1">Connect Account</h3>
            <p className="text-[10px] text-[#52525B] mb-4">
              {source === "google_drive"
                ? "Enter your Google OAuth access token or click Connect to authenticate."
                : "Enter your Dropbox OAuth access token or click Connect to authenticate."}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={oauthToken}
                onChange={(e) => onOauthTokenChange(e.target.value)}
                placeholder="Paste access token..."
                className={[
                  "flex-1 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#27272A]",
                  "text-xs text-[#EDEDED] placeholder:text-[#3F3F46]",
                  "focus:border-[#3F3F46] focus:ring-0 focus:outline-none",
                ].join(" ")}
              />
              <button
                onClick={onConnect}
                disabled={!oauthToken}
                className={[
                  "px-4 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white",
                  "hover:bg-blue-500 disabled:opacity-40",
                  "disabled:cursor-not-allowed transition-colors",
                ].join(" ")}
              >
                Connect & Browse
              </button>
            </div>
            <p className="text-[9px] text-[#3F3F46] mt-2">
              Tip: In production, this uses OAuth popup flow. For testing, paste a valid access token.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

type SelectFilesStepProps = {
  source: Source;
  selectedIds: Set<string>;
  totalSize: number;
  breadcrumb: BreadcrumbItem[];
  searchQuery: string;
  loadingFiles: boolean;
  filteredFiles: CloudFile[];
  onSearchQueryChange: (value: string) => void;
  onResetSource: () => void;
  onNavigateBreadcrumb: (index: number) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  onNavigateToFolder: (file: CloudFile) => void;
  onToggleSelection: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function MigrationSelectFilesStep({
  source,
  selectedIds,
  totalSize,
  breadcrumb,
  searchQuery,
  loadingFiles,
  filteredFiles,
  onSearchQueryChange,
  onResetSource,
  onNavigateBreadcrumb,
  onSelectAll,
  onRefresh,
  onNavigateToFolder,
  onToggleSelection,
  onBack,
  onNext,
}: SelectFilesStepProps) {
  return (
    <motion.div key="step2" {...STEP_ANIMATION}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Select Files</h2>
          <p className="text-xs text-[#52525B]">
            Browse your {source === "google_drive" ? "Google Drive" : "Dropbox"} and select files to
            import.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#52525B]">
            {selectedIds.size} file{selectedIds.size !== 1 ? "s" : ""} selected
            {totalSize > 0 && ` (${formatBytes(totalSize)})`}
          </span>
          <button
            onClick={onResetSource}
            className={[
              "px-3 py-1.5 rounded-lg border border-[#27272A]",
              "text-xs text-[#71717A] hover:text-white",
              "hover:border-[#3F3F46] transition-colors",
            ].join(" ")}
          >
            Change Source
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 text-[10px]">
        <button
          onClick={() => onNavigateBreadcrumb(-1)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          <HardDrive className="w-3 h-3 inline mr-1" />
          Root
        </button>
        {breadcrumb.map((crumb, i) => (
          <div key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-[#3F3F46]" />
            <button
              onClick={() => onNavigateBreadcrumb(i)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Filter files..."
            className={[
              "w-full pl-9 pr-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#27272A]",
              "text-xs text-[#EDEDED] placeholder:text-[#3F3F46]",
              "focus:border-[#3F3F46] focus:ring-0 focus:outline-none",
            ].join(" ")}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3 h-3 text-[#52525B] hover:text-white" />
            </button>
          )}
        </div>
        <button
          onClick={onSelectAll}
          className={[
            "px-3 py-2 rounded-lg border border-[#27272A]",
            "text-[10px] text-[#71717A] hover:text-white",
            "hover:border-[#3F3F46] transition-colors whitespace-nowrap",
          ].join(" ")}
        >
          Select All Assets
        </button>
        <button
          onClick={onRefresh}
          className={[
            "px-3 py-2 rounded-lg border border-[#27272A]",
            "text-[10px] text-[#71717A] hover:text-white",
            "hover:border-[#3F3F46] transition-colors",
          ].join(" ")}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden mb-6">
        <div className="grid grid-cols-[40px_1fr_120px_120px] gap-2 px-4 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A]">
          <span className="text-[9px] text-[#52525B] font-medium uppercase" />
          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-wider">Name</span>
          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-wider text-right">
            Size
          </span>
          <span className="text-[9px] text-[#52525B] font-medium uppercase tracking-wider text-right">
            Modified
          </span>
        </div>

        {loadingFiles ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="ml-2 text-xs text-[#52525B]">Loading files...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Folder className="w-8 h-8 text-[#27272A] mb-2" />
            <span className="text-xs text-[#3F3F46]">
              {searchQuery ? "No files match your search" : "This folder is empty"}
            </span>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const selectable = !file.isFolder && isAssetFile(file.name);
              const selected = selectedIds.has(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    if (file.isFolder) onNavigateToFolder(file);
                    else if (selectable) onToggleSelection(file.id);
                  }}
                  className={[
                    "grid grid-cols-[40px_1fr_120px_120px] gap-2 px-4 py-2.5 border-b",
                    "border-[#1E1E1E]/50 cursor-pointer transition-colors",
                    selected
                      ? "bg-blue-500/5"
                      : file.isFolder
                        ? "hover:bg-white/[0.02]"
                        : selectable
                          ? "hover:bg-white/[0.02]"
                          : "opacity-40 cursor-not-allowed",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-center">
                    {selectable ? (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-blue-600 border-blue-600"
                            : "border-[#3F3F46] hover:border-[#52525B]"
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    ) : file.isFolder ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[#3F3F46]" />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {fileIcon(file.name, file.isFolder)}
                    <span className="text-xs text-[#EDEDED] truncate">{file.name}</span>
                  </div>

                  <span className="text-[10px] text-[#52525B] text-right self-center">
                    {file.isFolder ? "—" : formatBytes(file.size)}
                  </span>

                  <span className="text-[10px] text-[#52525B] text-right self-center">
                    {file.modifiedTime
                      ? new Date(file.modifiedTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={[
            "flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#27272A]",
            "text-xs text-[#71717A] hover:text-white",
            "hover:border-[#3F3F46] transition-colors",
          ].join(" ")}
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedIds.size === 0}
          className={[
            "flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600",
            "text-xs font-medium text-white hover:bg-blue-500",
            "disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
          ].join(" ")}
        >
          Review & Import <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

type ReviewStepProps = {
  source: Source;
  importDone: boolean;
  selectedIds: Set<string>;
  totalSize: number;
  targetFolderId: string;
  folders: any[];
  selectedFiles: CloudFile[];
  importing: boolean;
  importResults: ImportResult[];
  successCount: number;
  failedCount: number;
  onTargetFolderChange: (value: string) => void;
  onEditSelection: () => void;
  onRemoveSelection: (id: string) => void;
  onBack: () => void;
  onStartImport: () => void;
  onImportMore: () => void;
};

export function MigrationReviewImportStep({
  source,
  importDone,
  selectedIds,
  totalSize,
  targetFolderId,
  folders,
  selectedFiles,
  importing,
  importResults,
  successCount,
  failedCount,
  onTargetFolderChange,
  onEditSelection,
  onRemoveSelection,
  onBack,
  onStartImport,
  onImportMore,
}: ReviewStepProps) {
  return (
    <motion.div key="step3" {...STEP_ANIMATION}>
      {!importDone ? (
        <>
          <h2 className="text-lg font-semibold mb-1">Review & Import</h2>
          <p className="text-xs text-[#52525B] mb-8">
            Confirm your selection and choose a target folder. Files will be downloaded and uploaded to
            your workspace.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <p className="text-[10px] text-[#52525B] mb-1">Source</p>
              <p className="text-sm font-semibold">
                {source === "google_drive" ? "Google Drive" : "Dropbox"}
              </p>
            </div>
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <p className="text-[10px] text-[#52525B] mb-1">Files Selected</p>
              <p className="text-sm font-semibold">{selectedIds.size} files</p>
            </div>
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <p className="text-[10px] text-[#52525B] mb-1">Total Size</p>
              <p className="text-sm font-semibold">{formatBytes(totalSize)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5 mb-6">
            <h3 className="text-xs font-semibold mb-1">Target Folder</h3>
            <p className="text-[10px] text-[#52525B] mb-3">
              Choose where to store the imported assets in your workspace.
            </p>
            <select
              value={targetFolderId}
              onChange={(e) => onTargetFolderChange(e.target.value)}
              className={[
                "w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#27272A]",
                "text-xs text-[#EDEDED] focus:border-[#3F3F46]",
                "focus:ring-0 focus:outline-none appearance-none",
              ].join(" ")}
            >
              <option value="">Root (no folder)</option>
              {folders.map((folder: any) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden mb-6">
            <div className="px-4 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between">
              <span className="text-[10px] text-[#52525B] font-medium uppercase tracking-wider">
                Selected Files ({selectedIds.size})
              </span>
              <button
                onClick={onEditSelection}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Edit Selection
              </button>
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-2 border-b border-[#1E1E1E]/50"
                >
                  <div className="flex items-center gap-2">
                    {fileIcon(file.name, false)}
                    <span className="text-xs text-[#EDEDED]">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#52525B]">{formatBytes(file.size)}</span>
                    <button
                      onClick={() => onRemoveSelection(file.id)}
                      className="text-[#3F3F46] hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#27272A]",
                "text-xs text-[#71717A] hover:text-white",
                "hover:border-[#3F3F46] transition-colors",
              ].join(" ")}
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <button
              onClick={onStartImport}
              disabled={importing || selectedIds.size === 0}
              className={[
                "flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r",
                "from-blue-600 to-purple-600 text-xs font-semibold text-white",
                "hover:from-blue-500 hover:to-purple-500 disabled:opacity-40",
                "disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20",
              ].join(" ")}
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Start Import ({selectedIds.size} files)
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                failedCount === 0 ? "bg-emerald-500/10" : "bg-amber-500/10"
              }`}
            >
              {failedCount === 0 ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <h2 className="text-lg font-semibold mb-1">
              {failedCount === 0 ? "Import Complete!" : "Import Finished with Issues"}
            </h2>
            <p className="text-xs text-[#52525B]">
              {successCount} of {importResults.length} files imported successfully
              {failedCount > 0 && `. ${failedCount} failed.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
              <p className="text-[10px] text-emerald-400/60">Successful</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <p className="text-2xl font-bold text-rose-400">{failedCount}</p>
              <p className="text-[10px] text-rose-400/60">Failed</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden mb-6">
            <div className="px-4 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A]">
              <span className="text-[10px] text-[#52525B] font-medium uppercase tracking-wider">Results</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {importResults.map((result, i) => (
                <div
                  key={result.file_id || i}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]/50"
                >
                  <div className="flex items-center gap-2">
                    {result.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="text-xs text-[#EDEDED]">{result.name}</span>
                  </div>
                  {result.error && (
                    <span className="text-[10px] text-rose-400/70 max-w-[200px] truncate">
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onImportMore}
              className={[
                "px-4 py-2 rounded-lg border border-[#27272A]",
                "text-xs text-[#71717A] hover:text-white",
                "hover:border-[#3F3F46] transition-colors",
              ].join(" ")}
            >
              Import More
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </>
      )}
    </motion.div>
  );
}

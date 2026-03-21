"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import UploadDropZone from "@/components/dashboard/upload/UploadDropZone";
import UploadOptionsBar from "@/components/dashboard/upload/UploadOptionsBar";
import UploadQueueTable from "@/components/dashboard/upload/UploadQueueTable";
import SupportedFormatsGrid from "@/components/dashboard/upload/SupportedFormatsGrid";
import {
  createQueueId,
  formatBytes,
  guessCategory,
} from "@/components/dashboard/upload/helpers";
import type { QueuedFile } from "@/components/dashboard/upload/types";

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

  useEffect(() => {
    const sessionToken =
      localStorage.getItem("kuantum_token") ||
      localStorage.getItem("lead_session_token") ||
      "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const user = JSON.parse(localStorage.getItem("session_user") || "{}");
    const billing = JSON.parse(localStorage.getItem("kuantum_billing") || "{}");

    setToken(sessionToken);
    setWorkspace(studio?.slug || "default-studio");
    setUserCode(user?.name || user?.user_code || "Unknown");
    setUserRole(user?.role || "member");
    setIsEnterprise((billing?.plan || "").startsWith("enterprise"));

    if (!sessionToken) return;
    api
      .fetchFolders(sessionToken)
      .then((rows) => setFolders(Array.isArray(rows) ? rows : []))
      .catch(() => setFolders([]));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: QueuedFile[] = Array.from(files).map((file) => ({
      id: createQueueId(),
      file,
      name: file.name,
      size: file.size,
      category: guessCategory(file.name),
      status: "queued",
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const updateCategory = useCallback((id: string, category: string) => {
    setQueue((prev) => prev.map((file) => (file.id === id ? { ...file, category } : file)));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const uploadAll = useCallback(async () => {
    const pending = queue.filter((file) => file.status === "queued" || file.status === "failed");
    if (pending.length === 0 || !token) return;

    setUploading(true);

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((file) =>
          file.id === item.id ? { ...file, status: "uploading", progress: 30 } : file,
        ),
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
              prev.map((file) =>
                file.id === item.id
                  ? {
                      ...file,
                      status: "warning",
                      progress: 100,
                      error: result.error,
                      violations: result.violations,
                    }
                  : file,
              ),
            );
          } else {
            setQueue((prev) =>
              prev.map((file) =>
                file.id === item.id
                  ? { ...file, status: "failed", progress: 100, error: result.error }
                  : file,
              ),
            );
          }
          continue;
        }

        const s3Key = result.s3_key || result.asset?.s3_key;
        if (autoSubmit && s3Key) {
          await api.submitAssetForReview(token, s3Key).catch(() => {});
        }

        setQueue((prev) =>
          prev.map((file) =>
            file.id === item.id
              ? {
                  ...file,
                  status: "success",
                  progress: 100,
                  assetId: result.asset?.id,
                  s3Key,
                }
              : file,
          ),
        );
      } catch (error: any) {
        setQueue((prev) =>
          prev.map((file) =>
            file.id === item.id
              ? { ...file, status: "failed", progress: 100, error: error.message }
              : file,
          ),
        );
      }
    }

    setUploading(false);
  }, [autoSubmit, queue, selectedFolder, token, userCode, workspace]);

  const forceUpload = useCallback(
    async (id: string) => {
      const item = queue.find((file) => file.id === id);
      if (!item || !token) return;

      setQueue((prev) =>
        prev.map((file) =>
          file.id === id ? { ...file, status: "uploading", progress: 30 } : file,
        ),
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
            prev.map((file) =>
              file.id === id
                ? { ...file, status: "failed", progress: 100, error: result.error }
                : file,
            ),
          );
          return;
        }

        const s3Key = result.s3_key || result.asset?.s3_key;
        if (autoSubmit && s3Key) {
          await api.submitAssetForReview(token, s3Key).catch(() => {});
        }

        setQueue((prev) =>
          prev.map((file) =>
            file.id === id
              ? {
                  ...file,
                  status: "success",
                  progress: 100,
                  assetId: result.asset?.id,
                  s3Key,
                }
              : file,
          ),
        );
      } catch (error: any) {
        setQueue((prev) =>
          prev.map((file) =>
            file.id === id
              ? { ...file, status: "failed", progress: 100, error: error.message }
              : file,
          ),
        );
      }
    },
    [autoSubmit, queue, selectedFolder, token, userCode, workspace],
  );

  const totalFiles = queue.length;
  const successCount = queue.filter((file) => file.status === "success").length;
  const failedCount = queue.filter((file) => file.status === "failed").length;
  const warningCount = queue.filter((file) => file.status === "warning").length;
  const pendingCount = queue.filter((file) => file.status === "queued").length;
  const totalSize = queue.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav
        studioName={workspace || "Studio"}
        role={userRole}
        isEnterprise={isEnterprise}
        showSearch={false}
      />

      <div className="border-b border-[#1E1E1E] bg-[#0A0A0A]/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Upload Assets</h1>
            <p className="text-[10px] text-[#52525B]">
              Drag & drop files or browse to upload to your workspace
            </p>
          </div>
          {totalFiles > 0 && (
            <span className="text-[10px] text-[#52525B]">
              {totalFiles} file{totalFiles !== 1 ? "s" : ""} ({formatBytes(totalSize)})
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <UploadDropZone
          dragOver={dragOver}
          inputRef={inputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onOpenPicker={() => inputRef.current?.click()}
          onFilesSelected={addFiles}
        />

        {queue.length > 0 && (
          <UploadOptionsBar
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectedFolderChange={setSelectedFolder}
            autoSubmit={autoSubmit}
            onToggleAutoSubmit={() => setAutoSubmit((prev) => !prev)}
            onClearAll={() => setQueue([])}
            onUploadAll={uploadAll}
            uploading={uploading}
            pendingCount={pendingCount}
          />
        )}

        {queue.length > 0 ? (
          <UploadQueueTable
            queue={queue}
            onUpdateCategory={updateCategory}
            onRemoveFile={removeFile}
            onForceUpload={forceUpload}
            successCount={successCount}
            failedCount={failedCount}
            warningCount={warningCount}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-[#3F3F46]">
              No files queued. Drop files above or click to browse.
            </p>
          </div>
        )}

        <SupportedFormatsGrid />
      </div>
    </div>
  );
}

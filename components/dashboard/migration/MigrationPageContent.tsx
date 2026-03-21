"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { isAssetFile } from "@/components/dashboard/migration/helpers";
import {
  MigrationHeader,
  MigrationReviewImportStep,
  MigrationSelectFilesStep,
  MigrationSourceStep,
} from "@/components/dashboard/migration/MigrationWizardSteps";
import type {
  BreadcrumbItem,
  CloudFile,
  ImportResult,
  Source,
  Step,
} from "@/components/dashboard/migration/types";

export default function MigrationPage() {
  const [token, setToken] = useState("");
  const [studioName, setStudioName] = useState("Studio");

  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState<Source>(null);
  const [oauthToken, setOauthToken] = useState("");

  const [files, setFiles] = useState<CloudFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [folders, setFolders] = useState<any[]>([]);
  const [targetFolderId, setTargetFolderId] = useState("");

  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importDone, setImportDone] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem("kuantum_token") || "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");

    setToken(sessionToken);
    setStudioName(studio?.name || "Studio");

    if (!sessionToken) return;

    api
      .fetchFolders(sessionToken)
      .then((rows) => setFolders(Array.isArray(rows) ? rows : []))
      .catch(() => setFolders([]));
  }, []);

  const loadFiles = useCallback(
    async (folderId?: string) => {
      if (!oauthToken || !source) return;

      setLoadingFiles(true);
      try {
        let result: CloudFile[] = [];
        if (source === "google_drive") {
          result = await api.listDriveFiles(token, oauthToken, folderId || "root");
        } else {
          result = await api.listDropboxFiles(token, oauthToken, folderId || "");
        }
        setFiles(result);
      } catch {
        setFiles([]);
      }
      setLoadingFiles(false);
    },
    [oauthToken, source, token],
  );

  const navigateToFolder = useCallback(
    (file: CloudFile) => {
      setBreadcrumb((prev) => [...prev, { id: file.id, name: file.name }]);
      loadFiles(file.id);
    },
    [loadFiles],
  );

  const navigateBreadcrumb = useCallback(
    (index: number) => {
      if (index < 0) {
        setBreadcrumb([]);
        loadFiles();
        return;
      }

      const crumb = breadcrumb[index];
      setBreadcrumb((prev) => prev.slice(0, index + 1));
      loadFiles(crumb.id);
    },
    [breadcrumb, loadFiles],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const selectable = files.filter((file) => !file.isFolder && isAssetFile(file.name));

    if (selectable.every((file) => selectedIds.has(file.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectable.forEach((file) => next.delete(file.id));
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectable.forEach((file) => next.add(file.id));
      return next;
    });
  }, [files, selectedIds]);

  const connectSource = useCallback(() => {
    if (!oauthToken) return;

    setBreadcrumb([]);
    setFiles([]);
    setSelectedIds(new Set());
    setStep(2);
    loadFiles();
  }, [loadFiles, oauthToken]);

  const startImport = useCallback(async () => {
    if (!source || selectedIds.size === 0) return;

    setImporting(true);
    setImportResults([]);

    try {
      const result = await api.importFromCloud(token, {
        source,
        access_token: oauthToken,
        file_ids: Array.from(selectedIds),
        folder_id: targetFolderId || undefined,
      });

      if (result.error) {
        setImportResults([
          { file_id: "", name: "Import", status: "failed", error: result.error },
        ]);
      } else {
        setImportResults(result.results || []);
      }
    } catch (error: any) {
      setImportResults([
        { file_id: "", name: "Import", status: "failed", error: error.message },
      ]);
    }

    setImporting(false);
    setImportDone(true);
  }, [oauthToken, selectedIds, source, targetFolderId, token]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const selectedFiles = files.filter((file) => selectedIds.has(file.id));
  const totalSize = selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0);

  const successCount = importResults.filter((item) => item.status === "success").length;
  const failedCount = importResults.filter((item) => item.status === "failed").length;

  const currentFolderId =
    breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.id : undefined;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav
        studioName={studioName}
        role="lead"
        isEnterprise
        showSearch={false}
      />

      <MigrationHeader step={step} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <MigrationSourceStep
              source={source}
              oauthToken={oauthToken}
              onSelectSource={setSource}
              onOauthTokenChange={setOauthToken}
              onConnect={connectSource}
            />
          )}

          {step === 2 && (
            <MigrationSelectFilesStep
              source={source}
              selectedIds={selectedIds}
              totalSize={totalSize}
              breadcrumb={breadcrumb}
              searchQuery={searchQuery}
              loadingFiles={loadingFiles}
              filteredFiles={filteredFiles}
              onSearchQueryChange={setSearchQuery}
              onResetSource={() => {
                setStep(1);
                setFiles([]);
                setBreadcrumb([]);
              }}
              onNavigateBreadcrumb={navigateBreadcrumb}
              onSelectAll={selectAll}
              onRefresh={() => loadFiles(currentFolderId)}
              onNavigateToFolder={navigateToFolder}
              onToggleSelection={toggleSelection}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <MigrationReviewImportStep
              source={source}
              importDone={importDone}
              selectedIds={selectedIds}
              totalSize={totalSize}
              targetFolderId={targetFolderId}
              folders={folders}
              selectedFiles={selectedFiles}
              importing={importing}
              importResults={importResults}
              successCount={successCount}
              failedCount={failedCount}
              onTargetFolderChange={setTargetFolderId}
              onEditSelection={() => setStep(2)}
              onRemoveSelection={toggleSelection}
              onBack={() => setStep(2)}
              onStartImport={startImport}
              onImportMore={() => {
                setImportDone(false);
                setImportResults([]);
                setSelectedIds(new Set());
                setStep(1);
                setSource(null);
                setOauthToken("");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

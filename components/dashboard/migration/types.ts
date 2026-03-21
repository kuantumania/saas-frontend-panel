export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  isFolder: boolean;
  modifiedTime?: string;
}

export interface ImportResult {
  file_id: string;
  name: string;
  status: "success" | "failed";
  error?: string;
  asset_id?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export type Source = "google_drive" | "dropbox" | null;
export type Step = 1 | 2 | 3;

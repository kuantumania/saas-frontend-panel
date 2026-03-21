export interface QueuedFile {
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

export const CATEGORIES = [
  "3D Model",
  "Texture",
  "Material",
  "Audio",
  "Animation",
  "UI",
  "VFX",
  "Shader",
  "Prefab",
  "Scene",
  "Script",
  "General",
];

import { Box, FileText, Folder, Image, Volume2 } from "lucide-react";

const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "tga",
  "psd",
  "exr",
  "hdr",
];

const MODEL_EXTENSIONS = [
  "fbx",
  "obj",
  "gltf",
  "glb",
  "usd",
  "usda",
  "usdz",
  "blend",
  "ma",
  "mb",
  "max",
];

const AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "flac", "aiff"];

const SUPPORTED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...MODEL_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  "unity",
  "prefab",
  "asset",
  "mat",
  "shader",
  "anim",
  "controller",
  "cs",
  "hlsl",
  "cginc",
  "compute",
  "json",
  "xml",
  "yaml",
  "txt",
];

export function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fileIcon(name: string, isFolder: boolean) {
  if (isFolder) return <Folder className="w-4 h-4 text-blue-400" />;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return <Image className="w-4 h-4 text-emerald-400" />;
  }
  if (MODEL_EXTENSIONS.includes(ext)) {
    return <Box className="w-4 h-4 text-purple-400" />;
  }
  if (AUDIO_EXTENSIONS.includes(ext)) {
    return <Volume2 className="w-4 h-4 text-amber-400" />;
  }
  return <FileText className="w-4 h-4 text-zinc-400" />;
}

export function isAssetFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return SUPPORTED_EXTENSIONS.includes(ext);
}

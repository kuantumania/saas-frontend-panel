import { Box, FileText, Image, Volume2 } from "lucide-react";

let idCounter = 0;

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

const TEXTURE_EXTENSIONS = [
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

const MATERIAL_EXTENSIONS = ["mat", "sbsar", "sbs"];
const AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "flac", "aiff"];
const ANIMATION_EXTENSIONS = ["anim", "controller"];
const PREFAB_EXTENSIONS = ["prefab"];
const SCENE_EXTENSIONS = ["unity", "scene"];
const SHADER_EXTENSIONS = ["shader", "hlsl", "cginc", "compute"];
const SCRIPT_EXTENSIONS = ["cs"];
const VFX_EXTENSIONS = ["vfx", "particle"];

export function createQueueId() {
  idCounter += 1;
  return `f_${Date.now()}_${idCounter}`;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function guessCategory(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (MODEL_EXTENSIONS.includes(ext)) return "3D Model";
  if (TEXTURE_EXTENSIONS.includes(ext)) return "Texture";
  if (MATERIAL_EXTENSIONS.includes(ext)) return "Material";
  if (AUDIO_EXTENSIONS.includes(ext)) return "Audio";
  if (ANIMATION_EXTENSIONS.includes(ext)) return "Animation";
  if (PREFAB_EXTENSIONS.includes(ext)) return "Prefab";
  if (SCENE_EXTENSIONS.includes(ext)) return "Scene";
  if (SHADER_EXTENSIONS.includes(ext)) return "Shader";
  if (SCRIPT_EXTENSIONS.includes(ext)) return "Script";
  if (VFX_EXTENSIONS.includes(ext)) return "VFX";

  return "General";
}

export function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (TEXTURE_EXTENSIONS.includes(ext)) {
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

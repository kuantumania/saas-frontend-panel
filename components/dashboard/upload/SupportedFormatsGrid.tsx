"use client";

import { Box, FileText, Image, Volume2 } from "lucide-react";

type SupportedFormat = {
  label: string;
  formats: string;
  icon: typeof Box;
  color: string;
  bg: string;
};

const SUPPORTED_FORMATS: SupportedFormat[] = [
  {
    label: "3D Models",
    formats: "FBX, OBJ, GLTF, GLB, USD, Blend",
    icon: Box,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    label: "Textures",
    formats: "PNG, JPG, PSD, TGA, EXR, HDR",
    icon: Image,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Audio",
    formats: "WAV, MP3, OGG, FLAC, AIFF",
    icon: Volume2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    label: "Other",
    formats: "Prefab, Shader, Anim, Script",
    icon: FileText,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
];

export default function SupportedFormatsGrid() {
  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
      {SUPPORTED_FORMATS.map((category) => (
        <div
          key={category.label}
          className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-7 h-7 rounded-lg ${category.bg} flex items-center justify-center`}
            >
              <category.icon className={`w-3.5 h-3.5 ${category.color}`} />
            </div>
            <span className="text-xs font-medium text-[#EDEDED]">{category.label}</span>
          </div>
          <p className="text-[10px] text-[#52525B]">{category.formats}</p>
        </div>
      ))}
    </div>
  );
}

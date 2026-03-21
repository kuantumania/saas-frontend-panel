"use client";

import type { DragEvent, RefObject } from "react";
import { Upload } from "lucide-react";

type UploadDropZoneProps = {
  dragOver: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onOpenPicker: () => void;
  onFilesSelected: (files: FileList) => void;
};

export default function UploadDropZone({
  dragOver,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenPicker,
  onFilesSelected,
}: UploadDropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onOpenPicker}
      className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-8 ${
        dragOver
          ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
          : "border-[#27272A] bg-[#121212] hover:border-[#3F3F46] hover:bg-[#141414]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) onFilesSelected(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      <div
        className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
          dragOver ? "bg-blue-500/10" : "bg-white/[0.04]"
        }`}
      >
        <Upload
          className={`w-6 h-6 transition-colors ${
            dragOver ? "text-blue-400" : "text-[#52525B]"
          }`}
        />
      </div>

      <h2 className="text-sm font-semibold mb-1">
        {dragOver ? "Drop files here" : "Drag & drop files"}
      </h2>
      <p className="text-xs text-[#52525B] mb-4">
        or <span className="text-blue-400 hover:text-blue-300">browse from your computer</span>
      </p>
      <p className="text-[9px] text-[#3F3F46]">
        FBX, OBJ, GLTF, PNG, PSD, WAV, MP3, and 30+ more formats supported
      </p>
    </div>
  );
}

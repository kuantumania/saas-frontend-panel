"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { MapPin } from "lucide-react";
import * as api from "@/lib/api";
import { timeAgo } from "@/lib/utils/dashboard";

type ImageAnnotation = {
  id: string;
  x: number;
  y: number;
  text: string;
  created_at: string;
  resolved: boolean;
  author_name?: string;
  resolved_by_name?: string;
};

export default function ImageAnnotationPanel({
  assetId,
  imageUrl,
  token,
  canCreate,
  canModerate,
  refreshKey,
}: {
  assetId: string;
  imageUrl: string;
  token: string;
  canCreate: boolean;
  canModerate: boolean;
  refreshKey?: number;
}) {
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);
  const [mode, setMode] = useState<"view" | "add">("view");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!token || !assetId) return;
    setLoading(true);
    const rows = await api.fetchAssetAnnotations(token, assetId);
    setAnnotations(Array.isArray(rows) ? rows : []);
    setLoading(false);
  }, [token, assetId]);

  useEffect(() => {
    load();
    setActiveId(null);
    setDraftText("");
    setMode("view");
  }, [load, refreshKey]);

  const onImageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (mode !== "add" || !canCreate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const text = draftText.trim();
    if (!text) return;
    setSaving(true);
    api.createAssetAnnotation(token, assetId, { x, y, text }).then((res: any) => {
      setSaving(false);
      if (res?.error) return;
      setDraftText("");
      setMode("view");
      load();
    });
  };

  const toggleResolved = (id: string) => {
    const target = annotations.find((a) => a.id === id);
    if (!target) return;
    api
      .updateAssetAnnotation(token, assetId, id, { resolved: !target.resolved })
      .then((res: any) => {
        if (!res?.error) load();
      });
  };

  const removeAnnotation = (id: string) => {
    if (!canModerate) return;
    api.deleteAssetAnnotation(token, assetId, id).then((res: any) => {
      if (!res?.error) {
        if (activeId === id) setActiveId(null);
        load();
      }
    });
  };

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" strokeWidth={1.5} />
          <p className="text-[11px] font-semibold text-[#A1A1AA]">
            Visual Annotation (MVP)
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setMode((m) => (m === "add" ? "view" : "add"))}
            disabled={saving}
            className={[
              "px-2 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors",
              mode === "add"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-[#121212] text-[#71717A] border-[#27272A] hover:text-[#A1A1AA]",
            ].join(" ")}
          >
            {mode === "add" ? "Cancel Add" : "Add Pin"}
          </button>
        )}
      </div>

      {canCreate && mode === "add" && (
        <div className="mb-2">
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Pin note (click image to place)"
            disabled={saving}
            className={[
              "w-full h-8 px-2 rounded-md bg-[#121212] border border-[#27272A]",
              "text-xs text-[#EDEDED] placeholder:text-[#52525B]",
              "focus:border-[#3F3F46] focus:outline-none",
            ].join(" ")}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3">
        <div
          ref={viewportRef}
          onClick={onImageClick}
          className={[
            "relative rounded-md border border-[#27272A] bg-[#121212] overflow-hidden",
            mode === "add" && canCreate ? "cursor-crosshair" : "",
          ].join(" ")}
        >
          <img src={imageUrl} alt="annotation-surface" className="w-full max-h-72 object-contain" />
          {annotations.map((a, idx) => (
            <button
              key={a.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(a.id);
              }}
              className={[
                "absolute w-5 h-5 rounded-full text-[10px] font-bold flex items-center",
                "justify-center ring-2 transition-colors",
                a.resolved
                  ? "bg-emerald-500 text-black ring-emerald-400/30"
                  : "bg-[#3B82F6] text-white ring-[#3B82F6]/30",
                activeId === a.id ? "scale-110" : "scale-100",
              ].join(" ")}
              style={{
                left: `calc(${a.x * 100}% - 10px)`,
                top: `calc(${a.y * 100}% - 10px)`,
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="rounded-md border border-[#27272A] bg-[#121212] p-2 max-h-72 overflow-auto">
          {loading ? (
            <p className="text-[11px] text-[#52525B]">Loading annotations…</p>
          ) : annotations.length === 0 ? (
            <p className="text-[11px] text-[#52525B]">No annotations yet.</p>
          ) : (
            <div className="space-y-2">
              {annotations.map((a, idx) => (
                <div
                  key={a.id}
                  className={[
                    "rounded border p-2",
                    activeId === a.id
                      ? "border-[#3B82F6]/40 bg-[#3B82F6]/5"
                      : "border-[#27272A] bg-[#0A0A0A]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => setActiveId(a.id)}
                      className="text-[10px] text-[#A1A1AA] hover:text-[#EDEDED] transition-colors"
                    >
                      #{idx + 1} · {a.resolved ? "Resolved" : "Open"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleResolved(a.id)}
                        className="px-1.5 py-0.5 rounded text-[9px] border border-[#27272A] text-[#A1A1AA] hover:text-[#EDEDED]"
                      >
                        {a.resolved ? "Reopen" : "Resolve"}
                      </button>
                      {canModerate && (
                        <button
                          onClick={() => removeAnnotation(a.id)}
                          className="px-1.5 py-0.5 rounded text-[9px] border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#EDEDED] leading-relaxed">{a.text}</p>
                  <p className="text-[10px] text-[#52525B] mt-1">{timeAgo(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

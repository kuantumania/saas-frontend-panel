"use client";

import { useEffect, useState } from "react";

export default function VersionComparePanel({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [split, setSplit] = useState(50);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [diffRatio, setDiffRatio] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!showHeatmap) return;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    (async () => {
      try {
        const [beforeImg, afterImg] = await Promise.all([load(beforeUrl), load(afterUrl)]);
        if (cancelled) return;
        const width = Math.max(
          1,
          Math.min(1024, afterImg.naturalWidth || beforeImg.naturalWidth || 1)
        );
        const height = Math.max(
          1,
          Math.min(1024, afterImg.naturalHeight || beforeImg.naturalHeight || 1)
        );
        const a = document.createElement("canvas");
        const b = document.createElement("canvas");
        const out = document.createElement("canvas");
        a.width = b.width = out.width = width;
        a.height = b.height = out.height = height;
        const actx = a.getContext("2d", { willReadFrequently: true });
        const bctx = b.getContext("2d", { willReadFrequently: true });
        const octx = out.getContext("2d");
        if (!actx || !bctx || !octx) return;
        actx.drawImage(beforeImg, 0, 0, width, height);
        bctx.drawImage(afterImg, 0, 0, width, height);
        const ad = actx.getImageData(0, 0, width, height);
        const bd = bctx.getImageData(0, 0, width, height);
        const od = octx.createImageData(width, height);
        let changed = 0;
        const total = width * height;
        for (let i = 0; i < ad.data.length; i += 4) {
          const delta =
            Math.abs(ad.data[i] - bd.data[i]) +
            Math.abs(ad.data[i + 1] - bd.data[i + 1]) +
            Math.abs(ad.data[i + 2] - bd.data[i + 2]);
          if (delta < 24) { od.data[i+3] = 0; continue; }
          changed += 1;
          od.data[i] = 255;
          od.data[i+1] = Math.max(0, 235 - delta);
          od.data[i+2] = 0;
          od.data[i+3] = Math.min(240, 60 + Math.floor(delta * 0.8));
        }
        octx.putImageData(od, 0, 0);
        setHeatmapUrl(out.toDataURL("image/png"));
        setDiffRatio(changed / total);
      } catch {
        setHeatmapUrl(null);
        setDiffRatio(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showHeatmap, beforeUrl, afterUrl]);

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-[#A1A1AA]">Version Compare (MVP)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className={[
              "px-2 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors",
              showHeatmap
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : "bg-[#121212] text-[#71717A] border-[#27272A] hover:text-[#A1A1AA]",
            ].join(" ")}
          >
            Heatmap
          </button>
          <p className="text-[10px] text-[#52525B]">
            {showHeatmap
              ? diffRatio !== null
                ? `${(diffRatio * 100).toFixed(1)}% changed`
                : "analyzing"
              : `${split}%`}
          </p>
        </div>
      </div>
      <div className="relative h-64 rounded-md border border-[#27272A] bg-[#121212] overflow-hidden">
        <img
          src={beforeUrl}
          alt="before"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        {showHeatmap ? (
          heatmapUrl ? (
            <img
              src={heatmapUrl}
              alt="diff-heatmap"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[#71717A]">
              Generating heatmap…
            </div>
          )
        ) : (
          <>
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${split}%` }}>
              <img
                src={afterUrl}
                alt="after"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            </div>
            <div className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${split}%` }} />
          </>
        )}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-[#EDEDED] border border-white/10">
          Before
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-[#EDEDED] border border-white/10">
          {showHeatmap ? "Diff" : "After"}
        </div>
      </div>
      {!showHeatmap && (
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          className="w-full mt-2 accent-[#3B82F6]"
        />
      )}
      <p className="text-[10px] text-[#52525B] mt-1 truncate">
        {beforeLabel} → {afterLabel}
      </p>
    </div>
  );
}

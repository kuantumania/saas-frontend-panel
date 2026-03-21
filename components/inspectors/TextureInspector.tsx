"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";

type TextureChannel = "rgba" | "r" | "g" | "b" | "a";

export default function TextureInspectorPanel({
  imageUrl,
  metadata,
}: {
  imageUrl: string;
  metadata?: Record<string, any>;
}) {
  const osdContainerRef = useRef<HTMLDivElement | null>(null);
  const channelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const sourceDataRef = useRef<ImageData | null>(null);
  const [channel, setChannel] = useState<TextureChannel>("rgba");
  const [channelPreviewUrl, setChannelPreviewUrl] = useState("");
  const [pixel, setPixel] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    a: number;
  } | null>(null);
  const [mips, setMips] = useState<Array<{ level: number; width: number; height: number }>>([]);
  const [pixelReadable, setPixelReadable] = useState(true);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const metadataSize = useMemo(() => {
    const toInt = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    return {
      width: toInt(
        metadata?.width ?? metadata?.resolution_width ?? metadata?.resolution?.width
      ),
      height: toInt(
        metadata?.height ?? metadata?.resolution_height ?? metadata?.resolution?.height
      ),
    };
  }, [metadata]);

  const buildMipmaps = useCallback((baseWidth: number, baseHeight: number) => {
    const levels: Array<{ level: number; width: number; height: number }> = [];
    let w = Math.max(1, Math.floor(baseWidth));
    let h = Math.max(1, Math.floor(baseHeight));
    for (let i = 0; i < 8; i++) {
      levels.push({ level: i, width: w, height: h });
      if (w <= 1 && h <= 1) break;
      w = Math.max(1, Math.floor(w / 2));
      h = Math.max(1, Math.floor(h / 2));
    }
    setMips(levels);
  }, []);

  const renderChannelCanvas = useCallback((mode: TextureChannel) => {
    const canvas = channelCanvasRef.current;
    const img = sourceImageRef.current;
    const source = sourceDataRef.current;
    if (!canvas || !img || !source) return;
    const scale = Math.min(1, 520 / img.naturalWidth);
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (mode === "rgba") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        setChannelPreviewUrl(canvas.toDataURL("image/png"));
      } catch {
        setChannelPreviewUrl("");
      }
      return;
    }

    const out = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    for (let i = 0; i < out.data.length; i += 4) {
      const [r, g, b, a] = [
        out.data[i],
        out.data[i + 1],
        out.data[i + 2],
        out.data[i + 3],
      ];
      if (mode === "r") {
        out.data[i] = r;
        out.data[i + 1] = 0;
        out.data[i + 2] = 0;
        out.data[i + 3] = 255;
      } else if (mode === "g") {
        out.data[i] = 0;
        out.data[i + 1] = g;
        out.data[i + 2] = 0;
        out.data[i + 3] = 255;
      } else if (mode === "b") {
        out.data[i] = 0;
        out.data[i + 1] = 0;
        out.data[i + 2] = b;
        out.data[i + 3] = 255;
      } else if (mode === "a") {
        out.data[i] = a;
        out.data[i + 1] = a;
        out.data[i + 2] = a;
        out.data[i + 3] = 255;
      }
    }
    const tmp = document.createElement("canvas");
    tmp.width = source.width;
    tmp.height = source.height;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(out, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
    try {
      setChannelPreviewUrl(canvas.toDataURL("image/png"));
    } catch {
      setChannelPreviewUrl("");
    }
  }, []);

  useEffect(() => {
    if (!osdContainerRef.current) return;
    let viewer: any = null;
    let cancelled = false;
    (async () => {
      const mod: any = await import("openseadragon");
      if (cancelled || !osdContainerRef.current) return;
      const OSD = mod.default || mod;
      viewer = OSD({
        element: osdContainerRef.current,
        prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
        tileSources: { type: "image", url: imageUrl },
        showNavigator: true,
        animationTime: 0.8,
        blendTime: 0.1,
        maxZoomPixelRatio: 2.5,
        zoomPerScroll: 1.25,
        constrainDuringPan: true,
        visibilityRatio: 1,
      } as any);
    })();
    return () => {
      cancelled = true;
      try {
        if (viewer) viewer.destroy();
      } catch {}
    };
  }, [imageUrl]);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      sourceImageRef.current = img;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      const temp = document.createElement("canvas");
      temp.width = img.naturalWidth;
      temp.height = img.naturalHeight;
      const tctx = temp.getContext("2d", { willReadFrequently: true });
      if (!tctx) return;
      tctx.drawImage(img, 0, 0);
      try {
        sourceDataRef.current = tctx.getImageData(0, 0, temp.width, temp.height);
        setPixelReadable(true);
        requestAnimationFrame(() => renderChannelCanvas(channel));
      } catch {
        sourceDataRef.current = null;
        setPixelReadable(false);
        setChannelPreviewUrl("");
      }
      buildMipmaps(img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => {
      if (!active) return;
      sourceImageRef.current = null;
      sourceDataRef.current = null;
      setPixelReadable(false);
      setChannelPreviewUrl("");
      if (metadataSize.width > 0 && metadataSize.height > 0) {
        setNaturalSize(metadataSize);
        buildMipmaps(metadataSize.width, metadataSize.height);
      }
    };
    img.src = imageUrl;
    return () => {
      active = false;
    };
  }, [imageUrl, channel, renderChannelCanvas, buildMipmaps, metadataSize.width, metadataSize.height]);

  useEffect(() => {
    if (mips.length === 0 && metadataSize.width > 0 && metadataSize.height > 0) {
      if (naturalSize.width === 0 || naturalSize.height === 0) setNaturalSize(metadataSize);
      buildMipmaps(metadataSize.width, metadataSize.height);
    }
  }, [mips.length, metadataSize.width, metadataSize.height, naturalSize.width, naturalSize.height, buildMipmaps]);

  useEffect(() => {
    renderChannelCanvas(channel);
  }, [channel, renderChannelCanvas]);

  const onPreviewHover = (e: ReactMouseEvent<HTMLImageElement>) => {
    const source = sourceDataRef.current;
    if (!source) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const ix = Math.min(
      source.width - 1,
      Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * source.width))
    );
    const iy = Math.min(
      source.height - 1,
      Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * source.height))
    );
    const idx = (iy * source.width + ix) * 4;
    setPixel({
      x: ix,
      y: iy,
      r: source.data[idx],
      g: source.data[idx + 1],
      b: source.data[idx + 2],
      a: source.data[idx + 3],
    });
  };

  const channelFilter = (mode: TextureChannel) => {
    if (mode === "r") return "contrast(1.1) sepia(1) saturate(8) hue-rotate(-45deg)";
    if (mode === "g") return "contrast(1.1) sepia(1) saturate(6) hue-rotate(35deg)";
    if (mode === "b") return "contrast(1.2) saturate(3) hue-rotate(170deg)";
    if (mode === "a") return "grayscale(1) contrast(1.5)";
    return "none";
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-2">
          <div ref={osdContainerRef} className="h-64 rounded-md overflow-hidden" />
          <p className="text-[10px] text-[#52525B] mt-2">Deep zoom (OpenSeadragon)</p>
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
          <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">
            Channel Isolation + Pixel Inspector
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(["rgba", "r", "g", "b", "a"] as TextureChannel[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={[
                  "px-2 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors",
                  channel === c
                    ? "bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30"
                    : "bg-[#121212] text-[#71717A] border-[#27272A] hover:text-[#A1A1AA]",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
          <canvas ref={channelCanvasRef} className="hidden" />
          {pixelReadable ? (
            <img
              src={channelPreviewUrl || imageUrl}
              alt="channel-preview"
              onMouseMove={onPreviewHover}
              className="w-full rounded border border-[#27272A] bg-[#121212] object-contain max-h-56 cursor-crosshair"
              style={{
                imageRendering: "pixelated",
                filter: channelPreviewUrl ? "none" : channelFilter(channel),
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt="channel-preview"
              className="w-full rounded border border-[#27272A] bg-[#121212] object-contain max-h-56"
              style={{ filter: channelFilter(channel), imageRendering: "pixelated" }}
            />
          )}
          <div className="mt-2 text-[10px] text-[#71717A] font-mono">
            {pixelReadable && pixel
              ? `x:${pixel.x} y:${pixel.y} | R:${pixel.r} G:${pixel.g} B:${pixel.b} A:${pixel.a}`
              : pixelReadable
                ? "Hover to inspect pixel values"
                : "Pixel read disabled by cross-origin policy. Channel preview fallback active."}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Mipmap Grid</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {mips.map((m) => (
            <div key={`mip-${m.level}`} className="rounded border border-[#27272A] bg-[#121212] p-1">
              <img
                src={imageUrl}
                alt={`mip-${m.level}`}
                className="w-full h-14 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="text-[9px] text-[#52525B] text-center mt-1">L{m.level} · {m.width}x{m.height}</p>
            </div>
          ))}
        </div>
        {naturalSize.width > 0 && (
          <p className="text-[10px] text-[#52525B] mt-2 font-mono">
            Base: {naturalSize.width}x{naturalSize.height}
          </p>
        )}
      </div>
    </div>
  );
}

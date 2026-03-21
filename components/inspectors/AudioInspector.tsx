"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Repeat } from "lucide-react";

export default function AudioInspectorPanel({ audioUrl }: { audioUrl: string }) {
  const waveRef = useRef<HTMLDivElement | null>(null);
  const spectroRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [duration, setDuration] = useState(0);
  const loopRef = useRef(false);
  loopRef.current = loop;

  useEffect(() => {
    if (!waveRef.current || !spectroRef.current) return;
    let ws: any = null;
    let cancelled = false;
    (async () => {
      const wsMod: any = await import("wavesurfer.js");
      const spMod: any = await import("wavesurfer.js/dist/plugins/spectrogram.esm.js");
      if (cancelled || !waveRef.current || !spectroRef.current) return;
      ws = (wsMod.default || wsMod).create({
        container: waveRef.current,
        height: 72,
        waveColor: "#334155",
        progressColor: "#3B82F6",
        cursorColor: "#F59E0B",
        barWidth: 2,
        barGap: 1,
        url: audioUrl,
        normalize: true,
        plugins: [
          (spMod.default || spMod).create({
            container: spectroRef.current,
            labels: false,
            height: 96,
            splitChannels: false,
          }),
        ],
      });
      ws.on("ready", () => {
        setReady(true);
        setDuration(ws.getDuration());
      });
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => {
        if (loopRef.current) ws.play();
        else setPlaying(false);
      });
      wsRef.current = ws;
    })();
    return () => {
      cancelled = true;
      if (ws) ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">
          Waveform (WaveSurfer v7)
        </p>
        <div ref={waveRef} />
      </div>
      <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
        <p className="text-[11px] font-semibold text-[#A1A1AA] mb-2">Spectrum</p>
        <div ref={spectroRef} className="min-h-24" />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => wsRef.current?.playPause()}
          className={[
            "px-3 py-1.5 rounded-md text-xs font-medium bg-[#3B82F6]/15",
            "text-[#60A5FA] ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6]/20",
            "transition-colors inline-flex items-center gap-1.5",
          ].join(" ")}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setLoop((v) => !v)}
          className={[
            "px-3 py-1.5 rounded-md text-xs font-medium ring-1 transition-colors",
            "inline-flex items-center gap-1.5",
            loop
              ? "bg-[#F59E0B]/15 text-[#FBBF24] ring-[#F59E0B]/30"
              : "bg-white/[0.04] text-[#71717A] ring-white/[0.08] hover:text-[#A1A1AA]",
          ].join(" ")}
        >
          <Repeat className="w-3.5 h-3.5" /> Loop
        </button>
        <button
          onClick={() => {
            wsRef.current?.seekTo(0);
            if (!playing) wsRef.current?.play();
          }}
          className={[
            "px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] text-[#A1A1AA]",
            "ring-1 ring-white/[0.08] hover:bg-white/[0.08] transition-colors",
          ].join(" ")}
        >
          Restart
        </button>
        <span className="ml-auto text-[10px] font-mono text-[#52525B]">
          {duration > 0 ? `${duration.toFixed(2)}s` : "Loading..."}
        </span>
      </div>
    </div>
  );
}

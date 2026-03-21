import { FileText, Image, Box, Volume2 } from "lucide-react";
import { createElement } from "react";

// -----------------------------------------------
// FORMATTING
// -----------------------------------------------

export function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function dueLabel(d?: string) {
  if (!d) return "no due";
  const sec = Math.floor((new Date(d).getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return sec >= 0 ? "due now" : "overdue";
  if (abs < 3600) {
    return sec >= 0
      ? `in ${Math.floor(abs / 60)}m`
      : `${Math.floor(abs / 60)}m overdue`;
  }
  if (abs < 86400) {
    return sec >= 0
      ? `in ${Math.floor(abs / 3600)}h`
      : `${Math.floor(abs / 3600)}h overdue`;
  }
  return sec >= 0
    ? `in ${Math.floor(abs / 86400)}d`
    : `${Math.floor(abs / 86400)}d overdue`;
}

export function formatSize(kb?: number) {
  if (!kb) return "—";
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function formatTechValue(value: any, key?: string) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") {
    if (String(key || "").includes("vram")) {
      if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
      if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
      return `${value} B`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value ?? "—");
}

export function toLocalDateTimeInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  ].join("T");
}

export function fromLocalDateTimeInput(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// -----------------------------------------------
// QA / SLA
// -----------------------------------------------

export function parseQaTaskStatus(text?: string): "open" | "in_progress" | "done" {
  const upper = String(text || "").toUpperCase();
  if (upper.includes("[DONE]")) return "done";
  if (upper.includes("[IN_PROGRESS]")) return "in_progress";
  return "open";
}

export function cleanQaTaskText(text?: string) {
  return String(text || "")
    .replace(/\[TECH ART AI\]/gi, "")
    .replace(/\[(OPEN|IN_PROGRESS|DONE)\]/gi, "")
    .replace(/\[(MOBILE|PC|CONSOLE)\]/gi, "")
    .trim();
}

export function ageHours(d?: string) {
  if (!d) return 0;
  return Math.max(0, (Date.now() - new Date(d).getTime()) / 3600000);
}

export function slaState(d?: string): { label: string; cls: string } {
  const h = ageHours(d);
  if (h >= 48) {
    return {
      label: "Critical",
      cls: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25",
    };
  }
  if (h >= 24) {
    return {
      label: "SLA Breach",
      cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    };
  }
  if (h >= 8) {
    return {
      label: "At Risk",
      cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    };
  }
  return {
    label: "Healthy",
    cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  };
}

export function qaGateState(item: any): "blocked" | "risky" | "ready" {
  const raw = String(item?.qa_state || "").toLowerCase();
  if (raw === "blocked" || raw === "risky" || raw === "ready") return raw;
  const errors = Number(item?.risk_errors || 0);
  const warnings = Number(item?.risk_warnings || 0);
  if (errors > 0) return "blocked";
  if (warnings > 0) return "risky";
  return "ready";
}

export function qaGateBadge(state: "blocked" | "risky" | "ready") {
  if (state === "blocked") {
    return {
      label: "Blocked",
      cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    };
  }
  if (state === "risky") {
    return {
      label: "Risky",
      cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    };
  }
  return {
    label: "Ready",
    cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  };
}

export function ownerSlaBadge(state?: string) {
  const s = String(state || "unassigned");
  if (s === "overdue") {
    return {
      label: "Owner Overdue",
      cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    };
  }
  if (s === "due_soon") {
    return {
      label: "Due Soon",
      cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    };
  }
  if (s === "on_track") {
    return {
      label: "On Track",
      cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    };
  }
  if (s === "no_due_date") {
    return {
      label: "No Due Date",
      cls: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
    };
  }
  return {
    label: "Unassigned",
    cls: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25",
  };
}

// -----------------------------------------------
// UNITY SYNC
// -----------------------------------------------

export function unitySyncPosture(health: any) {
  const successRate = Number(health?.success_rate || 0);
  const failed = Number(health?.failed_count || 0);
  const total = Number(health?.total_imports || 0);
  if (total < 5) {
    return {
      label: "Cold Start",
      cls: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/25",
      note: "Not enough signal yet.",
    };
  }
  if (successRate >= 0.97 && failed <= 1) {
    return {
      label: "Healthy",
      cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      note: "Delivery flow is stable.",
    };
  }
  if (successRate < 0.85 || failed >= 10) {
    return {
      label: "Blocked",
      cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
      note: "Failures are hurting Unity delivery speed.",
    };
  }
  if (successRate < 0.93 || failed >= 4) {
    return {
      label: "Risky",
      cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      note: "Monitor failures and run fixes this sprint.",
    };
  }
  return {
    label: "Watch",
    cls: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
    note: "Mostly stable, but regressions exist.",
  };
}

export function unitySyncActionHint(health: any) {
  const failedReasons = ((health?.breakdown || []) as any[])
    .filter((b: any) => b?.status === "failed")
    .sort((a: any, b: any) => Number(b.count || 0) - Number(a.count || 0));
  const top = String(failedReasons[0]?.reason_code || "").toLowerCase();
  if (top.includes("auth")) return "Top fix: refresh Unity plugin session token.";
  if (top.includes("rate")) return "Top fix: increase auto-sync interval and retry later.";
  if (top.includes("timeout") || top.includes("network")) {
    return "Top fix: check network stability and keep auto-sync enabled.";
  }
  if (top.includes("invalid")) return "Top fix: update plugin/back-end contract to latest build.";
  if (failedReasons.length === 0) return "Top fix: no action needed right now.";
  return "Top fix: inspect top reason-code and patch contract/import pipeline.";
}

// -----------------------------------------------
// ASSET CLASSIFICATION
// -----------------------------------------------

export const MODEL_PREVIEWABLE_FORMATS = new Set(["glb", "gltf", "obj", "fbx"]);
export const KNOWN_3D_FORMATS = new Set([
  "glb",
  "gltf",
  "fbx",
  "obj",
  "stl",
  "blend",
  "dae",
]);

export const UNITY_ROLE_MAP: Record<string, string> = {
  "2D_Artist": "UI",
  "3D_Animator": "Particles",
  "3D_Modeler": "Models",
  "Technical_Art": "Others",
  "QA_Tester": "Others",
  "lead": "Others",
};

export function getFilenameExtension(name?: string) {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() || "";
}

export function normalizeVersionBase(name?: string) {
  const n = String(name || "").toLowerCase();
  return n.replace(/_v\d+(\.[^.]+)$/i, "$1");
}

export function extractVersionNumber(name?: string): number | null {
  const n = String(name || "");
  const m = n.match(/_v(\d+)\.[^.]+$/i);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

export function unityCategoryForRole(role?: string) {
  if (!role) return "Others";
  return UNITY_ROLE_MAP[role] || "Others";
}

export function inferAssetKind(
  asset: any,
  metadata?: any
): "3d" | "image" | "audio" | "other" {
  const mime = String(asset?.file_type || "").toLowerCase();
  const ext = getFilenameExtension(asset?.filename);
  const format = String(metadata?.format || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (
    KNOWN_3D_FORMATS.has(ext) ||
    KNOWN_3D_FORMATS.has(format) ||
    mime.includes("model") ||
    mime.includes("fbx") ||
    mime.includes("gltf")
  ) {
    return "3d";
  }
  return "other";
}

export const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; ring: string }
> = {
  staging: {
    label: "Staging",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    ring: "ring-zinc-500/20",
  },
  in_review: {
    label: "Review",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    ring: "ring-amber-500/20",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    ring: "ring-rose-500/20",
  },
};

// -----------------------------------------------
// ICON HELPERS
// -----------------------------------------------

export function fileIcon(type?: string) {
  const props = { className: "w-4 h-4", strokeWidth: 1.5 };
  if (!type) return createElement(FileText, props);
  if (type.includes("image")) return createElement(Image, props);
  if (type.includes("fbx") || type.includes("model") || type.includes("obj")) {
    return createElement(Box, props);
  }
  if (type.includes("audio")) return createElement(Volume2, props);
  return createElement(FileText, props);
}

// -----------------------------------------------
// ACTIVITY HELPERS
// -----------------------------------------------

export function activityVerb(action: string) {
  switch (action) {
    case "upload":
      return "uploaded";
    case "submit_review":
      return "submitted for review";
    case "approve_asset":
    case "approve":
      return "approved";
    case "reject_asset":
    case "reject":
      return "rejected";
    case "comment":
      return "commented on";
    case "invite":
      return "invited a member";
    case "join":
      return "joined the team";
    case "review_assignment_set":
      return "assigned review owner on";
    case "asset_lock_intent_set":
      return "set lock intent on";
    case "asset_lock_intent_released":
      return "released lock intent on";
    case "queue_escalation":
      return "escalated";
    case "queue_owner_escalation":
      return "owner-escalated";
    case "auto_route_review":
      return "auto-routed";
    case "review_owner_reassigned":
      return "reassigned review owner on";
    default:
      return "performed an action";
  }
}

export function reviewActionBadge(action: string) {
  const a = String(action || "");
  if (
    a === "review_assignment_set" ||
    a === "review_owner_reassigned" ||
    a === "asset_lock_intent_set" ||
    a === "asset_lock_intent_released"
  ) {
    return {
      label: "Ownership",
      cls: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
    };
  }
  if (a === "queue_escalation" || a === "queue_owner_escalation") {
    return {
      label: "Escalation",
      cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
    };
  }
  if (a === "auto_route_review") {
    return {
      label: "Routing",
      cls: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25",
    };
  }
  if (a === "approve_asset" || a === "reject_asset" || a === "submit_review") {
    return {
      label: "Decision",
      cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    };
  }
  return { label: "Event", cls: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/20" };
}

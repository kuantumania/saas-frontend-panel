"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  ArrowUpRight,
  UserPlus,
  Lock,
  Unlock,
  Zap,
  AlertTriangle,
  Check,
  X,
  MessageCircle,
  ChevronRight,
  Activity,
} from "lucide-react";

import { statusConfig } from "@/lib/utils/dashboard";

export function StatusBadge({ status }: { status: string }) {
  const c = statusConfig[status] || statusConfig.staging;
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-wide",
        "uppercase rounded-full ring-1",
        c.bg,
        c.text,
        c.ring,
      ].join(" ")}
    >
      {c.label}
    </span>
  );
}

export function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={[
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg",
        "bg-[#18181B] border border-[#27272A] text-sm text-[#EDEDED]",
        "shadow-2xl shadow-black/50 backdrop-blur-md",
      ].join(" ")}
    >
      {message}
    </motion.div>
  );
}

export function activityIcon(action: string) {
  const cls = "w-3 h-3 text-[#52525B]";
  switch (action) {
    case "upload":
      return <Upload className={cls} strokeWidth={1.5} />;
    case "submit_review":
      return <ArrowUpRight className={cls} strokeWidth={1.5} />;
    case "review_assignment_set":
      return <UserPlus className={cls} strokeWidth={1.5} />;
    case "asset_lock_intent_set":
      return <Lock className={cls + " !text-amber-300"} strokeWidth={1.7} />;
    case "asset_lock_intent_released":
      return <Unlock className={cls + " !text-emerald-300"} strokeWidth={1.7} />;
    case "auto_route_review":
      return <Zap className={cls + " !text-fuchsia-300"} strokeWidth={1.7} />;
    case "queue_escalation":
    case "queue_owner_escalation":
      return <AlertTriangle className={cls + " !text-rose-400"} strokeWidth={1.7} />;
    case "approve_asset":
    case "approve":
      return <Check className={cls + " !text-emerald-500"} strokeWidth={2} />;
    case "reject_asset":
    case "reject":
      return <X className={cls + " !text-rose-500"} strokeWidth={2} />;
    case "comment":
      return <MessageCircle className={cls} strokeWidth={1.5} />;
    case "invite":
      return <UserPlus className={cls} strokeWidth={1.5} />;
    case "join":
      return <ChevronRight className={cls} strokeWidth={1.5} />;
    default:
      return <Activity className={cls} strokeWidth={1.5} />;
  }
}

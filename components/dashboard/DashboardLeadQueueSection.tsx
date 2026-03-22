"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Info } from "lucide-react";
import {
  ageHours,
  dueLabel,
  ownerSlaBadge,
  qaGateBadge,
  qaGateState,
  slaState,
} from "@/lib/utils/dashboard";

interface DashboardLeadQueueSectionProps {
  ctx: any;
}

export default function DashboardLeadQueueSection({
  ctx,
}: DashboardLeadQueueSectionProps) {
  const {
    reviewQueue,
    setShowQueueGlossary,
    showQueueGlossary,
    handleAutoRoute,
    isAutoRouting,
    handleRunEscalation,
    isEscalatingQueue,
    handleSlaSweep,
    isSlaSweeping,
    setShowPolicyModal,
    queueFilter,
    setQueueFilter,
    queueQaFilter,
    setQueueQaFilter,
    queuePolicy,
    filteredQueue,
    isAssetLockedByOther,
    canForceLockIntent,
    openInspector,
    openAssignModal,
    handleApprove,
    setRejectingId,
    setRejectReason,
  } = ctx;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
            Operational Queue
          </h2>
          <span className="text-xs text-[#52525B]">{reviewQueue.length}</span>
          <button
            onClick={() => setShowQueueGlossary((p: boolean) => !p)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#A1A1AA] hover:text-[#EDEDED] bg-white/[0.02] hover:bg-white/[0.05] ring-1 ring-white/[0.07] transition-colors"
            title="Queue terms and definitions"
          >
            <Info className="w-3.5 h-3.5" strokeWidth={1.7} />
            {showQueueGlossary ? "Hide Guide" : "Queue Guide"}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAutoRoute}
            disabled={isAutoRouting || reviewQueue.length === 0}
            className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
              isAutoRouting || reviewQueue.length === 0
                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                : "bg-[#3B82F6]/15 text-[#93C5FD] ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6]/25"
            }`}
          >
            {isAutoRouting ? "Routing..." : "Auto Route"}
          </button>
          <button
            onClick={handleRunEscalation}
            disabled={isEscalatingQueue || reviewQueue.length === 0}
            className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
              isEscalatingQueue || reviewQueue.length === 0
                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                : "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20"
            }`}
          >
            {isEscalatingQueue ? "Escalating..." : "Run Escalation"}
          </button>
          <button
            onClick={handleSlaSweep}
            disabled={isSlaSweeping || reviewQueue.length === 0}
            className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
              isSlaSweeping || reviewQueue.length === 0
                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                : "bg-fuchsia-500/12 text-fuchsia-300 ring-1 ring-fuchsia-500/30 hover:bg-fuchsia-500/20"
            }`}
          >
            {isSlaSweeping ? "Sweeping..." : "SLA Sweep"}
          </button>
          <button
            onClick={() => setShowPolicyModal(true)}
            className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide bg-white/[0.04] text-[#A1A1AA] ring-1 ring-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors"
          >
            Edit Policy
          </button>
          {(["all", "critical", "breach", "at_risk", "healthy"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setQueueFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                  queueFilter === f
                    ? "bg-white/[0.08] text-[#EDEDED]"
                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "at_risk"
                    ? "At Risk"
                    : f === "critical"
                      ? "Critical"
                      : f}
              </button>
            ),
          )}
          <div className="w-px h-4 bg-[#27272A]" />
          {(["all", "blocked", "risky", "ready"] as const).map((f) => (
            <button
              key={`qa-${f}`}
              onClick={() => setQueueQaFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                queueQaFilter === f
                  ? "bg-white/[0.08] text-[#EDEDED]"
                  : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
              }`}
            >
              {f === "all" ? "QA: All" : f}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showQueueGlossary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                  <p className="text-[11px] text-[#EDEDED] font-medium mb-1">
                    SLA States
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Healthy`: age &lt; {queuePolicy?.at_risk_hours ?? 8}h
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `At Risk`: age ≥ {queuePolicy?.at_risk_hours ?? 8}h and &lt;{" "}
                    {queuePolicy?.breach_hours ?? 24}h
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Breach`: age ≥ {queuePolicy?.breach_hours ?? 24}h and &lt;{" "}
                    {queuePolicy?.critical_hours ?? 48}h
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Critical`: age ≥ {queuePolicy?.critical_hours ?? 48}h
                    (highest urgency lane)
                  </p>
                </div>
                <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                  <p className="text-[11px] text-[#EDEDED] font-medium mb-1">
                    QA Gate States
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Ready`: no rule violations, safe to review/approve.
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Risky`: warnings exist, review allowed but dikkat gerekir.
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Blocked`: one or more error violations, normalde fix
                    gerekli.
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Escalation Needed`: SLA Breach/Critical veya QA Blocked.
                  </p>
                </div>
                <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3 col-span-2">
                  <p className="text-[11px] text-[#EDEDED] font-medium mb-1">
                    Scoring & Actions
                  </p>
                  <p className="text-[10px] text-[#71717A]">
                    `Priority (Pxx)` = yaş + dosya boyutu ağırlıklı operasyon
                    skoru. `Auto Route` önerilen reviewer'a dağıtır. `Run
                    Escalation` ise policy + cooldown kurallarıyla kritik
                    item'lar için uyarı üretir.
                  </p>
                  <p className="text-[10px] text-[#71717A] mt-1">
                    Owner SLA: `Unassigned`, `No Due Date`, `On Track`, `Due
                    Soon`, `Owner Overdue`.
                  </p>
                  <p className="text-[10px] text-[#71717A] mt-1">
                    `SLA Sweep`: owner overdue item'larda otomatik reroute +
                    escalation tetikler.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_80px_70px_170px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
          <span>Asset</span>
          <span>Priority</span>
          <span>QA Gate</span>
          <span>SLA</span>
          <span>Action</span>
        </div>
        {filteredQueue.slice(0, 12).map((q: any) => {
          const lockInfo = isAssetLockedByOther(q);
          const lockBlocked = lockInfo.blocked && !canForceLockIntent;
          const sla = q.sla_state
            ? {
                label:
                  q.sla_state === "critical"
                    ? "Critical"
                    : q.sla_state === "breach"
                      ? "Breach"
                      : q.sla_state === "at_risk"
                        ? "At Risk"
                        : "Healthy",
                cls:
                  q.sla_state === "critical"
                    ? "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25"
                    : q.sla_state === "breach"
                      ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                      : q.sla_state === "at_risk"
                        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
              }
            : slaState(q.created_at);
          const qa = qaGateBadge(qaGateState(q));
          return (
            <div
              key={`queue-${q.id}`}
              className="grid grid-cols-[1fr_90px_80px_70px_170px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 items-center hover:bg-white/[0.02]"
            >
              <button
                onClick={() => openInspector(q)}
                className="text-left min-w-0"
              >
                <p className="text-sm font-medium text-[#EDEDED] truncate">
                  {q.filename}
                </p>
                <p className="text-[10px] text-[#52525B]">
                  {q.uploader_name || "Unknown"} ·{" "}
                  {q.age_hours?.toFixed?.(1) ||
                    ageHours(q.created_at).toFixed(1)}
                  h
                </p>
                <p className="text-[10px] text-[#A1A1AA]">
                  Owner: {q.review_assignment?.assignee_name || "Unassigned"}
                  {q.review_assignment?.due_at
                    ? ` · ${dueLabel(q.review_assignment.due_at)}`
                    : ""}
                </p>
                {q.reviewer_suggestion?.name && (
                  <p className="text-[10px] text-[#60A5FA]">
                    Route → {q.reviewer_suggestion.name} (
                    {q.reviewer_suggestion.role})
                  </p>
                )}
              </button>
              <span className="text-xs font-semibold text-[#60A5FA]">
                P{q.priority_score ?? "—"}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${qa.cls}`}
              >
                {qa.label}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${sla.cls}`}
              >
                {sla.label}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${ownerSlaBadge(q.owner_sla_state).cls}`}
                >
                  {ownerSlaBadge(q.owner_sla_state).label}
                </span>
                <button
                  onClick={() => openAssignModal(q)}
                  className="px-2.5 py-1 rounded text-[10px] bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  Assign
                </button>
                <button
                  onClick={() => handleApprove(q)}
                  disabled={lockBlocked}
                  title={
                    lockBlocked ? `Locked by ${lockInfo.owner}` : "Approve"
                  }
                  className={`px-2.5 py-1 rounded text-[10px] ring-1 transition-colors ${
                    lockBlocked
                      ? "bg-[#18181B] text-[#3F3F46] ring-[#27272A] cursor-not-allowed"
                      : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20"
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setRejectingId(q.id);
                    setRejectReason("");
                  }}
                  disabled={lockBlocked}
                  title={lockBlocked ? `Locked by ${lockInfo.owner}` : "Reject"}
                  className={`px-2.5 py-1 rounded text-[10px] ring-1 transition-colors ${
                    lockBlocked
                      ? "bg-[#18181B] text-[#3F3F46] ring-[#27272A] cursor-not-allowed"
                      : "bg-rose-500/10 text-rose-400 ring-rose-500/20 hover:bg-rose-500/20"
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
        {filteredQueue.length === 0 && (
          <div className="py-10 text-center text-xs text-[#52525B]">
            No queue items for this filter.
          </div>
        )}
      </div>
    </section>
  );
}

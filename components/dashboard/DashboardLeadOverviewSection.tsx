"use client";

import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Package,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  StatusBadge,
  activityIcon,
} from "@/components/dashboard/DashboardShared";
import {
  activityVerb,
  ageHours,
  fileIcon,
  formatSize,
  slaState,
  timeAgo,
} from "@/lib/utils/dashboard";

interface DashboardLeadOverviewSectionProps {
  ctx: any;
}

export default function DashboardLeadOverviewSection({
  ctx,
}: DashboardLeadOverviewSectionProps) {
  const {
    studio,
    queuePolicy,
    cockpit,
    qaGate,
    queueInsights,
    queueScope,
    stats,
    loading,
    pendingAssets,
    reviewQueue,
    isAssetLockedByOther,
    canForceLockIntent,
    handleApprove,
    setRejectingId,
    setRejectReason,
    openInspector,
    activities,
  } = ctx;

  return (
    <>
      {/* ── Lead Welcome Header ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#EDEDED] mb-1">
              Command Center
            </h1>
            <p className="text-xs text-[#52525B]">
              {studio.name || "Studio"} &middot; Pipeline overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/upload"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white hover:border-[#3F3F46] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
              Upload
            </a>
            <a
              href="/dashboard/migration"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white hover:border-[#3F3F46] transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              Import
            </a>
          </div>
        </div>
      </section>

      {/* ── Decision Cockpit ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
            Decision Cockpit
          </h2>
          <span className="text-[10px] text-[#3F3F46] ml-auto">
            SLA: {queuePolicy?.at_risk_hours ?? 8}h at risk ·{" "}
            {queuePolicy?.breach_hours ?? 24}h breach ·{" "}
            {queuePolicy?.critical_hours ?? 48}h critical
          </span>
        </div>

        {/* SLA Status Row */}
        <div className="grid grid-cols-5 gap-3 mb-3 stagger">
          {[
            {
              label: "Critical",
              value: cockpit.critical,
              color: "text-fuchsia-300",
              ring: "ring-fuchsia-500/20",
              bg: "bg-fuchsia-500/5",
              dot: "bg-fuchsia-400",
            },
            {
              label: "SLA Breach",
              value: cockpit.overdue,
              color: "text-rose-400",
              ring: "ring-rose-500/20",
              bg: "bg-rose-500/5",
              dot: "bg-rose-400",
            },
            {
              label: "At Risk",
              value: cockpit.atRisk,
              color: "text-amber-400",
              ring: "ring-amber-500/20",
              bg: "bg-amber-500/5",
              dot: "bg-amber-400",
            },
            {
              label: "Healthy",
              value: cockpit.healthy,
              color: "text-emerald-400",
              ring: "ring-emerald-500/20",
              bg: "bg-emerald-500/5",
              dot: "bg-emerald-400",
            },
            {
              label: "Median Time",
              value: `${cockpit.medianReviewHours.toFixed(1)}h`,
              color: "text-[#EDEDED]",
              ring: "ring-[#27272A]",
              bg: "bg-[#121212]",
              dot: "bg-blue-400",
            },
          ].map(({ label, value, color, ring, bg, dot }) => (
            <div
              key={label}
              className={`rounded-xl border border-[#1E1E1E] ${bg} p-4 ring-1 ${ring}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#52525B]">
                  {label}
                </span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* QA Gate + Insights Row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            {
              label: "QA Blocked",
              value: qaGate.blocked,
              color: "text-rose-400",
              icon: "x",
            },
            {
              label: "QA Risky",
              value: qaGate.risky,
              color: "text-amber-400",
              icon: "!",
            },
            {
              label: "QA Ready",
              value: qaGate.ready,
              color: "text-emerald-400",
              icon: "check",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4"
            >
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
                {label}
              </span>
              <p className={`text-xl font-bold tracking-tight mt-1 ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Escalation + Bottleneck Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
              Escalation
            </span>
            <p className="text-xl font-bold tracking-tight mt-1 text-rose-400">
              {queueInsights?.escalation_needed ??
                queueScope.filter((q: any) => q.escalation_needed).length}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
              Unassigned
            </span>
            <p className="text-xl font-bold tracking-tight mt-1 text-fuchsia-300">
              {queueInsights?.owner_sla?.unassigned ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
              Owner Overdue
            </span>
            <p className="text-xl font-bold tracking-tight mt-1 text-rose-400">
              {queueInsights?.owner_sla?.overdue ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
              Top Bottleneck
            </span>
            <p className="text-sm font-semibold text-[#EDEDED] truncate mt-1">
              {queueInsights?.bottlenecks?.[0]?.bucket || "None"}
            </p>
            <p className="text-[10px] text-[#52525B] mt-0.5">
              {queueInsights?.bottlenecks?.[0]
                ? `${queueInsights.bottlenecks[0].count} items`
                : "Pipeline clear"}
            </p>
          </div>
        </div>
      </section>

      {/* ── METRICS ROW ────────────────────────── */}
      <section className="grid grid-cols-4 gap-4 mb-10 stagger">
        {[
          {
            label: "Members",
            value: stats.totalMembers,
            icon: Users,
            color: "text-[#3B82F6]",
          },
          {
            label: "Total Assets",
            value: stats.totalAssets,
            icon: Package,
            color: "text-[#A1A1AA]",
          },
          {
            label: "Pending",
            value: stats.pendingReview,
            icon: Clock,
            color: "text-[#F59E0B]",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle2,
            color: "text-[#10B981]",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="group p-5 rounded-xl bg-[#121212] border border-[#1E1E1E] hover:border-[#27272A] transition-all duration-200 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#52525B]">
                {label}
              </span>
              <Icon
                className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-80 transition-opacity`}
                strokeWidth={1.5}
              />
            </div>
            <span className="text-3xl font-light tracking-tight text-[#EDEDED]">
              {loading ? (
                <span className="skeleton inline-block w-10 h-8" />
              ) : (
                value
              )}
            </span>
          </div>
        ))}
      </section>

      {/* ── TWO COLUMNS: REVIEW + ACTIVITY ─────── */}
      <section className="grid grid-cols-5 gap-6 mb-10">
        {/* Pending Review — 3 cols */}
        <div className="col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              Pending Review
            </h2>
            {pendingAssets.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                {pendingAssets.length}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {loading ? (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0"
                  >
                    <div className="skeleton w-10 h-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-32" />
                      <div className="skeleton h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2
                  className="w-8 h-8 text-[#27272A] mb-3"
                  strokeWidth={1}
                />
                <p className="text-sm font-medium text-[#52525B]">
                  All caught up
                </p>
                <p className="text-xs text-[#3F3F46] mt-1">
                  No assets pending review
                </p>
              </div>
            ) : (
              <div>
                {(reviewQueue.length ? reviewQueue : pendingAssets)
                  .slice(0, 6)
                  .map((a: any) => {
                    const ext = (a.filename || "")
                      .split(".")
                      .pop()
                      ?.toLowerCase();
                    const isImg = [
                      "png",
                      "jpg",
                      "jpeg",
                      "gif",
                      "webp",
                    ].includes(ext || "");
                    const lockInfo = isAssetLockedByOther(a);
                    const lockBlocked = lockInfo.blocked && !canForceLockIntent;
                    const sla = a.sla_state
                      ? {
                          label:
                            a.sla_state === "critical"
                              ? "Critical"
                              : a.sla_state === "breach"
                                ? "SLA Breach"
                                : a.sla_state === "at_risk"
                                  ? "At Risk"
                                  : "Healthy",
                          cls:
                            a.sla_state === "critical"
                              ? "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25"
                              : a.sla_state === "breach"
                                ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                                : a.sla_state === "at_risk"
                                  ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                        }
                      : slaState(a.created_at);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {isImg && a.preview_url ? (
                            <img
                              src={a.preview_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#3F3F46]">
                              {fileIcon(a.file_type)}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EDEDED] truncate">
                            {a.filename}
                          </p>
                          <p className="text-xs text-[#52525B] mt-0.5">
                            {a.uploader_name || "Unknown"} ·{" "}
                            {formatSize(a.file_size_kb)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end mr-1">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${sla.cls}`}
                          >
                            {sla.label}
                          </span>
                          <span className="text-[10px] text-[#52525B] mt-1">
                            {(typeof a.age_hours === "number"
                              ? a.age_hours
                              : ageHours(a.created_at)
                            ).toFixed(1)}
                            h
                          </span>
                          {typeof a.priority_score === "number" && (
                            <span className="text-[10px] text-[#3B82F6] mt-1">
                              P{a.priority_score}
                            </span>
                          )}
                        </div>

                        {/* Actions — ghost buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApprove(a)}
                            disabled={lockBlocked}
                            className={`p-1.5 rounded-md transition-colors ${
                              lockBlocked
                                ? "text-[#3F3F46] cursor-not-allowed"
                                : "hover:bg-emerald-500/10 text-[#52525B] hover:text-emerald-400"
                            }`}
                            title={
                              lockBlocked
                                ? `Locked by ${lockInfo.owner}`
                                : "Approve"
                            }
                          >
                            <Check className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(a.id);
                              setRejectReason("");
                            }}
                            disabled={lockBlocked}
                            className={`p-1.5 rounded-md transition-colors ${
                              lockBlocked
                                ? "text-[#3F3F46] cursor-not-allowed"
                                : "hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400"
                            }`}
                            title={
                              lockBlocked
                                ? `Locked by ${lockInfo.owner}`
                                : "Reject"
                            }
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed — 2 cols */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              Activity
            </h2>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {loading ? (
              <div className="space-y-0">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0"
                  >
                    <div className="skeleton w-6 h-6 rounded-full" />
                    <div className="skeleton h-3 flex-1" />
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity
                  className="w-8 h-8 text-[#27272A] mb-3"
                  strokeWidth={1}
                />
                <p className="text-xs text-[#52525B]">No activity yet</p>
              </div>
            ) : (
              <div>
                {activities.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {activityIcon(a.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        <span className="font-medium text-[#EDEDED]">
                          {a.user_name || "Someone"}
                        </span>{" "}
                        {activityVerb(a.action)}{" "}
                        {a.metadata?.filename && (
                          <span className="text-[#71717A] font-mono text-[11px]">
                            {a.metadata.filename}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#3F3F46] whitespace-nowrap mt-0.5">
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

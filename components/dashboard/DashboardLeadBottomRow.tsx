"use client";

import {
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Gamepad2,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import * as api from "@/lib/api";
import { unitySyncActionHint, unitySyncPosture } from "@/lib/utils/dashboard";

interface DashboardLeadBottomRowProps {
  ctx: any;
}

export default function DashboardLeadBottomRow({
  ctx,
}: DashboardLeadBottomRowProps) {
  const {
    inviteMenuRef,
    showInviteMenu,
    setShowInviteMenu,
    handleInvite,
    members,
    billing,
    token,
    showToken,
    setShowToken,
    copyToken,
    unityActiveAssets,
    unityActiveLoading,
    unityActiveError,
    unitySyncHealth,
    unitySyncHealthError,
  } = ctx;

  return (
    <>
      {/* ── BOTTOM ROW: TEAM + BILLING + UNITY ── */}
      <section className="grid grid-cols-3 gap-6 mb-10">
        {/* Team Members */}
        <div className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
                Team
              </h2>
            </div>
            {/* Inline invite */}
            <div className="relative" ref={inviteMenuRef}>
              <button
                onClick={() => setShowInviteMenu((v: boolean) => !v)}
                className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              {/* Invite dropdown */}
              <div
                className={`absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#121212] border border-[#27272A] shadow-xl shadow-black/40 transition-all z-10 ${
                  showInviteMenu
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                {[
                  "2D_Artist",
                  "3D_Modeler",
                  "3D_Animator",
                  "Technical_Art",
                  "QA_Tester",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleInvite(role)}
                    className="w-full px-3 py-2 text-xs text-left text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#EDEDED] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {role.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UserPlus
                  className="w-6 h-6 text-[#27272A] mb-2"
                  strokeWidth={1}
                />
                <p className="text-xs text-[#52525B]">
                  Invite your first teammate
                </p>
              </div>
            ) : (
              members.map((m: any) => (
                <div
                  key={m.id || m.pin}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#52525B] flex-shrink-0">
                    {(m.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#EDEDED] truncate">
                      {m.name || "Unclaimed"}
                    </p>
                    <p className="text-[10px] text-[#52525B]">
                      {m.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${
                      m.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              Plan
            </h2>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
            {billing ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ring-1 ${
                      billing.plan === "pro"
                        ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        : billing.plan === "studio"
                          ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                          : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}
                  >
                    {(billing.plan || "free").toUpperCase()}
                  </span>
                </div>
                {billing.usage && billing.limits && (
                  <div className="space-y-3">
                    {[
                      {
                        label: "Members",
                        current: billing.usage.member_count,
                        max: billing.limits.max_members,
                      },
                      {
                        label: "Assets",
                        current: billing.usage.asset_count,
                        max: billing.limits.max_assets,
                      },
                      {
                        label: "Storage",
                        current: Math.round(
                          billing.usage.storage_bytes / 1024 / 1024,
                        ),
                        max: billing.limits.max_storage_mb,
                        unit: "MB",
                      },
                    ].map(({ label, current, max, unit }) => {
                      const unlimited = max === -1;
                      const pct = unlimited
                        ? 0
                        : Math.min(100, Math.round((current / max) * 100));
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[#52525B] uppercase tracking-wider">
                              {label}
                            </span>
                            <span className="text-[10px] text-[#71717A] font-mono">
                              {current}
                              {unit || ""} /{" "}
                              {unlimited ? "∞" : `${max}${unit || ""}`}
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-[#18181B]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-[#F43F5E]" : "bg-[#3B82F6]"}`}
                              style={{ width: unlimited ? "0%" : `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upgrade CTA for non-enterprise plans */}
                {billing.plan && !billing.plan.startsWith("enterprise") && (
                  <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                    <button
                      onClick={async () => {
                        const result = await api.createCheckout(
                          token,
                          "enterprise_starter",
                          "monthly",
                        );
                        if (result?.checkout_url)
                          window.open(result.checkout_url, "_blank");
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
                    >
                      Upgrade to Enterprise — $499/mo
                    </button>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#52525B]">SSO</span>
                      <span className="text-[10px] text-[#52525B]">•</span>
                      <span className="text-[10px] text-[#52525B]">
                        Audit Log
                      </span>
                      <span className="text-[10px] text-[#52525B]">•</span>
                      <span className="text-[10px] text-[#52525B]">
                        Departments
                      </span>
                      <span className="text-[10px] text-[#52525B]">•</span>
                      <span className="text-[10px] text-[#52525B]">500GB</span>
                    </div>
                  </div>
                )}

                {/* Enterprise badge */}
                {billing.plan?.startsWith("enterprise") && (
                  <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] text-purple-400 font-medium">
                        Enterprise features active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-emerald-400">
                        ✓ SSO
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        ✓ Audit
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        ✓ Departments
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="skeleton h-6 w-16" />
                <div className="skeleton h-2 w-full" />
                <div className="skeleton h-2 w-full" />
              </div>
            )}
          </div>
        </div>

        {/* Unity Plugin Token */}
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              Unity Plugin
            </h2>
          </div>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
            <p className="text-xs text-[#52525B] leading-relaxed mb-4">
              Copy your session token and paste it into the Unity CoPilot plugin
              to sync approved assets.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#27272A] font-mono text-[11px] text-[#71717A] truncate">
                {showToken ? token : "••••••••••••••••••••••••"}
              </div>
              <button
                onClick={() => setShowToken(!showToken)}
                className="p-2 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                title={showToken ? "Hide" : "Show"}
              >
                {showToken ? (
                  <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
              </button>
              <button
                onClick={copyToken}
                className="p-2 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[#3F3F46]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to production
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                  Active Sync Preview
                </span>
                <span className="text-[10px] text-[#3F3F46]">
                  {unityActiveAssets.length} active
                </span>
              </div>
              {unityActiveLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-5/6 rounded" />
                  <div className="skeleton h-3 w-4/6 rounded" />
                </div>
              ) : unityActiveError ? (
                <p className="text-[10px] text-rose-400">{unityActiveError}</p>
              ) : unityActiveAssets.length === 0 ? (
                <p className="text-[10px] text-[#52525B]">
                  No active assets yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {unityActiveAssets.slice(0, 6).map((a: any) => (
                    <div
                      key={a.guid}
                      className="flex items-center justify-between gap-2 rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#EDEDED] truncate">
                          {a.name}
                        </p>
                        <p className="text-[9px] text-[#3F3F46] truncate">
                          {a.category} · {a.fileSize}
                        </p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[9px] text-[#3F3F46] mt-2">
                Unity now pulls only active versions via
                `/api/engine/assets/active?engine=unity`.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                  Sync Health (24h)
                </span>
                <span className="text-[10px] text-[#3F3F46]">
                  {unitySyncHealth
                    ? `${Math.round(Number(unitySyncHealth.success_rate || 0) * 100)}% success`
                    : "n/a"}
                </span>
              </div>
              {unitySyncHealthError ? (
                <p className="text-[10px] text-rose-400">
                  {unitySyncHealthError}
                </p>
              ) : !unitySyncHealth ? (
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                </div>
              ) : (
                <>
                  {(() => {
                    const posture = unitySyncPosture(unitySyncHealth);
                    return (
                      <div className="mb-2 rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium ring-1 ${posture.cls}`}
                          >
                            {posture.label}
                          </span>
                          <span className="text-[9px] text-[#52525B]">
                            {posture.note}
                          </span>
                        </div>
                        <p className="mt-1 text-[9px] text-[#71717A]">
                          {unitySyncActionHint(unitySyncHealth)}
                        </p>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                      <p className="text-[9px] uppercase text-[#52525B]">
                        Total
                      </p>
                      <p className="text-[11px] text-[#EDEDED]">
                        {unitySyncHealth.total_imports || 0}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                      <p className="text-[9px] uppercase text-[#52525B]">
                        Success
                      </p>
                      <p className="text-[11px] text-emerald-300">
                        {unitySyncHealth.success_count || 0}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                      <p className="text-[9px] uppercase text-[#52525B]">
                        Failed
                      </p>
                      <p className="text-[11px] text-rose-300">
                        {unitySyncHealth.failed_count || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-[9px] text-[#52525B] mb-1">
                    Avg duration:{" "}
                    {Math.round(Number(unitySyncHealth.avg_duration_ms || 0))}{" "}
                    ms
                  </p>
                  <p className="text-[9px] text-[#52525B] mb-1">
                    Avg retries:{" "}
                    {Number(unitySyncHealth.avg_retry_count || 0).toFixed(2)} ·
                    Total retries: {unitySyncHealth.total_retries || 0}
                  </p>
                  <p className="text-[9px] text-[#52525B] mb-1">
                    Sync runs: {unitySyncHealth?.sync_runs?.total || 0} ·
                    success {unitySyncHealth?.sync_runs?.success || 0} · failed{" "}
                    {unitySyncHealth?.sync_runs?.failed || 0} · no-change{" "}
                    {unitySyncHealth?.sync_runs?.no_changes || 0}
                  </p>
                  <p className="text-[9px] text-[#52525B] mb-1">
                    Auto/manual:{" "}
                    {((unitySyncHealth?.sync_runs?.by_mode || []) as any[])
                      .map((x: any) => `${x.mode}:${x.status}=${x.count}`)
                      .slice(0, 4)
                      .join(" · ") || "n/a"}
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {((unitySyncHealth.breakdown || []) as any[])
                      .filter((b: any) => b?.status === "failed")
                      .sort(
                        (a: any, b: any) =>
                          Number(b.count || 0) - Number(a.count || 0),
                      )
                      .slice(0, 4)
                      .map((b: any) => (
                        <div
                          key={`${b.reason_code}-${b.status}`}
                          className="flex items-center justify-between text-[9px]"
                        >
                          <span className="text-[#71717A]">
                            {b.reason_code}
                          </span>
                          <span className="text-[#A1A1AA]">{b.count}</span>
                        </div>
                      ))}
                    {((unitySyncHealth.breakdown || []) as any[]).filter(
                      (b: any) => b?.status === "failed",
                    ).length === 0 && (
                      <p className="text-[9px] text-emerald-300">
                        No failures in last 24h.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

"use client";

import { Check, CreditCard, ExternalLink, X } from "lucide-react";

type BillingTabProps = {
  isEnterprise: boolean;
  plan: string;
  billing: any;
};

export default function BillingTab({
  isEnterprise,
  plan,
  billing,
}: BillingTabProps) {
  return (
    <>
      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#EDEDED] mb-4">Current Plan</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isEnterprise ? "bg-purple-500/10" : "bg-blue-500/10"
              }`}
            >
              <CreditCard
                className={`w-4 h-4 ${isEnterprise ? "text-purple-400" : "text-blue-400"}`}
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#EDEDED] capitalize">
                {(plan || "free").replace(/_/g, " ")}
              </p>
              <p className="text-[10px] text-[#52525B]">
                {billing?.billing_cycle === "annual"
                  ? "Annual billing"
                  : "Monthly billing"}
              </p>
            </div>
          </div>
          {!isEnterprise && (
            <a
              href="#"
              className="ml-auto text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              Upgrade to Enterprise <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: "Members",
              used: billing?.usage?.members ?? 0,
              limit: billing?.limits?.max_members ?? 5,
            },
            {
              label: "Assets",
              used: billing?.usage?.assets ?? 0,
              limit: billing?.limits?.max_assets ?? 100,
            },
            {
              label: "Storage",
              used: `${((billing?.usage?.storage_mb ?? 0) / 1024).toFixed(1)} GB`,
              limit:
                billing?.limits?.max_storage_mb === -1
                  ? "Unlimited"
                  : `${((billing?.limits?.max_storage_mb ?? 1024) / 1024).toFixed(0)} GB`,
            },
          ].map(({ label, used, limit }) => (
            <div
              key={label}
              className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3"
            >
              <p className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] mb-1">
                {label}
              </p>
              <p className="text-lg font-bold text-[#EDEDED]">{used}</p>
              <p className="text-[10px] text-[#52525B]">
                of {limit === -1 ? "Unlimited" : limit}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6">
        <h2 className="text-sm font-semibold text-[#EDEDED] mb-4">Plan Features</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "SSO Authentication", enabled: isEnterprise },
            { label: "Audit Log Export", enabled: isEnterprise },
            { label: "Department Management", enabled: isEnterprise },
            { label: "Priority Support", enabled: isEnterprise },
            { label: "Custom Integrations", enabled: plan === "enterprise_custom" },
            {
              label: "Dedicated Account Manager",
              enabled: plan === "enterprise_custom",
            },
          ].map(({ label, enabled }) => (
            <div key={label} className="flex items-center gap-2 py-1.5">
              {enabled ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
              ) : (
                <X className="w-3.5 h-3.5 text-[#3F3F46]" strokeWidth={2} />
              )}
              <span className={`text-xs ${enabled ? "text-[#EDEDED]" : "text-[#52525B]"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

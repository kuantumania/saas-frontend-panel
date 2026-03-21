"use client";

import { FileText, Lock, Shield, Upload } from "lucide-react";
import * as api from "@/lib/api";

type EnterpriseSectionProps = {
  token: string;
};

export default function EnterpriseSection({ token }: EnterpriseSectionProps) {
  const exportAuditCsv = async () => {
    const blob = await api.exportAuditLog(token, { format: "csv" });
    if (!(blob instanceof Blob)) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit_log_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportAuditJson = async () => {
    const data = await api.exportAuditLog(token, { format: "json", limit: 1000 });
    if (!data?.entries) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit_log_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-10 stagger">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Enterprise</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-[#EDEDED]">SSO Configuration</span>
          </div>
          <p className="text-[10px] text-[#52525B] mb-3">
            Configure Single Sign-On for your studio members.
          </p>
          <div className="space-y-2">
            {["Google Workspace", "Microsoft Entra", "SAML 2.0"].map((provider) => (
              <div
                key={provider}
                className="flex items-center justify-between px-2 py-1.5 rounded-md border border-[#1E1E1E] bg-[#0A0A0A]"
              >
                <span className="text-[10px] text-[#A1A1AA]">{provider}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/20">
                  Configure
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-[#EDEDED]">Audit Log</span>
          </div>
          <p className="text-[10px] text-[#52525B] mb-3">
            Export activity logs for compliance and reporting.
          </p>
          <div className="space-y-2">
            <button
              onClick={exportAuditCsv}
              className="w-full py-2 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white hover:border-[#3B82F6] transition-colors text-left flex items-center gap-2"
            >
              <FileText className="w-3 h-3" /> Export as CSV
            </button>
            <button
              onClick={exportAuditJson}
              className="w-full py-2 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white hover:border-[#3B82F6] transition-colors text-left flex items-center gap-2"
            >
              <FileText className="w-3 h-3" /> Export as JSON
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-[#EDEDED]">Migration Import</span>
          </div>
          <p className="text-[10px] text-[#52525B] mb-3">
            Import assets from Google Drive or Dropbox.
          </p>
          <a
            href="/dashboard/migration"
            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 text-xs text-blue-400 font-medium hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Open Migration Wizard
          </a>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Download, FileText, Loader2 } from "lucide-react";

type AuditTabProps = {
  auditFrom: string;
  auditTo: string;
  auditAction: string;
  exporting: boolean;
  onAuditFromChange: (value: string) => void;
  onAuditToChange: (value: string) => void;
  onAuditActionChange: (value: string) => void;
  onExportAudit: (format: "json" | "csv") => void;
};

export default function AuditTab({
  auditFrom,
  auditTo,
  auditAction,
  exporting,
  onAuditFromChange,
  onAuditToChange,
  onAuditActionChange,
  onExportAudit,
}: AuditTabProps) {
  return (
    <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold text-[#EDEDED]">Export Audit Log</h2>
      </div>
      <p className="text-xs text-[#52525B] mb-6">
        Download a complete record of all activity in your workspace for compliance
        and auditing purposes.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">
            From Date
          </label>
          <input
            type="date"
            value={auditFrom}
            onChange={(e) => onAuditFromChange(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">
            To Date
          </label>
          <input
            type="date"
            value={auditTo}
            onChange={(e) => onAuditToChange(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">
            Action Type
          </label>
          <select
            value={auditAction}
            onChange={(e) => onAuditActionChange(e.target.value)}
            className="w-full h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          >
            <option value="">All actions</option>
            <option value="upload">Upload</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="department_created">Department Created</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onExportAudit("csv")}
          disabled={exporting}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Export CSV
        </button>
        <button
          onClick={() => onExportAudit("json")}
          disabled={exporting}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Export JSON
        </button>
      </div>
    </div>
  );
}

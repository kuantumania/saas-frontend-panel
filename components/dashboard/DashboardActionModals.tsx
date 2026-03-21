"use client";

import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type QueuePolicyDraft = {
  at_risk_hours: number;
  breach_hours: number;
  critical_hours: number;
  cooldown_critical_hours: number;
  cooldown_breach_hours: number;
  cooldown_at_risk_hours: number;
  cooldown_default_hours: number;
};

type RejectAssetModalProps = {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function RejectAssetModal({
  open,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectAssetModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-[#121212] border border-[#27272A] p-6 shadow-2xl shadow-black/50"
          >
            <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">Reject Asset</h3>
            <p className="text-xs text-[#52525B] mb-4">Provide a reason for rejection:</p>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g., Naming convention not followed..."
              className="w-full h-24 px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] resize-none focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Reject
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type AssignOwnerModalProps = {
  open: boolean;
  asset: { filename?: string } | null;
  assignUserId: string;
  onAssignUserChange: (value: string) => void;
  members: any[];
  assignDueAt: string;
  onAssignDueAtChange: (value: string) => void;
  assignNote: string;
  onAssignNoteChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
};

export function AssignOwnerModal({
  open,
  asset,
  assignUserId,
  onAssignUserChange,
  members,
  assignDueAt,
  onAssignDueAtChange,
  assignNote,
  onAssignNoteChange,
  onClose,
  onSave,
  saving,
}: AssignOwnerModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-[#121212] border border-[#27272A] p-6 shadow-2xl shadow-black/50"
          >
            <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">Assign Review Owner</h3>
            <p className="text-xs text-[#52525B] mb-4 truncate">{asset?.filename}</p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#52525B] mb-1">Owner</p>
                <select
                  value={assignUserId}
                  onChange={(e) => onAssignUserChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members
                    .filter((m: any) => m.status === "claimed" || m.status === "active")
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name || "Unknown"} ({String(m.role || "").replace(/_/g, " ")})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#52525B] mb-1">Due Date</p>
                <input
                  type="datetime-local"
                  value={assignDueAt}
                  onChange={(e) => onAssignDueAtChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#52525B] mb-1">Note</p>
                <textarea
                  value={assignNote}
                  onChange={(e) => onAssignNoteChange(e.target.value)}
                  placeholder="Optional assignment context"
                  className="w-full h-20 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED] placeholder:text-[#3F3F46] resize-none focus:border-[#3F3F46] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  saving
                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                    : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                }`}
              >
                {saving ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type QueuePolicyModalProps = {
  open: boolean;
  policyDraft: QueuePolicyDraft;
  setPolicyDraft: Dispatch<SetStateAction<QueuePolicyDraft>>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
};

export function QueuePolicyModal({
  open,
  policyDraft,
  setPolicyDraft,
  onClose,
  onSave,
  saving,
}: QueuePolicyModalProps) {
  const updateNumber = (field: keyof QueuePolicyDraft, value: string) => {
    setPolicyDraft((prev) => ({
      ...prev,
      [field]: Number(value || 1),
    }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-[#121212] border border-[#27272A] p-6 shadow-2xl shadow-black/50"
          >
            <h3 className="text-sm font-semibold text-[#EDEDED] mb-1">Queue SLA Policy</h3>
            <p className="text-xs text-[#52525B] mb-4">
              Set thresholds and escalation cooldowns for this studio.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <label className="text-[10px] text-[#71717A]">
                At Risk (h)
                <input
                  type="number"
                  min={1}
                  value={policyDraft.at_risk_hours}
                  onChange={(e) => updateNumber("at_risk_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
              <label className="text-[10px] text-[#71717A]">
                Breach (h)
                <input
                  type="number"
                  min={1}
                  value={policyDraft.breach_hours}
                  onChange={(e) => updateNumber("breach_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
              <label className="text-[10px] text-[#71717A]">
                Critical (h)
                <input
                  type="number"
                  min={1}
                  value={policyDraft.critical_hours}
                  onChange={(e) => updateNumber("critical_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <label className="text-[10px] text-[#71717A]">
                CD Critical
                <input
                  type="number"
                  min={1}
                  value={policyDraft.cooldown_critical_hours}
                  onChange={(e) => updateNumber("cooldown_critical_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
              <label className="text-[10px] text-[#71717A]">
                CD Breach
                <input
                  type="number"
                  min={1}
                  value={policyDraft.cooldown_breach_hours}
                  onChange={(e) => updateNumber("cooldown_breach_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
              <label className="text-[10px] text-[#71717A]">
                CD At Risk
                <input
                  type="number"
                  min={1}
                  value={policyDraft.cooldown_at_risk_hours}
                  onChange={(e) => updateNumber("cooldown_at_risk_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
              <label className="text-[10px] text-[#71717A]">
                CD Default
                <input
                  type="number"
                  min={1}
                  value={policyDraft.cooldown_default_hours}
                  onChange={(e) => updateNumber("cooldown_default_hours", e.target.value)}
                  className="mt-1 w-full h-9 px-2 rounded bg-[#0A0A0A] border border-[#27272A] text-sm text-[#EDEDED]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  saving
                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                    : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                }`}
              >
                {saving ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

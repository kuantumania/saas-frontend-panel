"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Shield, Trash2, Zap } from "lucide-react";

interface DashboardLeadRulesSectionProps {
  ctx: any;
}

export default function DashboardLeadRulesSection({
  ctx,
}: DashboardLeadRulesSectionProps) {
  const {
    rules,
    showRuleForm,
    setShowRuleForm,
    newRuleType,
    setNewRuleType,
    setNewRuleConfig,
    newRuleFolderId,
    setNewRuleFolderId,
    folders,
    newRuleSeverity,
    setNewRuleSeverity,
    handleCreateRule,
    handleDeleteRule,
  } = ctx;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">
            Asset Rules
          </h2>
          <span className="text-xs text-[#52525B]">{rules.length}</span>
        </div>
        <button
          onClick={() => setShowRuleForm(!showRuleForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add Rule
        </button>
      </div>

      {/* Rule Creation Form */}
      <AnimatePresence>
        {showRuleForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-xl border border-[#27272A] bg-[#121212] p-5">
              <div className="grid grid-cols-4 gap-4 mb-4">
                {/* Rule Type */}
                <div>
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">
                    Rule Type
                  </label>
                  <select
                    value={newRuleType}
                    onChange={(e) => {
                      setNewRuleType(e.target.value);
                      setNewRuleConfig({});
                    }}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                  >
                    <option value="max_resolution">Max Resolution</option>
                    <option value="min_resolution">Min Resolution</option>
                    <option value="allowed_formats">Allowed Formats</option>
                    <option value="max_file_size">Max File Size</option>
                    <option value="max_poly_count">Max Poly Count</option>
                    <option value="max_vertex_count">Max Vertex Count</option>
                    <option value="naming_pattern">Naming Pattern</option>
                    <option value="sample_rate">Sample Rate</option>
                    <option value="max_duration">Max Duration</option>
                    <option value="aspect_ratio">Aspect Ratio</option>
                    <option value="required_alpha">Require Alpha</option>
                  </select>
                </div>

                {/* Folder */}
                <div>
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">
                    Folder
                  </label>
                  <select
                    value={newRuleFolderId}
                    onChange={(e) => setNewRuleFolderId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                  >
                    <option value="">All (Studio-wide)</option>
                    {folders.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Config based on type */}
                <div>
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">
                    Value
                  </label>
                  {(newRuleType === "max_resolution" ||
                    newRuleType === "min_resolution") && (
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Width"
                        onChange={(e) =>
                          setNewRuleConfig((prev: Record<string, any>) => ({
                            ...prev,
                            [`${newRuleType === "max_resolution" ? "max" : "min"}_width`]:
                              parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        onChange={(e) =>
                          setNewRuleConfig((prev: Record<string, any>) => ({
                            ...prev,
                            [`${newRuleType === "max_resolution" ? "max" : "min"}_height`]:
                              parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                      />
                    </div>
                  )}
                  {newRuleType === "allowed_formats" && (
                    <input
                      type="text"
                      placeholder="png, jpg, webp"
                      onChange={(e) =>
                        setNewRuleConfig({
                          allowed_formats: e.target.value
                            .split(",")
                            .map((s) => s.trim()),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "max_file_size" && (
                    <input
                      type="number"
                      placeholder="KB"
                      onChange={(e) =>
                        setNewRuleConfig({
                          max_file_size_kb: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {(newRuleType === "max_poly_count" ||
                    newRuleType === "max_vertex_count") && (
                    <input
                      type="number"
                      placeholder="Count"
                      onChange={(e) =>
                        setNewRuleConfig({
                          [newRuleType]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "naming_pattern" && (
                    <input
                      type="text"
                      placeholder="^TX_.*"
                      onChange={(e) =>
                        setNewRuleConfig({ naming_pattern: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] font-mono focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "max_duration" && (
                    <input
                      type="number"
                      placeholder="Seconds"
                      onChange={(e) =>
                        setNewRuleConfig({
                          max_duration_seconds: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "aspect_ratio" && (
                    <input
                      type="text"
                      placeholder="1:1 or 16:9"
                      onChange={(e) =>
                        setNewRuleConfig({ aspect_ratio: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "sample_rate" && (
                    <input
                      type="text"
                      placeholder="44100, 48000"
                      onChange={(e) =>
                        setNewRuleConfig({
                          sample_rate: e.target.value
                            .split(",")
                            .map((s) => parseInt(s.trim())),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    />
                  )}
                  {newRuleType === "required_alpha" && (
                    <select
                      onChange={(e) =>
                        setNewRuleConfig({
                          required_alpha: e.target.value === "true",
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                    >
                      <option value="true">Required</option>
                      <option value="false">Not Required</option>
                    </select>
                  )}
                </div>

                {/* Severity */}
                <div>
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">
                    Severity
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setNewRuleSeverity("error")}
                      className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                        newRuleSeverity === "error"
                          ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                          : "bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]"
                      }`}
                    >
                      Block
                    </button>
                    <button
                      onClick={() => setNewRuleSeverity("warning")}
                      className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                        newRuleSeverity === "warning"
                          ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                          : "bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]"
                      }`}
                    >
                      Warn
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRuleForm(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
            <p className="text-sm font-medium text-[#52525B]">
              No rules defined
            </p>
            <p className="text-xs text-[#3F3F46] mt-1">
              Set upload rules for your folders
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
              <span>Rule</span>
              <span>Folder</span>
              <span>Value</span>
              <span>Severity</span>
              <span />
            </div>
            {rules.map((r: any) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="flex items-center gap-2">
                  <Zap
                    className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="text-xs font-medium text-[#EDEDED]">
                    {r.rule_type?.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-xs text-[#52525B] truncate">
                  {r.folder_id
                    ? folders.find((f: any) => f.id === r.folder_id)?.name ||
                      "Folder"
                    : "All"}
                </span>
                <span className="text-xs text-[#71717A] font-mono truncate">
                  {JSON.stringify(r.rule_config).slice(1, -1).slice(0, 20)}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${
                    r.severity === "error"
                      ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                  }`}
                >
                  {r.severity === "error" ? "Block" : "Warn"}
                </span>
                <button
                  onClick={() => handleDeleteRule(r.id)}
                  className="p-1 rounded-md hover:bg-rose-500/10 text-[#3F3F46] hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

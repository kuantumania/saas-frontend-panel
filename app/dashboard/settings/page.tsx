"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, FileText, CreditCard, Building2, Plus, Trash2,
  Download, ChevronRight, Check, X, Loader2, Lock, ExternalLink,
  UserPlus, Settings, Globe, Key, Webhook, Send,
} from "lucide-react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type Tab = "billing" | "departments" | "sso" | "audit" | "webhooks";

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  member_count: number;
  created_at: string;
}

interface DeptMember {
  id: string;
  name: string;
  role: string;
  dept_role: string;
  assigned_at: string;
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

export default function SettingsPage() {
  // Auth
  const [token, setToken] = useState("");
  const [studioName, setStudioName] = useState("Studio");
  const [userRole, setUserRole] = useState("member");
  const [plan, setPlan] = useState("");
  const isEnterprise = plan.startsWith("enterprise");
  const isLead = userRole.toLowerCase() === "lead";

  // Tab
  const [tab, setTab] = useState<Tab>("billing");

  // Billing
  const [billing, setBilling] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [deptMembers, setDeptMembers] = useState<DeptMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [studioMembers, setStudioMembers] = useState<any[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // SSO
  const [ssoConfig, setSsoConfig] = useState<any>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("");
  const [ssoIdpUrl, setSsoIdpUrl] = useState("");
  const [ssoSaving, setSsoSaving] = useState(false);

  // Webhooks
  const [webhookUrl, setWebhookUrl] = useState("");
  const [slackUrl, setSlackUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<Record<string, boolean>>({
    "asset.uploaded": true,
    "asset.approved": true,
    "asset.rejected": true,
  });
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{ type: string; ok: boolean } | null>(null);

  // Audit
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [exporting, setExporting] = useState(false);

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("kuantum_token") || localStorage.getItem("lead_session_token") || "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const user = JSON.parse(localStorage.getItem("session_user") || "{}");
    setToken(t);
    setStudioName(studio?.name || "Studio");
    setUserRole(user?.role || "member");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    // Load billing
    api.fetchBilling(t).then((b: any) => {
      setBilling(b);
      setPlan(b?.plan || "free");
    }).catch(() => {});
    api.fetchPlans().then(setPlans).catch(() => {});
  }, []);

  // ── Load departments ──
  const loadDepartments = useCallback(async () => {
    if (!token) return;
    setDeptLoading(true);
    const deps = await api.fetchDepartments(token);
    setDepartments(deps);
    setDeptLoading(false);
  }, [token]);

  useEffect(() => {
    if (tab === "departments" && isEnterprise && token) {
      loadDepartments();
      api.fetchMembers(token).then(setStudioMembers).catch(() => {});
    }
  }, [tab, isEnterprise, token, loadDepartments]);

  // ── Load SSO ──
  useEffect(() => {
    if (tab === "sso" && isEnterprise && token) {
      setSsoLoading(true);
      api.fetchSSOConfig(token).then((cfg: any) => {
        setSsoConfig(cfg);
        setSsoProvider(cfg?.provider || "");
        setSsoIdpUrl(cfg?.idp_url || "");
        setSsoLoading(false);
      }).catch(() => setSsoLoading(false));
    }
  }, [tab, isEnterprise, token]);

  // ── Department actions ──
  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setCreatingDept(true);
    await api.createDepartment(token, newDeptName.trim());
    setNewDeptName("");
    setCreatingDept(false);
    loadDepartments();
  };

  const handleDeleteDept = async (deptId: string) => {
    await api.deleteDepartment(token, deptId);
    if (expandedDept === deptId) setExpandedDept(null);
    loadDepartments();
  };

  const handleExpandDept = async (deptId: string) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
      return;
    }
    setExpandedDept(deptId);
    setMembersLoading(true);
    const members = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(members);
    setMembersLoading(false);
  };

  const handleAddMember = async (deptId: string) => {
    if (!selectedUserId) return;
    setAddingMember(true);
    await api.addDepartmentMember(token, deptId, selectedUserId, "member");
    setSelectedUserId("");
    setAddingMember(false);
    const members = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(members);
    loadDepartments();
  };

  const handleRemoveMember = async (deptId: string, userId: string) => {
    await api.removeDepartmentMember(token, deptId, userId);
    const members = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(members);
    loadDepartments();
  };

  // ── Load webhooks ──
  useEffect(() => {
    if (tab === "webhooks" && token) {
      setWebhookLoading(true);
      api.fetchWebhookConfig(token).then((cfg: any) => {
        setWebhookUrl(cfg?.webhook_url || "");
        setSlackUrl(cfg?.slack_webhook_url || "");
        if (cfg?.webhook_events) {
          setWebhookEvents(cfg.webhook_events);
        }
        setWebhookLoading(false);
      }).catch(() => setWebhookLoading(false));
    }
  }, [tab, token]);

  // ── Webhook save ──
  const handleSaveWebhooks = async () => {
    setWebhookSaving(true);
    await api.updateWebhookConfig(token, {
      webhook_url: webhookUrl || undefined,
      slack_webhook_url: slackUrl || undefined,
      webhook_events: Object.entries(webhookEvents).filter(([, v]) => v).map(([k]) => k),
    });
    setWebhookSaving(false);
  };

  // ── Webhook test ──
  const handleTestWebhook = async (type: "webhook" | "slack") => {
    setWebhookTesting(type);
    setWebhookTestResult(null);
    try {
      const res = await api.testWebhook(token, type);
      setWebhookTestResult({ type, ok: !res?.error });
    } catch {
      setWebhookTestResult({ type, ok: false });
    }
    setWebhookTesting(null);
  };

  // ── SSO save ──
  const handleSaveSso = async () => {
    setSsoSaving(true);
    await api.updateSSOConfig(token, {
      provider: ssoProvider as "google" | "microsoft" | "saml",
      idp_url: ssoIdpUrl,
    });
    setSsoSaving(false);
  };

  // ── Audit export ──
  const handleExportAudit = async (format: "json" | "csv") => {
    setExporting(true);
    const result = await api.exportAuditLog(token, {
      format,
      from: auditFrom || undefined,
      to: auditTo || undefined,
      action: auditAction || undefined,
    });
    if (result && !result.error) {
      const blob = new Blob(
        [format === "json" ? JSON.stringify(result, null, 2) : result],
        { type: format === "json" ? "application/json" : "text/csv" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  // ── Tab config ──
  const TABS: { key: Tab; label: string; icon: any; requireEnterprise?: boolean }[] = [
    { key: "billing", label: "Billing & Plan", icon: CreditCard },
    { key: "departments", label: "Departments", icon: Building2, requireEnterprise: true },
    { key: "sso", label: "SSO", icon: Shield, requireEnterprise: true },
    { key: "audit", label: "Audit Log", icon: FileText, requireEnterprise: true },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
  ];

  const visibleTabs = TABS.filter(t => !t.requireEnterprise || isEnterprise);

  // ── Guard ──
  if (!isLead) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
        <DashboardNav studioName={studioName} role={userRole} isEnterprise={isEnterprise} showSearch={false} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Lock className="w-10 h-10 text-[#27272A] mb-4" />
          <h2 className="text-lg font-semibold text-[#52525B]">Settings</h2>
          <p className="text-sm text-[#3F3F46] mt-1">Only team leads can access settings.</p>
          <a href="/dashboard" className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav studioName={studioName} role={userRole} isEnterprise={isEnterprise} showSearch={false} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-[#EDEDED]">Settings</h1>
          <p className="text-xs text-[#52525B] mt-1">Manage your workspace, billing, and enterprise features</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {visibleTabs.map(({ key, label, icon: Icon, requireEnterprise }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    tab === key
                      ? "bg-white/[0.08] text-[#EDEDED]"
                      : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {label}
                  {requireEnterprise && (
                    <span className="ml-auto text-[7px] font-bold px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 leading-none">
                      ENT
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ═══ BILLING TAB ═══ */}
              {tab === "billing" && (
                <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
                    <h2 className="text-sm font-semibold text-[#EDEDED] mb-4">Current Plan</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isEnterprise ? "bg-purple-500/10" : "bg-blue-500/10"
                        }`}>
                          <CreditCard className={`w-4 h-4 ${isEnterprise ? "text-purple-400" : "text-blue-400"}`} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#EDEDED] capitalize">{(plan || "free").replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-[#52525B]">
                            {billing?.billing_cycle === "annual" ? "Annual billing" : "Monthly billing"}
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

                    {/* Usage */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: "Members", used: billing?.usage?.members ?? 0, limit: billing?.limits?.max_members ?? 5 },
                        { label: "Assets", used: billing?.usage?.assets ?? 0, limit: billing?.limits?.max_assets ?? 100 },
                        { label: "Storage", used: `${((billing?.usage?.storage_mb ?? 0) / 1024).toFixed(1)} GB`, limit: billing?.limits?.max_storage_mb === -1 ? "Unlimited" : `${((billing?.limits?.max_storage_mb ?? 1024) / 1024).toFixed(0)} GB` },
                      ].map(({ label, used, limit }) => (
                        <div key={label} className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                          <p className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] mb-1">{label}</p>
                          <p className="text-lg font-bold text-[#EDEDED]">{used}</p>
                          <p className="text-[10px] text-[#52525B]">of {limit === -1 ? "Unlimited" : limit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan features */}
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6">
                    <h2 className="text-sm font-semibold text-[#EDEDED] mb-4">Plan Features</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "SSO Authentication", enabled: isEnterprise },
                        { label: "Audit Log Export", enabled: isEnterprise },
                        { label: "Department Management", enabled: isEnterprise },
                        { label: "Priority Support", enabled: isEnterprise },
                        { label: "Custom Integrations", enabled: plan === "enterprise_custom" },
                        { label: "Dedicated Account Manager", enabled: plan === "enterprise_custom" },
                      ].map(({ label, enabled }) => (
                        <div key={label} className="flex items-center gap-2 py-1.5">
                          {enabled ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[#3F3F46]" strokeWidth={2} />
                          )}
                          <span className={`text-xs ${enabled ? "text-[#EDEDED]" : "text-[#52525B]"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ DEPARTMENTS TAB ═══ */}
              {tab === "departments" && (
                <motion.div key="departments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {/* Create */}
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
                    <h2 className="text-sm font-semibold text-[#EDEDED] mb-3">Create Department</h2>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Department name (e.g. Art, Engineering, QA)"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateDept()}
                        className="flex-1 h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                      />
                      <button
                        onClick={handleCreateDept}
                        disabled={creatingDept || !newDeptName.trim()}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {creatingDept ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Create
                      </button>
                    </div>
                  </div>

                  {/* Department list */}
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
                    <div className="px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center">
                      <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] flex-1">Department</span>
                      <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] w-20 text-center">Members</span>
                      <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] w-24 text-right">Actions</span>
                    </div>

                    {deptLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-[#52525B] animate-spin" />
                      </div>
                    ) : departments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 text-center">
                        <Building2 className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                        <p className="text-sm font-medium text-[#52525B]">No departments yet</p>
                        <p className="text-xs text-[#3F3F46] mt-1">Create your first department above</p>
                      </div>
                    ) : (
                      departments.map((dept) => (
                        <div key={dept.id}>
                          <div className="flex items-center px-5 py-3 border-b border-[#1E1E1E]/50 hover:bg-white/[0.02] transition-colors">
                            <button
                              onClick={() => handleExpandDept(dept.id)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              <ChevronRight className={`w-3.5 h-3.5 text-[#52525B] transition-transform ${expandedDept === dept.id ? "rotate-90" : ""}`} />
                              <Building2 className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                              <span className="text-sm font-medium text-[#EDEDED]">{dept.name}</span>
                            </button>
                            <span className="w-20 text-center text-xs text-[#71717A]">{dept.member_count}</span>
                            <div className="w-24 flex justify-end">
                              <button
                                onClick={() => handleDeleteDept(dept.id)}
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded: members */}
                          {expandedDept === dept.id && (
                            <div className="bg-[#0A0A0A] border-b border-[#1E1E1E] px-5 py-4">
                              {/* Add member */}
                              <div className="flex items-center gap-2 mb-3">
                                <select
                                  value={selectedUserId}
                                  onChange={(e) => setSelectedUserId(e.target.value)}
                                  className="flex-1 h-8 px-2 rounded-lg bg-[#121212] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                                >
                                  <option value="">Select member to add...</option>
                                  {studioMembers
                                    .filter((m: any) => !deptMembers.some(dm => dm.id === m.id))
                                    .map((m: any) => (
                                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))
                                  }
                                </select>
                                <button
                                  onClick={() => handleAddMember(dept.id)}
                                  disabled={addingMember || !selectedUserId}
                                  className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Add
                                </button>
                              </div>

                              {/* Members list */}
                              {membersLoading ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="w-4 h-4 text-[#52525B] animate-spin" />
                                </div>
                              ) : deptMembers.length === 0 ? (
                                <p className="text-xs text-[#52525B] text-center py-3">No members in this department</p>
                              ) : (
                                <div className="space-y-1">
                                  {deptMembers.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                                        {(m.name || "?")[0].toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[#EDEDED] truncate">{m.name}</p>
                                        <p className="text-[10px] text-[#52525B]">{m.role} &middot; Dept: {m.dept_role}</p>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveMember(dept.id, m.id)}
                                        className="p-1 rounded hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ SSO TAB ═══ */}
              {tab === "sso" && (
                <motion.div key="sso" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                      <h2 className="text-sm font-semibold text-[#EDEDED]">Single Sign-On Configuration</h2>
                    </div>
                    <p className="text-xs text-[#52525B] mb-6">
                      Allow your team to log in via your identity provider. Supports Google Workspace, Microsoft Entra, and SAML 2.0.
                    </p>

                    {ssoLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 text-[#52525B] animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Provider selection */}
                        <div>
                          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">Provider</label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { key: "google", label: "Google Workspace", icon: Globe },
                              { key: "microsoft", label: "Microsoft Entra", icon: Key },
                              { key: "saml", label: "SAML 2.0", icon: Shield },
                            ].map(({ key, label, icon: Icon }) => (
                              <button
                                key={key}
                                onClick={() => setSsoProvider(key)}
                                className={`flex items-center gap-2.5 p-3 rounded-lg border transition-colors ${
                                  ssoProvider === key
                                    ? "border-blue-500/50 bg-blue-500/5 text-[#EDEDED]"
                                    : "border-[#27272A] bg-[#0A0A0A] text-[#71717A] hover:border-[#3F3F46]"
                                }`}
                              >
                                <Icon className="w-4 h-4" strokeWidth={1.5} />
                                <span className="text-xs font-medium">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* IDP URL */}
                        {ssoProvider && (
                          <div>
                            <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">
                              {ssoProvider === "saml" ? "SAML Metadata URL" : "Identity Provider URL"}
                            </label>
                            <input
                              type="text"
                              placeholder={
                                ssoProvider === "google" ? "accounts.google.com"
                                  : ssoProvider === "microsoft" ? "login.microsoftonline.com/tenant-id"
                                  : "https://idp.example.com/saml/metadata"
                              }
                              value={ssoIdpUrl}
                              onChange={(e) => setSsoIdpUrl(e.target.value)}
                              className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Save */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={handleSaveSso}
                            disabled={ssoSaving || !ssoProvider}
                            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                          >
                            {ssoSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Save Configuration
                          </button>
                          {ssoConfig?.sso_enabled && (
                            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> SSO is active
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ WEBHOOKS TAB ═══ */}
              {tab === "webhooks" && (
                <motion.div key="webhooks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {webhookLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-5 h-5 text-[#52525B] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Webhook URL */}
                      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Webhook className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                          <h2 className="text-sm font-semibold text-[#EDEDED]">Webhook Endpoint</h2>
                        </div>
                        <p className="text-xs text-[#52525B] mb-4">
                          Receive HTTP POST notifications when events occur in your workspace.
                        </p>

                        <div>
                          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">Webhook URL</label>
                          <input
                            type="url"
                            placeholder="https://your-server.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                          />
                        </div>

                        {/* Events */}
                        <div className="mt-5">
                          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-2">Events</label>
                          <div className="space-y-2">
                            {[
                              { key: "asset.uploaded", label: "Asset Uploaded", desc: "When a new asset is uploaded" },
                              { key: "asset.approved", label: "Asset Approved", desc: "When an asset passes review" },
                              { key: "asset.rejected", label: "Asset Rejected", desc: "When an asset is rejected" },
                            ].map(({ key, label, desc }) => (
                              <label key={key} className="flex items-start gap-3 p-3 rounded-lg border border-[#27272A] bg-[#0A0A0A] hover:border-[#3F3F46] transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={webhookEvents[key] ?? true}
                                  onChange={(e) => setWebhookEvents(prev => ({ ...prev, [key]: e.target.checked }))}
                                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#3F3F46] bg-[#121212] text-blue-500 focus:ring-0 focus:ring-offset-0"
                                />
                                <div>
                                  <p className="text-xs font-medium text-[#EDEDED]">{label}</p>
                                  <p className="text-[10px] text-[#52525B]">{desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Test webhook */}
                        {webhookUrl && (
                          <div className="mt-4 flex items-center gap-3">
                            <button
                              onClick={() => handleTestWebhook("webhook")}
                              disabled={webhookTesting === "webhook"}
                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                            >
                              {webhookTesting === "webhook" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Send Test
                            </button>
                            {webhookTestResult?.type === "webhook" && (
                              <span className={`text-[10px] font-medium flex items-center gap-1 ${webhookTestResult.ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {webhookTestResult.ok ? <><Check className="w-3 h-3" /> Delivered</> : <><X className="w-3 h-3" /> Failed</>}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Slack Integration */}
                      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-4 h-4 rounded bg-[#4A154B] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">#</span>
                          </div>
                          <h2 className="text-sm font-semibold text-[#EDEDED]">Slack Integration</h2>
                        </div>
                        <p className="text-xs text-[#52525B] mb-4">
                          Send notifications to a Slack channel using an Incoming Webhook URL.
                        </p>

                        <div>
                          <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">Slack Webhook URL</label>
                          <input
                            type="url"
                            placeholder="https://hooks.slack.com/services/T.../B.../..."
                            value={slackUrl}
                            onChange={(e) => setSlackUrl(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                          />
                        </div>

                        {/* Test Slack */}
                        {slackUrl && (
                          <div className="mt-4 flex items-center gap-3">
                            <button
                              onClick={() => handleTestWebhook("slack")}
                              disabled={webhookTesting === "slack"}
                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                            >
                              {webhookTesting === "slack" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Send Test Message
                            </button>
                            {webhookTestResult?.type === "slack" && (
                              <span className={`text-[10px] font-medium flex items-center gap-1 ${webhookTestResult.ok ? "text-emerald-400" : "text-rose-400"}`}>
                                {webhookTestResult.ok ? <><Check className="w-3 h-3" /> Sent</> : <><X className="w-3 h-3" /> Failed</>}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Save */}
                      <button
                        onClick={handleSaveWebhooks}
                        disabled={webhookSaving}
                        className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {webhookSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save Configuration
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* ═══ AUDIT TAB ═══ */}
              {tab === "audit" && (
                <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                      <h2 className="text-sm font-semibold text-[#EDEDED]">Export Audit Log</h2>
                    </div>
                    <p className="text-xs text-[#52525B] mb-6">
                      Download a complete record of all activity in your workspace for compliance and auditing purposes.
                    </p>

                    {/* Filters */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">From Date</label>
                        <input
                          type="date"
                          value={auditFrom}
                          onChange={(e) => setAuditFrom(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">To Date</label>
                        <input
                          type="date"
                          value={auditTo}
                          onChange={(e) => setAuditTo(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#52525B] mb-1.5">Action Type</label>
                        <select
                          value={auditAction}
                          onChange={(e) => setAuditAction(e.target.value)}
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

                    {/* Export buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleExportAudit("csv")}
                        disabled={exporting}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                      >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExportAudit("json")}
                        disabled={exporting}
                        className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                      >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Export JSON
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

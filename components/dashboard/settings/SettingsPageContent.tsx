"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FileText,
  CreditCard,
  Building2,
  Lock,
  Webhook,
} from "lucide-react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import AuditTab from "@/components/dashboard/settings/AuditTab";
import BillingTab from "@/components/dashboard/settings/BillingTab";
import DepartmentsTab from "@/components/dashboard/settings/DepartmentsTab";
import SsoTab from "@/components/dashboard/settings/SsoTab";
import WebhooksTab from "@/components/dashboard/settings/WebhooksTab";

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

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [studioName, setStudioName] = useState("Studio");
  const [userRole, setUserRole] = useState("member");
  const [plan, setPlan] = useState("");
  const isEnterprise = plan.startsWith("enterprise");
  const isLead = userRole.toLowerCase() === "lead";

  const [tab, setTab] = useState<Tab>("billing");

  const [billing, setBilling] = useState<any>(null);

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

  const [ssoConfig, setSsoConfig] = useState<any>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("");
  const [ssoIdpUrl, setSsoIdpUrl] = useState("");
  const [ssoSaving, setSsoSaving] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [slackUrl, setSlackUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<Record<string, boolean>>({
    "asset.uploaded": true,
    "asset.approved": true,
    "asset.rejected": true,
  });
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState<
    "webhook" | "slack" | null
  >(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    type: string;
    ok: boolean;
  } | null>(null);

  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const sessionToken =
      localStorage.getItem("kuantum_token") ||
      localStorage.getItem("lead_session_token") ||
      "";
    const studio = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const user = JSON.parse(localStorage.getItem("session_user") || "{}");

    setToken(sessionToken);
    setStudioName(studio?.name || "Studio");
    setUserRole(user?.role || "member");

    if (!sessionToken) {
      window.location.href = "/login";
      return;
    }

    api
      .fetchBilling(sessionToken)
      .then((data: any) => {
        setBilling(data);
        setPlan(data?.plan || "free");
      })
      .catch(() => {});
  }, []);

  const loadDepartments = useCallback(async () => {
    if (!token) return;
    setDeptLoading(true);
    const rows = await api.fetchDepartments(token);
    setDepartments(rows);
    setDeptLoading(false);
  }, [token]);

  useEffect(() => {
    if (tab !== "departments" || !isEnterprise || !token) return;

    loadDepartments();
    api
      .fetchMembers(token)
      .then(setStudioMembers)
      .catch(() => {});
  }, [tab, isEnterprise, token, loadDepartments]);

  useEffect(() => {
    if (tab !== "sso" || !isEnterprise || !token) return;

    setSsoLoading(true);
    api
      .fetchSSOConfig(token)
      .then((config: any) => {
        setSsoConfig(config);
        setSsoProvider(config?.provider || "");
        setSsoIdpUrl(config?.idp_url || "");
        setSsoLoading(false);
      })
      .catch(() => setSsoLoading(false));
  }, [tab, isEnterprise, token]);

  useEffect(() => {
    if (tab !== "webhooks" || !token) return;

    setWebhookLoading(true);
    api
      .fetchWebhookConfig(token)
      .then((config: any) => {
        setWebhookUrl(config?.webhook_url || "");
        setSlackUrl(config?.slack_webhook_url || "");
        if (config?.webhook_events) {
          setWebhookEvents(config.webhook_events);
        }
        setWebhookLoading(false);
      })
      .catch(() => setWebhookLoading(false));
  }, [tab, token]);

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
    const rows = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(rows);
    setMembersLoading(false);
  };

  const handleAddMember = async (deptId: string) => {
    if (!selectedUserId) return;

    setAddingMember(true);
    await api.addDepartmentMember(token, deptId, selectedUserId, "member");
    setSelectedUserId("");
    setAddingMember(false);

    const rows = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(rows);
    loadDepartments();
  };

  const handleRemoveMember = async (deptId: string, userId: string) => {
    await api.removeDepartmentMember(token, deptId, userId);
    const rows = await api.fetchDepartmentMembers(token, deptId);
    setDeptMembers(rows);
    loadDepartments();
  };

  const handleSaveSso = async () => {
    setSsoSaving(true);
    await api.updateSSOConfig(token, {
      provider: ssoProvider as "google" | "microsoft" | "saml",
      idp_url: ssoIdpUrl,
    });
    setSsoSaving(false);
  };

  const handleSaveWebhooks = async () => {
    setWebhookSaving(true);
    await api.updateWebhookConfig(token, {
      webhook_url: webhookUrl || undefined,
      slack_webhook_url: slackUrl || undefined,
      webhook_events: Object.entries(webhookEvents)
        .filter(([, enabled]) => enabled)
        .map(([eventKey]) => eventKey),
    });
    setWebhookSaving(false);
  };

  const handleTestWebhook = async (type: "webhook" | "slack") => {
    setWebhookTesting(type);
    setWebhookTestResult(null);

    try {
      const result = await api.testWebhook(token, type);
      setWebhookTestResult({ type, ok: !result?.error });
    } catch {
      setWebhookTestResult({ type, ok: false });
    }

    setWebhookTesting(null);
  };

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
        { type: format === "json" ? "application/json" : "text/csv" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-log.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }

    setExporting(false);
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: any;
    requireEnterprise?: boolean;
  }[] = [
    { key: "billing", label: "Billing & Plan", icon: CreditCard },
    {
      key: "departments",
      label: "Departments",
      icon: Building2,
      requireEnterprise: true,
    },
    { key: "sso", label: "SSO", icon: Shield, requireEnterprise: true },
    {
      key: "audit",
      label: "Audit Log",
      icon: FileText,
      requireEnterprise: true,
    },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
  ];

  const visibleTabs = tabs.filter(
    (item) => !item.requireEnterprise || isEnterprise,
  );

  if (!isLead) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
        <DashboardNav
          studioName={studioName}
          role={userRole}
          isEnterprise={isEnterprise}
          showSearch={false}
        />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Lock className="w-10 h-10 text-[#27272A] mb-4" />
          <h2 className="text-lg font-semibold text-[#52525B]">Settings</h2>
          <p className="text-sm text-[#3F3F46] mt-1">
            Only team leads can access settings.
          </p>
          <a
            href="/dashboard"
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#EDEDED]">
      <DashboardNav
        studioName={studioName}
        role={userRole}
        isEnterprise={isEnterprise}
        showSearch={false}
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-[#EDEDED]">
            Settings
          </h1>
          <p className="text-xs text-[#52525B] mt-1">
            Manage your workspace, billing, and enterprise features
          </p>
        </div>

        <div className="flex gap-8">
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {visibleTabs.map(
                ({ key, label, icon: Icon, requireEnterprise }) => (
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
                      <span
                        className={[
                          "ml-auto text-[7px] font-bold px-1 py-0.5 rounded leading-none",
                          "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
                        ].join(" ")}
                      >
                        ENT
                      </span>
                    )}
                  </button>
                ),
              )}
            </nav>
          </div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {tab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <BillingTab
                    isEnterprise={isEnterprise}
                    plan={plan}
                    billing={billing}
                  />
                </motion.div>
              )}

              {tab === "departments" && (
                <motion.div
                  key="departments"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <DepartmentsTab
                    departments={departments}
                    deptLoading={deptLoading}
                    newDeptName={newDeptName}
                    creatingDept={creatingDept}
                    expandedDept={expandedDept}
                    deptMembers={deptMembers}
                    membersLoading={membersLoading}
                    studioMembers={studioMembers}
                    addingMember={addingMember}
                    selectedUserId={selectedUserId}
                    onNewDeptNameChange={setNewDeptName}
                    onCreateDept={handleCreateDept}
                    onDeleteDept={handleDeleteDept}
                    onExpandDept={handleExpandDept}
                    onSelectedUserIdChange={setSelectedUserId}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                  />
                </motion.div>
              )}

              {tab === "sso" && (
                <motion.div
                  key="sso"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <SsoTab
                    ssoConfig={ssoConfig}
                    ssoLoading={ssoLoading}
                    ssoProvider={ssoProvider}
                    ssoIdpUrl={ssoIdpUrl}
                    ssoSaving={ssoSaving}
                    onSsoProviderChange={setSsoProvider}
                    onSsoIdpUrlChange={setSsoIdpUrl}
                    onSaveSso={handleSaveSso}
                  />
                </motion.div>
              )}

              {tab === "webhooks" && (
                <motion.div
                  key="webhooks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <WebhooksTab
                    webhookUrl={webhookUrl}
                    slackUrl={slackUrl}
                    webhookEvents={webhookEvents}
                    webhookLoading={webhookLoading}
                    webhookSaving={webhookSaving}
                    webhookTesting={webhookTesting}
                    webhookTestResult={webhookTestResult}
                    onWebhookUrlChange={setWebhookUrl}
                    onSlackUrlChange={setSlackUrl}
                    onToggleWebhookEvent={(eventKey, enabled) =>
                      setWebhookEvents((prev) => ({
                        ...prev,
                        [eventKey]: enabled,
                      }))
                    }
                    onTestWebhook={handleTestWebhook}
                    onSaveWebhooks={handleSaveWebhooks}
                  />
                </motion.div>
              )}

              {tab === "audit" && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <AuditTab
                    auditFrom={auditFrom}
                    auditTo={auditTo}
                    auditAction={auditAction}
                    exporting={exporting}
                    onAuditFromChange={setAuditFrom}
                    onAuditToChange={setAuditTo}
                    onAuditActionChange={setAuditAction}
                    onExportAudit={handleExportAudit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

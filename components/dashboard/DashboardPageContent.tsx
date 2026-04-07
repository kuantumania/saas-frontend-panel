"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  LogOut,
  Users,
  Package,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Check,
  X,
  MessageCircle,
  Upload,
  UserPlus,
  Activity,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Gamepad2,
  CreditCard,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Image,
  Box,
  Volume2,
  Folder,
  Shield,
  AlertTriangle,
  Trash2,
  Plus,
  Info,
  Cpu,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";
import * as api from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import {
  StatusBadge,
  Toast,
  activityIcon,
} from "@/components/dashboard/DashboardShared";
import {
  AssignOwnerModal,
  QueuePolicyModal,
  RejectAssetModal,
  type QueuePolicyDraft,
} from "@/components/dashboard/DashboardActionModals";
import EnterpriseSection from "@/components/dashboard/EnterpriseSection";
import DashboardMemberContent from "@/components/dashboard/DashboardMemberContent";
import WelcomeWizard from "@/components/onboarding/WelcomeWizard";
import EmptyStateCards from "@/components/onboarding/EmptyStateCards";
import DashboardLeadBottomRow from "@/components/dashboard/DashboardLeadBottomRow";
import DashboardLeadLibrarySection from "@/components/dashboard/DashboardLeadLibrarySection";
import DashboardLeadOverviewSection from "@/components/dashboard/DashboardLeadOverviewSection";
import DashboardLeadQueueSection from "@/components/dashboard/DashboardLeadQueueSection";
import DashboardLeadRulesSection from "@/components/dashboard/DashboardLeadRulesSection";
import {
  timeAgo,
  dueLabel,
  formatSize,
  formatTechValue,
  ageHours,
  parseQaTaskStatus,
  cleanQaTaskText,
  slaState,
  qaGateState,
  qaGateBadge,
  ownerSlaBadge,
  unitySyncPosture,
  unitySyncActionHint,
  MODEL_PREVIEWABLE_FORMATS,
  KNOWN_3D_FORMATS,
  getFilenameExtension,
  normalizeVersionBase,
  extractVersionNumber,
  unityCategoryForRole,
  inferAssetKind,
  fileIcon,
  toLocalDateTimeInput,
  fromLocalDateTimeInput,
  activityVerb,
  reviewActionBadge,
} from "@/lib/utils/dashboard";
import DashboardInspectorModal from "@/components/dashboard/DashboardInspectorModal";

// ===============================================
// SHARED UI
// ===============================================

// ===============================================
// MAIN DASHBOARD
// ===============================================

export default function DashboardPage() {
  // ── Auth ──
  const [token, setToken] = useState<string | null>(null);
  const [studio, setStudio] = useState<{ name?: string; slug?: string }>({});
  const [sessionUser, setSessionUser] = useState<any>(null);

  // ── Data ──
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAssets: 0,
    pendingReview: 0,
    approved: 0,
  });
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [libraryPagination, setLibraryPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
    has_prev: false,
    has_next: false,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [billing, setBilling] = useState<any>(null);

  // ── FAZ 9: Rules ──
  const [rules, setRules] = useState<any[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRuleType, setNewRuleType] = useState("max_resolution");
  const [newRuleSeverity, setNewRuleSeverity] = useState("error");
  const [newRuleFolderId, setNewRuleFolderId] = useState("");
  const [newRuleConfig, setNewRuleConfig] = useState<Record<string, any>>({});
  const [folders, setFolders] = useState<any[]>([]);

  // ── FAZ 10: Inspector ──
  const [inspectAsset, setInspectAsset] = useState<any>(null);
  const [assetMeta, setAssetMeta] = useState<any>(null);
  const [assetVersions, setAssetVersions] = useState<any[]>([]);
  const [activatingVersionId, setActivatingVersionId] = useState<string | null>(
    null,
  );
  const [assetQaGuidance, setAssetQaGuidance] = useState<any>(null);
  const [qaGuideLoading, setQaGuideLoading] = useState(false);
  const [qaProfile, setQaProfile] = useState<"mobile" | "pc" | "console">("pc");
  const [creatingQaTaskKey, setCreatingQaTaskKey] = useState<string | null>(
    null,
  );
  const [qaTasks, setQaTasks] = useState<any[]>([]);
  const [qaTaskLoading, setQaTaskLoading] = useState(false);
  const [updatingQaTaskId, setUpdatingQaTaskId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [unityActiveAssets, setUnityActiveAssets] = useState<any[]>([]);
  const [unityActiveLoading, setUnityActiveLoading] = useState(false);
  const [unityActiveError, setUnityActiveError] = useState<string | null>(null);
  const [unitySyncHealth, setUnitySyncHealth] = useState<any>(null);
  const [unitySyncHealthError, setUnitySyncHealthError] = useState<
    string | null
  >(null);

  // ── UI State ──
  const [loading, setLoading] = useState(true);
  const [libFilter, setLibFilter] = useState("all");
  const [libSearch, setLibSearch] = useState("");
  const [libPage, setLibPage] = useState(1);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoRouting, setIsAutoRouting] = useState(false);
  const [isEscalatingQueue, setIsEscalatingQueue] = useState(false);
  const [isSlaSweeping, setIsSlaSweeping] = useState(false);
  const [showQueueGlossary, setShowQueueGlossary] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [queueCooldown, setQueueCooldown] = useState<any>(null);
  const [policyDraft, setPolicyDraft] = useState<QueuePolicyDraft>({
    at_risk_hours: 8,
    breach_hours: 24,
    critical_hours: 48,
    cooldown_critical_hours: 2,
    cooldown_breach_hours: 6,
    cooldown_at_risk_hours: 12,
    cooldown_default_hours: 6,
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<any>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignDueAt, setAssignDueAt] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [lockIntentNote, setLockIntentNote] = useState("");
  const [savingLockIntent, setSavingLockIntent] = useState(false);
  const [queueFilter, setQueueFilter] = useState<
    "all" | "critical" | "breach" | "at_risk" | "healthy"
  >("all");
  const [queueQaFilter, setQueueQaFilter] = useState<
    "all" | "blocked" | "risky" | "ready"
  >("all");
  const [queueInsights, setQueueInsights] = useState<any>(null);
  const [queuePolicy, setQueuePolicy] = useState<any>(null);
  const [imageInspectorTab, setImageInspectorTab] = useState<
    "inspect" | "compare" | "annotate"
  >("inspect");
  const [annotationRefreshTick, setAnnotationRefreshTick] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [reviewHistoryFilter, setReviewHistoryFilter] = useState<
    "all" | "ownership" | "escalation" | "routing" | "decision"
  >("all");

  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const inviteMenuRef = useRef<HTMLDivElement>(null);
  const memberUploadInputRef = useRef<HTMLInputElement>(null);

  // ── Init ──
  useEffect(() => {
    const t = localStorage.getItem("lead_session_token");
    const s = JSON.parse(localStorage.getItem("lead_studio") || "{}");
    const u = JSON.parse(localStorage.getItem("session_user") || "null");
    if (!t) {
      window.location.href = "/login";
      return;
    }
    setToken(t);
    setStudio(s);
    setSessionUser(u);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      const ctx = await api.fetchSessionContext(token);
      if (!active || !ctx?.success) return;
      setSessionUser((prev: any) => {
        const merged = {
          ...(prev || {}),
          id: ctx.user_id || prev?.id || "",
          name: ctx.user_name || prev?.name || "",
          role: ctx.user_role || prev?.role || "",
          workspace: ctx.workspace || prev?.workspace || "",
        };
        localStorage.setItem("session_user", JSON.stringify(merged));
        return merged;
      });
      setStudio((prev: any) => ({
        ...prev,
        slug: prev?.slug || ctx.workspace || "",
        name: prev?.name || ctx.studio_name || "Studio",
      }));
    })();
    return () => {
      active = false;
    };
  }, [token]);

  // ── Keyboard shortcut ⌘K ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Load Data ──
  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setUnityActiveLoading(true);
    try {
      const isLeadRole = (sessionUser?.role || "").toLowerCase() === "lead";
      if (isLeadRole) {
        const [
          s,
          p,
          q,
          qp,
          qi,
          l,
          m,
          a,
          n,
          b,
          r,
          fld,
          unityActive,
          syncHealth,
          onboardingReq,
        ] = await Promise.all([
          api.fetchStats(token),
          api.fetchPendingReview(token),
          api.fetchReviewQueue(token),
          api.fetchReviewQueuePolicy(token),
          api.fetchReviewQueueInsights(token),
          api.fetchLibrary(token, { page: 1, status: "all" }),
          api.fetchMembers(token),
          api.fetchActivity(token),
          api.fetchNotifications(token),
          api.fetchBilling(token),
          api.fetchRules(token),
          api.fetchFolders(token),
          api.fetchUnityActiveAssets(token),
          api.fetchUnitySyncHealth(token),
          api.fetchOnboardingStatus(token)
        ]);
        setStats(s);
        setPendingAssets(p);
        setReviewQueue(q || []);
        setQueuePolicy(qp?.policy || null);
        setQueueCooldown(qp?.cooldown || null);
        if (qp?.policy || qp?.cooldown) {
          setPolicyDraft({
            at_risk_hours: Number(qp?.policy?.at_risk_hours ?? 8),
            breach_hours: Number(qp?.policy?.breach_hours ?? 24),
            critical_hours: Number(qp?.policy?.critical_hours ?? 48),
            cooldown_critical_hours: Number(qp?.cooldown?.critical ?? 2),
            cooldown_breach_hours: Number(qp?.cooldown?.breach ?? 6),
            cooldown_at_risk_hours: Number(qp?.cooldown?.at_risk ?? 12),
            cooldown_default_hours: Number(qp?.cooldown?.default ?? 6),
          });
        }
        setQueueInsights(qi || null);
        setLibraryAssets(l.assets || []);
        setLibraryPagination(l.pagination || {});
        setMembers(m);
        setActivities(a);
        setNotifications(n.notifications || []);
        setUnreadCount(n.unread_count || 0);
        setBilling(b);
        setRules(r);
        setFolders(fld);
        if ((unityActive as any)?.error) {
          setUnityActiveAssets([]);
          setUnityActiveError(
            (unityActive as any).error || "Unity sync unavailable",
          );
        } else {
          setUnityActiveAssets((unityActive as any)?.assets || []);
          setUnityActiveError(null);
        }
        if ((syncHealth as any)?.error) {
          setUnitySyncHealth(null);
          setUnitySyncHealthError(
            (syncHealth as any).error || "Sync health unavailable",
          );
        } else {
          setUnitySyncHealth(syncHealth || null);
          setUnitySyncHealthError(null);
        }
        
        const obs = onboardingReq?.status || "pending";
        if (obs === "pending" || obs === "started") {
          setShowWelcome(true);
        }
      } else {
        const [l, a, n, unityActive, syncHealth] = await Promise.all([
          api.fetchLibrary(token, { page: 1, status: "all" }),
          api.fetchActivity(token),
          api.fetchNotifications(token),
          api.fetchUnityActiveAssets(token),
          api.fetchUnitySyncHealth(token),
        ]);
        const assets = l.assets || [];
        setLibraryAssets(assets);
        setLibraryPagination(l.pagination || {});
        setActivities(a || []);
        setNotifications(n.notifications || []);
        setUnreadCount(n.unread_count || 0);
        if ((unityActive as any)?.error) {
          setUnityActiveAssets([]);
          setUnityActiveError(
            (unityActive as any).error || "Unity sync unavailable",
          );
        } else {
          setUnityActiveAssets((unityActive as any)?.assets || []);
          setUnityActiveError(null);
        }
        if ((syncHealth as any)?.error) {
          setUnitySyncHealth(null);
          setUnitySyncHealthError(
            (syncHealth as any).error || "Sync health unavailable",
          );
        } else {
          setUnitySyncHealth(syncHealth || null);
          setUnitySyncHealthError(null);
        }
        setPendingAssets([]);
        setReviewQueue([]);
        setQueuePolicy(null);
        setQueueCooldown(null);
        setQueueInsights(null);
        setMembers([]);
        setBilling(null);
        setRules([]);
        setFolders([]);
        setStats({
          totalMembers: 0,
          totalAssets: l.pagination?.total || assets.length || 0,
          pendingReview: assets.filter((x: any) => x.status === "in_review")
            .length,
          approved: assets.filter((x: any) => x.status === "approved").length,
        });
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setUnityActiveLoading(false);
    setLoading(false);
  }, [token, sessionUser?.role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!inviteMenuRef.current) return;
      if (!inviteMenuRef.current.contains(e.target as Node))
        setShowInviteMenu(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Library reload ──
  const loadLibrary = useCallback(async () => {
    if (!token) return;
    const data = await api.fetchLibrary(token, {
      page: libPage,
      status: libFilter,
      search: libSearch,
    });
    setLibraryAssets(data.assets || []);
    setLibraryPagination(data.pagination || {});
  }, [token, libPage, libFilter, libSearch]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // ── Actions ──
  const isAssetLockedByOther = (asset: any) => {
    const lock = asset?.metadata?.lock_intent;
    if (!lock || !lock.locked) return { blocked: false };
    const lockOwnerId = String(lock.user_id || "");
    const lockOwnerName = String(lock.user_name || "");
    if (currentUserId && lockOwnerId && currentUserId === lockOwnerId)
      return { blocked: false };
    if (
      !currentUserId &&
      currentUserName &&
      lockOwnerName &&
      currentUserName === lockOwnerName
    )
      return { blocked: false };
    return { blocked: true, owner: lockOwnerName || "another user" };
  };

  const handleApprove = async (asset: any) => {
    if (!token) return;
    const lockInfo = isAssetLockedByOther(asset);
    let force = false;
    if (lockInfo.blocked) {
      if (canForceLockIntent) {
        const ok = window.confirm(
          `Asset locked by ${lockInfo.owner}. Force approve?`,
        );
        if (!ok) return;
        force = true;
      } else {
        setToast(`Locked by ${lockInfo.owner}. Ask owner or lead to unlock.`);
        return;
      }
    }
    const res = await api.approveAsset(token, asset.id, { force });
    if ((res as any)?.error) {
      setToast(`Approve failed: ${(res as any).error}`);
      return;
    }
    setToast("Asset approved");
    loadAll();
  };

  const handleReject = async () => {
    if (!token || !rejectingId) return;
    const target =
      reviewQueue.find((a: any) => String(a.id) === String(rejectingId)) ||
      pendingAssets.find((a: any) => String(a.id) === String(rejectingId)) ||
      libraryAssets.find((a: any) => String(a.id) === String(rejectingId));
    const lockInfo = target ? isAssetLockedByOther(target) : { blocked: false };
    let force = false;
    if (lockInfo.blocked) {
      if (canForceLockIntent) {
        const ok = window.confirm(
          `Asset locked by ${lockInfo.owner}. Force reject?`,
        );
        if (!ok) return;
        force = true;
      } else {
        setToast(`Locked by ${lockInfo.owner}. Ask owner or lead to unlock.`);
        return;
      }
    }
    const res = await api.rejectAsset(token, rejectingId, rejectReason, {
      force,
    });
    if ((res as any)?.error) {
      setToast(`Reject failed: ${(res as any).error}`);
      return;
    }
    setToast("Asset rejected");
    setRejectingId(null);
    setRejectReason("");
    loadAll();
  };

  const handleAutoRoute = async () => {
    if (!token) return;
    setIsAutoRouting(true);
    const res = await api.autoRouteReviewQueue(token, {
      execute: true,
      limit: 10,
    });
    setIsAutoRouting(false);
    if ((res as any)?.error) {
      setToast(`Auto-route failed: ${(res as any).error}`);
      return;
    }
    setToast(`Auto-routed ${res.routed_count}/${res.targeted} items`);
    await loadAll();
  };

  const handleRunEscalation = async () => {
    if (!token) return;
    setIsEscalatingQueue(true);
    const res = await api.escalateReviewQueue(token, {
      execute: true,
      include_at_risk: true,
      cooldown_hours: 6,
      limit: 10,
    });
    setIsEscalatingQueue(false);
    if ((res as any)?.error) {
      setToast(`Escalation failed: ${(res as any).error}`);
      return;
    }
    setToast(`Escalated ${res.escalated_count}/${res.matched} items`);
    await loadAll();
  };

  const handleSlaSweep = async () => {
    if (!token) return;
    setIsSlaSweeping(true);
    const res = await api.escalateReviewQueue(token, {
      execute: true,
      include_at_risk: true,
      include_owner_overdue: true,
      include_owner_due_soon: true,
      auto_reroute_overdue: true,
      reroute_due_hours: 8,
      limit: 15,
    });
    setIsSlaSweeping(false);
    if ((res as any)?.error) {
      setToast(`SLA sweep failed: ${(res as any).error}`);
      return;
    }
    setToast(
      `SLA sweep: escalated ${res.escalated_count}, rerouted ${res.rerouted_count}`,
    );
    await loadAll();
  };

  const handleSavePolicy = async () => {
    if (!token) return;
    setSavingPolicy(true);
    const res = await api.updateReviewQueuePolicy(token, {
      at_risk_hours: Number(policyDraft.at_risk_hours),
      breach_hours: Number(policyDraft.breach_hours),
      critical_hours: Number(policyDraft.critical_hours),
      cooldown_critical_hours: Number(policyDraft.cooldown_critical_hours),
      cooldown_breach_hours: Number(policyDraft.cooldown_breach_hours),
      cooldown_at_risk_hours: Number(policyDraft.cooldown_at_risk_hours),
      cooldown_default_hours: Number(policyDraft.cooldown_default_hours),
    });
    setSavingPolicy(false);
    if ((res as any)?.error) {
      setToast(`Policy save failed: ${(res as any).error}`);
      return;
    }
    setShowPolicyModal(false);
    setToast("Queue policy updated");
    await loadAll();
  };

  const openAssignModal = (asset: any) => {
    const assignment = asset?.review_assignment || {};
    setAssigningAsset(asset);
    setAssignUserId(String(assignment.assignee_user_id || ""));
    setAssignDueAt(toLocalDateTimeInput(assignment.due_at));
    setAssignNote(String(assignment.note || ""));
  };

  const handleSaveAssignment = async () => {
    if (!token || !assigningAsset?.id) return;
    setSavingAssignment(true);
    const res = await api.upsertReviewAssignment(token, assigningAsset.id, {
      assignee_user_id: assignUserId || null,
      due_at: fromLocalDateTimeInput(assignDueAt),
      note: assignNote,
    });
    setSavingAssignment(false);
    if ((res as any)?.error) {
      setToast(`Assignment failed: ${(res as any).error}`);
      return;
    }
    setToast("Review owner updated");
    setAssigningAsset(null);
    setAssignUserId("");
    setAssignDueAt("");
    setAssignNote("");
    await loadAll();
  };

  const handleCreateQaTask = async (title: string, taskKey: string) => {
    if (!token || !inspectAsset?.id) return;
    setCreatingQaTaskKey(taskKey);
    const res = await api.createAssetAnnotation(token, inspectAsset.id, {
      x: 0.5,
      y: 0.5,
      text: `[Tech Art AI][OPEN][${qaProfile.toUpperCase()}] ${title}`,
    });
    setCreatingQaTaskKey(null);
    if ((res as any)?.error) {
      setToast(`Task create failed: ${(res as any).error}`);
      return;
    }
    setAnnotationRefreshTick((v) => v + 1);
    if (inferAssetKind(inspectAsset, assetMeta?.metadata) === "image") {
      setImageInspectorTab("annotate");
    }
    setToast("Tech task added to annotations");
  };

  const applyLockIntentToLocalState = (lockIntent: any) => {
    setAssetMeta((prev: any) => {
      if (!prev?.metadata) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          lock_intent: lockIntent,
        },
      };
    });
    setInspectAsset((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          lock_intent: lockIntent,
        },
      };
    });
  };

  const handleAcquireLockIntent = async (force = false) => {
    if (!token || !inspectAsset?.id) return;
    setSavingLockIntent(true);
    const res = await api.setAssetLockIntent(token, inspectAsset.id, {
      note: lockIntentNote,
      force,
    });
    setSavingLockIntent(false);
    if ((res as any)?.error) {
      setToast(`Lock failed: ${(res as any).error}`);
      return;
    }
    applyLockIntentToLocalState((res as any).lock_intent || { locked: true });
    setToast(force ? "Lock force-takeover applied" : "Lock intent acquired");
    await loadLibrary();
  };

  const handleReleaseLockIntent = async (force = false) => {
    if (!token || !inspectAsset?.id) return;
    setSavingLockIntent(true);
    const res = await api.releaseAssetLockIntent(token, inspectAsset.id, {
      force,
    });
    setSavingLockIntent(false);
    if ((res as any)?.error) {
      setToast(`Unlock failed: ${(res as any).error}`);
      return;
    }
    applyLockIntentToLocalState((res as any).lock_intent || { locked: false });
    setToast(force ? "Force unlock applied" : "Lock released");
    await loadLibrary();
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!token || !inspectAsset?.id) return;
    setActivatingVersionId(versionId);
    const res = await api.setActiveVersion(token, inspectAsset.id, versionId);
    if ((res as any)?.error) {
      setToast(`Activate failed: ${(res as any).error}`);
      setActivatingVersionId(null);
      return;
    }
    const versions = await api.fetchAssetVersions(token, inspectAsset.id);
    setAssetVersions(Array.isArray(versions) ? versions : []);
    setAssetMeta((prev: any) => {
      if (!prev?.metadata) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          active_version_asset_id: String(versionId),
          version_state:
            String(inspectAsset.id) === String(versionId)
              ? "active"
              : "inactive",
        },
      };
    });
    setInspectAsset((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          active_version_asset_id: String(versionId),
          version_state:
            String(prev.id) === String(versionId) ? "active" : "inactive",
        },
      };
    });
    setActivatingVersionId(null);
    setToast("Active version updated");
  };

  const handleRollbackVersion = async (versionId: string) => {
    if (!token || !inspectAsset?.id) return;
    setActivatingVersionId(versionId);
    const res = await api.rollbackVersion(token, inspectAsset.id, versionId);
    if ((res as any)?.error) {
      setToast(`Rollback failed: ${(res as any).error}`);
      setActivatingVersionId(null);
      return;
    }
    const versions = await api.fetchAssetVersions(token, inspectAsset.id);
    setAssetVersions(Array.isArray(versions) ? versions : []);
    setAssetMeta((prev: any) => {
      if (!prev?.metadata) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          active_version_asset_id: String(versionId),
          version_state:
            String(inspectAsset.id) === String(versionId)
              ? "active"
              : "inactive",
        },
      };
    });
    setInspectAsset((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          active_version_asset_id: String(versionId),
          version_state:
            String(prev.id) === String(versionId) ? "active" : "inactive",
        },
      };
    });
    setActivatingVersionId(null);
    setToast("Rollback applied");
  };

  const handleUpdateQaTaskStatus = async (
    task: any,
    next: "open" | "in_progress" | "done",
  ) => {
    if (!token || !inspectAsset?.id || !task?.id) return;
    setUpdatingQaTaskId(task.id);
    const statusTag =
      next === "in_progress" ? "IN_PROGRESS" : next.toUpperCase();
    let text = String(task.raw_text || task.text || "");
    if (/\[(OPEN|IN_PROGRESS|DONE)\]/i.test(text)) {
      text = text.replace(/\[(OPEN|IN_PROGRESS|DONE)\]/i, `[${statusTag}]`);
    } else {
      text = `[${statusTag}] ${text}`;
    }
    const res = await api.updateAssetAnnotation(
      token,
      inspectAsset.id,
      task.id,
      {
        text,
        resolved: next === "done",
      },
    );
    setUpdatingQaTaskId(null);
    if ((res as any)?.error) {
      setToast(`Task update failed: ${(res as any).error}`);
      return;
    }
    setAnnotationRefreshTick((v) => v + 1);
    setToast("Task status updated");
  };

  const handleInvite = async (role: string) => {
    if (!token) return;
    const data = await api.inviteMember(token, role);
    setShowInviteMenu(false);
    if ((data as any)?.error) {
      setToast(`Invite failed: ${(data as any).error}`);
      return;
    }
    if (data?.pin) {
      setToast(`Invite PIN: ${data.pin}`);
      loadAll();
      return;
    }
    setToast("Invite failed");
  };

  const handleMarkRead = async () => {
    if (!token) return;
    await api.markNotificationsRead(token);
    setUnreadCount(0);
    const n = await api.fetchNotifications(token);
    setNotifications(n.notifications || []);
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setToast("Session token copied");
  };

  const logout = () => {
    localStorage.removeItem("lead_session_token");
    localStorage.removeItem("lead_studio");
    localStorage.removeItem("session_user");
    window.location.href = "/login";
  };

  const handleSearch = (val: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLibSearch(val);
      setLibPage(1);
    }, 300);
  };

  // ── FAZ 9: Rules Handlers ──
  const handleCreateRule = async () => {
    if (!token) return;
    try {
      const result = await api.createRule(
        token,
        newRuleType,
        newRuleConfig,
        newRuleSeverity,
        newRuleFolderId || undefined,
      );
      if (result?.error) {
        setToast(`Error: ${result.error}`);
        return;
      }
      if (result?.success) {
        setToast("Rule created");
        setShowRuleForm(false);
        setNewRuleConfig({});
        const r = await api.fetchRules(token);
        setRules(r);
      }
    } catch (e: any) {
      setToast(`Error: ${e.message || "Network error"}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!token) return;
    const ok = await api.deleteRule(token, ruleId);
    if (ok) {
      setToast("Rule deleted");
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  };

  // ── FAZ 10: Inspector Handler ──
  const openInspector = async (asset: any) => {
    if (!token) return;
    setInspectAsset(asset);
    setImageInspectorTab("inspect");
    setReviewHistoryFilter("all");
    setQaProfile("pc");
    setLockIntentNote(String(asset?.metadata?.lock_intent?.note || ""));
    setMetaLoading(true);
    setQaGuideLoading(true);
    setAssetQaGuidance(null);
    const [metaData, versions, history] = await Promise.all([
      api.fetchAssetMetadata(token, asset.id),
      api.fetchAssetVersions(token, asset.id),
      api.fetchAssetReviewHistory(token, asset.id),
    ]);
    setAssetMeta(metaData);
    setAssetVersions(Array.isArray(versions) ? versions : []);
    setReviewHistory(Array.isArray(history) ? history : []);
    setMetaLoading(false);
  };

  useEffect(() => {
    if (!token || !inspectAsset?.id) return;
    let alive = true;
    setQaGuideLoading(true);
    api
      .fetchAssetQaGuidance(token, inspectAsset.id, qaProfile)
      .then((data) => {
        if (!alive) return;
        setAssetQaGuidance(data);
      })
      .finally(() => {
        if (alive) setQaGuideLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, inspectAsset?.id, qaProfile]);

  useEffect(() => {
    if (!token || !inspectAsset?.id) return;
    let alive = true;
    setQaTaskLoading(true);
    api
      .fetchAssetAnnotations(token, inspectAsset.id)
      .then((rows) => {
        if (!alive) return;
        const list = (Array.isArray(rows) ? rows : [])
          .map((a: any) => {
            const raw = String(a?.text || "");
            if (!raw.toUpperCase().includes("[TECH ART AI]")) return null;
            return {
              id: a.id,
              raw_text: raw,
              text: cleanQaTaskText(raw) || "Untitled task",
              status: parseQaTaskStatus(raw),
              created_at: a.created_at,
              resolved: Boolean(a.resolved),
              author_name: a.author_name || "System",
            };
          })
          .filter(Boolean);
        setQaTasks(list as any[]);
      })
      .finally(() => {
        if (alive) setQaTaskLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, inspectAsset?.id, annotationRefreshTick]);

  const closeInspector = () => {
    setInspectAsset(null);
    setAssetMeta(null);
    setAssetVersions([]);
    setReviewHistory([]);
    setReviewHistoryFilter("all");
    setImageInspectorTab("inspect");
    setAssetQaGuidance(null);
    setQaGuideLoading(false);
    setQaProfile("pc");
    setQaTasks([]);
    setQaTaskLoading(false);
    setUpdatingQaTaskId(null);
    setLockIntentNote("");
    setSavingLockIntent(false);
  };

  if (!token) return null;
  const inspectKind = inspectAsset
    ? inferAssetKind(inspectAsset, assetMeta?.metadata)
    : "other";
  const conversionStatus = assetMeta?.metadata?.conversion?.status || null;
  const convertedReady = assetMeta?.metadata?.conversion?.status === "ready";
  const inspectFormat = convertedReady
    ? "glb"
    : String(
        assetMeta?.metadata?.format ||
          getFilenameExtension(inspectAsset?.filename),
      ).toLowerCase();
  const canRender3DPreview =
    inspectKind === "3d" &&
    MODEL_PREVIEWABLE_FORMATS.has(inspectFormat) &&
    Boolean(inspectAsset?.preview_url);
  const isLead = (sessionUser?.role || "").toLowerCase() === "lead";
  const canManageAnnotations =
    isLead || (sessionUser?.role || "") === "Technical_Art";
  const canForceLockIntent =
    isLead || (sessionUser?.role || "") === "Technical_Art";
  const canManageVersions =
    isLead || (sessionUser?.role || "") === "Technical_Art";
  const activeLockIntent = (() => {
    const raw =
      assetMeta?.metadata?.lock_intent ||
      inspectAsset?.metadata?.lock_intent ||
      null;
    if (!raw || typeof raw !== "object") return null;
    return raw;
  })();
  const currentUserId = String(sessionUser?.id || "");
  const currentUserName = String(sessionUser?.name || "");
  const isLockHeld = Boolean(activeLockIntent?.locked);
  const lockOwnerId = String(activeLockIntent?.user_id || "");
  const lockOwnerName = String(activeLockIntent?.user_name || "");
  const lockHeldByCurrentUser = Boolean(
    isLockHeld &&
    ((currentUserId && lockOwnerId && currentUserId === lockOwnerId) ||
      (!currentUserId &&
        currentUserName &&
        lockOwnerName &&
        currentUserName === lockOwnerName)),
  );
  const lockHeldByOther = Boolean(isLockHeld && !lockHeldByCurrentUser);
  const memberName = (sessionUser?.name || "").trim();
  const memberAssets = (() => {
    if (!libraryAssets?.length) return [];
    if (isLead) return libraryAssets;
    if (sessionUser?.id) {
      return libraryAssets.filter(
        (a: any) => String(a.uploader_id || "") === String(sessionUser.id),
      );
    }
    if (memberName) {
      return libraryAssets.filter(
        (a: any) =>
          (a.uploader_name || "").trim().toLowerCase() ===
          memberName.toLowerCase(),
      );
    }
    return libraryAssets;
  })();
  const versionsForBase = (() => {
    if (!inspectAsset) return [];
    const source = assetVersions.length > 0 ? assetVersions : libraryAssets;
    const currentBase = normalizeVersionBase(inspectAsset.filename);
    return (source || []).filter(
      (a: any) => normalizeVersionBase(a?.filename) === currentBase,
    );
  })();
  const sortedVersions = [...versionsForBase].sort((a: any, b: any) => {
    const av = extractVersionNumber(a?.filename);
    const bv = extractVersionNumber(b?.filename);
    if (av !== null && bv !== null) return bv - av;
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });
  const activeVersionId = (() => {
    const fromList = sortedVersions.find(
      (v: any) => v?.metadata?.version_state === "active",
    );
    if (fromList?.id) return String(fromList.id);
    const fromMeta =
      assetMeta?.metadata?.active_version_asset_id ||
      inspectAsset?.metadata?.active_version_asset_id;
    return fromMeta ? String(fromMeta) : null;
  })();
  const unityContractAsset = (() => {
    if (!inspectAsset) return null;
    const byGuid = (unityActiveAssets || []).find(
      (x: any) => String(x?.guid) === String(inspectAsset.id),
    );
    if (byGuid) return byGuid;
    if (activeVersionId) {
      const byActive = (unityActiveAssets || []).find(
        (x: any) =>
          String(x?.active_version_asset_id || "") === String(activeVersionId),
      );
      if (byActive) return byActive;
    }
    return null;
  })();
  const unityCategory = String(
    unityContractAsset?.unity_category ||
      unityContractAsset?.category ||
      unityCategoryForRole(
        inspectAsset?.uploader_role || inspectAsset?.uploaderRole || "",
      ),
  );
  const unityTargetPath = String(
    unityContractAsset?.unity_target_path ||
      (inspectAsset?.filename
        ? `Assets/${unityCategory}/${inspectAsset.filename}`
        : `Assets/${unityCategory}`),
  );
  const lineageIndex = sortedVersions.findIndex(
    (v: any) => String(v?.id) === String(inspectAsset?.id),
  );
  const lineagePrev =
    lineageIndex >= 0 ? sortedVersions[lineageIndex + 1] : null;
  const lineageNext =
    lineageIndex >= 0 ? sortedVersions[lineageIndex - 1] : null;
  const compareAsset = (() => {
    if (!inspectAsset || inspectKind !== "image") return null;
    const source = assetVersions.length > 0 ? assetVersions : libraryAssets;
    const currentBase = normalizeVersionBase(inspectAsset.filename);
    const currentVersion = extractVersionNumber(inspectAsset.filename);
    const sameBase = (source || []).filter(
      (a: any) =>
        a?.id !== inspectAsset.id &&
        a?.preview_url &&
        normalizeVersionBase(a?.filename) === currentBase,
    );
    if (sameBase.length === 0) return null;

    if (currentVersion !== null) {
      const lower = sameBase
        .filter((a: any) => {
          const v = extractVersionNumber(a.filename);
          return v !== null && v < currentVersion;
        })
        .sort(
          (a: any, b: any) =>
            (extractVersionNumber(b.filename) || 0) -
            (extractVersionNumber(a.filename) || 0),
        );
      if (lower.length > 0) return lower[0];
    }

    const currentTime = new Date(inspectAsset.created_at || 0).getTime();
    const older = sameBase
      .filter((a: any) => new Date(a.created_at || 0).getTime() < currentTime)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );
    if (older.length > 0) return older[0];

    return sameBase.sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    )[0];
  })();
  const riskSummary = (() => {
    if (assetMeta?.risk?.score !== undefined && assetMeta?.risk?.label) {
      const score = Number(assetMeta.risk.score) || 0;
      const label = String(assetMeta.risk.label || "low").toLowerCase();
      if (label === "high")
        return {
          label: "High Risk",
          score,
          cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
        };
      if (label === "medium")
        return {
          label: "Medium Risk",
          score,
          cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
        };
      return {
        label: "Low Risk",
        score,
        cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      };
    }
    const v = assetMeta?.violations || [];
    if (!Array.isArray(v) || v.length === 0) {
      return {
        label: "Low Risk",
        score: 12,
        cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      };
    }
    const err = v.filter((x: any) => x?.severity === "error").length;
    const warn = v.filter((x: any) => x?.severity !== "error").length;
    const score = Math.min(100, err * 35 + warn * 12 + 8);
    if (score >= 70)
      return {
        label: "High Risk",
        score,
        cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
      };
    if (score >= 35)
      return {
        label: "Medium Risk",
        score,
        cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      };
    return {
      label: "Low Risk",
      score,
      cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    };
  })();
  const queueScope = (reviewQueue.length ? reviewQueue : pendingAssets) || [];
  const cockpit = (() => {
    const critical = queueScope.filter(
      (a: any) =>
        (a.sla_state || "") === "critical" || ageHours(a.created_at) >= 48,
    ).length;
    const overdue = queueScope.filter((a: any) => {
      const h = ageHours(a.created_at);
      const s = a.sla_state || "";
      return s === "breach" || (h >= 24 && h < 48);
    }).length;
    const atRisk = queueScope.filter((a: any) => {
      const h = ageHours(a.created_at);
      const s = a.sla_state || "";
      return s === "at_risk" || (h >= 8 && h < 24);
    }).length;
    const medianH = queueScope.length
      ? [...queueScope]
          .map((a: any) => Number(a.age_hours ?? ageHours(a.created_at)))
          .sort((a: number, b: number) => a - b)[
          Math.floor(queueScope.length / 2)
        ]
      : 0;
    return {
      critical,
      overdue,
      atRisk,
      healthy: Math.max(0, queueScope.length - critical - overdue - atRisk),
      medianReviewHours: medianH,
    };
  })();
  const qaGate = (() => {
    const blocked = queueScope.filter(
      (q: any) => qaGateState(q) === "blocked",
    ).length;
    const risky = queueScope.filter(
      (q: any) => qaGateState(q) === "risky",
    ).length;
    const ready = queueScope.filter(
      (q: any) => qaGateState(q) === "ready",
    ).length;
    return { blocked, risky, ready, total: queueScope.length };
  })();
  const filteredQueue = reviewQueue.filter((q: any) => {
    const slaOk = queueFilter === "all" ? true : q.sla_state === queueFilter;
    const qaOk =
      queueQaFilter === "all" ? true : qaGateState(q) === queueQaFilter;
    return slaOk && qaOk;
  });
  const filteredReviewHistory = reviewHistory.filter((ev: any) => {
    const a = String(ev?.action || "");
    if (reviewHistoryFilter === "all") return true;
    if (reviewHistoryFilter === "ownership")
      return (
        a === "review_assignment_set" ||
        a === "asset_lock_intent_set" ||
        a === "asset_lock_intent_released"
      );
    if (reviewHistoryFilter === "escalation")
      return a === "queue_escalation" || a === "queue_owner_escalation";
    if (reviewHistoryFilter === "routing") return a === "auto_route_review";
    if (reviewHistoryFilter === "decision")
      return (
        a === "approve_asset" || a === "reject_asset" || a === "submit_review"
      );
    return true;
  });

  const handleMemberUploadFile = async (file: File) => {
    if (!token || !file) return;
    if (!studio.slug) {
      setToast("Studio context missing. Please log in again.");
      return;
    }
    setIsUploading(true);
    const result = await api.uploadAsset(token, file, {
      role: sessionUser?.role || "General",
      userCode: memberName || "Member",
      workspace: studio.slug,
    });
    setIsUploading(false);
    if ((result as any)?.error) {
      setToast(`Upload failed: ${(result as any).error}`);
      return;
    }
    setToast(`Uploaded: ${file.name}`);
    await loadLibrary();
  };

  const handleMemberSubmitReview = async (asset: any) => {
    if (!token || !asset?.s3_key) return;
    const lockInfo = isAssetLockedByOther(asset);
    if (lockInfo.blocked) {
      setToast(`Locked by ${lockInfo.owner}. Ask owner or lead to unlock.`);
      return;
    }
    const res = await api.submitAssetForReview(token, asset.s3_key);
    if ((res as any)?.error) {
      setToast(`Submit failed: ${(res as any).error}`);
      return;
    }
    setToast("Sent to review");
    await loadLibrary();
  };

  // ===============================================
  // RENDER
  // ===============================================

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-[family-name:var(--font-geist-sans)]">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeWizard
            studioName={studio.name || "Studio"}
            onComplete={async () => {
              if (token) await api.completeOnboarding(token, "completed");
              setShowWelcome(false);
            }}
            onSkip={async () => {
              if (token) await api.completeOnboarding(token, "skipped");
              setShowWelcome(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SHARED NAV ─────────────────── */}
      <DashboardNav
        studioName={studio.name || "Studio"}
        role={sessionUser?.role || "member"}
        isEnterprise={billing?.plan?.startsWith("enterprise") || false}
        onSearch={handleSearch}
        showSearch={true}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onLogout={logout}
      />

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!loading && libraryAssets.length === 0 && pendingAssets.length === 0 && reviewQueue.length === 0 ? (
          <EmptyStateCards />
        ) : !isLead ? (
          <DashboardMemberContent
            memberName={memberName}
            sessionUser={sessionUser}
            studio={studio}
            memberAssets={memberAssets}
            isDraggingUpload={isDraggingUpload}
            isUploading={isUploading}
            memberUploadInputRef={memberUploadInputRef}
            setIsDraggingUpload={setIsDraggingUpload}
            handleMemberUploadFile={handleMemberUploadFile}
            openInspector={openInspector}
            handleMemberSubmitReview={handleMemberSubmitReview}
          />
        ) : (
          <>
            <DashboardLeadOverviewSection
              ctx={{
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
              }}
            />

            <DashboardLeadQueueSection
              ctx={{
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
              }}
            />

            <DashboardLeadLibrarySection
              ctx={{
                libraryPagination,
                libFilter,
                setLibFilter,
                setLibPage,
                loading,
                libraryAssets,
                openInspector,
              }}
            />

            <DashboardLeadRulesSection
              ctx={{
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
              }}
            />
            <DashboardLeadBottomRow
              ctx={{
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
              }}
            />
          </>
        )}

        {/* ── ENTERPRISE SECTION ─────────────────────────── */}
        {isLead && billing?.plan?.startsWith("enterprise") && (
          <EnterpriseSection token={token} />
        )}
      </main>

      <RejectAssetModal
        open={Boolean(rejectingId)}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => setRejectingId(null)}
        onConfirm={handleReject}
      />

      <AssignOwnerModal
        open={Boolean(assigningAsset)}
        asset={assigningAsset}
        assignUserId={assignUserId}
        onAssignUserChange={setAssignUserId}
        members={members}
        assignDueAt={assignDueAt}
        onAssignDueAtChange={setAssignDueAt}
        assignNote={assignNote}
        onAssignNoteChange={setAssignNote}
        onClose={() => setAssigningAsset(null)}
        onSave={handleSaveAssignment}
        saving={savingAssignment}
      />

      <QueuePolicyModal
        open={showPolicyModal}
        policyDraft={policyDraft}
        setPolicyDraft={setPolicyDraft}
        onClose={() => setShowPolicyModal(false)}
        onSave={handleSavePolicy}
        saving={savingPolicy}
      />

      <DashboardInspectorModal
        ctx={{
          inspectAsset,
          closeInspector,
          inspectKind,
          canRender3DPreview,
          inspectFormat,
          conversionStatus,
          imageInspectorTab,
          setImageInspectorTab,
          assetMeta,
          compareAsset,
          canManageVersions,
          activeVersionId,
          handleRollbackVersion,
          activatingVersionId,
          token,
          canManageAnnotations,
          annotationRefreshTick,
          metaLoading,
          riskSummary,
          isLockHeld,
          lockOwnerName,
          activeLockIntent,
          lockIntentNote,
          setLockIntentNote,
          handleAcquireLockIntent,
          savingLockIntent,
          lockHeldByCurrentUser,
          handleReleaseLockIntent,
          canForceLockIntent,
          sortedVersions,
          unityTargetPath,
          unityCategory,
          lineagePrev,
          openInspector,
          lineageNext,
          handleActivateVersion,
          qaGuideLoading,
          assetQaGuidance,
          setQaProfile,
          qaProfile,
          handleCreateQaTask,
          creatingQaTaskKey,
          openAssignModal,
          qaTaskLoading,
          qaTasks,
          handleUpdateQaTaskStatus,
          updatingQaTaskId,
          setReviewHistoryFilter,
          reviewHistoryFilter,
          filteredReviewHistory,
        }}
      />
      {/* ── TOAST ─────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

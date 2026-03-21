"use client";

import { useEffect, useState, useCallback, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, LogOut, Users, Package, Clock, CheckCircle2,
  MoreHorizontal, Check, X, MessageCircle, Upload, UserPlus,
  Activity, ChevronRight, Copy, Eye, EyeOff, Gamepad2,
  CreditCard, ExternalLink, Layers, ArrowUpRight,
  Image, Box, Volume2, Folder, Shield,
  AlertTriangle, Trash2, Plus, Info, Cpu, Zap, Lock, Unlock,
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
import {
  timeAgo, dueLabel, formatSize, formatTechValue, ageHours,
  parseQaTaskStatus, cleanQaTaskText, slaState, qaGateState, qaGateBadge, ownerSlaBadge,
  unitySyncPosture, unitySyncActionHint,
  MODEL_PREVIEWABLE_FORMATS, KNOWN_3D_FORMATS,
  getFilenameExtension, normalizeVersionBase, extractVersionNumber,
  unityCategoryForRole, inferAssetKind, fileIcon,
  toLocalDateTimeInput, fromLocalDateTimeInput,
  activityVerb, reviewActionBadge,
} from "@/lib/utils/dashboard";
import {
  AudioInspectorPanel,
  ImageAnnotationPanel,
  ModelPreviewCanvas,
  TextureInspectorPanel,
  VersionComparePanel,
} from "@/components/inspectors";

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
  const [stats, setStats] = useState({ totalMembers: 0, totalAssets: 0, pendingReview: 0, approved: 0 });
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [libraryPagination, setLibraryPagination] = useState({ page: 1, total_pages: 1, total: 0, has_prev: false, has_next: false });
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
  const [activatingVersionId, setActivatingVersionId] = useState<string | null>(null);
  const [assetQaGuidance, setAssetQaGuidance] = useState<any>(null);
  const [qaGuideLoading, setQaGuideLoading] = useState(false);
  const [qaProfile, setQaProfile] = useState<"mobile" | "pc" | "console">("pc");
  const [creatingQaTaskKey, setCreatingQaTaskKey] = useState<string | null>(null);
  const [qaTasks, setQaTasks] = useState<any[]>([]);
  const [qaTaskLoading, setQaTaskLoading] = useState(false);
  const [updatingQaTaskId, setUpdatingQaTaskId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [unityActiveAssets, setUnityActiveAssets] = useState<any[]>([]);
  const [unityActiveLoading, setUnityActiveLoading] = useState(false);
  const [unityActiveError, setUnityActiveError] = useState<string | null>(null);
  const [unitySyncHealth, setUnitySyncHealth] = useState<any>(null);
  const [unitySyncHealthError, setUnitySyncHealthError] = useState<string | null>(null);

  // ── UI State ──
  const [loading, setLoading] = useState(true);
  const [libFilter, setLibFilter] = useState("all");
  const [libSearch, setLibSearch] = useState("");
  const [libPage, setLibPage] = useState(1);
  const [showNotifs, setShowNotifs] = useState(false);
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
  const [queueFilter, setQueueFilter] = useState<"all" | "critical" | "breach" | "at_risk" | "healthy">("all");
  const [queueQaFilter, setQueueQaFilter] = useState<"all" | "blocked" | "risky" | "ready">("all");
  const [queueInsights, setQueueInsights] = useState<any>(null);
  const [queuePolicy, setQueuePolicy] = useState<any>(null);
  const [imageInspectorTab, setImageInspectorTab] = useState<"inspect" | "compare" | "annotate">("inspect");
  const [annotationRefreshTick, setAnnotationRefreshTick] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [reviewHistoryFilter, setReviewHistoryFilter] = useState<"all" | "ownership" | "escalation" | "routing" | "decision">("all");

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
        const [s, p, q, qp, qi, l, m, a, n, b, r, fld, unityActive, syncHealth] = await Promise.all([
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
          setUnityActiveError((unityActive as any).error || "Unity sync unavailable");
        } else {
          setUnityActiveAssets((unityActive as any)?.assets || []);
          setUnityActiveError(null);
        }
        if ((syncHealth as any)?.error) {
          setUnitySyncHealth(null);
          setUnitySyncHealthError((syncHealth as any).error || "Sync health unavailable");
        } else {
          setUnitySyncHealth(syncHealth || null);
          setUnitySyncHealthError(null);
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
          setUnityActiveError((unityActive as any).error || "Unity sync unavailable");
        } else {
          setUnityActiveAssets((unityActive as any)?.assets || []);
          setUnityActiveError(null);
        }
        if ((syncHealth as any)?.error) {
          setUnitySyncHealth(null);
          setUnitySyncHealthError((syncHealth as any).error || "Sync health unavailable");
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
          pendingReview: assets.filter((x: any) => x.status === "in_review").length,
          approved: assets.filter((x: any) => x.status === "approved").length,
        });
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    setUnityActiveLoading(false);
    setLoading(false);
  }, [token, sessionUser?.role]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!inviteMenuRef.current) return;
      if (!inviteMenuRef.current.contains(e.target as Node)) setShowInviteMenu(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Library reload ──
  const loadLibrary = useCallback(async () => {
    if (!token) return;
    const data = await api.fetchLibrary(token, { page: libPage, status: libFilter, search: libSearch });
    setLibraryAssets(data.assets || []);
    setLibraryPagination(data.pagination || {});
  }, [token, libPage, libFilter, libSearch]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  // ── Actions ──
  const isAssetLockedByOther = (asset: any) => {
    const lock = asset?.metadata?.lock_intent;
    if (!lock || !lock.locked) return { blocked: false };
    const lockOwnerId = String(lock.user_id || "");
    const lockOwnerName = String(lock.user_name || "");
    if (currentUserId && lockOwnerId && currentUserId === lockOwnerId) return { blocked: false };
    if (!currentUserId && currentUserName && lockOwnerName && currentUserName === lockOwnerName) return { blocked: false };
    return { blocked: true, owner: lockOwnerName || "another user" };
  };

  const handleApprove = async (asset: any) => {
    if (!token) return;
    const lockInfo = isAssetLockedByOther(asset);
    let force = false;
    if (lockInfo.blocked) {
      if (canForceLockIntent) {
        const ok = window.confirm(`Asset locked by ${lockInfo.owner}. Force approve?`);
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
    const target = (reviewQueue.find((a: any) => String(a.id) === String(rejectingId))
      || pendingAssets.find((a: any) => String(a.id) === String(rejectingId))
      || libraryAssets.find((a: any) => String(a.id) === String(rejectingId)));
    const lockInfo = target ? isAssetLockedByOther(target) : { blocked: false };
    let force = false;
    if (lockInfo.blocked) {
      if (canForceLockIntent) {
        const ok = window.confirm(`Asset locked by ${lockInfo.owner}. Force reject?`);
        if (!ok) return;
        force = true;
      } else {
        setToast(`Locked by ${lockInfo.owner}. Ask owner or lead to unlock.`);
        return;
      }
    }
    const res = await api.rejectAsset(token, rejectingId, rejectReason, { force });
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
    const res = await api.autoRouteReviewQueue(token, { execute: true, limit: 10 });
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
    setToast(`SLA sweep: escalated ${res.escalated_count}, rerouted ${res.rerouted_count}`);
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
    const res = await api.releaseAssetLockIntent(token, inspectAsset.id, { force });
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
          version_state: String(inspectAsset.id) === String(versionId) ? "active" : "inactive",
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
          version_state: String(prev.id) === String(versionId) ? "active" : "inactive",
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
          version_state: String(inspectAsset.id) === String(versionId) ? "active" : "inactive",
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
          version_state: String(prev.id) === String(versionId) ? "active" : "inactive",
        },
      };
    });
    setActivatingVersionId(null);
    setToast("Rollback applied");
  };

  const handleUpdateQaTaskStatus = async (task: any, next: "open" | "in_progress" | "done") => {
    if (!token || !inspectAsset?.id || !task?.id) return;
    setUpdatingQaTaskId(task.id);
    const statusTag = next === "in_progress" ? "IN_PROGRESS" : next.toUpperCase();
    let text = String(task.raw_text || task.text || "");
    if (/\[(OPEN|IN_PROGRESS|DONE)\]/i.test(text)) {
      text = text.replace(/\[(OPEN|IN_PROGRESS|DONE)\]/i, `[${statusTag}]`);
    } else {
      text = `[${statusTag}] ${text}`;
    }
    const res = await api.updateAssetAnnotation(token, inspectAsset.id, task.id, {
      text,
      resolved: next === "done",
    });
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
        token, newRuleType, newRuleConfig, newRuleSeverity,
        newRuleFolderId || undefined
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
      setToast(`Error: ${e.message || 'Network error'}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!token) return;
    const ok = await api.deleteRule(token, ruleId);
    if (ok) {
      setToast("Rule deleted");
      setRules(prev => prev.filter(r => r.id !== ruleId));
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
    api.fetchAssetQaGuidance(token, inspectAsset.id, qaProfile)
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
    api.fetchAssetAnnotations(token, inspectAsset.id)
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
  const inspectKind = inspectAsset ? inferAssetKind(inspectAsset, assetMeta?.metadata) : "other";
  const conversionStatus = assetMeta?.metadata?.conversion?.status || null;
  const convertedReady = assetMeta?.metadata?.conversion?.status === "ready";
  const inspectFormat = convertedReady
    ? "glb"
    : (String(assetMeta?.metadata?.format || getFilenameExtension(inspectAsset?.filename))).toLowerCase();
  const canRender3DPreview =
    inspectKind === "3d" &&
    MODEL_PREVIEWABLE_FORMATS.has(inspectFormat) &&
    Boolean(inspectAsset?.preview_url);
  const isLead = (sessionUser?.role || "").toLowerCase() === "lead";
  const canManageAnnotations = isLead || (sessionUser?.role || "") === "Technical_Art";
  const canForceLockIntent = isLead || (sessionUser?.role || "") === "Technical_Art";
  const canManageVersions = isLead || (sessionUser?.role || "") === "Technical_Art";
  const activeLockIntent = (() => {
    const raw = assetMeta?.metadata?.lock_intent || inspectAsset?.metadata?.lock_intent || null;
    if (!raw || typeof raw !== "object") return null;
    return raw;
  })();
  const currentUserId = String(sessionUser?.id || "");
  const currentUserName = String(sessionUser?.name || "");
  const isLockHeld = Boolean(activeLockIntent?.locked);
  const lockOwnerId = String(activeLockIntent?.user_id || "");
  const lockOwnerName = String(activeLockIntent?.user_name || "");
  const lockHeldByCurrentUser = Boolean(
    isLockHeld && (
      (currentUserId && lockOwnerId && currentUserId === lockOwnerId) ||
      (!currentUserId && currentUserName && lockOwnerName && currentUserName === lockOwnerName)
    )
  );
  const lockHeldByOther = Boolean(isLockHeld && !lockHeldByCurrentUser);
  const memberName = (sessionUser?.name || "").trim();
  const memberAssets = (() => {
    if (!libraryAssets?.length) return [];
    if (isLead) return libraryAssets;
    if (sessionUser?.id) {
      return libraryAssets.filter((a: any) => String(a.uploader_id || "") === String(sessionUser.id));
    }
    if (memberName) {
      return libraryAssets.filter((a: any) => (a.uploader_name || "").trim().toLowerCase() === memberName.toLowerCase());
    }
    return libraryAssets;
  })();
  const versionsForBase = (() => {
    if (!inspectAsset) return [];
    const source = assetVersions.length > 0 ? assetVersions : libraryAssets;
    const currentBase = normalizeVersionBase(inspectAsset.filename);
    return (source || []).filter((a: any) => normalizeVersionBase(a?.filename) === currentBase);
  })();
  const sortedVersions = [...versionsForBase].sort((a: any, b: any) => {
    const av = extractVersionNumber(a?.filename);
    const bv = extractVersionNumber(b?.filename);
    if (av !== null && bv !== null) return bv - av;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  const activeVersionId = (() => {
    const fromList = sortedVersions.find((v: any) => v?.metadata?.version_state === "active");
    if (fromList?.id) return String(fromList.id);
    const fromMeta = assetMeta?.metadata?.active_version_asset_id || inspectAsset?.metadata?.active_version_asset_id;
    return fromMeta ? String(fromMeta) : null;
  })();
  const unityContractAsset = (() => {
    if (!inspectAsset) return null;
    const byGuid = (unityActiveAssets || []).find((x: any) => String(x?.guid) === String(inspectAsset.id));
    if (byGuid) return byGuid;
    if (activeVersionId) {
      const byActive = (unityActiveAssets || []).find((x: any) => String(x?.active_version_asset_id || "") === String(activeVersionId));
      if (byActive) return byActive;
    }
    return null;
  })();
  const unityCategory = String(unityContractAsset?.unity_category || unityContractAsset?.category || unityCategoryForRole(inspectAsset?.uploader_role || inspectAsset?.uploaderRole || ""));
  const unityTargetPath = String(unityContractAsset?.unity_target_path || (inspectAsset?.filename
    ? `Assets/${unityCategory}/${inspectAsset.filename}`
    : `Assets/${unityCategory}`));
  const lineageIndex = sortedVersions.findIndex((v: any) => String(v?.id) === String(inspectAsset?.id));
  const lineagePrev = lineageIndex >= 0 ? sortedVersions[lineageIndex + 1] : null;
  const lineageNext = lineageIndex >= 0 ? sortedVersions[lineageIndex - 1] : null;
  const compareAsset = (() => {
    if (!inspectAsset || inspectKind !== "image") return null;
    const source = assetVersions.length > 0 ? assetVersions : libraryAssets;
    const currentBase = normalizeVersionBase(inspectAsset.filename);
    const currentVersion = extractVersionNumber(inspectAsset.filename);
    const sameBase = (source || []).filter((a: any) =>
      a?.id !== inspectAsset.id &&
      a?.preview_url &&
      normalizeVersionBase(a?.filename) === currentBase
    );
    if (sameBase.length === 0) return null;

    if (currentVersion !== null) {
      const lower = sameBase
        .filter((a: any) => {
          const v = extractVersionNumber(a.filename);
          return v !== null && v < currentVersion;
        })
        .sort((a: any, b: any) => (extractVersionNumber(b.filename) || 0) - (extractVersionNumber(a.filename) || 0));
      if (lower.length > 0) return lower[0];
    }

    const currentTime = new Date(inspectAsset.created_at || 0).getTime();
    const older = sameBase
      .filter((a: any) => new Date(a.created_at || 0).getTime() < currentTime)
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (older.length > 0) return older[0];

    return sameBase.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
  })();
  const riskSummary = (() => {
    if (assetMeta?.risk?.score !== undefined && assetMeta?.risk?.label) {
      const score = Number(assetMeta.risk.score) || 0;
      const label = String(assetMeta.risk.label || "low").toLowerCase();
      if (label === "high") return { label: "High Risk", score, cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20" };
      if (label === "medium") return { label: "Medium Risk", score, cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20" };
      return { label: "Low Risk", score, cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" };
    }
    const v = assetMeta?.violations || [];
    if (!Array.isArray(v) || v.length === 0) {
      return { label: "Low Risk", score: 12, cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" };
    }
    const err = v.filter((x: any) => x?.severity === "error").length;
    const warn = v.filter((x: any) => x?.severity !== "error").length;
    const score = Math.min(100, err * 35 + warn * 12 + 8);
    if (score >= 70) return { label: "High Risk", score, cls: "bg-rose-500/10 text-rose-400 ring-rose-500/20" };
    if (score >= 35) return { label: "Medium Risk", score, cls: "bg-amber-500/10 text-amber-400 ring-amber-500/20" };
    return { label: "Low Risk", score, cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" };
  })();
  const queueScope = (reviewQueue.length ? reviewQueue : pendingAssets) || [];
  const cockpit = (() => {
    const critical = queueScope.filter((a: any) => (a.sla_state || "") === "critical" || ageHours(a.created_at) >= 48).length;
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
          .sort((a: number, b: number) => a - b)[Math.floor(queueScope.length / 2)]
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
    const blocked = queueScope.filter((q: any) => qaGateState(q) === "blocked").length;
    const risky = queueScope.filter((q: any) => qaGateState(q) === "risky").length;
    const ready = queueScope.filter((q: any) => qaGateState(q) === "ready").length;
    return { blocked, risky, ready, total: queueScope.length };
  })();
  const filteredQueue = reviewQueue.filter((q: any) => {
    const slaOk = queueFilter === "all" ? true : q.sla_state === queueFilter;
    const qaOk = queueQaFilter === "all" ? true : qaGateState(q) === queueQaFilter;
    return slaOk && qaOk;
  });
  const filteredReviewHistory = reviewHistory.filter((ev: any) => {
    const a = String(ev?.action || "");
    if (reviewHistoryFilter === "all") return true;
    if (reviewHistoryFilter === "ownership") return a === "review_assignment_set" || a === "asset_lock_intent_set" || a === "asset_lock_intent_released";
    if (reviewHistoryFilter === "escalation") return a === "queue_escalation" || a === "queue_owner_escalation";
    if (reviewHistoryFilter === "routing") return a === "auto_route_review";
    if (reviewHistoryFilter === "decision") return a === "approve_asset" || a === "reject_asset" || a === "submit_review";
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
      {/* ── SHARED NAV ─────────────────── */}
      <DashboardNav
        studioName={studio.name || "Studio"}
        role={sessionUser?.role || "member"}
        isEnterprise={billing?.plan?.startsWith('enterprise') || false}
        onSearch={handleSearch}
        showSearch={true}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onLogout={logout}
      />

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!isLead ? (
          <>
            {/* ── Member Welcome Header ── */}
            <section className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#EDEDED] mb-1">
                    Welcome back, {memberName || "Member"}
                  </h1>
                  <p className="text-xs text-[#52525B]">
                    {(sessionUser?.role || "member").replace(/_/g, " ")} &middot; {studio.slug || sessionUser?.workspace || "Studio"}
                  </p>
                </div>
                <a
                  href="/dashboard/upload"
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                  Upload Assets
                </a>
              </div>
            </section>

            {/* ── Member Quick Stats ── */}
            <section className="grid grid-cols-4 gap-3 mb-8 stagger">
              {[
                { label: "My Uploads", value: memberAssets.length, icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "In Review", value: memberAssets.filter((a: any) => a.status === "in_review").length, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Approved", value: memberAssets.filter((a: any) => a.status === "approved").length, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Staging", value: memberAssets.filter((a: any) => a.status === "staging").length, icon: Layers, color: "text-purple-400", bg: "bg-purple-500/10" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4 hover:border-[#27272A] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">{label}</span>
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-[#EDEDED]">{value}</span>
                </div>
              ))}
            </section>

            {/* ── Quick Upload Zone ── */}
            <section className="mb-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingUpload(true);
                }}
                onDragLeave={() => setIsDraggingUpload(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingUpload(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleMemberUploadFile(file);
                }}
                className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                  isDraggingUpload
                    ? "border-blue-500 bg-blue-500/5 scale-[1.005]"
                    : "border-[#27272A] bg-[#121212] hover:border-[#3F3F46] hover:bg-[#141414]"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-colors ${
                  isDraggingUpload ? "bg-blue-500/10" : "bg-white/[0.04]"
                }`}>
                  <Upload className={`w-5 h-5 transition-colors ${isDraggingUpload ? "text-blue-400" : "text-[#52525B]"}`} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-[#A1A1AA] mb-1">
                  {isDraggingUpload ? "Drop to upload" : "Quick Upload"}
                </p>
                <p className="text-xs text-[#52525B] mb-3">Drag & drop a file or click to browse</p>
                <button
                  onClick={() => memberUploadInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </button>
                <input
                  ref={memberUploadInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMemberUploadFile(file);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </section>

            {/* ── My Uploads Table ── */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                  <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">My Uploads</h2>
                  {memberAssets.length > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                      {memberAssets.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A] text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">
                  <span />
                  <span>Name</span>
                  <span>Size</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {memberAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-[#27272A]" strokeWidth={1} />
                    </div>
                    <p className="text-sm font-medium text-[#52525B]">No uploads yet</p>
                    <p className="text-xs text-[#3F3F46] mt-1">Upload your first asset using the drop zone above</p>
                  </div>
                ) : (
                  memberAssets.map((a: any) => {
                    const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                    const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
                    return (
                      <div key={a.id} className="grid grid-cols-[40px_1fr_80px_90px_120px] gap-3 px-5 py-3 border-b border-[#1E1E1E]/50 last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                        <div className="w-10 h-10 rounded-lg bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center">
                          {isImg && a.preview_url ? (
                            <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                          )}
                        </div>
                        <button onClick={() => openInspector(a)} className="text-left min-w-0">
                          <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                          <p className="text-[10px] text-[#52525B]">{a.created_at ? timeAgo(a.created_at) : ""}</p>
                        </button>
                        <span className="text-xs text-[#71717A] font-mono">{formatSize(a.file_size_kb)}</span>
                        <StatusBadge status={a.status} />
                        {a.status === "staging" ? (
                          <button
                            onClick={() => handleMemberSubmitReview(a)}
                            className="justify-self-start px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            Submit Review
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#52525B]">{a.status === "in_review" ? "Waiting lead" : "—"}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        ) : (
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
            <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Decision Cockpit</h2>
            <span className="text-[10px] text-[#3F3F46] ml-auto">
              SLA: {queuePolicy?.at_risk_hours ?? 8}h at risk · {queuePolicy?.breach_hours ?? 24}h breach · {queuePolicy?.critical_hours ?? 48}h critical
            </span>
          </div>

          {/* SLA Status Row */}
          <div className="grid grid-cols-5 gap-3 mb-3 stagger">
            {[
              { label: "Critical", value: cockpit.critical, color: "text-fuchsia-300", ring: "ring-fuchsia-500/20", bg: "bg-fuchsia-500/5", dot: "bg-fuchsia-400" },
              { label: "SLA Breach", value: cockpit.overdue, color: "text-rose-400", ring: "ring-rose-500/20", bg: "bg-rose-500/5", dot: "bg-rose-400" },
              { label: "At Risk", value: cockpit.atRisk, color: "text-amber-400", ring: "ring-amber-500/20", bg: "bg-amber-500/5", dot: "bg-amber-400" },
              { label: "Healthy", value: cockpit.healthy, color: "text-emerald-400", ring: "ring-emerald-500/20", bg: "bg-emerald-500/5", dot: "bg-emerald-400" },
              { label: "Median Time", value: `${cockpit.medianReviewHours.toFixed(1)}h`, color: "text-[#EDEDED]", ring: "ring-[#27272A]", bg: "bg-[#121212]", dot: "bg-blue-400" },
            ].map(({ label, value, color, ring, bg, dot }) => (
              <div key={label} className={`rounded-xl border border-[#1E1E1E] ${bg} p-4 ring-1 ${ring}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#52525B]">{label}</span>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* QA Gate + Insights Row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "QA Blocked", value: qaGate.blocked, color: "text-rose-400", icon: "x" },
              { label: "QA Risky", value: qaGate.risky, color: "text-amber-400", icon: "!" },
              { label: "QA Ready", value: qaGate.ready, color: "text-emerald-400", icon: "check" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
                <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">{label}</span>
                <p className={`text-xl font-bold tracking-tight mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Escalation + Bottleneck Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">Escalation</span>
              <p className="text-xl font-bold tracking-tight mt-1 text-rose-400">
                {queueInsights?.escalation_needed ?? queueScope.filter((q: any) => q.escalation_needed).length}
              </p>
            </div>
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">Unassigned</span>
              <p className="text-xl font-bold tracking-tight mt-1 text-fuchsia-300">{queueInsights?.owner_sla?.unassigned ?? 0}</p>
            </div>
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">Owner Overdue</span>
              <p className="text-xl font-bold tracking-tight mt-1 text-rose-400">{queueInsights?.owner_sla?.overdue ?? 0}</p>
            </div>
            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46]">Top Bottleneck</span>
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
            { label: "Members", value: stats.totalMembers, icon: Users, color: "text-[#3B82F6]" },
            { label: "Total Assets", value: stats.totalAssets, icon: Package, color: "text-[#A1A1AA]" },
            { label: "Pending", value: stats.pendingReview, icon: Clock, color: "text-[#F59E0B]" },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-[#10B981]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="group p-5 rounded-xl bg-[#121212] border border-[#1E1E1E] hover:border-[#27272A] transition-all duration-200 cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#52525B]">
                  {label}
                </span>
                <Icon className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-80 transition-opacity`} strokeWidth={1.5} />
              </div>
              <span className="text-3xl font-light tracking-tight text-[#EDEDED]">
                {loading ? <span className="skeleton inline-block w-10 h-8" /> : value}
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
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Pending Review</h2>
              {pendingAssets.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                  {pendingAssets.length}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {loading ? (
                <div className="space-y-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
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
                  <CheckCircle2 className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                  <p className="text-sm font-medium text-[#52525B]">All caught up</p>
                  <p className="text-xs text-[#3F3F46] mt-1">No assets pending review</p>
                </div>
              ) : (
                <div>
                  {(reviewQueue.length ? reviewQueue : pendingAssets).slice(0, 6).map((a: any) => {
                    const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                    const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "");
                    const lockInfo = isAssetLockedByOther(a);
                    const lockBlocked = lockInfo.blocked && !canForceLockIntent;
                    const sla = a.sla_state
                      ? {
                          label: a.sla_state === "critical" ? "Critical" : a.sla_state === "breach" ? "SLA Breach" : a.sla_state === "at_risk" ? "At Risk" : "Healthy",
                          cls: a.sla_state === "critical"
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
                            <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                          <p className="text-xs text-[#52525B] mt-0.5">
                            {a.uploader_name || "Unknown"} · {formatSize(a.file_size_kb)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end mr-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${sla.cls}`}>
                            {sla.label}
                          </span>
                          <span className="text-[10px] text-[#52525B] mt-1">
                            {(typeof a.age_hours === "number" ? a.age_hours : ageHours(a.created_at)).toFixed(1)}h
                          </span>
                          {typeof a.priority_score === "number" && (
                            <span className="text-[10px] text-[#3B82F6] mt-1">P{a.priority_score}</span>
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
                            title={lockBlocked ? `Locked by ${lockInfo.owner}` : "Approve"}
                          >
                            <Check className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => { setRejectingId(a.id); setRejectReason(""); }}
                            disabled={lockBlocked}
                            className={`p-1.5 rounded-md transition-colors ${
                              lockBlocked
                                ? "text-[#3F3F46] cursor-not-allowed"
                                : "hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400"
                            }`}
                            title={lockBlocked ? `Locked by ${lockInfo.owner}` : "Reject"}
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
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Activity</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
              {loading ? (
                <div className="space-y-0">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                      <div className="skeleton w-6 h-6 rounded-full" />
                      <div className="skeleton h-3 flex-1" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                  <p className="text-xs text-[#52525B]">No activity yet</p>
                </div>
              ) : (
                <div>
                  {activities.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#18181B] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {activityIcon(a.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          <span className="font-medium text-[#EDEDED]">{a.user_name || "Someone"}</span>
                          {" "}{activityVerb(a.action)}{" "}
                          {a.metadata?.filename && <span className="text-[#71717A] font-mono text-[11px]">{a.metadata.filename}</span>}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#3F3F46] whitespace-nowrap mt-0.5">{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Operational Queue</h2>
              <span className="text-xs text-[#52525B]">{reviewQueue.length}</span>
              <button
                onClick={() => setShowQueueGlossary((p) => !p)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#A1A1AA] hover:text-[#EDEDED] bg-white/[0.02] hover:bg-white/[0.05] ring-1 ring-white/[0.07] transition-colors"
                title="Queue terms and definitions"
              >
                <Info className="w-3.5 h-3.5" strokeWidth={1.7} />
                {showQueueGlossary ? "Hide Guide" : "Queue Guide"}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAutoRoute}
                disabled={isAutoRouting || reviewQueue.length === 0}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                  isAutoRouting || reviewQueue.length === 0
                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                    : "bg-[#3B82F6]/15 text-[#93C5FD] ring-1 ring-[#3B82F6]/30 hover:bg-[#3B82F6]/25"
                }`}
              >
                {isAutoRouting ? "Routing..." : "Auto Route"}
              </button>
              <button
                onClick={handleRunEscalation}
                disabled={isEscalatingQueue || reviewQueue.length === 0}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                  isEscalatingQueue || reviewQueue.length === 0
                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                    : "bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20"
                }`}
              >
                {isEscalatingQueue ? "Escalating..." : "Run Escalation"}
              </button>
              <button
                onClick={handleSlaSweep}
                disabled={isSlaSweeping || reviewQueue.length === 0}
                className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                  isSlaSweeping || reviewQueue.length === 0
                    ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                    : "bg-fuchsia-500/12 text-fuchsia-300 ring-1 ring-fuchsia-500/30 hover:bg-fuchsia-500/20"
                }`}
              >
                {isSlaSweeping ? "Sweeping..." : "SLA Sweep"}
              </button>
              <button
                onClick={() => setShowPolicyModal(true)}
                className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide bg-white/[0.04] text-[#A1A1AA] ring-1 ring-white/[0.08] hover:bg-white/[0.08] hover:text-[#EDEDED] transition-colors"
              >
                Edit Policy
              </button>
              {(["all", "critical", "breach", "at_risk", "healthy"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                    queueFilter === f
                      ? "bg-white/[0.08] text-[#EDEDED]"
                      : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                  }`}
                >
                  {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f === "critical" ? "Critical" : f}
                </button>
              ))}
              <div className="w-px h-4 bg-[#27272A]" />
              {(["all", "blocked", "risky", "ready"] as const).map((f) => (
                <button
                  key={`qa-${f}`}
                  onClick={() => setQueueQaFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                    queueQaFilter === f
                      ? "bg-white/[0.08] text-[#EDEDED]"
                      : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                  }`}
                >
                  {f === "all" ? "QA: All" : f}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showQueueGlossary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                      <p className="text-[11px] text-[#EDEDED] font-medium mb-1">SLA States</p>
                      <p className="text-[10px] text-[#71717A]">`Healthy`: age &lt; {queuePolicy?.at_risk_hours ?? 8}h</p>
                      <p className="text-[10px] text-[#71717A]">`At Risk`: age ≥ {queuePolicy?.at_risk_hours ?? 8}h and &lt; {queuePolicy?.breach_hours ?? 24}h</p>
                      <p className="text-[10px] text-[#71717A]">`Breach`: age ≥ {queuePolicy?.breach_hours ?? 24}h and &lt; {queuePolicy?.critical_hours ?? 48}h</p>
                      <p className="text-[10px] text-[#71717A]">`Critical`: age ≥ {queuePolicy?.critical_hours ?? 48}h (highest urgency lane)</p>
                    </div>
                    <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3">
                      <p className="text-[11px] text-[#EDEDED] font-medium mb-1">QA Gate States</p>
                      <p className="text-[10px] text-[#71717A]">`Ready`: no rule violations, safe to review/approve.</p>
                      <p className="text-[10px] text-[#71717A]">`Risky`: warnings exist, review allowed but dikkat gerekir.</p>
                      <p className="text-[10px] text-[#71717A]">`Blocked`: one or more error violations, normalde fix gerekli.</p>
                      <p className="text-[10px] text-[#71717A]">`Escalation Needed`: SLA Breach/Critical veya QA Blocked.</p>
                    </div>
                    <div className="rounded-lg border border-[#27272A] bg-[#0A0A0A] p-3 col-span-2">
                      <p className="text-[11px] text-[#EDEDED] font-medium mb-1">Scoring & Actions</p>
                      <p className="text-[10px] text-[#71717A]">
                        `Priority (Pxx)` = yaş + dosya boyutu ağırlıklı operasyon skoru. `Auto Route` önerilen reviewer'a dağıtır.
                        `Run Escalation` ise policy + cooldown kurallarıyla kritik item'lar için uyarı üretir.
                      </p>
                      <p className="text-[10px] text-[#71717A] mt-1">
                        Owner SLA: `Unassigned`, `No Due Date`, `On Track`, `Due Soon`, `Owner Overdue`.
                      </p>
                      <p className="text-[10px] text-[#71717A] mt-1">
                        `SLA Sweep`: owner overdue item'larda otomatik reroute + escalation tetikler.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            <div className="grid grid-cols-[1fr_90px_80px_70px_170px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
              <span>Asset</span>
              <span>Priority</span>
              <span>QA Gate</span>
              <span>SLA</span>
              <span>Action</span>
            </div>
            {filteredQueue
              .slice(0, 12)
              .map((q: any) => {
                const lockInfo = isAssetLockedByOther(q);
                const lockBlocked = lockInfo.blocked && !canForceLockIntent;
                const sla = q.sla_state
                  ? {
                      label: q.sla_state === "critical" ? "Critical" : q.sla_state === "breach" ? "Breach" : q.sla_state === "at_risk" ? "At Risk" : "Healthy",
                      cls: q.sla_state === "critical"
                        ? "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/25"
                        : q.sla_state === "breach"
                          ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                          : q.sla_state === "at_risk"
                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                    }
                  : slaState(q.created_at);
                const qa = qaGateBadge(qaGateState(q));
                return (
                  <div key={`queue-${q.id}`} className="grid grid-cols-[1fr_90px_80px_70px_170px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 items-center hover:bg-white/[0.02]">
                    <button onClick={() => openInspector(q)} className="text-left min-w-0">
                      <p className="text-sm font-medium text-[#EDEDED] truncate">{q.filename}</p>
                      <p className="text-[10px] text-[#52525B]">
                        {q.uploader_name || "Unknown"} · {q.age_hours?.toFixed?.(1) || ageHours(q.created_at).toFixed(1)}h
                      </p>
                      <p className="text-[10px] text-[#A1A1AA]">
                        Owner: {q.review_assignment?.assignee_name || "Unassigned"}
                        {q.review_assignment?.due_at ? ` · ${dueLabel(q.review_assignment.due_at)}` : ""}
                      </p>
                      {q.reviewer_suggestion?.name && (
                        <p className="text-[10px] text-[#60A5FA]">
                          Route → {q.reviewer_suggestion.name} ({q.reviewer_suggestion.role})
                        </p>
                      )}
                    </button>
                    <span className="text-xs font-semibold text-[#60A5FA]">P{q.priority_score ?? "—"}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${qa.cls}`}>{qa.label}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${sla.cls}`}>{sla.label}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${ownerSlaBadge(q.owner_sla_state).cls}`}>
                        {ownerSlaBadge(q.owner_sla_state).label}
                      </span>
                      <button
                        onClick={() => openAssignModal(q)}
                        className="px-2.5 py-1 rounded text-[10px] bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleApprove(q)}
                        disabled={lockBlocked}
                        title={lockBlocked ? `Locked by ${lockInfo.owner}` : "Approve"}
                        className={`px-2.5 py-1 rounded text-[10px] ring-1 transition-colors ${
                          lockBlocked
                            ? "bg-[#18181B] text-[#3F3F46] ring-[#27272A] cursor-not-allowed"
                            : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(q.id); setRejectReason(""); }}
                        disabled={lockBlocked}
                        title={lockBlocked ? `Locked by ${lockInfo.owner}` : "Reject"}
                        className={`px-2.5 py-1 rounded text-[10px] ring-1 transition-colors ${
                          lockBlocked
                            ? "bg-[#18181B] text-[#3F3F46] ring-[#27272A] cursor-not-allowed"
                            : "bg-rose-500/10 text-rose-400 ring-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            {filteredQueue.length === 0 && (
              <div className="py-10 text-center text-xs text-[#52525B]">No queue items for this filter.</div>
            )}
          </div>
        </section>

        {/* ── ASSET LIBRARY ──────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Asset Library</h2>
              <span className="text-xs text-[#52525B]">{libraryPagination.total}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 mb-4">
            {["all", "staging", "in_review", "approved", "rejected"].map(f => (
              <button
                key={f}
                onClick={() => { setLibFilter(f); setLibPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  libFilter === f
                    ? "bg-white/[0.08] text-[#EDEDED]"
                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                }`}
              >
                {f === "all" ? "All" : f === "in_review" ? "Review" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3F3F46]">
              <span />
              <span>Name</span>
              <span>Uploader</span>
              <span>Size</span>
              <span>Status</span>
              <span>Time</span>
            </div>

            {loading ? (
              <div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0">
                    <div className="skeleton w-10 h-10 rounded-md" />
                    <div className="skeleton h-3 w-40 my-auto" />
                    <div className="skeleton h-3 w-16 my-auto" />
                    <div className="skeleton h-3 w-12 my-auto" />
                    <div className="skeleton h-3 w-14 my-auto" />
                    <div className="skeleton h-3 w-8 my-auto" />
                  </div>
                ))}
              </div>
            ) : libraryAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-8 h-8 text-[#27272A] mb-3" strokeWidth={1} />
                <p className="text-sm font-medium text-[#52525B]">No assets found</p>
                <p className="text-xs text-[#3F3F46] mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                {libraryAssets.map((a: any) => {
                  const ext = (a.filename || "").split(".").pop()?.toLowerCase();
                  const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
                  const rowLock = a?.metadata?.lock_intent;
                  const rowLocked = Boolean(rowLock?.locked);
                  return (
                    <div
                      key={a.id}
                      onClick={() => openInspector(a)}
                      className="grid grid-cols-[40px_1fr_120px_100px_80px_80px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {isImg && a.preview_url ? (
                          <img src={a.preview_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#3F3F46]">{fileIcon(a.file_type)}</span>
                        )}
                      </div>
                      <div className="flex items-center min-w-0">
                        <p className="text-sm font-medium text-[#EDEDED] truncate">{a.filename}</p>
                        {rowLocked && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
                            <Lock className="w-2.5 h-2.5" strokeWidth={1.8} />
                            {rowLock?.user_name ? `Locked by ${rowLock.user_name}` : "Locked"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[#52525B] truncate">{a.uploader_name || "—"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[#52525B] font-mono">{formatSize(a.file_size_kb)}</span>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center">
                        <span className="text-[10px] text-[#3F3F46]">{a.created_at ? timeAgo(a.created_at) : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {libraryPagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E1E1E]">
                <button
                  disabled={!libraryPagination.has_prev}
                  onClick={() => setLibPage(p => Math.max(1, p - 1))}
                  className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[10px] text-[#3F3F46] font-mono">
                  {libraryPagination.page} / {libraryPagination.total_pages}
                </span>
                <button
                  disabled={!libraryPagination.has_next}
                  onClick={() => setLibPage(p => p + 1)}
                  className="text-xs text-[#52525B] hover:text-[#A1A1AA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── FAZ 9: ASSET RULES ──────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Asset Rules</h2>
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
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Rule Type</label>
                      <select
                        value={newRuleType}
                        onChange={e => { setNewRuleType(e.target.value); setNewRuleConfig({}); }}
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
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Folder</label>
                      <select
                        value={newRuleFolderId}
                        onChange={e => setNewRuleFolderId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                      >
                        <option value="">All (Studio-wide)</option>
                        {folders.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Config based on type */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Value</label>
                      {(newRuleType === 'max_resolution' || newRuleType === 'min_resolution') && (
                        <div className="flex gap-1.5">
                          <input
                            type="number" placeholder="Width"
                            onChange={e => setNewRuleConfig(prev => ({ ...prev, [`${newRuleType === 'max_resolution' ? 'max' : 'min'}_width`]: parseInt(e.target.value) || 0 }))}
                            className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                          />
                          <input
                            type="number" placeholder="Height"
                            onChange={e => setNewRuleConfig(prev => ({ ...prev, [`${newRuleType === 'max_resolution' ? 'max' : 'min'}_height`]: parseInt(e.target.value) || 0 }))}
                            className="w-1/2 h-9 px-2 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                          />
                        </div>
                      )}
                      {newRuleType === 'allowed_formats' && (
                        <input
                          type="text" placeholder="png, jpg, webp"
                          onChange={e => setNewRuleConfig({ allowed_formats: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'max_file_size' && (
                        <input
                          type="number" placeholder="KB"
                          onChange={e => setNewRuleConfig({ max_file_size_kb: parseInt(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {(newRuleType === 'max_poly_count' || newRuleType === 'max_vertex_count') && (
                        <input
                          type="number" placeholder="Count"
                          onChange={e => setNewRuleConfig({ [newRuleType]: parseInt(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'naming_pattern' && (
                        <input
                          type="text" placeholder="^TX_.*"
                          onChange={e => setNewRuleConfig({ naming_pattern: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] font-mono focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'max_duration' && (
                        <input
                          type="number" placeholder="Seconds"
                          onChange={e => setNewRuleConfig({ max_duration_seconds: parseFloat(e.target.value) || 0 })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'aspect_ratio' && (
                        <input
                          type="text" placeholder="1:1 or 16:9"
                          onChange={e => setNewRuleConfig({ aspect_ratio: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'sample_rate' && (
                        <input
                          type="text" placeholder="44100, 48000"
                          onChange={e => setNewRuleConfig({ sample_rate: e.target.value.split(',').map(s => parseInt(s.trim())) })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        />
                      )}
                      {newRuleType === 'required_alpha' && (
                        <select
                          onChange={e => setNewRuleConfig({ required_alpha: e.target.value === 'true' })}
                          className="w-full h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:outline-none"
                        >
                          <option value="true">Required</option>
                          <option value="false">Not Required</option>
                        </select>
                      )}
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-[#52525B] mb-1.5 block">Severity</label>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setNewRuleSeverity('error')}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                            newRuleSeverity === 'error'
                              ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                              : 'bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]'
                          }`}
                        >
                          Block
                        </button>
                        <button
                          onClick={() => setNewRuleSeverity('warning')}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                            newRuleSeverity === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                              : 'bg-[#0A0A0A] text-[#52525B] border border-[#27272A] hover:text-[#A1A1AA]'
                          }`}
                        >
                          Warn
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRuleForm(false)} className="px-3 py-1.5 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.04] transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleCreateRule} className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] ring-1 ring-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors">
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
                <p className="text-sm font-medium text-[#52525B]">No rules defined</p>
                <p className="text-xs text-[#3F3F46] mt-1">Set upload rules for your folders</p>
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
                  <div key={r.id} className="grid grid-cols-[1fr_120px_120px_80px_40px] gap-3 px-4 py-2.5 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-[#EDEDED]">{r.rule_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-[#52525B] truncate">
                      {r.folder_id ? (folders.find((f: any) => f.id === r.folder_id)?.name || 'Folder') : 'All'}
                    </span>
                    <span className="text-xs text-[#71717A] font-mono truncate">
                      {JSON.stringify(r.rule_config).slice(1, -1).slice(0, 20)}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 w-fit ${
                      r.severity === 'error'
                        ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                    }`}>
                      {r.severity === 'error' ? 'Block' : 'Warn'}
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

        {/* ── BOTTOM ROW: TEAM + BILLING + UNITY ── */}
        <section className="grid grid-cols-3 gap-6 mb-10">

          {/* Team Members */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Team</h2>
              </div>
              {/* Inline invite */}
              <div className="relative" ref={inviteMenuRef}>
                <button
                  onClick={() => setShowInviteMenu(v => !v)}
                  className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {/* Invite dropdown */}
                <div className={`absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#121212] border border-[#27272A] shadow-xl shadow-black/40 transition-all z-10 ${
                  showInviteMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}>
                  {["2D_Artist", "3D_Modeler", "3D_Animator", "Technical_Art", "QA_Tester"].map(role => (
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
                  <UserPlus className="w-6 h-6 text-[#27272A] mb-2" strokeWidth={1} />
                  <p className="text-xs text-[#52525B]">Invite your first teammate</p>
                </div>
              ) : (
                members.map((m: any) => (
                  <div key={m.id || m.pin} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#52525B] flex-shrink-0">
                      {(m.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#EDEDED] truncate">{m.name || "Unclaimed"}</p>
                      <p className="text-[10px] text-[#52525B]">{m.role?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ${
                      m.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}>
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
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Plan</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              {billing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ring-1 ${
                      billing.plan === "pro"
                        ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        : billing.plan === "studio"
                        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20"
                    }`}>
                      {(billing.plan || "free").toUpperCase()}
                    </span>
                  </div>
                  {billing.usage && billing.limits && (
                    <div className="space-y-3">
                      {[
                        { label: "Members", current: billing.usage.member_count, max: billing.limits.max_members },
                        { label: "Assets", current: billing.usage.asset_count, max: billing.limits.max_assets },
                        { label: "Storage", current: Math.round(billing.usage.storage_bytes / 1024 / 1024), max: billing.limits.max_storage_mb, unit: "MB" },
                      ].map(({ label, current, max, unit }) => {
                        const unlimited = max === -1;
                        const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-[#52525B] uppercase tracking-wider">{label}</span>
                              <span className="text-[10px] text-[#71717A] font-mono">
                                {current}{unit || ""} / {unlimited ? "∞" : `${max}${unit || ""}`}
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
                  {billing.plan && !billing.plan.startsWith('enterprise') && (
                    <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                      <button
                        onClick={async () => {
                          const result = await api.createCheckout(token, 'enterprise_starter', 'monthly');
                          if (result?.checkout_url) window.open(result.checkout_url, '_blank');
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
                      >
                        Upgrade to Enterprise — $499/mo
                      </button>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-[#52525B]">SSO</span>
                        <span className="text-[10px] text-[#52525B]">•</span>
                        <span className="text-[10px] text-[#52525B]">Audit Log</span>
                        <span className="text-[10px] text-[#52525B]">•</span>
                        <span className="text-[10px] text-[#52525B]">Departments</span>
                        <span className="text-[10px] text-[#52525B]">•</span>
                        <span className="text-[10px] text-[#52525B]">500GB</span>
                      </div>
                    </div>
                  )}

                  {/* Enterprise badge */}
                  {billing.plan?.startsWith('enterprise') && (
                    <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] text-purple-400 font-medium">Enterprise features active</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-emerald-400">✓ SSO</span>
                        <span className="text-[10px] text-emerald-400">✓ Audit</span>
                        <span className="text-[10px] text-emerald-400">✓ Departments</span>
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
              <h2 className="text-sm font-semibold tracking-tight text-[#EDEDED]">Unity Plugin</h2>
            </div>

            <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-5">
              <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                Copy your session token and paste it into the Unity CoPilot plugin to sync approved assets.
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
                  {showToken ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
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
                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Active Sync Preview</span>
                  <span className="text-[10px] text-[#3F3F46]">{unityActiveAssets.length} active</span>
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
                  <p className="text-[10px] text-[#52525B]">No active assets yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {unityActiveAssets.slice(0, 6).map((a: any) => (
                      <div key={a.guid} className="flex items-center justify-between gap-2 rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#EDEDED] truncate">{a.name}</p>
                          <p className="text-[9px] text-[#3F3F46] truncate">{a.category} · {a.fileSize}</p>
                        </div>
                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] text-[#3F3F46] mt-2">Unity now pulls only active versions via `/api/engine/assets/active?engine=unity`.</p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Sync Health (24h)</span>
                  <span className="text-[10px] text-[#3F3F46]">
                    {unitySyncHealth ? `${Math.round((Number(unitySyncHealth.success_rate || 0)) * 100)}% success` : "n/a"}
                  </span>
                </div>
                {unitySyncHealthError ? (
                  <p className="text-[10px] text-rose-400">{unitySyncHealthError}</p>
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
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium ring-1 ${posture.cls}`}>
                              {posture.label}
                            </span>
                            <span className="text-[9px] text-[#52525B]">{posture.note}</span>
                          </div>
                          <p className="mt-1 text-[9px] text-[#71717A]">{unitySyncActionHint(unitySyncHealth)}</p>
                        </div>
                      );
                    })()}
	                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                        <p className="text-[9px] uppercase text-[#52525B]">Total</p>
                        <p className="text-[11px] text-[#EDEDED]">{unitySyncHealth.total_imports || 0}</p>
                      </div>
                      <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                        <p className="text-[9px] uppercase text-[#52525B]">Success</p>
                        <p className="text-[11px] text-emerald-300">{unitySyncHealth.success_count || 0}</p>
                      </div>
                      <div className="rounded-md border border-[#1E1E1E] bg-[#0A0A0A] px-2 py-1.5">
                        <p className="text-[9px] uppercase text-[#52525B]">Failed</p>
                        <p className="text-[11px] text-rose-300">{unitySyncHealth.failed_count || 0}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-[#52525B] mb-1">Avg duration: {Math.round(Number(unitySyncHealth.avg_duration_ms || 0))} ms</p>
                    <p className="text-[9px] text-[#52525B] mb-1">Avg retries: {Number(unitySyncHealth.avg_retry_count || 0).toFixed(2)} · Total retries: {unitySyncHealth.total_retries || 0}</p>
                    <p className="text-[9px] text-[#52525B] mb-1">
                      Sync runs: {unitySyncHealth?.sync_runs?.total || 0} · success {unitySyncHealth?.sync_runs?.success || 0} · failed {unitySyncHealth?.sync_runs?.failed || 0} · no-change {unitySyncHealth?.sync_runs?.no_changes || 0}
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
                        .sort((a: any, b: any) => Number(b.count || 0) - Number(a.count || 0))
                        .slice(0, 4)
                        .map((b: any) => (
                          <div key={`${b.reason_code}-${b.status}`} className="flex items-center justify-between text-[9px]">
                            <span className="text-[#71717A]">{b.reason_code}</span>
                            <span className="text-[#A1A1AA]">{b.count}</span>
                          </div>
                        ))}
                      {((unitySyncHealth.breakdown || []) as any[]).filter((b: any) => b?.status === "failed").length === 0 && (
                        <p className="text-[9px] text-emerald-300">No failures in last 24h.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
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

      {/* ── FAZ 10: ASSET INSPECTOR MODAL ────────── */}
      <AnimatePresence>
        {inspectAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeInspector}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-[#121212] border border-[#27272A] shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-[#3B82F6]" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-[#EDEDED]">Asset Inspector</span>
                </div>
                <button onClick={closeInspector} className="p-1.5 rounded-md hover:bg-white/[0.04] text-[#52525B] hover:text-[#A1A1AA] transition-colors">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Asset Info */}
              <div className="px-5 py-3 border-b border-[#1E1E1E] flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                  {fileIcon(inspectAsset.file_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <a href={`/dashboard/assets?id=${inspectAsset.id}`} className="text-sm font-medium text-[#EDEDED] hover:text-blue-400 transition-colors truncate block">
                    {inspectAsset.filename}
                  </a>
                  <p className="text-xs text-[#52525B]">{formatSize(inspectAsset.file_size_kb)} · {inspectAsset.uploader_name || 'Unknown'}</p>
                </div>
                <a
                  href={`/dashboard/assets?id=${inspectAsset.id}`}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#52525B] hover:text-[#EDEDED] transition-colors"
                  title="Open full page"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <StatusBadge status={inspectAsset.status} />
              </div>

              {/* FAZ 11: 3D Preview */}
              {inspectKind === "3d" && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] overflow-hidden h-64">
                    {canRender3DPreview ? (
                      <ModelPreviewCanvas
                        src={inspectAsset.preview_url}
                        format={inspectFormat}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center px-5">
                        <Box className="w-5 h-5 text-[#3F3F46] mb-2" strokeWidth={1.5} />
                        <p className="text-xs text-[#71717A]">
                          {conversionStatus === "pending"
                            ? "Model is converting to GLB for web preview..."
                            : "3D preview will be supported for this format soon."}
                        </p>
                        <p className="text-[10px] text-[#52525B] mt-1">
                          Current format: {inspectFormat || "unknown"} · Supported now: glb, gltf, obj, fbx
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#52525B] mt-2">FAZ 11 Preview (v2): React Three Fiber + Drei + PostProcessing.</p>
                </div>
              )}

              {inspectKind === "image" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <div className="flex items-center gap-1 mb-3">
                    {(["inspect", "compare", "annotate"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setImageInspectorTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide transition-colors ${
                          imageInspectorTab === tab
                            ? "bg-white/[0.08] text-[#EDEDED]"
                            : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {imageInspectorTab === "inspect" && (
                    <TextureInspectorPanel
                      imageUrl={inspectAsset.preview_url}
                      metadata={assetMeta?.metadata}
                    />
                  )}

                  {imageInspectorTab === "compare" && (
                    compareAsset?.preview_url ? (
                      <div className="space-y-3">
                        <VersionComparePanel
                          beforeUrl={compareAsset.preview_url}
                          afterUrl={inspectAsset.preview_url}
                          beforeLabel={compareAsset.filename || "Previous"}
                          afterLabel={inspectAsset.filename || "Current"}
                        />
                        {canManageVersions && (
                          <div className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0A0A0A] px-3 py-2">
                            <div>
                              <p className="text-[11px] text-[#A1A1AA]">Rollback target</p>
                              <p className="text-[10px] text-[#52525B] truncate">{compareAsset.filename}</p>
                            </div>
                            {activeVersionId && String(compareAsset.id) === String(activeVersionId) ? (
                              <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRollbackVersion(String(compareAsset.id))}
                                disabled={activatingVersionId === String(compareAsset.id)}
                                className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ring-1 ${
                                  activatingVersionId === String(compareAsset.id)
                                    ? "bg-white/[0.04] text-[#52525B] ring-white/[0.06] cursor-not-allowed"
                                    : "bg-amber-500/10 text-amber-200 ring-amber-500/20 hover:bg-amber-500/20"
                                }`}
                              >
                                {activatingVersionId === String(compareAsset.id) ? "Rolling..." : "Rollback"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#52525B]">
                        Version Compare: previous version not found in current asset page.
                      </p>
                    )
                  )}

                  {imageInspectorTab === "annotate" && (
                    <ImageAnnotationPanel
                      assetId={inspectAsset.id}
                      imageUrl={inspectAsset.preview_url}
                      token={token}
                      canCreate={canManageAnnotations}
                      canModerate={canManageAnnotations}
                      refreshKey={annotationRefreshTick}
                    />
                  )}
                </div>
              )}

              {inspectKind === "audio" && inspectAsset?.preview_url && (
                <div className="px-5 py-4 border-b border-[#1E1E1E]">
                  <AudioInspectorPanel audioUrl={inspectAsset.preview_url} />
                </div>
              )}

              {/* Metadata */}
              <div className="px-5 py-4">
                {metaLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-4 w-full rounded" />)}
                  </div>
                ) : assetMeta?.metadata ? (
                  <div className="space-y-4">
                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#3B82F6]/10 text-[#3B82F6] ring-1 ring-[#3B82F6]/20">
                        {assetMeta.metadata.type || 'Unknown'}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ring-1 ${riskSummary.cls}`}>
                        Risk {riskSummary.score} · {riskSummary.label}
                      </span>
                      {assetMeta.metadata.format && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-[#71717A] ring-1 ring-white/[0.06]">
                          {assetMeta.metadata.format}
                        </span>
                      )}
                    </div>

                    {/* Git-for-Artists Core: Lock Intent */}
                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {isLockHeld ? (
                            <Lock className="w-3.5 h-3.5 text-amber-300" strokeWidth={1.5} />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-300" strokeWidth={1.5} />
                          )}
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">Lock Intent</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${
                          isLockHeld
                            ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                        }`}>
                          {isLockHeld ? "Locked" : "Available"}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#71717A]">
                        {isLockHeld
                          ? `Owner: ${lockOwnerName || "unknown"}${activeLockIntent?.locked_at ? ` · ${timeAgo(activeLockIntent.locked_at)}` : ""}`
                          : "No active lock. Claim intent before major changes to avoid collisions."}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={lockIntentNote}
                          onChange={(e) => setLockIntentNote(e.target.value)}
                          placeholder="Lock note (optional): e.g. updating UV + naming"
                          className="flex-1 h-8 px-2 rounded bg-[#121212] border border-[#27272A] text-[11px] text-[#EDEDED] placeholder:text-[#3F3F46] focus:border-[#3F3F46] focus:outline-none"
                        />
                        {!isLockHeld ? (
                          <button
                            onClick={() => handleAcquireLockIntent(false)}
                            disabled={savingLockIntent}
                            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                              savingLockIntent
                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            Claim
                          </button>
                        ) : lockHeldByCurrentUser ? (
                          <button
                            onClick={() => handleReleaseLockIntent(false)}
                            disabled={savingLockIntent}
                            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                              savingLockIntent
                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20"
                            }`}
                          >
                            Release
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            {canForceLockIntent && (
                              <>
                                <button
                                  onClick={() => handleAcquireLockIntent(true)}
                                  disabled={savingLockIntent}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    savingLockIntent
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                                  }`}
                                >
                                  Force Claim
                                </button>
                                <button
                                  onClick={() => handleReleaseLockIntent(true)}
                                  disabled={savingLockIntent}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    savingLockIntent
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-500/20 hover:bg-zinc-500/20"
                                  }`}
                                >
                                  Force Unlock
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Version Core v2 */}
                    <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#60A5FA]" strokeWidth={1.5} />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">Version Core</span>
                        </div>
                        <span className="text-[10px] text-[#52525B]">{sortedVersions.length} versions</span>
                      </div>

                      <div className="mb-3 rounded-lg border border-[#1E1E1E] bg-[#0F0F12] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#52525B]">Unity Target</p>
                        <p className="text-[11px] text-[#EDEDED] truncate">{unityTargetPath}</p>
                        <p className="text-[9px] text-[#3F3F46]">Category: {unityCategory}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#52525B] mb-1">Lineage</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          {lineagePrev ? (
                            <button
                              onClick={() => openInspector(lineagePrev)}
                              className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#A1A1AA] hover:text-[#EDEDED] transition-colors"
                            >
                              ← {lineagePrev.filename}
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#3F3F46]">Start</span>
                          )}
                          <span className="px-2 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-200">
                            {inspectAsset?.filename || "Current"}
                          </span>
                          {lineageNext ? (
                            <button
                              onClick={() => openInspector(lineageNext)}
                              className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#A1A1AA] hover:text-[#EDEDED] transition-colors"
                            >
                              {lineageNext.filename} →
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-md border border-[#1E1E1E] bg-[#0F0F12] text-[#3F3F46]">Latest</span>
                          )}
                        </div>
                      </div>

                      {sortedVersions.length === 0 ? (
                        <p className="text-[11px] text-[#52525B]">No version history found for this asset.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {sortedVersions.map((v: any) => {
                            const isActive = activeVersionId ? String(v.id) === activeVersionId : false;
                            const isCurrent = String(v.id) === String(inspectAsset.id);
                            const versionNum = extractVersionNumber(v.filename);
                            return (
                              <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#1F1F22] bg-[#0F0F12] px-2.5 py-2">
                                <div className="min-w-0">
                                  <p className="text-[11px] text-[#EDEDED] truncate">
                                    {v.filename}
                                  </p>
                                  <p className="text-[10px] text-[#52525B]">
                                    {versionNum !== null ? `v${versionNum}` : "version"} · {formatSize(v.file_size_kb)} · {timeAgo(v.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isCurrent && (
                                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A1A1AA]">Current</span>
                                  )}
                                  {!isCurrent && (
                                    <button
                                      onClick={() => openInspector(v)}
                                      className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ring-1 bg-white/[0.03] text-[#A1A1AA] ring-white/[0.08] hover:bg-white/[0.06]"
                                    >
                                      Open
                                    </button>
                                  )}
                                  {isActive ? (
                                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">Active</span>
                                  ) : (
                                    canManageVersions && (
                                      <button
                                        onClick={() => handleActivateVersion(String(v.id))}
                                        disabled={activatingVersionId === String(v.id)}
                                        className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ring-1 ${
                                          activatingVersionId === String(v.id)
                                            ? "bg-white/[0.04] text-[#52525B] ring-white/[0.06] cursor-not-allowed"
                                            : "bg-blue-500/10 text-blue-200 ring-blue-500/20 hover:bg-blue-500/20"
                                        }`}
                                      >
                                        {activatingVersionId === String(v.id) ? "Setting..." : "Set Active"}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!canManageVersions && (
                        <p className="text-[10px] text-[#3F3F46] mt-2">Only Lead/Tech Art can change the active version.</p>
                      )}
                    </div>

                    {/* Tech Art AI v1 */}
                    {(qaGuideLoading || assetQaGuidance?.guidance) && (
                      <div className="rounded-xl border border-[#27272A] bg-[#0A0A0A] p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#3B82F6]" strokeWidth={1.5} />
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">Tech Art AI v1</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(["mobile", "pc", "console"] as const).map((p) => (
                              <button
                                key={`qa-profile-${p}`}
                                onClick={() => setQaProfile(p)}
                                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                  qaProfile === p
                                    ? "bg-white/[0.1] text-[#EDEDED]"
                                    : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          {assetQaGuidance?.guidance?.recommended_decision && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${
                              assetQaGuidance.guidance.recommended_decision === "block_fix_first"
                                ? "bg-rose-500/10 text-rose-300 ring-rose-500/20"
                                : assetQaGuidance.guidance.recommended_decision === "review_with_caution"
                                ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                            }`}>
                              {assetQaGuidance.guidance.recommended_decision === "block_fix_first"
                                ? "Block + Fix"
                                : assetQaGuidance.guidance.recommended_decision === "review_with_caution"
                                ? "Review Carefully"
                                : "Ready"}
                            </span>
                          )}
                        </div>
                        {qaGuideLoading ? (
                          <div className="space-y-2">
                            <div className="skeleton h-3 w-full rounded" />
                            <div className="skeleton h-3 w-3/4 rounded" />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-[#A1A1AA] leading-relaxed">
                              {assetQaGuidance?.guidance?.summary || "Guidance unavailable for this asset."}
                            </p>
                            {canManageAnnotations && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCreateQaTask("Review technical checklist and resolve failed checks.", "qa-summary")}
                                  disabled={creatingQaTaskKey === "qa-summary"}
                                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                    creatingQaTaskKey === "qa-summary"
                                      ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                      : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                                  }`}
                                >
                                  {creatingQaTaskKey === "qa-summary" ? "Creating..." : "Add Tech Task"}
                                </button>
                                <button
                                  onClick={() => openAssignModal(inspectAsset)}
                                  className="px-2 py-1 rounded text-[10px] uppercase tracking-wide bg-white/[0.04] text-[#A1A1AA] ring-1 ring-white/[0.08] hover:text-[#EDEDED] hover:bg-white/[0.08] transition-colors"
                                >
                                  Assign Owner
                                </button>
                              </div>
                            )}

                            {assetQaGuidance?.guidance?.reviewer_suggestion?.name && (
                              <p className="text-[11px] text-[#71717A] mt-2">
                                Suggested reviewer:{" "}
                                <span className="text-[#EDEDED]">
                                  {assetQaGuidance.guidance.reviewer_suggestion.name}
                                </span>{" "}
                                ({String(assetQaGuidance.guidance.reviewer_suggestion.role || "reviewer").replace(/_/g, " ")})
                              </p>
                            )}

                            {Array.isArray(assetQaGuidance?.guidance?.checklist) && assetQaGuidance.guidance.checklist.length > 0 && (
                              <div className="mt-2 grid grid-cols-1 gap-1.5">
                                {assetQaGuidance.guidance.checklist.slice(0, 4).map((step: any, idx: number) => (
                                  <div key={`qa-step-${step.id || idx}`} className="flex items-start gap-2 rounded-md bg-white/[0.02] px-2 py-1.5 ring-1 ring-white/[0.06]">
                                    <span className={`mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                      step.priority === "high"
                                        ? "bg-rose-500/10 text-rose-300"
                                        : step.priority === "medium"
                                        ? "bg-amber-500/10 text-amber-300"
                                        : "bg-emerald-500/10 text-emerald-300"
                                    }`}>
                                      {String(step.priority || "low").toUpperCase()}
                                    </span>
                                    <p className="text-[11px] text-[#A1A1AA] flex-1">{step.title}</p>
                                    {canManageAnnotations && (
                                      <button
                                        onClick={() => handleCreateQaTask(step.title, `checklist-${step.id || idx}`)}
                                        disabled={creatingQaTaskKey === `checklist-${step.id || idx}`}
                                        className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ${
                                          creatingQaTaskKey === `checklist-${step.id || idx}`
                                            ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                            : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 hover:bg-blue-500/20"
                                        }`}
                                      >
                                        Task
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {assetQaGuidance?.deep_analysis && (
                              <div className="mt-2 rounded-md bg-white/[0.02] p-2.5 ring-1 ring-white/[0.06]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                                    Profile {String(assetQaGuidance.deep_analysis.profile || qaProfile).toUpperCase()}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                    assetQaGuidance.deep_analysis.import_risk_band === "high"
                                      ? "bg-rose-500/10 text-rose-300"
                                      : assetQaGuidance.deep_analysis.import_risk_band === "medium"
                                      ? "bg-amber-500/10 text-amber-300"
                                      : "bg-emerald-500/10 text-emerald-300"
                                  }`}>
                                    Import Risk {assetQaGuidance.deep_analysis.import_risk_score}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2 text-[10px] text-[#71717A]">
                                  <span>Pass {assetQaGuidance.deep_analysis.health?.pass ?? 0}</span>
                                  <span>•</span>
                                  <span>Fail {assetQaGuidance.deep_analysis.health?.fail ?? 0}</span>
                                </div>
                                {Array.isArray(assetQaGuidance.deep_analysis.checks) && assetQaGuidance.deep_analysis.checks.length > 0 && (
                                  <div className="space-y-1">
                                    {assetQaGuidance.deep_analysis.checks.slice(0, 6).map((c: any, idx: number) => (
                                      <div key={`deep-check-${c.key || idx}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-[10px]">
                                        <span className="text-[#A1A1AA] truncate">{c.label}</span>
                                        <span className="text-[#71717A] font-mono">actual {formatTechValue(c.actual, c.key)}</span>
                                        <span className={`font-medium ${c.status === "pass" ? "text-emerald-300" : "text-rose-300"}`}>
                                          {c.status === "pass" ? "PASS" : "FAIL"} / {formatTechValue(c.limit, c.key)}
                                        </span>
                                        {canManageAnnotations && c.status === "fail" ? (
                                          <button
                                            onClick={() => handleCreateQaTask(`${c.label}: actual ${formatTechValue(c.actual, c.key)} / target ${formatTechValue(c.limit, c.key)}`, `deep-${c.key || idx}`)}
                                            disabled={creatingQaTaskKey === `deep-${c.key || idx}`}
                                            className={`justify-self-end px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide transition-colors ${
                                              creatingQaTaskKey === `deep-${c.key || idx}`
                                                ? "bg-white/[0.04] text-[#52525B] cursor-not-allowed"
                                                : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                                            }`}
                                          >
                                            Fix Task
                                          </button>
                                        ) : (
                                          <span />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {(qaTaskLoading || qaTasks.length > 0 || canManageAnnotations) && (
                              <div className="mt-2 rounded-md bg-white/[0.02] p-2.5 ring-1 ring-white/[0.06]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Tech Task Board</span>
                                  <span className="text-[10px] text-[#52525B]">{qaTasks.length} tasks</span>
                                </div>
                                {qaTaskLoading ? (
                                  <div className="space-y-1.5">
                                    <div className="skeleton h-3 w-full rounded" />
                                    <div className="skeleton h-3 w-4/5 rounded" />
                                  </div>
                                ) : qaTasks.length === 0 ? (
                                  <p className="text-[11px] text-[#52525B]">No tech tasks yet. Create from checklist or failed checks.</p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                    {([
                                      { key: "open", label: "Open" },
                                      { key: "in_progress", label: "In Progress" },
                                      { key: "done", label: "Done" },
                                    ] as const).map((col) => {
                                      const items = qaTasks.filter((t: any) => t.status === col.key);
                                      return (
                                        <div key={`task-col-${col.key}`} className="rounded border border-[#27272A] bg-[#0A0A0A] p-2">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">{col.label}</span>
                                            <span className="text-[10px] text-[#52525B]">{items.length}</span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {items.length === 0 ? (
                                              <p className="text-[10px] text-[#3F3F46]">No items</p>
                                            ) : (
                                              items.slice(0, 4).map((task: any) => (
                                                <div key={`task-${task.id}`} className="rounded border border-white/[0.08] bg-white/[0.02] p-1.5">
                                                  <p className="text-[10px] text-[#EDEDED] leading-relaxed">{task.text}</p>
                                                  <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[9px] text-[#52525B]">{timeAgo(task.created_at)}</span>
                                                    <div className="flex items-center gap-1">
                                                      {col.key !== "open" && (
                                                        <button
                                                          onClick={() => handleUpdateQaTaskStatus(task, "open")}
                                                          disabled={updatingQaTaskId === task.id}
                                                          className="px-1 py-0.5 rounded text-[9px] bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500/20 disabled:opacity-50"
                                                        >
                                                          Open
                                                        </button>
                                                      )}
                                                      {col.key !== "in_progress" && (
                                                        <button
                                                          onClick={() => handleUpdateQaTaskStatus(task, "in_progress")}
                                                          disabled={updatingQaTaskId === task.id}
                                                          className="px-1 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                                                        >
                                                          WIP
                                                        </button>
                                                      )}
                                                      {col.key !== "done" && (
                                                        <button
                                                          onClick={() => handleUpdateQaTaskStatus(task, "done")}
                                                          disabled={updatingQaTaskId === task.id}
                                                          className="px-1 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                                                        >
                                                          Done
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {Object.entries(assetMeta.metadata)
                        .filter(([k]) => !['type', 'format', 'error'].includes(k))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E]/50">
                            <span className="text-[10px] font-medium text-[#52525B] uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-mono text-[#EDEDED]">
                              {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Violations */}
                    {assetMeta.violations && assetMeta.violations.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-400">Rule Violations</span>
                        </div>
                        <div className="space-y-1.5">
                          {assetMeta.violations.map((v: any, i: number) => (
                            <div key={i} className={`px-3 py-2 rounded-lg text-xs ${
                              v.severity === 'error'
                                ? 'bg-rose-500/5 text-rose-300 ring-1 ring-rose-500/10'
                                : 'bg-amber-500/5 text-amber-300 ring-1 ring-amber-500/10'
                            }`}>
                              {v.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Timeline */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.5} />
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#71717A]">Review Timeline</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(["all", "ownership", "escalation", "routing", "decision"] as const).map((f) => (
                            <button
                              key={`rh-${f}`}
                              onClick={() => setReviewHistoryFilter(f)}
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide transition-colors ${
                                reviewHistoryFilter === f
                                  ? "bg-white/[0.08] text-[#EDEDED]"
                                  : "text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                              }`}
                            >
                              {f === "all" ? "All" : f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {filteredReviewHistory.length === 0 ? (
                          <div className="px-3 py-2 rounded-lg text-xs bg-white/[0.02] text-[#52525B] ring-1 ring-white/[0.06]">
                            No events for this filter.
                          </div>
                        ) : (
                          filteredReviewHistory.slice(0, 10).map((ev: any) => {
                            const badge = reviewActionBadge(ev.action);
                            const meta = ev.metadata || {};
                            const rerouteNote = meta.auto_rerouted
                              ? `Rerouted to ${meta.target_reviewer || "suggested reviewer"}`
                              : "";
                            return (
                              <div key={ev.id} className="px-3 py-2 rounded-lg text-xs bg-white/[0.02] ring-1 ring-white/[0.06]">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${badge.cls}`}>{badge.label}</span>
                                  <span className="text-[10px] text-[#52525B]">{timeAgo(ev.created_at)}</span>
                                </div>
                                <p className="text-[#A1A1AA]">
                                  <span className="text-[#EDEDED] font-medium">{ev.user_name || "System"}</span>{" "}
                                  {activityVerb(ev.action)}{" "}
                                  <span className="text-[#71717A]">{meta?.filename || inspectAsset?.filename}</span>
                                </p>
                                {(meta.assignee_name || meta.target_reviewer || meta.due_at || rerouteNote) && (
                                  <p className="text-[10px] text-[#52525B] mt-0.5">
                                    {meta.assignee_name ? `Owner: ${meta.assignee_name}` : ""}
                                    {meta.target_reviewer ? `${meta.assignee_name ? " · " : ""}Target: ${meta.target_reviewer}` : ""}
                                    {meta.due_at ? `${(meta.assignee_name || meta.target_reviewer) ? " · " : ""}Due: ${dueLabel(meta.due_at)}` : ""}
                                    {rerouteNote ? `${(meta.assignee_name || meta.target_reviewer || meta.due_at) ? " · " : ""}${rerouteNote}` : ""}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="w-6 h-6 text-[#27272A] mb-2" strokeWidth={1} />
                    <p className="text-xs text-[#52525B]">No metadata available</p>
                    <p className="text-[10px] text-[#3F3F46] mt-1">Upload a new version to extract metadata</p>
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ─────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

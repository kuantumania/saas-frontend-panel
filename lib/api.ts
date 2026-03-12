const API = "https://saas-asset-backend.onrender.com";

function headers(token: string): HeadersInit {
  return { "x-api-key": token, "Content-Type": "application/json" };
}

export async function fetchStats(token: string) {
  const [mRes, aRes] = await Promise.all([
    fetch(`${API}/api/lead/stats`, { headers: headers(token) }),
    fetch(`${API}/api/assets/stats`, { headers: headers(token) }),
  ]);
  const members = mRes.ok ? await mRes.json() : { stats: {} };
  const assets = aRes.ok ? await aRes.json() : { stats: {} };
  return {
    totalMembers: members.stats?.total_members ?? 0,
    totalAssets: assets.stats?.total_assets ?? 0,
    pendingReview: assets.stats?.in_review ?? 0,
    approved: assets.stats?.approved ?? 0,
  };
}

export async function fetchPendingReview(token: string) {
  const res = await fetch(`${API}/api/assets/pending`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.assets || [];
}

export async function fetchReviewQueue(token: string) {
  const res = await fetch(`${API}/api/review/queues`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.queue || [];
}

export async function scoreAssetRisk(
  token: string,
  payload: { asset_id?: string; folder_id?: string; filename?: string; file_size_kb?: number; metadata?: Record<string, any> }
) {
  const res = await fetch(`${API}/api/rules/score`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchLibrary(
  token: string,
  opts: { page?: number; status?: string; search?: string; folderId?: string; tagId?: string } = {}
) {
  const params = new URLSearchParams({ page: String(opts.page || 1), per_page: "30" });
  if (opts.status && opts.status !== "all") params.append("status", opts.status);
  if (opts.search) params.append("search", opts.search);
  if (opts.folderId) params.append("folder_id", opts.folderId);
  if (opts.tagId) params.append("tag_id", opts.tagId);

  const res = await fetch(`${API}/api/assets/browse?${params}`, { headers: headers(token) });
  if (!res.ok) return { assets: [], pagination: { page: 1, total_pages: 1, total: 0, has_prev: false, has_next: false } };
  return res.json();
}

export async function fetchMembers(token: string) {
  const res = await fetch(`${API}/api/lead/members`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.members || [];
}

export async function fetchActivity(token: string) {
  const res = await fetch(`${API}/api/activity?limit=8`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

export async function fetchNotifications(token: string) {
  const res = await fetch(`${API}/api/notifications`, { headers: headers(token) });
  if (!res.ok) return { notifications: [], unread_count: 0 };
  return res.json();
}

export async function markNotificationsRead(token: string) {
  await fetch(`${API}/api/notifications/read`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({}),
  });
}

export async function fetchBilling(token: string) {
  const res = await fetch(`${API}/api/billing/status`, { headers: headers(token) });
  if (!res.ok) return null;
  return res.json();
}

export async function approveAsset(token: string, assetId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/approve`, {
    method: "POST",
    headers: headers(token),
  });
  return res.ok;
}

export async function rejectAsset(token: string, assetId: string, reason: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/reject`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}

export async function inviteMember(token: string, role: string) {
  const res = await fetch(`${API}/api/lead/invite`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ role }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return data;
}

export async function postComment(token: string, assetId: string, content: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/comments`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ content }),
  });
  return res.ok;
}

export async function fetchAssetDetail(token: string, assetId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/detail`, { headers: headers(token) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset || null;
}

export async function fetchFolders(token: string) {
  const res = await fetch(`${API}/api/folders`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.folders || [];
}

export async function fetchTags(token: string) {
  const res = await fetch(`${API}/api/tags`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tags || [];
}

// ════════════════════════════════════════
// FAZ 9: ASSET RULES
// ════════════════════════════════════════

export async function fetchRules(token: string, folderId?: string) {
  const params = folderId ? `?folder_id=${folderId}` : "";
  const res = await fetch(`${API}/api/rules${params}`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.rules || [];
}

export async function createRule(
  token: string,
  ruleType: string,
  config: Record<string, any>,
  severity: string = "error",
  folderId?: string
) {
  const body: Record<string, any> = { rule_type: ruleType, config, severity };
  if (folderId) body.folder_id = folderId;
  const res = await fetch(`${API}/api/rules`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return data;
}

export async function updateRule(
  token: string,
  ruleId: string,
  data: { config?: Record<string, any>; severity?: string; is_active?: boolean }
) {
  const res = await fetch(`${API}/api/rules/${ruleId}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function deleteRule(token: string, ruleId: string) {
  const res = await fetch(`${API}/api/rules/${ruleId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  return res.ok;
}

// ════════════════════════════════════════
// FAZ 10: ASSET METADATA
// ════════════════════════════════════════

export async function fetchAssetMetadata(token: string, assetId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/metadata`, { headers: headers(token) });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAssetVersions(token: string, assetId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/versions`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.versions || [];
}

export async function fetchAssetAnnotations(token: string, assetId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/annotations`, { headers: headers(token) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.annotations || [];
}

export async function createAssetAnnotation(
  token: string,
  assetId: string,
  payload: { x: number; y: number; text: string; version_asset_id?: string }
) {
  const res = await fetch(`${API}/api/assets/${assetId}/annotations`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return data.annotation;
}

export async function updateAssetAnnotation(
  token: string,
  assetId: string,
  annotationId: string,
  payload: { x?: number; y?: number; text?: string; resolved?: boolean }
) {
  const res = await fetch(`${API}/api/assets/${assetId}/annotations/${annotationId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return data.annotation;
}

export async function deleteAssetAnnotation(token: string, assetId: string, annotationId: string) {
  const res = await fetch(`${API}/api/assets/${assetId}/annotations/${annotationId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return { success: true };
}

export async function fetchSessionContext(token: string) {
  const res = await fetch(`${API}/api/unity/studio`, { headers: headers(token) });
  if (!res.ok) return null;
  return res.json();
}

export async function uploadAsset(
  token: string,
  file: File,
  opts: { role: string; userCode: string; workspace: string; folderId?: string; forceUpload?: boolean }
) {
  const form = new FormData();
  form.append("file", file);
  form.append("category", opts.role || "General");
  form.append("user_code", opts.userCode || "Unknown");
  form.append("workspace", opts.workspace || "default-studio");
  if (opts.folderId) form.append("folder_id", opts.folderId);
  if (opts.forceUpload) form.append("force_upload", "true");

  const res = await fetch(`${API}/api/upload`, {
    method: "POST",
    headers: { "x-api-key": token },
    body: form,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}`, code: data?.code, violations: data?.violations };
  return data;
}

export async function submitAssetForReview(token: string, s3Key: string) {
  const res = await fetch(`${API}/api/assets/submit-by-key`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ s3_key: s3Key }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error || `HTTP ${res.status}` };
  return data;
}

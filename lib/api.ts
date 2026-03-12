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
  if (!res.ok) return null;
  return res.json();
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
  if (!res.ok) return null;
  return res.json();
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


"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Layers, Search, Bell, LogOut, Upload,
  LayoutDashboard, FolderUp, GitMerge, Users, Shield, Settings,
} from "lucide-react";

type Role = "lead" | "member" | string;

interface DashboardNavProps {
  studioName?: string;
  role?: Role;
  isEnterprise?: boolean;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  notifications?: any[];
  unreadCount?: number;
  onToggleNotifs?: () => void;
  onMarkRead?: () => void;
  onLogout?: () => void;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  leadOnly?: boolean;
  enterpriseOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload", icon: FolderUp },
  { href: "/dashboard/migration", label: "Import", icon: GitMerge, leadOnly: true, enterpriseOnly: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, leadOnly: true },
];

export default function DashboardNav({
  studioName = "Studio",
  role = "member",
  isEnterprise = false,
  onSearch,
  showSearch = true,
  notifications = [],
  unreadCount = 0,
  onToggleNotifs,
  onMarkRead,
  onLogout,
}: DashboardNavProps) {
  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = useState(false);
  const isLead = role.toLowerCase() === "lead";

  const handleNotifToggle = () => {
    setShowNotifs(!showNotifs);
    onToggleNotifs?.();
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.leadOnly && !isLead) return false;
    if (item.enterpriseOnly && !isEnterprise) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#1E1E1E] bg-[#0A0A0A]/80 backdrop-blur-xl">
        {/* Main bar */}
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Layers className="w-5 h-5 text-[#3B82F6]" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-[#EDEDED]">
              {studioName}
            </span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 mx-6">
            {visibleNavItems.map(({ href, label, icon: Icon, enterpriseOnly }) => {
              const isActive = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white/[0.08] text-[#EDEDED]"
                      : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {label}
                  {enterpriseOnly && (
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 leading-none">
                      ENT
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Search */}
          {showSearch && onSearch && (
            <div className="flex-1 max-w-sm mx-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B] group-focus-within:text-[#71717A] transition-colors" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search assets..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full h-8 pl-9 pr-10 rounded-lg bg-[#121212] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none transition-colors"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-medium px-1 py-0.5 rounded bg-white/[0.06] text-[#52525B] border border-[#27272A]">
                  /
                </kbd>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotifToggle}
                className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <Bell className="w-4 h-4 text-[#A1A1AA]" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F43F5E] ring-2 ring-[#0A0A0A]" />
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#121212] border border-[#27272A] shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#71717A]">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={onMarkRead} className="text-[10px] font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-[#52525B] py-8">No notifications</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-white/[0.02] transition-colors ${!n.is_read ? "bg-[#3B82F6]/[0.03]" : ""}`}
                        >
                          <p className="text-xs text-[#EDEDED] leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-[#52525B] mt-1 block">{timeAgo(n.created_at)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload shortcut */}
            {pathname !== "/dashboard/upload" && (
              <a
                href="/dashboard/upload"
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                Upload
              </a>
            )}

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-[#52525B]" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close notifs */}
      {showNotifs && <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />}
    </>
  );
}

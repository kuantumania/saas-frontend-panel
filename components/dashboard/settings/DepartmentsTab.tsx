"use client";

import { Building2, ChevronRight, Loader2, Plus, Trash2, UserPlus, X } from "lucide-react";

type Department = {
  id: string;
  name: string;
  parent_id: string | null;
  member_count: number;
  created_at: string;
};

type DeptMember = {
  id: string;
  name: string;
  role: string;
  dept_role: string;
  assigned_at: string;
};

type DepartmentsTabProps = {
  departments: Department[];
  deptLoading: boolean;
  newDeptName: string;
  creatingDept: boolean;
  expandedDept: string | null;
  deptMembers: DeptMember[];
  membersLoading: boolean;
  studioMembers: any[];
  addingMember: boolean;
  selectedUserId: string;
  onNewDeptNameChange: (value: string) => void;
  onCreateDept: () => void;
  onDeleteDept: (deptId: string) => void;
  onExpandDept: (deptId: string) => void;
  onSelectedUserIdChange: (userId: string) => void;
  onAddMember: (deptId: string) => void;
  onRemoveMember: (deptId: string, userId: string) => void;
};

export default function DepartmentsTab({
  departments,
  deptLoading,
  newDeptName,
  creatingDept,
  expandedDept,
  deptMembers,
  membersLoading,
  studioMembers,
  addingMember,
  selectedUserId,
  onNewDeptNameChange,
  onCreateDept,
  onDeleteDept,
  onExpandDept,
  onSelectedUserIdChange,
  onAddMember,
  onRemoveMember,
}: DepartmentsTabProps) {
  return (
    <>
      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#EDEDED] mb-3">Create Department</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Department name (e.g. Art, Engineering, QA)"
            value={newDeptName}
            onChange={(e) => onNewDeptNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCreateDept()}
            className="flex-1 h-9 px-3 rounded-lg bg-[#0A0A0A] border border-[#27272A] text-xs text-[#EDEDED] placeholder:text-[#52525B] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
          />
          <button
            onClick={onCreateDept}
            disabled={creatingDept || !newDeptName.trim()}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {creatingDept ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E1E1E] bg-[#121212] overflow-hidden">
        <div className="px-5 py-2.5 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center">
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] flex-1">
            Department
          </span>
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] w-20 text-center">
            Members
          </span>
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-[#3F3F46] w-24 text-right">
            Actions
          </span>
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
                  onClick={() => onExpandDept(dept.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[#52525B] transition-transform ${
                      expandedDept === dept.id ? "rotate-90" : ""
                    }`}
                  />
                  <Building2 className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[#EDEDED]">{dept.name}</span>
                </button>
                <span className="w-20 text-center text-xs text-[#71717A]">
                  {dept.member_count}
                </span>
                <div className="w-24 flex justify-end">
                  <button
                    onClick={() => onDeleteDept(dept.id)}
                    className="p-1.5 rounded-md hover:bg-rose-500/10 text-[#52525B] hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expandedDept === dept.id && (
                <div className="bg-[#0A0A0A] border-b border-[#1E1E1E] px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={selectedUserId}
                      onChange={(e) => onSelectedUserIdChange(e.target.value)}
                      className="flex-1 h-8 px-2 rounded-lg bg-[#121212] border border-[#27272A] text-xs text-[#EDEDED] focus:border-[#3F3F46] focus:ring-0 focus:outline-none"
                    >
                      <option value="">Select member to add...</option>
                      {studioMembers
                        .filter((m: any) => !deptMembers.some((dm) => dm.id === m.id))
                        .map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => onAddMember(dept.id)}
                      disabled={addingMember || !selectedUserId}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white/[0.06] text-xs font-medium text-[#EDEDED] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add
                    </button>
                  </div>

                  {membersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 text-[#52525B] animate-spin" />
                    </div>
                  ) : deptMembers.length === 0 ? (
                    <p className="text-xs text-[#52525B] text-center py-3">
                      No members in this department
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {deptMembers.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                            {(m.name || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#EDEDED] truncate">{m.name}</p>
                            <p className="text-[10px] text-[#52525B]">
                              {m.role} &middot; Dept: {m.dept_role}
                            </p>
                          </div>
                          <button
                            onClick={() => onRemoveMember(dept.id, m.id)}
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
    </>
  );
}

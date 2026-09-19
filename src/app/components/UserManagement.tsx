import { useState } from "react";
import { Link } from "react-router";
import { UserPlus, Edit2, UserX, X, Presentation, ShieldCheck, Check, ChevronRight } from "lucide-react";
import { useRole, canEdit, ROLE_META } from "../access";
import { STAFF, grantTrainer, useStoreVersion } from "../trainingStore";

const TEAL = "#00C9A7";

interface User {
  id: string; name: string; email: string;
  role: "Admin" | "HR" | "Manager" | "Trainer" | "Staff";
  department: string; status: "Active" | "Inactive";
}

const EXTRA_ACCOUNTS: User[] = [
  { id: "A1", name: "John Admin", email: "admin@company.com", role: "Admin", department: "IT", status: "Active" },
];

const ROLE_STYLE: Record<User["role"], { color: string; bg: string }> = {
  Admin:   { color: "#7C3AED", bg: "#F3E8FF" },
  HR:      { color: "#0891B2", bg: "#ECFEFF" },
  Manager: { color: "#3B82F6", bg: "#EFF6FF" },
  Trainer: { color: TEAL,      bg: "#E8FAF7" },
  Staff:   { color: "#6B7280", bg: "#F3F4F6" },
};

/** Maps a staff record onto a system account row. */
function roleOf(dept: string, position: string, isTrainer: boolean): User["role"] {
  if (dept === "HR") return "HR";
  if (position.startsWith("Head") || position.includes("Manager")) return "Manager";
  return isTrainer ? "Trainer" : "Staff";
}
const STATUS_STYLE = {
  Active:   { color: "#059669", bg: "#ECFDF5" },
  Inactive: { color: "#DC2626", bg: "#FEE2E2" },
};

export function UserManagement() {
  const role = useRole();
  useStoreVersion();
  const mayGrant = canEdit(role, "users");
  const [showModal, setShowModal] = useState(false);

  const users: User[] = [
    ...EXTRA_ACCOUNTS,
    ...STAFF.map(s => ({
      id: s.id,
      name: s.name,
      email: `${s.name.split(" ")[0].toLowerCase()}@company.com`,
      role: roleOf(s.dept, s.position, s.isTrainer),
      department: s.dept,
      status: "Active" as const,
    })),
  ];

  const active = users.filter(u => u.status === "Active").length;
  const trainers = STAFF.filter(s => s.isTrainer).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#1A1F2E]">User Management</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">Manage accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: TEAL }}
        >
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Permission note */}
      <div className="rounded-xl px-5 py-3.5 mb-4 flex items-start gap-2.5" style={{ backgroundColor: mayGrant ? "#F3E8FF" : "#F9FAFB" }}>
        <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: mayGrant ? "#7C3AED" : "#9CA3AF" }} />
        <p className="text-[12px] leading-relaxed" style={{ color: mayGrant ? "#5B21B6" : "#6B7280" }}>
          {mayGrant
            ? `${ROLE_META[role].label}: you grant the volunteer trainer permission below. A trainer can create sessions and materials, but can only edit and assign the materials they created themselves.`
            : "Only Super Admin and HR can grant the volunteer trainer permission."}
        </p>
        <Link to="/access" className="ml-auto flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: "#7C3AED" }}>
          Role matrix <ChevronRight size={11} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Users", value: users.length, color: "#1A1F2E" },
          { label: "Active Users", value: active, color: "#059669" },
          { label: "Volunteer Trainers", value: trainers, color: TEAL },
          { label: "Roles Configured", value: 5, color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg px-5 py-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {/* Filters */}
        <div className="apex-mobile-filters flex gap-2 px-5 py-3.5 border-b border-gray-100">
          {[
            { label: "All Roles", options: ["All Roles", "Admin", "HR", "Manager", "Trainer", "Staff"] },
            { label: "All Departments", options: ["All Departments", "IT", "HR", "Sales", "Finance", "Operations"] },
            { label: "All Status", options: ["All Status", "Active", "Inactive"] },
          ].map(f => (
            <select key={f.label}
              className="px-3 py-1.5 bg-[#F4F6F9] border border-gray-100 rounded-md text-[12px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 focus:border-[#00C9A7] transition-all">
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {["Name", "Email", "Role", "Department", "Trainer Permission", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: ROLE_STYLE[u.role].color }}>
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-[13px] font-medium text-[#1A1F2E]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-[#6B7280]">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: ROLE_STYLE[u.role].color, backgroundColor: ROLE_STYLE[u.role].bg }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-[#6B7280]">{u.department}</td>
                  <td className="px-5 py-3.5">
                    {STAFF.some(st => st.id === u.id) ? (
                      <button
                        disabled={!mayGrant}
                        onClick={() => grantTrainer(u.id, !STAFF.find(st => st.id === u.id)?.isTrainer)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors"
                        style={STAFF.find(st => st.id === u.id)?.isTrainer
                          ? { backgroundColor: TEAL, color: "white", cursor: mayGrant ? "pointer" : "default" }
                          : { backgroundColor: "#F3F4F6", color: "#9CA3AF", cursor: mayGrant ? "pointer" : "default" }}
                      >
                        {STAFF.find(st => st.id === u.id)?.isTrainer
                          ? <><Check size={10} /> Granted</>
                          : <><Presentation size={10} /> Grant</>}
                      </button>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#C4C9D4" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: STATUS_STYLE[u.status].color, backgroundColor: STATUS_STYLE[u.status].bg }}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-md hover:bg-[#EFF6FF] transition-colors">
                        <Edit2 size={13} className="text-[#3B82F6]" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-[#FEE2E2] transition-colors">
                        <UserX size={13} className="text-[#DC2626]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[#1A1F2E]">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} className="text-[#9CA3AF]" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              {[
                { label: "Full Name", type: "text", placeholder: "Enter full name" },
                { label: "Email Address", type: "email", placeholder: "user@company.com" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 bg-[#F4F6F9] border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 focus:border-[#00C9A7] transition-all" />
                </div>
              ))}
              {[
                { label: "Role", opts: ["Select role", "Super Admin", "HR", "Manager", "Trainer", "Staff"] },
                { label: "Department", opts: ["Select department", "Engineering", "Sales", "Service", "IT", "HR", "Finance"] },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">{f.label}</label>
                  <select className="w-full px-3 py-2.5 bg-[#F4F6F9] border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 focus:border-[#00C9A7] transition-all">
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-md text-[13px] font-semibold text-[#6B7280] border-2 border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-md text-[13px] font-semibold text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: TEAL }}>
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

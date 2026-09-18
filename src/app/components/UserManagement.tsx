import { useState } from "react";
import { UserPlus, Edit2, UserX, X } from "lucide-react";

const TEAL = "#00C9A7";

interface User {
  id: string; name: string; email: string;
  role: "Admin" | "Trainer" | "Staff";
  department: string; status: "Active" | "Inactive";
}

const MOCK: User[] = [
  { id: "1", name: "John Admin", email: "admin@company.com", role: "Admin", department: "IT", status: "Active" },
  { id: "2", name: "Jane Trainer", email: "trainer@company.com", role: "Trainer", department: "HR", status: "Active" },
  { id: "3", name: "Sarah Johnson", email: "sarah@company.com", role: "Staff", department: "IT", status: "Active" },
  { id: "4", name: "Michael Chen", email: "michael@company.com", role: "Staff", department: "Sales", status: "Active" },
  { id: "5", name: "Emily Rodriguez", email: "emily@company.com", role: "Trainer", department: "Finance", status: "Active" },
  { id: "6", name: "David Kim", email: "david@company.com", role: "Staff", department: "Operations", status: "Inactive" },
  { id: "7", name: "Jessica Liu", email: "jessica@company.com", role: "Staff", department: "IT", status: "Active" },
  { id: "8", name: "Robert Taylor", email: "robert@company.com", role: "Trainer", department: "Operations", status: "Active" },
];

const ROLE_STYLE = {
  Admin:   { color: "#7C3AED", bg: "#F3E8FF" },
  Trainer: { color: TEAL,     bg: "#E8FAF7" },
  Staff:   { color: "#6B7280", bg: "#F3F4F6" },
};
const STATUS_STYLE = {
  Active:   { color: "#059669", bg: "#ECFDF5" },
  Inactive: { color: "#DC2626", bg: "#FEE2E2" },
};

export function UserManagement() {
  const [users] = useState<User[]>(MOCK);
  const [showModal, setShowModal] = useState(false);

  const active = users.filter(u => u.status === "Active").length;

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Users", value: users.length, color: "#1A1F2E" },
          { label: "Active Users", value: active, color: "#059669" },
          { label: "Inactive Users", value: users.length - active, color: "#DC2626" },
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
        <div className="flex gap-2 px-5 py-3.5 border-b border-gray-100">
          {[
            { label: "All Roles", options: ["All Roles", "Admin", "Trainer", "Staff"] },
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
                {["Name", "Email", "Role", "Department", "Status", "Actions"].map(h => (
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
                { label: "Role", opts: ["Select role", "Admin", "Trainer", "Staff"] },
                { label: "Department", opts: ["Select department", "IT", "HR", "Sales", "Finance", "Operations"] },
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

import { useState, useMemo } from "react";
import {
  X, Search, Plus, ChevronUp, ChevronDown,
  CalendarDays, CheckCircle, Users, User, Briefcase,
  ToggleLeft, ToggleRight, BookOpen, Clock,
} from "lucide-react";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourseMaterial {
  id: string; title: string; dept: string; version: string;
  modules: number; from: string; to: string; emoji: string; approved: string;
}
interface Staff {
  id: string; name: string; initials: string; dept: string; role: string; color: string;
}
interface Chip {
  key: string; type: "department" | "role" | "individual";
  label: string; count: number; staffIds: string[];
}
interface HistoryEntry {
  id: string; title: string; target: string; date: string; count: number; status: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const COURSES: CourseMaterial[] = [
  { id: "M001", title: "AC Installation Manual",      dept: "Technical",  version: "v1.2", modules: 5, from: "#0F4C75", to: "#1B6CA8",  emoji: "🔧", approved: "16 May 2026" },
  { id: "M002", title: "Customer Handling Protocol",  dept: "Operations", version: "v1.0", modules: 3, from: "#00897B", to: "#00C9A7",  emoji: "🤝", approved: "10 May 2026" },
  { id: "M003", title: "Safety Procedures Manual",    dept: "Technical",  version: "v2.1", modules: 4, from: "#B91C1C", to: "#EF4444",  emoji: "⚠️", approved: "8 May 2026"  },
];

const DEPARTMENTS = ["Technical", "IT", "HR", "Sales", "Finance", "Operations", "Marketing"];
const ROLES       = ["Technician", "Service Staff", "Admin", "Manager", "Analyst"];

const STAFF: Staff[] = [
  { id: "S001", name: "Ahmad Syafiq",    initials: "AS", dept: "Technical",  role: "Technician",    color: TEAL      },
  { id: "S002", name: "Nurul Ain",       initials: "NA", dept: "Technical",  role: "Technician",    color: "#6366F1" },
  { id: "S003", name: "Haziq Rahman",    initials: "HR", dept: "Technical",  role: "Technician",    color: "#F59E0B" },
  { id: "S004", name: "Siti Mariam",     initials: "SM", dept: "Technical",  role: "Service Staff", color: "#3B82F6" },
  { id: "S005", name: "Faizal Ismail",   initials: "FI", dept: "Technical",  role: "Technician",    color: "#8B5CF6" },
  { id: "S006", name: "Izzati Mohd",     initials: "IM", dept: "Technical",  role: "Service Staff", color: "#EC4899" },
  { id: "S007", name: "Razif Kamal",     initials: "RK", dept: "Technical",  role: "Technician",    color: "#14B8A6" },
  { id: "S008", name: "Amirah Zulkifli", initials: "AZ", dept: "Technical",  role: "Technician",    color: "#A855F7" },
  { id: "S009", name: "Alice Morgan",    initials: "AM", dept: "IT",         role: "Technician",    color: "#0EA5E9" },
  { id: "S010", name: "Bob Carter",      initials: "BC", dept: "HR",         role: "Manager",       color: "#10B981" },
  { id: "S011", name: "Clara Davis",     initials: "CD", dept: "Sales",      role: "Service Staff", color: "#F97316" },
  { id: "S012", name: "Derek Lee",       initials: "DL", dept: "Finance",    role: "Analyst",       color: "#64748B" },
];

const HISTORY: HistoryEntry[] = [
  { id: "H1", title: "AC Installation Manual",     target: "Technical Dept",    date: "16 May 2026", count: 8,  status: "In Progress" },
  { id: "H2", title: "Customer Handling Protocol", target: "Service Staff Role", date: "10 May 2026", count: 12, status: "Completed"   },
  { id: "H3", title: "Safety Procedures Manual",   target: "Operations Dept",   date: "8 May 2026",  count: 15, status: "Completed"   },
];

const HIST_PILL: Record<string, { color: string; bg: string }> = {
  "In Progress": { color: "#D97706", bg: "#FEF3C7" },
  "Completed":   { color: "#6366F1", bg: "#EEF2FF" },
  "Assigned":    { color: "#059669", bg: "#ECFDF5" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CHIP_STYLE: Record<Chip["type"], { color: string; bg: string; border: string }> = {
  department: { color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
  role:       { color: "#3730A3", bg: "#EEF2FF", border: "#C7D2FE" },
  individual: { color: "#1F2937", bg: "#F3F4F6", border: "#E5E7EB" },
};

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ backgroundColor: TEAL }}>
          {num}
        </div>
        <p className="text-[13px] font-bold text-[#1A1F2E]">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TrainingAssignment() {
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [mode, setMode]                   = useState<Chip["type"]>("department");
  const [chips, setChips]                 = useState<Chip[]>([]);
  const [pickedDept, setPickedDept]       = useState(DEPARTMENTS[0]);
  const [pickedRole, setPickedRole]       = useState(ROLES[0]);
  const [search, setSearch]               = useState("");
  const [mandatory, setMandatory]         = useState(false);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [daysWithin, setDaysWithin]       = useState(14);
  const [submitted, setSubmitted]         = useState(false);

  const selectedCourse = COURSES.find(c => c.id === selectedId);

  const previewStaff = useMemo(() => {
    const ids = new Set<string>(chips.flatMap(c => c.staffIds));
    return STAFF.filter(s => ids.has(s.id));
  }, [chips]);

  const totalAssignees = previewStaff.length;
  const canAssign = selectedId && chips.length > 0 && effectiveDate;

  // ── Chip helpers ────────────────────────────────────────────────────────────
  const addDeptChip = () => {
    const key = `dept-${pickedDept}`;
    if (chips.some(c => c.key === key)) return;
    const ids = STAFF.filter(s => s.dept === pickedDept).map(s => s.id);
    if (!ids.length) return;
    setChips(cs => [...cs, { key, type: "department", label: `${pickedDept}`, count: ids.length, staffIds: ids }]);
  };

  const addRoleChip = () => {
    const key = `role-${pickedRole}`;
    if (chips.some(c => c.key === key)) return;
    const ids = STAFF.filter(s => s.role === pickedRole).map(s => s.id);
    if (!ids.length) return;
    setChips(cs => [...cs, { key, type: "role", label: `${pickedRole}`, count: ids.length, staffIds: ids }]);
  };

  const addIndivChip = (s: Staff) => {
    const key = `ind-${s.id}`;
    if (chips.some(c => c.key === key)) return;
    setChips(cs => [...cs, { key, type: "individual", label: s.name, count: 1, staffIds: [s.id] }]);
  };

  const removeChip = (key: string) => setChips(cs => cs.filter(c => c.key !== key));

  const filteredStaff = STAFF.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.dept.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!canAssign) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setChips([]);
    setSelectedId(null);
    setEffectiveDate("");
    setDaysWithin(14);
    setMandatory(false);
  };

  return (
    <div className="apex-training-assignment flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1F2E]">Assign Training</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">Select a course, choose recipients, and set a completion window</p>
        </div>
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
            <CheckCircle size={14} style={{ color: "#059669" }} />
            <p className="text-[12px] font-semibold text-[#065F46]">Training assigned — staff notified.</p>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="apex-training-assignment-body flex flex-1 overflow-hidden">

        {/* Main scrollable form */}
        <div className="apex-training-assignment-form flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── 1. Select Course ─────────────────────────────────────────── */}
          <Section num={1} title="Select Course">
            <div className="grid grid-cols-3 gap-3">
              {COURSES.map(c => {
                const active = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(active ? null : c.id)}
                    className="text-left rounded-xl overflow-hidden border-2 transition-all"
                    style={{ borderColor: active ? TEAL : "#E5E7EB", boxShadow: active ? `0 0 0 3px ${TEAL}22` : "none" }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative flex items-center justify-center"
                      style={{ height: 72, background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                    >
                      <span className="text-3xl">{c.emoji}</span>
                      {/* Version tag */}
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                        {c.version}
                      </span>
                      {active && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <CheckCircle size={14} style={{ color: TEAL }} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <p className="text-[12px] font-bold text-[#1A1F2E] leading-snug">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-[#9CA3AF] bg-gray-100 px-1.5 py-0.5 rounded">{c.dept}</span>
                        <span className="text-[10px] text-[#9CA3AF]">{c.modules} modules</span>
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">Approved {c.approved}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── 2. Assign To ─────────────────────────────────────────────── */}
          <Section num={2} title="Assign To">
            {/* Mode tabs */}
            <div className="flex gap-1.5 mb-4">
              {([
                { id: "department", icon: Users,    label: "Department"  },
                { id: "role",       icon: Briefcase, label: "Role"       },
                { id: "individual", icon: User,      label: "Individual" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
                  style={mode === id
                    ? { backgroundColor: TEAL, borderColor: TEAL, color: "white" }
                    : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {/* Selector by mode */}
            {mode === "department" && (
              <div className="flex gap-2 mb-3">
                <select
                  value={pickedDept}
                  onChange={e => setPickedDept(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7]"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d} Department</option>)}
                </select>
                <button
                  onClick={addDeptChip}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white shrink-0"
                  style={{ backgroundColor: TEAL }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
            {mode === "role" && (
              <div className="flex gap-2 mb-3">
                <select
                  value={pickedRole}
                  onChange={e => setPickedRole(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7]"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  onClick={addRoleChip}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white shrink-0"
                  style={{ backgroundColor: TEAL }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
            {mode === "individual" && (
              <div className="mb-3">
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or department…"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7]"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[160px] overflow-y-auto">
                  {filteredStaff.map(s => {
                    const picked = chips.some(c => c.key === `ind-${s.id}`);
                    return (
                      <button
                        key={s.id}
                        onClick={() => picked ? removeChip(`ind-${s.id}`) : addIndivChip(s)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: s.color }}>
                          {s.initials}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[12px] font-semibold text-[#1A1F2E]">{s.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{s.dept} · {s.role}</p>
                        </div>
                        {picked
                          ? <CheckCircle size={14} style={{ color: TEAL }} />
                          : <Plus size={13} className="text-gray-300" />
                        }
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chips */}
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {chips.map(chip => {
                  const st = CHIP_STYLE[chip.type];
                  return (
                    <span
                      key={chip.key}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold border"
                      style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                    >
                      {chip.type === "department" && <Users size={10} />}
                      {chip.type === "role"       && <Briefcase size={10} />}
                      {chip.type === "individual" && <User size={10} />}
                      {chip.label}
                      {chip.count > 1 && <span className="opacity-60">({chip.count})</span>}
                      <button onClick={() => removeChip(chip.key)} className="ml-0.5 hover:opacity-60 transition-opacity">
                        <X size={11} />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF] mt-1">No recipients added yet — use the selector above.</p>
            )}
          </Section>

          {/* ── 3. Mandatory ─────────────────────────────────────────────── */}
          <Section num={3} title="Mandatory">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#374151]">
                  Mark as mandatory training
                  {mandatory && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                      REQUIRED
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {mandatory
                    ? "Staff must complete this training. Non-completion will be flagged."
                    : "Optional — staff can complete this at their own discretion."}
                </p>
              </div>
              <button onClick={() => setMandatory(m => !m)} className="shrink-0 ml-4">
                {mandatory
                  ? <ToggleRight size={36} style={{ color: "#DC2626" }} />
                  : <ToggleLeft  size={36} className="text-gray-300" />
                }
              </button>
            </div>
          </Section>

          {/* ── 4. Duration ──────────────────────────────────────────────── */}
          <Section num={4} title="Completion Window">
            <div className="flex items-end gap-4 flex-wrap">
              {/* Effective date */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Public effective date
                </label>
                <div className="relative">
                  <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7] transition-colors"
                  />
                </div>
              </div>

              {/* Days stepper */}
              <div>
                <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Complete within
                </label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setDaysWithin(d => Math.max(1, d - 1))}
                    className="px-3 py-2.5 border-r border-gray-200 hover:bg-gray-50 transition-colors text-[#6B7280] font-bold"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <input
                    type="number"
                    value={daysWithin}
                    onChange={e => setDaysWithin(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center text-[14px] font-bold text-[#1A1F2E] py-2.5 focus:outline-none bg-white"
                    min={1}
                  />
                  <button
                    onClick={() => setDaysWithin(d => d + 1)}
                    className="px-3 py-2.5 border-l border-gray-200 hover:bg-gray-50 transition-colors text-[#6B7280] font-bold"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="pr-3 text-[12px] text-[#9CA3AF] font-medium">days</span>
                </div>
              </div>
            </div>

            {/* Live helper line */}
            {effectiveDate ? (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#E8FAF7" }}>
                <Clock size={13} style={{ color: TEAL }} />
                <p className="text-[12px] font-semibold" style={{ color: "#065F46" }}>
                  Effective {fmtDate(effectiveDate)} · due by {addDays(effectiveDate, daysWithin)} for each assignee
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50">
                <Clock size={13} className="text-gray-300" />
                <p className="text-[12px] text-[#9CA3AF]">Set an effective date to see the computed due date</p>
              </div>
            )}
          </Section>

          {/* ── 5. Assignee Preview ──────────────────────────────────────── */}
          {previewStaff.length > 0 && (
            <Section num={5} title={`Assignee Preview · ${totalAssignees} ${totalAssignees === 1 ? "person" : "people"}`}>
              <div className="rounded-lg overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["Name", "Department", "Role", "Due Date"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] border-b border-gray-100">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewStaff.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: s.color }}>
                              {s.initials}
                            </div>
                            <span className="text-[12px] font-semibold text-[#1A1F2E]">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{s.dept}</td>
                        <td className="px-4 py-2.5 text-[12px] text-[#6B7280]">{s.role}</td>
                        <td className="px-4 py-2.5">
                          {effectiveDate ? (
                            <span className="text-[12px] font-semibold" style={{ color: mandatory ? "#DC2626" : "#1A1F2E" }}>
                              {addDays(effectiveDate, daysWithin)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* bottom padding so footer doesn't obscure last section */}
          <div className="h-4" />
        </div>

        {/* ── Right sidebar: history ───────────────────────────────────── */}
        <aside className="apex-training-history w-[268px] shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <p className="text-[13px] font-bold text-[#1A1F2E]">Assignment History</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Recent assignments</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {HISTORY.map(h => {
              const pill = HIST_PILL[h.status];
              return (
                <div key={h.id} className="p-3.5 bg-[#F9FAFB] rounded-xl border border-gray-100">
                  <p className="text-[12px] font-bold text-[#1A1F2E] leading-snug line-clamp-1 mb-0.5">{h.title}</p>
                  <p className="text-[11px] text-[#6B7280] mb-2">{h.target}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9CA3AF]">{h.date} · {h.count} staff</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: pill.color, backgroundColor: pill.bg }}>
                      {h.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="apex-training-assignment-footer bg-white border-t border-gray-100 px-6 py-3.5 shrink-0 flex items-center justify-between">
        <div className="text-[12px] text-[#9CA3AF]">
          {selectedCourse
            ? <><BookOpen size={12} className="inline mr-1" />{selectedCourse.title} · {selectedCourse.version}</>
            : "No course selected"}
          {chips.length > 0 && <span className="ml-3"><Users size={12} className="inline mr-1" />{totalAssignees} assignees</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedId(null); setChips([]); setEffectiveDate(""); setDaysWithin(14); setMandatory(false); }}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold border-2 border-gray-200 text-[#6B7280] hover:border-gray-300 hover:text-[#1A1F2E] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!canAssign}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ backgroundColor: canAssign ? "#059669" : "#D1D5DB", cursor: canAssign ? "pointer" : "not-allowed" }}
          >
            <CheckCircle size={14} /> Assign Training
          </button>
        </div>
      </div>
    </div>
  );
}

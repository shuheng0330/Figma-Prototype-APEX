import { useState, useMemo } from "react";
import {
  X, Search, Plus, Globe, ChevronUp, ChevronDown,
  CalendarDays, CheckCircle, Users, User, Briefcase,
  ToggleLeft, ToggleRight, BookOpen, Clock, AlertTriangle, Lock, Info,
  Zap, LayoutGrid, Bell,
} from "lucide-react";
import { useRole, ROLE_META, scopeOf } from "../access";
import {
  COURSES as MATERIALS, ROLE_IDENTITY, catStyle, ASSIGNMENT_MODE_META,
  staffById, assignCourse, useStoreVersion,
  type AssignmentMode,
} from "../trainingStore";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
/** A material as shown in the picker — sourced from the shared training store. */
interface CourseMaterial {
  id: string; title: string; dept: string; version: string;
  modules: number; from: string; to: string; emoji: string; approved: string;
  ownerId: string; topic: string;
}
interface Staff {
  id: string; name: string; initials: string; dept: string; role: string; color: string;
}
interface Chip {
  key: string; type: "department" | "role" | "individual";
  label: string; count: number; staffIds: string[];
}
/** "all" publishes the course to the Learning Portal for every staff member. */
type Audience = "all" | "specific";
interface HistoryEntry {
  id: string; title: string; target: string; date: string; count: number; status: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const COURSES: CourseMaterial[] = MATERIALS.map((c, i) => ({
  id: c.id,
  title: c.title,
  dept: c.dept,
  version: `v1.${i % 4}`,
  modules: 3 + (i % 4),
  from: c.from,
  to: c.to,
  emoji: c.emoji,
  approved: c.deadline ? fmtDate(c.deadline) : "16 May 2026",
  ownerId: c.ownerId,
  topic: c.topic,
}));

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
  { id: "H2", title: "Customer Handling Protocol", target: "All Staff · Learning Portal", date: "10 May 2026", count: 12, status: "Completed"   },
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
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Whole days from today until the given date (negative if it has passed). */
function daysUntil(iso: string) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((new Date(iso + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime()) / MS);
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
  const role  = useRole();
  useStoreVersion();
  const myId  = ROLE_IDENTITY[role] ?? "E001";
  const scope = scopeOf(role, "assign-training");
  /** Trainers may assign only what they created; HR and Super Admin assign anything. */
  const ownOnly = scope === "own";
  const visibleCourses = ownOnly ? COURSES.filter(c => c.ownerId === myId) : COURSES;

  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [audience, setAudience]       = useState<Audience>("all");
  const [mode2, setMode2]             = useState<AssignmentMode>("portal");
  const [mode, setMode]               = useState<Chip["type"]>("department");
  const [chips, setChips]             = useState<Chip[]>([]);
  const [pickedDept, setPickedDept]   = useState(DEPARTMENTS[0]);
  const [pickedRole, setPickedRole]   = useState(ROLES[0]);
  const [search, setSearch]           = useState("");
  const [mandatory, setMandatory]     = useState(false);
  const [deadline, setDeadline]       = useState("");
  const [daysWithin, setDaysWithin]   = useState(14);
  const [submitted, setSubmitted]     = useState(false);

  const selectedCourse = visibleCourses.find(c => c.id === selectedId);

  const previewStaff = useMemo(() => {
    if (audience === "all") return STAFF;
    const ids = new Set<string>(chips.flatMap(c => c.staffIds));
    return STAFF.filter(s => ids.has(s.id));
  }, [audience, chips]);

  const totalAssignees = previewStaff.length;
  const audienceReady = audience === "all" || chips.length > 0;
  const daysLeft = deadline ? daysUntil(deadline) : null;
  const deadlinePassed = daysLeft !== null && daysLeft < 0;
  // The personal window cannot outrun the deadline — whichever comes first wins.
  const windowClipped = daysLeft !== null && daysLeft >= 0 && daysLeft < daysWithin;
  const isImmediate = mode2 === "immediate";
  /** For an immediate assignment the window runs from today, so the due date is fixed. */
  const immediateDue = (() => {
    const d = new Date(todayISO() + "T00:00:00");
    d.setDate(d.getDate() + daysWithin);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return deadline && iso > deadline ? deadline : iso;
  })();
  const canAssign = Boolean(selectedId && audienceReady && deadline && !deadlinePassed);

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
    if (!canAssign || !selectedId) return;
    assignCourse(selectedId, {
      mode: mode2,
      deadline,
      daysWithin,
      mandatory,
      audience: audience === "all" ? "All staff · Learning Portal" : chips.map(c => c.label).join(", "),
      assignedBy: myId,
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setChips([]);
    setSelectedId(null);
    setAudience("all");
    setMode2("portal");
    setDeadline("");
    setDaysWithin(14);
    setMandatory(false);
  };

  return (
    <div className="apex-training-assignment flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1F2E]">Assign Training</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">Select a course, choose an audience, and set the completion deadline</p>
        </div>
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
            <CheckCircle size={14} style={{ color: "#059669" }} />
            <p className="text-[12px] font-semibold text-[#065F46]">
            {isImmediate
              ? "Assigned to start now — staff notified and the course is pinned in My Learnings."
              : "Added to the Learning Portal — staff can start any time before the deadline."}
          </p>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="apex-training-assignment-body flex flex-1 overflow-hidden">

        {/* Main scrollable form */}
        <div className="apex-training-assignment-form flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── 1. Select Course ─────────────────────────────────────────── */}
          <Section num={1} title="Select Course">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-3"
              style={{ backgroundColor: ownOnly ? "#FFFBEB" : "#F9FAFB" }}>
              {ownOnly ? <Lock size={12} className="mt-0.5 shrink-0" style={{ color: "#B45309" }} />
                       : <Info size={12} className="mt-0.5 shrink-0" style={{ color: "#9CA3AF" }} />}
              <p className="text-[11px] leading-relaxed" style={{ color: ownOnly ? "#92400E" : "#6B7280" }}>
                {ownOnly
                  ? `${ROLE_META[role].label}: you can assign only the ${visibleCourses.length} material${visibleCourses.length === 1 ? "" : "s"} you created. Materials owned by others are read-only.`
                  : `${ROLE_META[role].label}: you can assign any of the ${visibleCourses.length} approved materials company-wide.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
              {visibleCourses.map(c => {
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
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[10px] text-[#9CA3AF] truncate">Approved {c.approved}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ color: catStyle(c.topic).color, backgroundColor: catStyle(c.topic).bg }}>
                          {catStyle(c.topic).name}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#C4C9D4] mt-1 truncate">
                        Owner: {c.ownerId === myId ? "you" : staffById(c.ownerId)?.name ?? "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {!visibleCourses.length && (
              <div className="py-8 text-center">
                <BookOpen size={26} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                <p className="text-[12px] font-semibold" style={{ color: "#9CA3AF" }}>You have not created any materials yet</p>
                <p className="text-[11px] mt-1" style={{ color: "#C4C9D4" }}>Upload an SOP first — you can only assign your own.</p>
              </div>
            )}
          </Section>

          {/* ── 2. Assign To ─────────────────────────────────────────────── */}
          <Section num={2} title="Audience">
            {/* All staff vs. targeted */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                { id: "all",      icon: Globe, label: "All staff",           desc: `Published to the Learning Portal — any of the ${STAFF.length} staff can take it` },
                { id: "specific", icon: Users, label: "Specific recipients", desc: "Target selected departments, roles, or individuals" },
              ] as const).map(({ id, icon: Icon, label, desc }) => {
                const active = audience === id;
                return (
                  <button
                    key={id}
                    onClick={() => setAudience(id)}
                    className="text-left rounded-xl border-2 px-3.5 py-3 transition-all"
                    style={{ borderColor: active ? TEAL : "#E5E7EB", backgroundColor: active ? "#F0FDFA" : "white" }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={13} style={{ color: active ? TEAL : "#9CA3AF" }} />
                      <p className="text-[12px] font-bold text-[#1A1F2E]">{label}</p>
                      {active && <CheckCircle size={13} className="ml-auto" style={{ color: TEAL }} />}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1 leading-snug">{desc}</p>
                  </button>
                );
              })}
            </div>

            {audience === "all" ? (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#E8FAF7" }}>
                <Globe size={13} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                <p className="text-[12px] font-semibold leading-relaxed" style={{ color: "#065F46" }}>
                  No recipients needed — the course appears in every staff member's Learning Portal
                  and must be completed on or before the deadline below.
                </p>
              </div>
            ) : (
            <>
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
            </>
            )}
          </Section>

          {/* ── 3. Assignment type ───────────────────────────────────────── */}
          <Section num={3} title="How Staff Receive It">
            <div className="grid grid-cols-2 gap-3">
              {(["portal", "immediate"] as AssignmentMode[]).map(m => {
                const meta = ASSIGNMENT_MODE_META[m];
                const active = mode2 === m;
                const Icon = m === "portal" ? LayoutGrid : Zap;
                return (
                  <button
                    key={m}
                    onClick={() => setMode2(m)}
                    className="text-left rounded-xl border-2 px-4 py-3.5 transition-all"
                    style={{ borderColor: active ? meta.color : "#E5E7EB", backgroundColor: active ? meta.bg : "white" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={14} style={{ color: active ? meta.color : "#9CA3AF" }} />
                      <p className="text-[12px] font-bold text-[#1A1F2E]">{meta.label}</p>
                      {active && <CheckCircle size={13} className="ml-auto" style={{ color: meta.color }} />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#9CA3AF]">{meta.blurb}</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {(m === "portal"
                        ? ["Self-paced", "No notification", "Counts on completion"]
                        : ["Pinned to the top", "Notifies staff", "Clock starts today"]
                      ).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{ color: active ? meta.color : "#9CA3AF", backgroundColor: active ? "white" : "#F3F4F6" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {isImmediate && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mt-3" style={{ backgroundColor: "#FEF2F2" }}>
                <Bell size={12} className="mt-0.5 shrink-0" style={{ color: "#DC2626" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "#991B1B" }}>
                  Every assignee is notified on assignment and the course is pinned to the top of their
                  My Learnings as <b>Start now</b>. They must finish within {daysWithin} day{daysWithin === 1 ? "" : "s"} of
                  today{deadline ? `, and no later than ${fmtDate(deadline)}` : ""}.
                </p>
              </div>
            )}
          </Section>

          {/* ── 4. Mandatory ─────────────────────────────────────────────── */}
          <Section num={4} title="Mandatory">
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
                    ? "Staff must complete this training by the deadline. Non-completion will be flagged."
                    : "Optional — staff can complete this any time before the deadline."}
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

          {/* ── 5. Deadline ──────────────────────────────────────────────── */}
          <Section num={5} title="Completion Deadline">
            <div className="flex items-start gap-4 flex-wrap">
              {/* Absolute cutoff */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                  Last date to complete
                </label>
                <div className="relative">
                  <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="date"
                    value={deadline}
                    min={todayISO()}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7] transition-colors"
                    style={{ borderColor: deadlinePassed ? "#FCA5A5" : "#E5E7EB" }}
                  />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1.5">Course closes after this date.</p>
              </div>

              {/* Per-person window */}
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
                <p className="text-[10px] text-[#9CA3AF] mt-1.5">
                  {isImmediate ? "Counted from today — the assignment date." : "Counted from the day each staff starts."}
                </p>
              </div>
            </div>

            {/* Live helper line */}
            {!deadline ? (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50">
                <Clock size={13} className="text-gray-300" />
                <p className="text-[12px] text-[#9CA3AF]">Set the last date staff can take this course</p>
              </div>
            ) : deadlinePassed ? (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#FEF2F2" }}>
                <AlertTriangle size={13} style={{ color: "#DC2626" }} />
                <p className="text-[12px] font-semibold" style={{ color: "#991B1B" }}>
                  {fmtDate(deadline)} has already passed — pick a future date.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#E8FAF7" }}>
                  <Clock size={13} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                  <p className="text-[12px] font-semibold leading-relaxed" style={{ color: "#065F46" }}>
                    {isImmediate ? (
                      <>Starts today · everyone must finish by {fmtDate(immediateDue)} ({daysWithin} {daysWithin === 1 ? "day" : "days"} from assignment)
                        {immediateDue === deadline ? " — capped by the deadline" : ""}</>
                    ) : (
                      <>Staff can start any time · each has {daysWithin} {daysWithin === 1 ? "day" : "days"} from their own start date to finish
                        {" "}· nothing accepted after {fmtDate(deadline)}
                        {" "}({daysLeft === 0 ? "today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} from today`})</>
                    )}
                  </p>
                </div>
                {windowClipped && !isImmediate && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#FFFBEB" }}>
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "#D97706" }} />
                    <p className="text-[12px] font-semibold leading-relaxed" style={{ color: "#92400E" }}>
                      Only {daysLeft} {daysLeft === 1 ? "day" : "days"} left before the deadline — anyone starting today gets
                      less than the full {daysWithin}-day window, and it shrinks further each day.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── 5. Assignee Preview ──────────────────────────────────────── */}
          {previewStaff.length > 0 && (
            <Section num={6} title={`${audience === "all" ? "Learning Portal Preview" : "Assignee Preview"} · ${totalAssignees} ${totalAssignees === 1 ? "person" : "people"}`}>
              <div className="rounded-lg overflow-hidden border border-gray-100 max-h-[280px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      {["Name", "Department", "Role", "Must Finish By"].map(h => (
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
                          {deadline ? (
                            <>
                              <span className="text-[12px] font-semibold" style={{ color: mandatory ? "#DC2626" : "#1A1F2E" }}>
                                {fmtDate(isImmediate ? immediateDue : deadline)}
                              </span>
                              <span className="block text-[10px] text-[#9CA3AF]">
                                {isImmediate ? `${daysWithin}d from today — starts immediately` : `or ${daysWithin}d after start — whichever is first`}
                              </span>
                            </>
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
          {audience === "all"
            ? <span className="ml-3"><Globe size={12} className="inline mr-1" />All staff · Learning Portal</span>
            : chips.length > 0 && <span className="ml-3"><Users size={12} className="inline mr-1" />{totalAssignees} assignees</span>}
          {deadline && !deadlinePassed && (
            <span className="ml-3"><Clock size={12} className="inline mr-1" />
              {daysWithin}d window · by {fmtDate(isImmediate ? immediateDue : deadline)}
            </span>
          )}
          <span className="ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ color: ASSIGNMENT_MODE_META[mode2].color, backgroundColor: ASSIGNMENT_MODE_META[mode2].bg }}>
            {ASSIGNMENT_MODE_META[mode2].short}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedId(null); setChips([]); setAudience("all"); setDeadline(""); setDaysWithin(14); setMandatory(false); }}
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
            {isImmediate ? <Zap size={14} /> : <CheckCircle size={14} />}
            {isImmediate ? "Assign & Start Now" : "Add to Portal"}
          </button>
        </div>
      </div>
    </div>
  );
}

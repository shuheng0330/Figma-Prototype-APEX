import { useState, useRef, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import {
  Users, Award, Filter, ChevronDown, Eye, Download,
  CheckCircle, XCircle, Clock, Plus, ArrowUp, ArrowDown,
  ArrowUpDown, Columns, X, AlertTriangle, Sparkles,
} from "lucide-react";

import { TrainerDashboard } from "./TrainerDashboard";
import { SharingSessions } from "./SharingSessions";
import { useRole, can } from "../access";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
type StatusType = "Certified ✓" | "Failed Module" | "In Progress" | "Not Started";
type SortField = "name" | "department" | "score" | "modulesDone" | "lastAttempt" | "attempts";
type SortDir = "asc" | "desc";

type ColKey =
  | "department" | "sop" | "prerequisite"
  | "modulesDone" | "score" | "status"
  | "lastAttempt" | "attempts";

interface StaffRecord {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  department: string;
  sop: string;
  modulesDone: number;
  totalModules: number;
  score: number;
  status: StatusType;
  lastAttempt: string;
  attempts: number;
  prerequisite: string;
  prerequisiteMet: boolean;
}

interface DeptScore {
  name: string;
  avgScore: number;
  trained: number;
  total: number;
}

interface ExternalLog {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  topic: string;
  competency: string;
  duration: string;
  notes: string;
  loggedAt: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = ["IT", "HR", "Sales", "Finance", "Operations", "Marketing", "Technical"];
const SOP_LIST = ["AC Installation Manual", "Customer Handling Protocol", "Safety Procedures Manual"];
const COMPETENCIES = ["Safety & Compliance", "Technical Skills", "Customer Service", "Leadership", "Digital Literacy", "Product Knowledge"];

const STAFF_DATA: StaffRecord[] = [
  { id: "S001", name: "Ahmad Syafiq",   initials: "AS", avatarColor: "#00C9A7", department: "Technical", sop: "AC Installation Manual",       modulesDone: 2, totalModules: 5, score: 88, status: "In Progress",  lastAttempt: "2026-05-16", attempts: 1, prerequisite: "Safety Procedures Manual", prerequisiteMet: true  },
  { id: "S002", name: "Nurul Ain",       initials: "NA", avatarColor: "#6366F1", department: "Technical", sop: "AC Installation Manual",       modulesDone: 5, totalModules: 5, score: 91, status: "Certified ✓",  lastAttempt: "2026-05-16", attempts: 1, prerequisite: "Safety Procedures Manual", prerequisiteMet: true  },
  { id: "S003", name: "Haziq Rahman",    initials: "HR", avatarColor: "#F59E0B", department: "Technical", sop: "AC Installation Manual",       modulesDone: 5, totalModules: 5, score: 76, status: "Certified ✓",  lastAttempt: "2026-05-16", attempts: 2, prerequisite: "Safety Procedures Manual", prerequisiteMet: true  },
  { id: "S004", name: "Siti Mariam",     initials: "SM", avatarColor: "#3B82F6", department: "Technical", sop: "AC Installation Manual",       modulesDone: 3, totalModules: 5, score: 82, status: "In Progress",  lastAttempt: "2026-05-15", attempts: 1, prerequisite: "Safety Procedures Manual", prerequisiteMet: false },
  { id: "S005", name: "Faizal Ismail",   initials: "FI", avatarColor: "#8B5CF6", department: "Technical", sop: "AC Installation Manual",       modulesDone: 0, totalModules: 5, score:  0, status: "Not Started",  lastAttempt: "-",          attempts: 0, prerequisite: "Safety Procedures Manual", prerequisiteMet: false },
  { id: "S006", name: "Izzati Mohd",     initials: "IM", avatarColor: "#EC4899", department: "Technical", sop: "AC Installation Manual",       modulesDone: 5, totalModules: 5, score: 65, status: "Certified ✓",  lastAttempt: "2026-05-14", attempts: 3, prerequisite: "Safety Procedures Manual", prerequisiteMet: true  },
  { id: "S007", name: "Razif Kamal",     initials: "RK", avatarColor: "#14B8A6", department: "Technical", sop: "AC Installation Manual",       modulesDone: 2, totalModules: 5, score: 55, status: "In Progress",  lastAttempt: "2026-05-13", attempts: 2, prerequisite: "Safety Procedures Manual", prerequisiteMet: false },
  { id: "S008", name: "Amirah Zulkifli", initials: "AZ", avatarColor: "#A855F7", department: "Technical", sop: "AC Installation Manual",       modulesDone: 5, totalModules: 5, score: 94, status: "Certified ✓",  lastAttempt: "2026-05-16", attempts: 1, prerequisite: "Safety Procedures Manual", prerequisiteMet: true  },
];

const DEPT_COLORS: Record<string, string> = {
  IT: TEAL, HR: "#6366F1", Sales: "#F59E0B",
  Finance: "#3B82F6", Operations: "#8B5CF6", Marketing: "#EC4899",
  Technical: "#059669",
};

const ALL_COLS: ColKey[] = ["department", "sop", "prerequisite", "modulesDone", "score", "status", "lastAttempt", "attempts"];
const COL_LABELS: Record<ColKey, string> = {
  department: "Department", sop: "SOP", prerequisite: "Prerequisites",
  modulesDone: "Modules Done", score: "Score", status: "Status",
  lastAttempt: "Last Attempt", attempts: "Attempts",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusPill(status: StatusType): { color: string; bg: string } {
  switch (status) {
    case "Certified ✓":  return { color: "#059669", bg: "#ECFDF5" };
    case "Failed Module": return { color: "#DC2626", bg: "#FEE2E2" };
    case "In Progress":   return { color: "#D97706", bg: "#FEF3C7" };
    case "Not Started":   return { color: "#9CA3AF", bg: "#F3F4F6" };
  }
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

// ── DropDown ──────────────────────────────────────────────────────────────────
function DropDown({
  label, open, setOpen, refEl, options, current, onSelect,
}: {
  label: string; open: boolean; setOpen: (v: boolean) => void;
  refEl: React.RefObject<HTMLDivElement>; options: string[];
  current: string; onSelect: (v: string) => void;
}) {
  return (
    <div ref={refEl} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[12px] text-[#374151] hover:border-gray-300 transition-colors shadow-sm">
        {label}{current !== "All" && <span className="font-semibold" style={{ color: TEAL }}>: {current}</span>}
        <ChevronDown size={11} className="text-[#9CA3AF]" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 min-w-[160px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
          {options.map((o) => (
            <button key={o} onClick={() => { onSelect(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F4F6F9] transition-colors"
              style={current === o ? { color: TEAL, fontWeight: 600 } : { color: "#374151" }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown size={10} className="opacity-30" />;
  return dir === "asc" ? <ArrowUp size={10} style={{ color: TEAL }} /> : <ArrowDown size={10} style={{ color: TEAL }} />;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function DeptChartTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p className="text-[11px] font-bold text-[#1A1F2E] mb-1">{d.name}</p>
      <p className="text-[11px] text-[#6B7280]">Avg Score: <span className="font-semibold text-[#1A1F2E]">{d.avgScore}%</span></p>
      <p className="text-[11px] text-[#6B7280]">Trained: <span className="font-semibold text-[#1A1F2E]">{d.trained}/{d.total}</span></p>
    </div>
  );
}

// ── Log External Training Modal ───────────────────────────────────────────────
function LogExternalModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (log: Omit<ExternalLog, "id" | "loggedAt">) => void;
}) {
  const [staffId, setStaffId]       = useState(STAFF_DATA[0].id);
  const [date, setDate]             = useState("");
  const [topic, setTopic]           = useState("");
  const [duration, setDuration]     = useState("");
  const [competency, setCompetency] = useState(COMPETENCIES[0]);
  const [notes, setNotes]           = useState("");

  const canSubmit = date && topic.trim() && duration.trim();
  const selectedStaff = STAFF_DATA.find(s => s.id === staffId)!;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7] transition-colors bg-white";

  const handleSave = () => {
    if (!canSubmit) return;
    onSave({
      staffId,
      staffName: selectedStaff.name,
      date,
      topic: topic.trim(),
      competency,
      duration: duration.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-[500px] max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A1F2E]">Log External Training</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Record external training completed by a staff member</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#6B7280]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Staff Member */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Staff Member <span className="text-red-500">*</span></label>
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className={inputCls}>
              {STAFF_DATA.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
              ))}
            </select>
          </div>

          {/* Training Topic */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Training Topic <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Advanced HVAC Certification — External"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Date + Duration row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Date Completed <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Duration <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. 2 days / 8 hours"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Competency */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Competency Area</label>
            <select value={competency} onChange={e => setCompetency(e.target.value)} className={inputCls}>
              {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Certificate number, issuing body, observations..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputCls + " resize-none"}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#6B7280] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ backgroundColor: canSubmit ? TEAL : "#D1D5DB", cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            Log Training
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
type ScoreTab = "staff" | "trainers" | "sharing";

export function TrainingScoreboard() {
  const role = useRole();
  /** Trainer effectiveness lives here as a second tab. */
  const showTrainerTab = can(role, "trainer-dashboard");
  const [tab, setTab] = useState<ScoreTab>("staff");

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filterDept, setFilterDept]     = useState("All");
  const [filterSOP, setFilterSOP]       = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showDeptDD, setShowDeptDD]     = useState(false);
  const [showSOPDD, setShowSOPDD]       = useState(false);
  const [showStatusDD, setShowStatusDD] = useState(false);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir]     = useState<SortDir>("asc");

  // ── Column visibility ─────────────────────────────────────────────────────
  const [visibleCols, setVisibleCols]   = useState<Set<ColKey>>(new Set(ALL_COLS));
  const [showColPanel, setShowColPanel] = useState(false);

  // ── Log External Training modal ───────────────────────────────────────────
  const [showLogModal, setShowLogModal]   = useState(false);
  const [externalLogs, setExternalLogs]   = useState<ExternalLog[]>([]);
  const [logSuccess, setLogSuccess]       = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const deptRef   = useRef<HTMLDivElement>(null);
  const sopRef    = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const colRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setShowDeptDD(false);
      if (sopRef.current && !sopRef.current.contains(e.target as Node)) setShowSOPDD(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDD(false);
      if (colRef.current && !colRef.current.contains(e.target as Node)) setShowColPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Column toggle ─────────────────────────────────────────────────────────
  const toggleCol = (col: ColKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) { next.delete(col); } else { next.add(col); }
      return next;
    });
  };

  // ── Filtered + sorted staff ───────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    let result = STAFF_DATA.filter((s) =>
      (filterDept === "All" || s.department === filterDept) &&
      (filterSOP === "All" || s.sop === filterSOP) &&
      (filterStatus === "All" || s.status === filterStatus)
    );
    if (sortField) {
      result = [...result].sort((a, b) => {
        let va: string | number = "";
        let vb: string | number = "";
        switch (sortField) {
          case "name":        va = a.name;        vb = b.name;        break;
          case "department":  va = a.department;  vb = b.department;  break;
          case "score":       va = a.score;       vb = b.score;       break;
          case "modulesDone": va = a.modulesDone; vb = b.modulesDone; break;
          case "lastAttempt": va = a.lastAttempt === "-" ? "" : a.lastAttempt; vb = b.lastAttempt === "-" ? "" : b.lastAttempt; break;
          case "attempts":    va = a.attempts;    vb = b.attempts;    break;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ?  1 : -1;
        return 0;
      });
    }
    return result;
  }, [filterDept, filterSOP, filterStatus, sortField, sortDir]);

  // ── KPI metrics ──────────────────────────────────────────────────────────
  const totalAssigned     = STAFF_DATA.length;
  const certified         = STAFF_DATA.filter((s) => s.status === "Certified ✓").length;
  const inProgress        = STAFF_DATA.filter((s) => s.status === "In Progress").length;
  const notStarted        = STAFF_DATA.filter((s) => s.status === "Not Started").length;
  const certificationRate = Math.round((certified / totalAssigned) * 100);
  const prereqUnmet       = STAFF_DATA.filter(s => !s.prerequisiteMet).length;

  // ── Department scores ─────────────────────────────────────────────────────
  const deptScores: DeptScore[] = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptStaff   = STAFF_DATA.filter((s) => s.department === dept);
      const trainedStaff = deptStaff.filter((s) => s.score > 0);
      const avgScore    = trainedStaff.length > 0
        ? Math.round(trainedStaff.reduce((sum, s) => sum + s.score, 0) / trainedStaff.length)
        : 0;
      return { name: dept, avgScore, trained: trainedStaff.length, total: deptStaff.length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, []);

  // Custom bar shape
  function DeptBar(props: any) {
    const { x, y, width, height, name } = props;
    if (!height || height <= 0) return null;
    const fill = DEPT_COLORS[name as string] ?? TEAL;
    return <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} rx={3} ry={3} />;
  }

  // ── Handle external training log ─────────────────────────────────────────
  const handleLogSave = (log: Omit<ExternalLog, "id" | "loggedAt">) => {
    setExternalLogs(prev => [...prev, {
      ...log,
      id: `EXT-${Date.now()}`,
      loggedAt: new Date().toLocaleDateString("en-GB"),
    }]);
    setShowLogModal(false);
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3500);
  };

  // ── Column header cell ────────────────────────────────────────────────────
  function SortableTh({
    col, label, field,
  }: {
    col?: ColKey; label: string; field?: SortField;
  }) {
    if (col && !visibleCols.has(col)) return null;
    const isSortable = !!field;
    return (
      <th
        onClick={isSortable ? () => handleSort(field!) : undefined}
        className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap"
        style={{ cursor: isSortable ? "pointer" : "default", userSelect: "none" }}
      >
        <div className="flex items-center gap-1">
          {label}
          {isSortable && <SortIcon field={field!} current={sortField} dir={sortDir} />}
        </div>
      </th>
    );
  }

  // ── Tab strip ──────────────────────────────────────────────────────────────
  const Tabs = () => (
    showTrainerTab ? (
      <div className="flex items-center gap-1 p-0.5 rounded-lg w-fit" style={{ backgroundColor: "#F4F6F9", border: "1px solid #E5E7EB" }}>
        {([
          { id: "staff" as const,    label: "Staff Performance",     icon: Users },
          { id: "trainers" as const, label: "Trainer Effectiveness", icon: Award },
          { id: "sharing" as const,  label: "Staff Sharing",         icon: Sparkles },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12px] font-semibold transition-all"
            style={tab === id
              ? { backgroundColor: "white", color: "#1A1F2E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { backgroundColor: "transparent", color: "#9CA3AF" }}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
    ) : null
  );

  // ── Staff sharing tab ──────────────────────────────────────────────────────
  if (tab === "sharing" && showTrainerTab) {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#1A1F2E]">Training Scoreboard</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            Staff sharing sessions — how many were held and how many staff took part
          </p>
        </div>
        <Tabs />
        <SharingSessions embedded />
      </div>
    );
  }

  // ── Trainer effectiveness tab ──────────────────────────────────────────────
  if (tab === "trainers" && showTrainerTab) {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#1A1F2E]">Training Scoreboard</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            Trainer effectiveness — headcount and average quiz scores per session
          </p>
        </div>
        <Tabs />
        <TrainerDashboard embedded />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#1A1F2E]">Training Scoreboard</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">Overview of staff training performance · Trainer view</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            <Plus size={12} /> Log External Training
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-md text-[12px] text-[#374151] hover:border-gray-300 shadow-sm transition-colors">
            <Download size={12} className="text-[#9CA3AF]" /> Export Report
          </button>
        </div>
      </div>

      <Tabs />

      {/* ── Success toast ─────────────────────────────────────────────── */}
      {logSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }}>
          <CheckCircle size={16} style={{ color: "#059669" }} />
          <p className="text-[13px] font-semibold" style={{ color: "#065F46" }}>External training logged successfully.</p>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Total Assigned</p>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8FAF7" }}>
              <Users size={16} style={{ color: TEAL }} />
            </div>
          </div>
          <p className="text-[26px] font-bold text-[#1A1F2E] leading-none mb-1">{totalAssigned}</p>
          <p className="text-[11px] text-[#9CA3AF]">Staff enrolled</p>
        </div>

        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Certified</p>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
              <CheckCircle size={16} style={{ color: "#059669" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold text-[#1A1F2E] leading-none mb-1">{certified}</p>
          <p className="text-[11px] text-[#9CA3AF]">All modules done</p>
        </div>

        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">In Progress</p>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
              <Clock size={16} style={{ color: "#D97706" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold text-[#1A1F2E] leading-none mb-1">{inProgress}</p>
          <p className="text-[11px] text-[#9CA3AF]">Actively training</p>
        </div>

        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Not Started</p>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
              <XCircle size={16} style={{ color: "#9CA3AF" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold text-[#1A1F2E] leading-none mb-1">{notStarted}</p>
          <p className="text-[11px] text-[#9CA3AF]">Yet to begin</p>
        </div>

        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Certification Rate</p>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
              <Award size={16} style={{ color: "#3B82F6" }} />
            </div>
          </div>
          <p className="text-[26px] font-bold text-[#1A1F2E] leading-none mb-2">{certificationRate}%</p>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${certificationRate}%`, backgroundColor: "#3B82F6" }} />
          </div>
        </div>
      </div>

      {/* ── Prerequisite Flag Banner ───────────────────────────────────── */}
      {prereqUnmet > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
              {prereqUnmet} staff member{prereqUnmet > 1 ? "s have" : " has"} unmet prerequisites
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#B45309" }}>
              Staff flagged below have not completed their prerequisite SOP before starting the assigned training. Consider pausing their progress until prerequisites are met.
            </p>
          </div>
        </div>
      )}

      {/* ── Department Performance Chart ──────────────────────────────── */}
      <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-bold text-[#1A1F2E]">Performance by Department</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Average training scores across departments</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart id="training-scoreboard" data={deptScores} margin={{ top: 8, right: 16, bottom: 0, left: -10 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <ReTooltip content={<DeptChartTip />} cursor={{ fill: "#F9FAFB" }} />
            <Bar dataKey="avgScore" shape={<DeptBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Staff Training Records ────────────────────────────────────── */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1F2E]">Staff Training Records</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">{filteredStaff.length} staff records</p>
            </div>
            {/* Column toggle */}
            <div ref={colRef} className="relative">
              <button
                onClick={() => setShowColPanel(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[12px] text-[#374151] hover:border-gray-300 transition-colors shadow-sm"
              >
                <Columns size={12} className="text-[#9CA3AF]" /> Columns
                <ChevronDown size={11} className="text-[#9CA3AF]" />
              </button>
              {showColPanel && (
                <div className="absolute top-full mt-1 right-0 w-[200px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-2">
                  <p className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">Toggle Columns</p>
                  {ALL_COLS.map(col => (
                    <button
                      key={col}
                      onClick={() => toggleCol(col)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-[#F4F6F9] transition-colors text-left"
                      style={{ color: visibleCols.has(col) ? "#1A1F2E" : "#9CA3AF" }}
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                        style={visibleCols.has(col)
                          ? { borderColor: TEAL, backgroundColor: TEAL }
                          : { borderColor: "#D1D5DB" }}
                      >
                        {visibleCols.has(col) && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {COL_LABELS[col]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-[#9CA3AF]" />
            <DropDown label="Department" open={showDeptDD} setOpen={setShowDeptDD} refEl={deptRef}
              options={["All", ...DEPARTMENTS]} current={filterDept} onSelect={setFilterDept} />
            <DropDown label="SOP" open={showSOPDD} setOpen={setShowSOPDD} refEl={sopRef}
              options={["All", ...SOP_LIST]} current={filterSOP} onSelect={setFilterSOP} />
            <DropDown label="Status" open={showStatusDD} setOpen={setShowStatusDD} refEl={statusRef}
              options={["All", "Certified ✓", "Failed Module", "In Progress", "Not Started"]} current={filterStatus} onSelect={setFilterStatus} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {/* Staff Name — always visible, sortable */}
                <th
                  onClick={() => handleSort("name")}
                  className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    Staff Name <SortIcon field="name" current={sortField} dir={sortDir} />
                  </div>
                </th>
                {visibleCols.has("department") && (
                  <th
                    onClick={() => handleSort("department")}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      Department <SortIcon field="department" current={sortField} dir={sortDir} />
                    </div>
                  </th>
                )}
                {visibleCols.has("sop") && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">SOP</th>
                )}
                {visibleCols.has("prerequisite") && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">Prerequisites</th>
                )}
                {visibleCols.has("modulesDone") && (
                  <th
                    onClick={() => handleSort("modulesDone")}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      Modules Done <SortIcon field="modulesDone" current={sortField} dir={sortDir} />
                    </div>
                  </th>
                )}
                {visibleCols.has("score") && (
                  <th
                    onClick={() => handleSort("score")}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      Score <SortIcon field="score" current={sortField} dir={sortDir} />
                    </div>
                  </th>
                )}
                {visibleCols.has("status") && (
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">Status</th>
                )}
                {visibleCols.has("lastAttempt") && (
                  <th
                    onClick={() => handleSort("lastAttempt")}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      Last Attempt <SortIcon field="lastAttempt" current={sortField} dir={sortDir} />
                    </div>
                  </th>
                )}
                {visibleCols.has("attempts") && (
                  <th
                    onClick={() => handleSort("attempts")}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1">
                      Attempts <SortIcon field="attempts" current={sortField} dir={sortDir} />
                    </div>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: staff.avatarColor }}>{staff.initials}</div>
                        {!staff.prerequisiteMet && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border border-white flex items-center justify-center">
                            <span className="text-[7px] font-bold text-white">!</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-[#1A1F2E] whitespace-nowrap">{staff.name}</span>
                    </div>
                  </td>
                  {/* Dept */}
                  {visibleCols.has("department") && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPT_COLORS[staff.department] }} />
                        <span className="text-[12px] text-[#6B7280]">{staff.department}</span>
                      </div>
                    </td>
                  )}
                  {/* SOP */}
                  {visibleCols.has("sop") && (
                    <td className="px-4 py-3 text-[12px] text-[#6B7280] max-w-[200px] truncate">{staff.sop}</td>
                  )}
                  {/* Prerequisites */}
                  {visibleCols.has("prerequisite") && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {staff.prerequisiteMet ? (
                          <>
                            <CheckCircle size={12} style={{ color: "#059669" }} className="shrink-0" />
                            <span className="text-[11px]" style={{ color: "#059669" }}>Met</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} style={{ color: "#D97706" }} className="shrink-0" />
                            <span className="text-[11px] font-semibold" style={{ color: "#D97706" }}>Unmet</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-[#C4C9D4] mt-0.5 max-w-[140px] truncate" title={staff.prerequisite}>{staff.prerequisite}</p>
                    </td>
                  )}
                  {/* Modules Done */}
                  {visibleCols.has("modulesDone") && (
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold text-[#1A1F2E]">{staff.modulesDone}/{staff.totalModules}</span>
                    </td>
                  )}
                  {/* Score */}
                  {visibleCols.has("score") && (
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-[#1A1F2E]">{staff.score > 0 ? `${staff.score}%` : "—%"}</span>
                    </td>
                  )}
                  {/* Status */}
                  {visibleCols.has("status") && (
                    <td className="px-4 py-3">
                      <Chip label={staff.status} {...getStatusPill(staff.status)} />
                    </td>
                  )}
                  {/* Last Attempt */}
                  {visibleCols.has("lastAttempt") && (
                    <td className="px-4 py-3 text-[12px] text-[#6B7280]">{staff.lastAttempt}</td>
                  )}
                  {/* Attempts */}
                  {visibleCols.has("attempts") && (
                    <td className="px-4 py-3 text-[12px] text-[#6B7280]">{staff.attempts}</td>
                  )}
                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: TEAL, backgroundColor: "#E8FAF7" }}
                    >
                      <Eye size={11} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td
                    colSpan={2 + ALL_COLS.filter(c => visibleCols.has(c)).length}
                    className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]"
                  >
                    No staff records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Note */}
        <div className="px-5 py-3 bg-[#FFFBEB] border-t border-[#FDE68A]">
          <p className="text-[11px] text-[#92400E] flex items-start gap-2">
            <span className="text-[#D97706] shrink-0">⚠</span>
            Staff are only marked Certified when all 5 modules are completed and all module quizzes are passed (minimum 70% per module). Staff with unmet prerequisites are flagged with a badge on their avatar.
          </p>
        </div>
      </div>

      {/* ── External Training Logs Table ───────────────────────────────── */}
      {externalLogs.length > 0 && (
        <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-[#1A1F2E]">External Training Logs</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{externalLogs.length} record{externalLogs.length > 1 ? "s" : ""} logged by trainer</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  {["Staff Member", "Training Topic", "Date", "Duration", "Competency", "Logged"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {externalLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#1A1F2E]">{log.staffName}</td>
                    <td className="px-4 py-3 text-[12px] text-[#1A1F2E]">{log.topic}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B7280]">{log.date}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B7280]">{log.duration}</td>
                    <td className="px-4 py-3">
                      <Chip label={log.competency} color={TEAL} bg="#E8FAF7" />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">{log.loggedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Log External Training Modal ────────────────────────────────── */}
      {showLogModal && (
        <LogExternalModal onClose={() => setShowLogModal(false)} onSave={handleLogSave} />
      )}
    </div>
  );
}

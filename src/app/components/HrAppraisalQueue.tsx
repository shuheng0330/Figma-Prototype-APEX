import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { EMPLOYEES, LIVE_PERIOD, AppStatus, Decision, PeriodAppraisal, resolvePeriodData } from "./appraisalData";
import { usePerformanceStore } from "../performance/store";

const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const RED    = "#D14343";
const GREEN  = "#059669";
const PURPLE = "#7C3AED";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";

// HR queue only shows these statuses (manager-side states are not HR's concern)
const HR_STATUSES: AppStatus[] = ["Pending Review", "Returned", "Approved"];

const STATUS_STYLE: Record<AppStatus, { color: string; bg: string }> = {
  "Draft":                { color: AMBER,  bg: "#FEF9EC" },
  "Pending Review":       { color: TEAL,   bg: "#ECFDF9" },
  "Returned":             { color: RED,    bg: "#FEF3F2" },
  "Approved":             { color: GREEN,  bg: "#ECFDF5" },
};

const ACTION_LABEL: Partial<Record<AppStatus, string>> = {
  "Pending Review":       "Review Appraisal",
  "Returned":             "View Status",
  "Approved":             "View Appraisal",
};

const EMP_META: Record<string, { department: string; manager: string }> = {
  amir:  { department: "Retail Sales", manager: "Lee Seng Wah" },
  sarah: { department: "Retail Sales", manager: "Lee Seng Wah" },
  rizal: { department: "Retail Sales", manager: "Ahmad Faiz" },
  nurul: { department: "Retail Sales", manager: "Ahmad Faiz" },
};

const DECISION_LABEL: Record<string, string> = {
  Promotion:         "Promotion",
  "Salary Increment": "Salary Increment",
  Both:              "Both",
  "No Recommendation": "No Recommendation",
};

type SortField = "finalScore" | "submittedDate";

interface HrRow {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  manager: string;
  finalScore: number;
  managerDecision: Decision | null;
  submittedDate: string;
  status: AppStatus;
}

function buildHrRows(period: string, sharedAppraisals: Record<string, Partial<PeriodAppraisal>>): HrRow[] {
  return Object.entries(EMPLOYEES).flatMap(([id, emp]) => {
    const pd = resolvePeriodData(id, period, period === LIVE_PERIOD ? sharedAppraisals[id] : undefined);
    if (!pd || !HR_STATUSES.includes(pd.status)) return [];
    const meta = EMP_META[id] ?? { department: "—", manager: "—" };
    return [{
      id, name: emp.name, initials: emp.initials, role: emp.role,
      department: meta.department, manager: meta.manager,
      finalScore: pd.finalScore,
      managerDecision: pd.managerDecision,
      submittedDate: pd.submittedDate,
      status: pd.status,
    }];
  });
}

export function HrAppraisalQueue() {
  const navigate = useNavigate();
  const performanceStore = usePerformanceStore();
  const period = LIVE_PERIOD;
  const rows = useMemo(() => buildHrRows(period, performanceStore.state.appraisals), [period, performanceStore.state.appraisals]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMgr,   setFilterMgr]   = useState("All");
  const [filterEmp,   setFilterEmp]   = useState("All");
  const [sortField,   setSortField]   = useState<SortField | null>(null);
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} style={{ color: MUTED, flexShrink: 0 }} />;
    return sortDir === "desc"
      ? <ArrowDown size={12} style={{ color: BLUE, flexShrink: 0 }} />
      : <ArrowUp   size={12} style={{ color: BLUE, flexShrink: 0 }} />;
  }

  const allManagers = useMemo(() => [...new Set(rows.map(r => r.manager))], [rows]);

  const displayed = useMemo(() => {
    let list = rows.filter(r =>
      (filterStatus === "All" || r.status === filterStatus) &&
      (filterMgr    === "All" || r.manager === filterMgr) &&
      (filterEmp    === "All" || r.name === filterEmp)
    );
    if (sortField) {
      list = [...list].sort((a, b) => {
        let diff = 0;
        if (sortField === "finalScore") {
          diff = a.finalScore - b.finalScore;
        } else {
          diff = (a.submittedDate || "").localeCompare(b.submittedDate || "");
        }
        return sortDir === "asc" ? diff : -diff;
      });
    }
    return list;
  }, [rows, filterStatus, filterMgr, filterEmp, sortField, sortDir]);

  const counts = useMemo(() => ({
    "Pending Review":      rows.filter(r => r.status === "Pending Review").length,
    "Returned":            rows.filter(r => r.status === "Returned").length,
    "Approved":            rows.filter(r => r.status === "Approved").length,
  }), [rows]);

  const SUMMARY_CARDS = [
    { label: "Pending Review",      key: "Pending Review",      color: TEAL,  bg: "#ECFDF9" },
    { label: "Returned",            key: "Returned",            color: RED,   bg: "#FEF3F2" },
    { label: "Approved",            key: "Approved",            color: GREEN, bg: "#ECFDF5" },
  ] as const;

  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>HR Appraisal Review</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>HR view · Retail Sales Department</p>
            <p className="text-[13px] mt-1" style={{ color: MUTED }}>
              Review submitted appraisals, approve outcomes, or return to Superiors for revision.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {SUMMARY_CARDS.map(c => (
            <div
              key={c.key}
              className="bg-white rounded-lg px-5 py-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
            >
              <p className="text-[11px] font-medium mb-2" style={{ color: MUTED }}>{c.label}</p>
              <p className="text-[28px] font-bold leading-none" style={{ color: c.color }}>
                {counts[c.key as keyof typeof counts]}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div
          className="bg-white rounded-lg px-5 py-3 flex items-center gap-3 flex-wrap"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Filter by</span>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-md text-[12px] outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              <option value="All">Status: All</option>
              {HR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>

          <div className="relative">
            <select
              value={filterMgr}
              onChange={e => setFilterMgr(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-md text-[12px] outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              <option value="All">Manager: All</option>
              {allManagers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>

          <div className="relative">
            <select
              value={filterEmp}
              onChange={e => setFilterEmp(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-md text-[12px] outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              <option value="All">Employee: All</option>
              {rows.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>

          {(filterStatus !== "All" || filterMgr !== "All" || filterEmp !== "All") && (
            <button
              onClick={() => { setFilterStatus("All"); setFilterMgr("All"); setFilterEmp("All"); }}
              className="text-[12px]"
              style={{ color: BLUE }}
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-[12px]" style={{ color: MUTED }}>
            {displayed.length} submission{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div
          className="bg-white rounded-lg overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {[
                  { label: "Employee",            field: null },
                  { label: "Department / Role",   field: null },
                  { label: "Manager",             field: null },
                  { label: "Final Score",         field: "finalScore"    as SortField },
                  { label: "Mgr Recommendation",  field: null },
                  { label: "Submitted Date",      field: "submittedDate" as SortField },
                  { label: "Status",              field: null },
                  { label: "Action",              field: null },
                ].map((col, i) => (
                  <th
                    key={i}
                    onClick={col.field ? () => toggleSort(col.field as SortField) : undefined}
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap${col.field ? " cursor-pointer select-none" : ""}`}
                    style={{
                      color: col.field && sortField === col.field ? BLUE : MUTED,
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    {col.field ? (
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.field as SortField} />
                      </span>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, i) => {
                const ss = STATUS_STYLE[row.status];
                const actionLabel = ACTION_LABEL[row.status];
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    style={{ borderBottom: i < displayed.length - 1 ? `1px solid ${BORDER}` : "none" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: BLUE }}
                        >
                          {row.initials}
                        </div>
                        <p className="font-medium" style={{ color: TEXT }}>{row.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-medium" style={{ color: TEXT }}>{row.department}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>{row.role}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: MUTED }}>{row.manager}</td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-bold" style={{ color: PURPLE }}>{row.finalScore.toFixed(1)}</span>
                      <span className="text-[11px] ml-1" style={{ color: MUTED }}>/100</span>
                    </td>
                    <td className="px-4 py-3">
                      {row.managerDecision ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ color: BLUE, backgroundColor: "#EEF3FC" }}
                        >
                          {DECISION_LABEL[row.managerDecision] ?? row.managerDecision}
                        </span>
                      ) : (
                        <span className="text-[12px]" style={{ color: MUTED }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: row.submittedDate ? TEXT : MUTED }}>
                      {row.submittedDate || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: ss.color, backgroundColor: ss.bg }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {actionLabel && (
                        <button
                          onClick={() => navigate(`/performance/hr-appraisals/${row.id}?period=${encodeURIComponent(period)}`)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors hover:opacity-80"
                          style={{
                            color: row.status === "Pending Review" ? "white" : BLUE,
                            backgroundColor: row.status === "Pending Review" ? BLUE : "#EEF3FC",
                          }}
                        >
                          {actionLabel}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: MUTED }}>
                    No submissions match the selected filters for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

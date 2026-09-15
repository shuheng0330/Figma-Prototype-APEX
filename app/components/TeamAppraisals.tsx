import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { EMPLOYEES, PERIOD_OPTIONS, LIVE_PERIOD, AppStatus, resolvePeriodData } from "./appraisalData";

const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const RED    = "#D14343";
const GREEN  = "#059669";
const PURPLE = "#7C3AED";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";

const STATUS_STYLE: Record<AppStatus, { color: string; bg: string }> = {
  "Ready for Appraisal":  { color: BLUE,   bg: "#EEF3FC" },
  "Draft":                { color: AMBER,  bg: "#FEF9EC" },
  "Pending Review":       { color: TEAL,   bg: "#ECFDF9" },
  "Return for Revision":  { color: RED,    bg: "#FEF3F2" },
  "Approve":              { color: GREEN,  bg: "#ECFDF5" },
  "Override and Approve": { color: PURPLE, bg: "#F5F3FF" },
};

const ACTION_LABEL: Record<AppStatus, string> = {
  "Ready for Appraisal":  "Start Appraisal",
  "Draft":                "Continue Appraisal",
  "Pending Review":       "View Submission",
  "Return for Revision":  "Revise Appraisal",
  "Approve":              "View Appraisal",
  "Override and Approve": "View Appraisal",
};
const STATUS_LABEL: Record<AppStatus, string> = {
  "Ready for Appraisal": "Ready for Appraisal",
  "Draft": "Draft",
  "Pending Review": "Pending Review",
  "Return for Revision": "Returned",
  "Approve": "Approved",
  "Override and Approve": "Approved",
};

const ALL_STATUSES: AppStatus[] = [
  "Ready for Appraisal", "Draft", "Pending Review",
  "Return for Revision", "Approve", "Override and Approve",
];

type SortField = "kpiScore" | "attScore" | "finalScore";

interface RowEmployee {
  id: string;
  name: string;
  initials: string;
  role: string;
  kpiScore: number;
  attScore: number;
  finalScore: number;
  status: AppStatus;
}

function buildRows(period: string): RowEmployee[] {
  return Object.entries(EMPLOYEES).flatMap(([id, emp]) => {
    const pd = resolvePeriodData(id, period);
    if (!pd) return [];
    return [{
      id, name: emp.name, initials: emp.initials, role: emp.role,
      kpiScore: pd.kpiScore, attScore: pd.attScore, finalScore: pd.finalScore,
      status: pd.status,
    }];
  });
}

export function TeamAppraisals() {
  const navigate = useNavigate();
  const [period,         setPeriod]         = useState(LIVE_PERIOD);
  const [rows,           setRows]           = useState<RowEmployee[]>(() => buildRows(LIVE_PERIOD));
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [sortField,      setSortField]      = useState<SortField | null>(null);
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setRows(buildRows(period));
    setFilterStatus("All");
    setFilterEmployee("All");
  }, [period]);

  useEffect(() => {
    const handler = () => setRows(buildRows(period));
    window.addEventListener("appraisalStatusChange", handler);
    return () => window.removeEventListener("appraisalStatusChange", handler);
  }, [period]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} style={{ color: MUTED, flexShrink: 0 }} />;
    return sortDir === "desc"
      ? <ArrowDown size={12} style={{ color: BLUE, flexShrink: 0 }} />
      : <ArrowUp   size={12} style={{ color: BLUE, flexShrink: 0 }} />;
  }

  const displayed = useMemo(() => {
    let list = rows.filter(e =>
      (filterStatus === "All" || e.status === filterStatus) &&
      (filterEmployee === "All" || e.name === filterEmployee)
    );
    if (sortField) {
      list = [...list].sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return sortDir === "asc" ? diff : -diff;
      });
    }
    return list;
  }, [rows, filterStatus, filterEmployee, sortField, sortDir]);

  const counts = useMemo(() => ({
    "Ready for Appraisal": rows.filter(e => e.status === "Ready for Appraisal").length,
    "Draft":               rows.filter(e => e.status === "Draft").length,
    "Pending Review":      rows.filter(e => e.status === "Pending Review").length,
    "Return for Revision": rows.filter(e => e.status === "Return for Revision").length,
    "Approved":            rows.filter(e => e.status === "Approve" || e.status === "Override and Approve").length,
  }), [rows]);

  const SUMMARY_CARDS = [
    { label: "Ready for Appraisal", key: "Ready for Appraisal", color: BLUE,  bg: "#EEF3FC" },
    { label: "Draft",               key: "Draft",               color: AMBER, bg: "#FEF9EC" },
    { label: "Pending Review",      key: "Pending Review",      color: TEAL,  bg: "#ECFDF9" },
    { label: "Returned",            key: "Return for Revision", color: RED,   bg: "#FEF3F2" },
    { label: "Approved",            key: "Approved",            color: GREEN, bg: "#ECFDF5" },
  ] as const;

  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Team Appraisals</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>Superior view · Retail Sales Department</p>
            <p className="text-[13px] mt-1" style={{ color: MUTED }}>
              Review employees who are ready for final appraisal and submit recommendations to HR.
            </p>
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-md text-[13px] font-semibold outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              {PERIOD_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-3">
          {SUMMARY_CARDS.map(c => (
            <div
              key={c.key}
              className="bg-white rounded-lg px-4 py-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
            >
              <p className="text-[11px] font-medium leading-snug mb-2" style={{ color: MUTED }}>{c.label}</p>
              <p className="text-[26px] font-bold leading-none" style={{ color: c.color }}>
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
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>

          <div className="relative">
            <select
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-md text-[12px] outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              <option value="All">Employee: All</option>
              {rows.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>

          {(filterStatus !== "All" || filterEmployee !== "All") && (
            <button
              onClick={() => { setFilterStatus("All"); setFilterEmployee("All"); }}
              className="text-[12px]"
              style={{ color: BLUE }}
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-[12px]" style={{ color: MUTED }}>
            {displayed.length} employee{displayed.length !== 1 ? "s" : ""}
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
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  Employee
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  Role
                </th>
                {([
                  { label: "KPI Performance Score",    field: "kpiScore"   as SortField },
                  { label: "Attitude Evaluation Score", field: "attScore"   as SortField },
                  { label: "Final Appraisal Score",     field: "finalScore" as SortField },
                ] as const).map(col => (
                  <th
                    key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none"
                    style={{
                      color: sortField === col.field ? BLUE : MUTED,
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  Appraisal Status
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((emp, i) => {
                const ss = STATUS_STYLE[emp.status];
                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    style={{ borderBottom: i < displayed.length - 1 ? `1px solid ${BORDER}` : "none" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: BLUE }}
                        >
                          {emp.initials}
                        </div>
                        <p className="font-medium" style={{ color: TEXT }}>{emp.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: MUTED }}>{emp.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-bold" style={{ color: BLUE }}>{emp.kpiScore.toFixed(1)}</span>
                      <span className="text-[11px] ml-1" style={{ color: MUTED }}>/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-bold" style={{ color: TEAL }}>{emp.attScore.toFixed(1)}</span>
                      <span className="text-[11px] ml-1" style={{ color: MUTED }}>/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-bold" style={{ color: PURPLE }}>{emp.finalScore.toFixed(1)}</span>
                      <span className="text-[11px] ml-1" style={{ color: MUTED }}>/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: ss.color, backgroundColor: ss.bg }}
                      >
                        {STATUS_LABEL[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/performance/final-appraisals/${emp.id}?period=${encodeURIComponent(period)}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors hover:opacity-80"
                        style={{ color: BLUE, backgroundColor: "#EEF3FC" }}
                      >
                        {ACTION_LABEL[emp.status]}
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: MUTED }}>
                    No employees match the selected filters.
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

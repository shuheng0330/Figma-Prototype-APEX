import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  ChevronDown, TrendingUp, TrendingDown, Users,
  ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, ChevronRight, Search, ArrowLeft,
} from "lucide-react";
import {
  EMPLOYEES, PERIOD_OPTIONS, LIVE_PERIOD, AppStatus,
  PeriodAppraisal, resolvePeriodData,
} from "./appraisalData";

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const GREEN  = "#059669";
const RED    = "#D14343";
const PURPLE = "#8B5CF6";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";

const STATUS_STYLE: Record<AppStatus, { color: string; bg: string }> = {
  "Ready for Appraisal":  { color: BLUE,   bg: "#EEF3FC" },
  "Draft":                { color: AMBER,  bg: "#FEF9EC" },
  "Pending Review":       { color: TEAL,   bg: "#ECFDF9" },
  "Return for Revision":  { color: RED,    bg: "#FEF3F2" },
  "Approve":              { color: GREEN,  bg: "#ECFDF5" },
  "Override and Approve": { color: PURPLE, bg: "#F5F3FF" },
};

const EMP_META: Record<string, { dept: string; avatarColor: string }> = {
  amir:  { dept: "Retail Banking", avatarColor: BLUE  },
  sarah: { dept: "Retail Banking", avatarColor: TEAL  },
  rizal: { dept: "Retail Banking", avatarColor: AMBER },
  nurul: { dept: "Retail Banking", avatarColor: GREEN },
};

// ── Metric config ─────────────────────────────────────────────────────────────
type Metric = "final" | "kpi" | "attitude";
const METRIC_LABELS: Record<Metric, string> = {
  final:    "Final Appraisal Score",
  kpi:      "KPI Performance Score",
  attitude: "Attitude Evaluation Score",
};
const METRIC_FIELD: Record<Metric, keyof Pick<PeriodAppraisal, "finalScore" | "kpiScore" | "attScore">> = {
  final:    "finalScore",
  kpi:      "kpiScore",
  attitude: "attScore",
};
const METRIC_TREND_KEY: Record<Metric, "final" | "kpi" | "attitude"> = {
  final: "final", kpi: "kpi", attitude: "attitude",
};

// ── Static helpers ─────────────────────────────────────────────────────────────
const TEAM_IDS = Object.keys(EMPLOYEES);
function round1(n: number) { return Math.round(n * 10) / 10; }
function avgArr(nums: number[]) {
  if (!nums.length) return 0;
  return round1(nums.reduce((s, n) => s + n, 0) / nums.length);
}

// Pre-compute team trend averages from EMPLOYEES trendData
const TEAM_TREND_ALL = (() => {
  const yearMap: Record<string, { kpi: number[]; attitude: number[]; final: number[] }> = {};
  for (const id of TEAM_IDS) {
    for (const pt of EMPLOYEES[id].trendData) {
      if (!yearMap[pt.year]) yearMap[pt.year] = { kpi: [], attitude: [], final: [] };
      yearMap[pt.year].kpi.push(pt.kpi);
      yearMap[pt.year].attitude.push(pt.attitude);
      yearMap[pt.year].final.push(pt.final);
    }
  }
  return Object.entries(yearMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, vals]) => ({
      year,
      teamKpi:      avgArr(vals.kpi),
      teamAttitude: avgArr(vals.attitude),
      teamFinal:    avgArr(vals.final),
      orgKpi:       round1(avgArr(vals.kpi) - 4.2),
      orgAttitude:  round1(avgArr(vals.attitude) - 3.8),
      orgFinal:     round1(avgArr(vals.final) - 4.0),
    }));
})();

// Score range buckets
type Bucket = "80–100" | "70–79" | "60–69" | "Below 60";
const BUCKETS: Bucket[] = ["80–100", "70–79", "60–69", "Below 60"];
const BUCKET_COLORS: Record<Bucket, string> = {
  "80–100":   "#2457A6",
  "70–79":    "#0F9F8F",
  "60–69":    "#D99000",
  "Below 60": "#D14343",
};
function getBucket(score: number): Bucket {
  if (score >= 80) return "80–100";
  if (score >= 70) return "70–79";
  if (score >= 60) return "60–69";
  return "Below 60";
}

// Needs Attention mock data
const ATTENTION_ITEMS = [
  { label: "Pending Superior Reviews", count: 3, color: AMBER },
  { label: "Overdue Reviews",          count: 2, color: RED   },
  { label: "Returned Individual KPIs", count: 1, color: RED   },
];

// ── Sort key type ─────────────────────────────────────────────────────────────
type SortKey = "kpiScore" | "attScore" | "finalScore" | "trendDelta";

// ── Team row model ─────────────────────────────────────────────────────────────
interface TeamRow {
  id: string;
  name: string;
  initials: string;
  staffId: string;
  role: string;
  avatarColor: string;
  kpiScore: number | null;
  attScore: number | null;
  finalScore: number | null;
  trendDelta: number | null;
  sparkPoints: number[];
  status: AppStatus | null;
}

// ── Mini Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ points, delta }: { points: number[]; delta: number | null }) {
  const W = 44, H = 18;
  if (points.length < 2) return <span style={{ color: MUTED, fontSize: 11 }}>—</span>;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(v => H - ((v - min) / range) * (H - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const up = delta !== null ? delta >= 0 : points[points.length - 1] >= points[0];
  const lineColor = up ? GREEN : RED;
  return (
    <div className="flex items-center gap-2">
      <svg width={W} height={H} className="overflow-visible shrink-0">
        <path d={d} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} fill={lineColor} />
      </svg>
      {delta !== null && (
        <span className="text-[11px] font-semibold" style={{ color: lineColor }}>
          {delta >= 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
}

// ── Metric Selector dropdown ───────────────────────────────────────────────────
function MetricSelect({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors"
        style={{ backgroundColor: "#EEF3FC", color: BLUE, border: `1px solid #C7D8F5` }}>
        {METRIC_LABELS[value]}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
          style={{ minWidth: 220, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
          {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
            <button key={m} onClick={() => { onChange(m); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors"
              style={{ color: value === m ? BLUE : TEXT, fontWeight: value === m ? 600 : 400 }}>
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sort column header ─────────────────────────────────────────────────────────
function SortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:opacity-70 transition-opacity"
      style={{ color: active ? BLUE : MUTED, borderBottom: `1px solid ${BORDER}`, backgroundColor: "#F8FAFC" }}
      onClick={() => onSort(sortKey)}>
      <span className="flex items-center gap-1">
        {label}
        {active
          ? (dir === "asc" ? <ArrowUp size={10} style={{ color: BLUE }} /> : <ArrowDown size={10} style={{ color: BLUE }} />)
          : <ArrowUpDown size={10} style={{ color: BORDER }} />}
      </span>
    </th>
  );
}
function PlainTh({ label }: { label: string }) {
  return (
    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ color: MUTED, borderBottom: `1px solid ${BORDER}`, backgroundColor: "#F8FAFC" }}>
      {label}
    </th>
  );
}

// ── Custom tooltip for trend chart ────────────────────────────────────────────
function TrendTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg px-3 py-2 text-[11px]"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p className="font-bold mb-1.5" style={{ color: TEXT }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span style={{ color: MUTED }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: TEXT }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function CompetencyDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPeriod = searchParams.get("period");
  const returnToOrganisation = searchParams.get("returnTo") === "organisation-performance";
  const requestedDepartment = searchParams.get("department");

  const [selectedPeriod, setSelectedPeriod] = useState(
    requestedPeriod && PERIOD_OPTIONS.includes(requestedPeriod) ? requestedPeriod : LIVE_PERIOD
  );
  const [showPeriod, setShowPeriod]         = useState(false);
  const [trendMetric, setTrendMetric]       = useState<Metric>("final");
  const [trendYears, setTrendYears]         = useState<3 | 5>(5);
  const [distMetric, setDistMetric]         = useState<Metric>("final");
  const [sortKey, setSortKey]               = useState<SortKey>("finalScore");
  const [sortDir, setSortDir]               = useState<"asc" | "desc">("desc");
  const [search, setSearch]                 = useState("");
  const [roleFilter, setRoleFilter]         = useState("All");
  const [statusFilter, setStatusFilter]     = useState("All");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const periodRef  = useRef<HTMLDivElement>(null);
  const roleRef    = useRef<HTMLDivElement>(null);
  const statusRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!periodRef.current?.contains(e.target as Node)) setShowPeriod(false);
      if (!roleRef.current?.contains(e.target as Node)) setShowRoleFilter(false);
      if (!statusRef.current?.contains(e.target as Node)) setShowStatusFilter(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Build team rows ─────────────────────────────────────────────────────────
  const prevPeriod = PERIOD_OPTIONS[PERIOD_OPTIONS.indexOf(selectedPeriod) + 1] ?? null;

  const teamRows: TeamRow[] = useMemo(() => {
    return TEAM_IDS.map(id => {
      const emp  = EMPLOYEES[id];
      const meta = EMP_META[id] ?? { dept: "Retail Banking", avatarColor: BLUE };
      const pd   = resolvePeriodData(id, selectedPeriod);
      const prev = prevPeriod ? (emp.periods[prevPeriod] ?? null) : null;
      const trendDelta = pd && prev ? round1(pd.finalScore - prev.finalScore) : null;
      // sparkline from last 3 years of trendData
      const sparkPoints = emp.trendData.slice(-3).map(t => t.final);
      return {
        id,
        name:        emp.name,
        initials:    emp.initials,
        staffId:     emp.staffId,
        role:        emp.role,
        avatarColor: meta.avatarColor,
        kpiScore:    pd?.kpiScore   ?? null,
        attScore:    pd?.attScore   ?? null,
        finalScore:  pd?.finalScore ?? null,
        trendDelta,
        sparkPoints,
        status: pd?.status ?? null,
      };
    });
  }, [selectedPeriod, prevPeriod]);

  // ── Summary card values ─────────────────────────────────────────────────────
  const rowsWithData  = teamRows.filter(r => r.finalScore !== null);
  const teamKpiAvg    = rowsWithData.length ? avgArr(rowsWithData.map(r => r.kpiScore!))   : null;
  const teamAttAvg    = rowsWithData.length ? avgArr(rowsWithData.map(r => r.attScore!))   : null;
  const teamFinalAvg  = rowsWithData.length ? avgArr(rowsWithData.map(r => r.finalScore!)) : null;

  // ── Trend chart data ────────────────────────────────────────────────────────
  const selectedYear = parseInt(selectedPeriod.split(" ")[0]);
  const trendData = useMemo(() => {
    const all = TEAM_TREND_ALL.filter(d => parseInt(d.year) <= selectedYear);
    return trendYears === 3 ? all.slice(-3) : all.slice(-5);
  }, [trendYears, selectedYear]);

  const teamTrendKey = `team${trendMetric.charAt(0).toUpperCase()}${trendMetric.slice(1)}` as
    "teamFinal" | "teamKpi" | "teamAttitude";
  const orgTrendKey = `org${trendMetric.charAt(0).toUpperCase()}${trendMetric.slice(1)}` as
    "orgFinal" | "orgKpi" | "orgAttitude";

  // ── Distribution ───────────────────────────────────────────────────────────
  const distData = useMemo(() => {
    const field = METRIC_FIELD[distMetric];
    const bucketMap: Record<Bucket, number> = { "80–100": 0, "70–79": 0, "60–69": 0, "Below 60": 0 };
    for (const row of rowsWithData) {
      const score = row[field === "finalScore" ? "finalScore" : field === "kpiScore" ? "kpiScore" : "attScore"] ?? 0;
      bucketMap[getBucket(score)]++;
    }
    return BUCKETS.map(b => ({
      bucket: b,
      count:  bucketMap[b],
      pct:    rowsWithData.length ? Math.round((bucketMap[b] / rowsWithData.length) * 100) : 0,
      color:  BUCKET_COLORS[b],
    }));
  }, [distMetric, rowsWithData]);

  // ── Role options ────────────────────────────────────────────────────────────
  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(teamRows.map(r => r.role)));
    return ["All", ...roles];
  }, [teamRows]);

  const statusOptions: string[] = [
    "All", "Ready for Appraisal", "Draft", "Pending Review",
    "Return for Revision", "Approve", "Override and Approve",
  ];

  // ── Filtered + sorted rows ──────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return teamRows.filter(r => {
      const nameOk   = !search || r.name.toLowerCase().includes(search.toLowerCase())
                       || r.staffId.toLowerCase().includes(search.toLowerCase());
      const roleOk   = roleFilter === "All"   || r.role === roleFilter;
      const statusOk = statusFilter === "All" || r.status === statusFilter;
      return nameOk && roleOk && statusOk;
    });
  }, [teamRows, search, roleFilter, statusFilter]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [filteredRows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── 1. Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {returnToOrganisation && (
              <button onClick={() => navigate(`/org-eval?period=${encodeURIComponent(selectedPeriod)}`)}
                className="flex items-center gap-1.5 text-[12px] font-semibold mb-3" style={{ color: BLUE }}>
                <ArrowLeft size={14} /> Back to Organisation Performance
              </button>
            )}
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Team Performance</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              {requestedDepartment ?? "Retail Sales"} Department · Performance overview
            </p>
          </div>
          <div ref={periodRef} className="relative">
            <button onClick={() => setShowPeriod(o => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-md text-[13px] transition-colors"
              style={{ border: `1px solid ${BORDER}`, color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Period</span>
              <span className="font-semibold" style={{ color: BLUE }}>{selectedPeriod.split(" ")[0]}</span>
              <span style={{ color: MUTED }}>Annual KPI Review</span>
              <ChevronDown size={13} style={{ color: MUTED }} />
            </button>
            {showPeriod && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                style={{ minWidth: 220, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                {PERIOD_OPTIONS.map(p => (
                  <button key={p} onClick={() => { setSelectedPeriod(p); setShowPeriod(false); }}
                    className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors"
                    style={{ color: selectedPeriod === p ? BLUE : TEXT, fontWeight: selectedPeriod === p ? 600 : 400 }}>
                    {p}
                    {p === LIVE_PERIOD && (
                      <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                        style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "Employees with Results",
              value: rowsWithData.length.toString(),
              sub: `of ${TEAM_IDS.length} employees in the team`,
              color: BLUE,
              iconBg: "#EEF3FC",
              icon: <Users size={16} style={{ color: BLUE }} />,
            },
            {
              label: "Team KPI Performance Score",
              value: teamKpiAvg !== null ? teamKpiAvg.toFixed(1) : "—",
              sub: "Average KPI Performance Score",
              color: TEAL,
              iconBg: "#ECFDF9",
              icon: <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><path d="M2 12L6 8L9 10L14 4" stroke={TEAL} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>,
            },
            {
              label: "Team Attitude Evaluation Score",
              value: teamAttAvg !== null ? teamAttAvg.toFixed(1) : "—",
              sub: "Average Attitude Evaluation Score",
              color: PURPLE,
              iconBg: "#F5F3FF",
              icon: <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><circle cx={8} cy={6} r={2.5} stroke={PURPLE} strokeWidth={1.6}/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke={PURPLE} strokeWidth={1.6} strokeLinecap="round"/></svg>,
            },
            {
              label: "Team Final Appraisal Score",
              value: teamFinalAvg !== null ? teamFinalAvg.toFixed(1) : "—",
              sub: "Composite average",
              color: GREEN,
              iconBg: "#ECFDF5",
              icon: <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><path d="M8 2l1.8 3.6L14 6.4l-3 2.9.7 4.1L8 11.5l-3.7 1.9.7-4.1L2 6.4l4.2-.8L8 2z" stroke={GREEN} strokeWidth={1.5} strokeLinejoin="round"/></svg>,
            },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-lg p-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wide leading-snug" style={{ color: MUTED }}>
                  {c.label}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: c.iconBg }}>
                  {c.icon}
                </div>
              </div>
              <p className="text-[28px] font-bold leading-none mb-2" style={{ color: c.color }}>
                {c.value}
              </p>
              <p className="text-[11px]" style={{ color: MUTED }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── 3. Needs Attention ────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg px-5 py-4 flex items-center gap-6 flex-wrap"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: "#FEF3F2" }}>
              <AlertCircle size={13} style={{ color: RED }} />
            </div>
            <p className="text-[12px] font-bold" style={{ color: TEXT }}>Needs Attention</p>
          </div>
          <div className="flex items-center gap-1" style={{ color: BORDER }}>|</div>
          <div className="flex items-center gap-5 flex-wrap flex-1">
            {ATTENTION_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[18px] font-bold leading-none" style={{ color: item.color }}>
                  {item.count}
                </span>
                <span className="text-[12px]" style={{ color: MUTED }}>{item.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/performance/team-reviews")}
            className="flex items-center gap-1 text-[12px] font-semibold shrink-0 hover:underline"
            style={{ color: BLUE }}>
            View Pending Reviews
            <ChevronRight size={13} />
          </button>
        </div>

        {/* ── 4 + 5. Trend Chart + Score Distribution ───────────────────────── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Trend Chart — 3 cols */}
          <div className="col-span-3 bg-white rounded-lg p-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Team Performance Trend</h2>
                <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                  3–5 year view of the team's KPI Performance, Attitude Evaluation and Final Appraisal results.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <MetricSelect value={trendMetric} onChange={setTrendMetric} />
                <div className="flex items-center gap-0.5 rounded-md p-0.5"
                  style={{ border: `1px solid ${BORDER}` }}>
                  {([3, 5] as const).map(y => (
                    <button key={y} onClick={() => setTrendYears(y)}
                      className="px-3 py-1 text-[11px] font-semibold rounded transition-colors"
                      style={trendYears === y
                        ? { backgroundColor: BLUE, color: "white" }
                        : { backgroundColor: "transparent", color: MUTED }}>
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 mt-3 mb-3">
              {[
                { label: "Team Average",         color: BLUE,  dash: false },
                { label: "Organisation Average",  color: MUTED, dash: true  },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  {l.dash
                    ? <span className="w-6 h-0 inline-block border-t-2 border-dashed" style={{ borderColor: l.color }} />
                    : <span className="w-6 h-0.5 inline-block" style={{ backgroundColor: l.color }} />
                  }
                  <span className="text-[11px]" style={{ color: MUTED }}>{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 8, right: 20, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <ReTooltip content={<TrendTip />} />
                <Line type="monotone" dataKey={teamTrendKey} name="Team Average"
                  stroke={BLUE} strokeWidth={2.5}
                  dot={{ r: 4, fill: BLUE, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={orgTrendKey} name="Organisation Average"
                  stroke={MUTED} strokeWidth={1.5} strokeDasharray="5 4"
                  dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution — 2 cols */}
          <div className="col-span-2 bg-white rounded-lg p-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-4 gap-2">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Score Distribution</h2>
                <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                  Employees by score range
                </p>
              </div>
              <MetricSelect value={distMetric} onChange={setDistMetric} />
            </div>
            <div className="space-y-4 mt-2">
              {distData.map(d => (
                <div key={d.bucket}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.bucket}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold" style={{ color: TEXT }}>{d.count}</span>
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        {rowsWithData.length > 0 ? `${d.pct}%` : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: rowsWithData.length > 0 ? `${d.pct}%` : "0%",
                        backgroundColor: d.color,
                        minWidth: d.count > 0 ? 8 : 0,
                      }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-[11px]" style={{ color: MUTED }}>
                Based on <span className="font-semibold" style={{ color: TEXT }}>{rowsWithData.length}</span>
                {" "}employee{rowsWithData.length !== 1 ? "s" : ""} with available results
                {" "}· {METRIC_LABELS[distMetric]}
              </p>
            </div>
          </div>
        </div>

        {/* ── 6. Team Performance Table ─────────────────────────────────────── */}
        <div className="bg-white rounded-lg overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>

          {/* Table header bar */}
          <div className="flex items-center justify-between px-5 py-3.5 gap-3 flex-wrap"
            style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Employee Performance</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "#F3F4F6", color: MUTED }}>
                {sortedRows.length} of {TEAM_IDS.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Employee search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search employee…"
                  className="pl-7 pr-3 py-1.5 text-[12px] rounded-md outline-none w-40"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}
                />
              </div>

              {/* Role filter */}
              <div ref={roleRef} className="relative">
                <button onClick={() => setShowRoleFilter(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md text-[12px] transition-colors"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                  {roleFilter === "All" ? "All Roles" : roleFilter}
                  <ChevronDown size={11} style={{ color: MUTED }} />
                </button>
                {showRoleFilter && (
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                    style={{ minWidth: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                    {roleOptions.map(r => (
                      <button key={r} onClick={() => { setRoleFilter(r); setShowRoleFilter(false); }}
                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors"
                        style={{ color: roleFilter === r ? BLUE : TEXT, fontWeight: roleFilter === r ? 600 : 400 }}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filter */}
              <div ref={statusRef} className="relative">
                <button onClick={() => setShowStatusFilter(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-md text-[12px] transition-colors"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                  {statusFilter === "All" ? "All Statuses" : statusFilter}
                  <ChevronDown size={11} style={{ color: MUTED }} />
                </button>
                {showStatusFilter && (
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                    style={{ minWidth: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                    {statusOptions.map(s => (
                      <button key={s} onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}
                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors"
                        style={{ color: statusFilter === s ? BLUE : TEXT, fontWeight: statusFilter === s ? 600 : 400 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  <PlainTh label="Employee" />
                  <PlainTh label="Role" />
                  <SortTh label="KPI Performance Score"      sortKey="kpiScore"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortTh label="Attitude Evaluation Score"  sortKey="attScore"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortTh label="Final Appraisal Score"     sortKey="finalScore"  current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortTh label="YoY Change"           sortKey="trendDelta"  current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <PlainTh label="Appraisal Status" />
                  <PlainTh label="Action" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => {
                  const ss = row.status ? STATUS_STYLE[row.status] : null;
                  return (
                    <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors"
                      style={{ borderBottom: i < sortedRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                            style={{ backgroundColor: row.avatarColor }}>
                            {row.initials}
                          </div>
                          <div>
                            <p className="font-semibold whitespace-nowrap" style={{ color: TEXT }}>{row.name}</p>
                            <p className="text-[10px]" style={{ color: MUTED }}>{row.staffId}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: MUTED }}>{row.role}</td>
                      {/* KPI Score */}
                      <td className="px-4 py-3">
                        {row.kpiScore !== null
                          ? <><span className="font-bold" style={{ color: TEXT }}>{row.kpiScore.toFixed(1)}</span>
                              <span style={{ color: MUTED }}>/100</span></>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      {/* Attitude Score */}
                      <td className="px-4 py-3">
                        {row.attScore !== null
                          ? <><span className="font-bold" style={{ color: TEXT }}>{row.attScore.toFixed(1)}</span>
                              <span style={{ color: MUTED }}>/100</span></>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      {/* Final Score */}
                      <td className="px-4 py-3">
                        {row.finalScore !== null
                          ? <>
                              <span className="font-bold" style={{
                                color: row.finalScore >= 80 ? GREEN : row.finalScore >= 70 ? AMBER : RED,
                              }}>
                                {row.finalScore.toFixed(1)}
                              </span>
                              <span style={{ color: MUTED }}>/100</span>
                            </>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      {/* Trend */}
                      <td className="px-4 py-3">
                        <Sparkline points={row.sparkPoints} delta={row.trendDelta} />
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {ss && row.status
                          ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                              style={{ color: ss.color, backgroundColor: ss.bg }}>
                              {row.status}
                            </span>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/staff-profile/${row.id}?returnTo=team-performance&period=${encodeURIComponent(selectedPeriod)}`)}
                          className="text-[11px] font-semibold hover:underline whitespace-nowrap"
                          style={{ color: BLUE }}>
                          View Employee →
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: MUTED }}>
                      No employees match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

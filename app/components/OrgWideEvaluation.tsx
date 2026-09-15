import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, TrendingUp, TrendingDown, ChevronDown,
  ArrowUp, ArrowDown, ArrowUpDown, Plus, Minus,
  BarChart2, Target, Star,
} from "lucide-react";
import { PERIOD_OPTIONS } from "./appraisalData";

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const GREEN  = "#059669";
const PURPLE = "#8B5CF6";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";

const LIVE_PERIOD = "2027 Annual KPI Review";

// ── Types ─────────────────────────────────────────────────────────────────────
type Metric      = "final" | "kpi" | "attitude";
type TrendWindow = "3Y" | "5Y";
type RecTab      = "manager" | "hr";
type SortCol     = "kpiScore" | "attScore" | "finalScore" | "yoyChange";
type PeriodStatus = "Upcoming" | "Open" | "Closed";

const METRIC_LABELS: Record<Metric, string> = {
  final:    "Final Appraisal Score",
  kpi:      "KPI Performance Score",
  attitude: "Attitude Evaluation Score",
};
const METRIC_KEY: Record<Metric, string> = { final: "final", kpi: "kpi", attitude: "attitude" };

// ── Departments ───────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Retail Banking", "Retail Sales", "Operations", "Finance", "Human Resources", "IT & Digital"];

const DEPT_COLORS: Record<string, string> = {
  "Retail Banking":  BLUE,
  "Retail Sales":    TEAL,
  "Operations":      AMBER,
  "Finance":         "#3B82F6",
  "Human Resources": PURPLE,
  "IT & Digital":    "#0EA5E9",
};

// ── Period Status ─────────────────────────────────────────────────────────────
const PERIOD_STATUS: Record<string, PeriodStatus> = {
  "2027 Annual KPI Review": "Upcoming",
  "2026 Annual KPI Review": "Open",
  "2025 Annual KPI Review": "Closed",
  "2024 Annual KPI Review": "Closed",
};
const PERIOD_STATUS_STYLE: Record<PeriodStatus, { color: string; bg: string }> = {
  "Upcoming": { color: AMBER, bg: "#FEF9EC" },
  "Open":     { color: GREEN, bg: "#ECFDF5" },
  "Closed":   { color: MUTED, bg: "#F2F4F7" },
};

// ── Summary Data ──────────────────────────────────────────────────────────────
interface PeriodSummary {
  total: number; withResults: number;
  kpiScore: number; attScore: number; finalScore: number;
}
const PERIOD_SUMMARY: Record<string, PeriodSummary> = {
  "2027 Annual KPI Review": { total: 210, withResults: 186, kpiScore: 76.8, attScore: 80.2, finalScore: 78.5 },
  "2026 Annual KPI Review": { total: 205, withResults: 198, kpiScore: 74.6, attScore: 79.4, finalScore: 76.8 },
  "2025 Annual KPI Review": { total: 198, withResults: 191, kpiScore: 73.2, attScore: 77.9, finalScore: 75.3 },
  "2024 Annual KPI Review": { total: 195, withResults: 184, kpiScore: 71.8, attScore: 76.1, finalScore: 73.7 },
};

// ── Org Historical Year Data ──────────────────────────────────────────────────
interface YearSlice { kpi: number; attitude: number; final: number; employees: number; }
const ORG_YEAR_DATA: Record<string, YearSlice> = {
  "2020": { kpi: 65.4, attitude: 69.2, final: 66.9, employees: 172 },
  "2021": { kpi: 67.2, attitude: 70.8, final: 68.6, employees: 175 },
  "2022": { kpi: 69.1, attitude: 72.8, final: 70.6, employees: 181 },
  "2023": { kpi: 70.8, attitude: 74.3, final: 72.3, employees: 185 },
  "2024": { kpi: 71.8, attitude: 76.1, final: 73.7, employees: 184 },
  "2025": { kpi: 73.2, attitude: 77.9, final: 75.3, employees: 191 },
  "2026": { kpi: 74.6, attitude: 79.4, final: 76.8, employees: 198 },
  "2027": { kpi: 76.8, attitude: 80.2, final: 78.5, employees: 186 },
};

// ── Department Year Data ──────────────────────────────────────────────────────
interface DeptSlice { kpi: number; attitude: number; final: number; }
const DEPT_YEAR_DATA: Record<string, Record<string, DeptSlice>> = {
  "Retail Banking": {
    "2020": { kpi: 68.4, attitude: 72.6, final: 70.1 }, "2021": { kpi: 70.2, attitude: 74.4, final: 71.9 },
    "2022": { kpi: 72.1, attitude: 76.2, final: 73.8 }, "2023": { kpi: 73.8, attitude: 77.6, final: 75.4 },
    "2024": { kpi: 75.2, attitude: 79.1, final: 77.0 }, "2025": { kpi: 76.8, attitude: 80.3, final: 78.3 },
    "2026": { kpi: 77.9, attitude: 81.2, final: 79.4 }, "2027": { kpi: 79.4, attitude: 82.4, final: 80.7 },
  },
  "Retail Sales": {
    "2020": { kpi: 66.8, attitude: 70.5, final: 68.2 }, "2021": { kpi: 68.4, attitude: 72.1, final: 69.9 },
    "2022": { kpi: 70.4, attitude: 74.1, final: 71.9 }, "2023": { kpi: 71.2, attitude: 75.8, final: 73.2 },
    "2024": { kpi: 72.6, attitude: 77.2, final: 74.6 }, "2025": { kpi: 73.8, attitude: 78.4, final: 75.8 },
    "2026": { kpi: 75.1, attitude: 79.6, final: 77.1 }, "2027": { kpi: 76.4, attitude: 80.5, final: 78.2 },
  },
  "Operations": {
    "2020": { kpi: 60.2, attitude: 64.4, final: 61.9 }, "2021": { kpi: 62.1, attitude: 66.2, final: 63.8 },
    "2022": { kpi: 64.2, attitude: 68.4, final: 65.9 }, "2023": { kpi: 65.8, attitude: 70.1, final: 67.6 },
    "2024": { kpi: 66.4, attitude: 71.5, final: 68.6 }, "2025": { kpi: 67.9, attitude: 72.8, final: 70.1 },
    "2026": { kpi: 68.7, attitude: 73.9, final: 71.0 }, "2027": { kpi: 70.2, attitude: 74.8, final: 72.3 },
  },
  "Finance": {
    "2020": { kpi: 67.8, attitude: 71.2, final: 69.1 }, "2021": { kpi: 69.4, attitude: 72.8, final: 70.7 },
    "2022": { kpi: 71.8, attitude: 74.9, final: 73.1 }, "2023": { kpi: 72.6, attitude: 76.2, final: 74.2 },
    "2024": { kpi: 73.4, attitude: 77.8, final: 75.4 }, "2025": { kpi: 74.8, attitude: 78.9, final: 76.6 },
    "2026": { kpi: 75.9, attitude: 79.8, final: 77.6 }, "2027": { kpi: 77.2, attitude: 80.7, final: 78.7 },
  },
  "Human Resources": {
    "2020": { kpi: 71.2, attitude: 75.8, final: 73.1 }, "2021": { kpi: 73.1, attitude: 77.6, final: 75.0 },
    "2022": { kpi: 75.4, attitude: 79.8, final: 77.3 }, "2023": { kpi: 77.2, attitude: 81.2, final: 79.0 },
    "2024": { kpi: 78.4, attitude: 82.4, final: 80.2 }, "2025": { kpi: 79.6, attitude: 83.6, final: 81.4 },
    "2026": { kpi: 80.8, attitude: 84.5, final: 82.4 }, "2027": { kpi: 82.1, attitude: 85.2, final: 83.5 },
  },
  "IT & Digital": {
    "2020": { kpi: 69.4, attitude: 73.1, final: 71.0 }, "2021": { kpi: 71.2, attitude: 75.3, final: 72.9 },
    "2022": { kpi: 73.6, attitude: 77.3, final: 75.2 }, "2023": { kpi: 75.1, attitude: 78.6, final: 76.6 },
    "2024": { kpi: 76.8, attitude: 80.2, final: 78.3 }, "2025": { kpi: 78.2, attitude: 81.4, final: 79.6 },
    "2026": { kpi: 79.5, attitude: 82.6, final: 80.8 }, "2027": { kpi: 80.8, attitude: 83.7, final: 82.1 },
  },
};

// ── Score Distribution ────────────────────────────────────────────────────────
interface DistBucket { range: string; count: number; pct: number; }
const SCORE_DIST: Record<string, Record<Metric, DistBucket[]>> = {
  "2027 Annual KPI Review": {
    kpi:      [{ range: "Below 60", count: 12, pct: 6.5 }, { range: "60–69", count: 38, pct: 20.4 }, { range: "70–79", count: 74, pct: 39.8 }, { range: "80–89", count: 48, pct: 25.8 }, { range: "90–100", count: 14, pct: 7.5 }],
    attitude: [{ range: "Below 60", count: 8,  pct: 4.3  }, { range: "60–69", count: 28, pct: 15.1 }, { range: "70–79", count: 66, pct: 35.5 }, { range: "80–89", count: 62, pct: 33.3 }, { range: "90–100", count: 22, pct: 11.8 }],
    final:    [{ range: "Below 60", count: 10, pct: 5.4  }, { range: "60–69", count: 33, pct: 17.7 }, { range: "70–79", count: 71, pct: 38.2 }, { range: "80–89", count: 55, pct: 29.6 }, { range: "90–100", count: 17, pct: 9.1  }],
  },
  "2026 Annual KPI Review": {
    kpi:      [{ range: "Below 60", count: 14, pct: 7.1  }, { range: "60–69", count: 42, pct: 21.2 }, { range: "70–79", count: 78, pct: 39.4 }, { range: "80–89", count: 44, pct: 22.2 }, { range: "90–100", count: 20, pct: 10.1 }],
    attitude: [{ range: "Below 60", count: 10, pct: 5.1  }, { range: "60–69", count: 31, pct: 15.7 }, { range: "70–79", count: 70, pct: 35.4 }, { range: "80–89", count: 58, pct: 29.3 }, { range: "90–100", count: 29, pct: 14.6 }],
    final:    [{ range: "Below 60", count: 12, pct: 6.1  }, { range: "60–69", count: 36, pct: 18.2 }, { range: "70–79", count: 75, pct: 37.9 }, { range: "80–89", count: 52, pct: 26.3 }, { range: "90–100", count: 23, pct: 11.6 }],
  },
  "2025 Annual KPI Review": {
    kpi:      [{ range: "Below 60", count: 16, pct: 8.4  }, { range: "60–69", count: 45, pct: 23.6 }, { range: "70–79", count: 76, pct: 39.8 }, { range: "80–89", count: 38, pct: 19.9 }, { range: "90–100", count: 16, pct: 8.4  }],
    attitude: [{ range: "Below 60", count: 11, pct: 5.8  }, { range: "60–69", count: 35, pct: 18.3 }, { range: "70–79", count: 68, pct: 35.6 }, { range: "80–89", count: 52, pct: 27.2 }, { range: "90–100", count: 25, pct: 13.1 }],
    final:    [{ range: "Below 60", count: 14, pct: 7.3  }, { range: "60–69", count: 39, pct: 20.4 }, { range: "70–79", count: 72, pct: 37.7 }, { range: "80–89", count: 46, pct: 24.1 }, { range: "90–100", count: 20, pct: 10.5 }],
  },
  "2024 Annual KPI Review": {
    kpi:      [{ range: "Below 60", count: 18, pct: 9.8  }, { range: "60–69", count: 48, pct: 26.1 }, { range: "70–79", count: 72, pct: 39.1 }, { range: "80–89", count: 34, pct: 18.5 }, { range: "90–100", count: 12, pct: 6.5  }],
    attitude: [{ range: "Below 60", count: 13, pct: 7.1  }, { range: "60–69", count: 38, pct: 20.7 }, { range: "70–79", count: 66, pct: 35.9 }, { range: "80–89", count: 48, pct: 26.1 }, { range: "90–100", count: 19, pct: 10.3 }],
    final:    [{ range: "Below 60", count: 16, pct: 8.7  }, { range: "60–69", count: 42, pct: 22.8 }, { range: "70–79", count: 69, pct: 37.5 }, { range: "80–89", count: 42, pct: 22.8 }, { range: "90–100", count: 15, pct: 8.2  }],
  },
};

// ── Department Performance Table ──────────────────────────────────────────────
interface DeptRow {
  dept: string; total: number; withResults: number;
  kpiScore: number; attScore: number; finalScore: number; yoyChange: number;
}
const DEPT_PERF: Record<string, DeptRow[]> = {
  "2027 Annual KPI Review": [
    { dept: "Human Resources", total: 22, withResults: 20, kpiScore: 82.1, attScore: 85.2, finalScore: 83.5, yoyChange: +1.1 },
    { dept: "IT & Digital",    total: 35, withResults: 28, kpiScore: 80.8, attScore: 83.7, finalScore: 82.1, yoyChange: +1.3 },
    { dept: "Retail Banking",  total: 42, withResults: 38, kpiScore: 79.4, attScore: 82.4, finalScore: 80.7, yoyChange: +1.3 },
    { dept: "Finance",         total: 28, withResults: 26, kpiScore: 77.2, attScore: 80.7, finalScore: 78.7, yoyChange: +1.1 },
    { dept: "Retail Sales",    total: 38, withResults: 34, kpiScore: 76.4, attScore: 80.5, finalScore: 78.2, yoyChange: +1.1 },
    { dept: "Operations",      total: 45, withResults: 40, kpiScore: 70.2, attScore: 74.8, finalScore: 72.3, yoyChange: +1.3 },
  ],
  "2026 Annual KPI Review": [
    { dept: "Human Resources", total: 21, withResults: 21, kpiScore: 80.8, attScore: 84.5, finalScore: 82.4, yoyChange: +1.0 },
    { dept: "IT & Digital",    total: 35, withResults: 33, kpiScore: 79.5, attScore: 82.6, finalScore: 80.8, yoyChange: +1.2 },
    { dept: "Retail Banking",  total: 41, withResults: 39, kpiScore: 77.9, attScore: 81.2, finalScore: 79.4, yoyChange: +1.1 },
    { dept: "Finance",         total: 27, withResults: 26, kpiScore: 75.9, attScore: 79.8, finalScore: 77.6, yoyChange: +1.0 },
    { dept: "Retail Sales",    total: 37, withResults: 36, kpiScore: 75.1, attScore: 79.6, finalScore: 77.1, yoyChange: +1.3 },
    { dept: "Operations",      total: 44, withResults: 43, kpiScore: 68.7, attScore: 73.9, finalScore: 71.0, yoyChange: +0.9 },
  ],
  "2025 Annual KPI Review": [
    { dept: "Human Resources", total: 20, withResults: 20, kpiScore: 79.6, attScore: 83.6, finalScore: 81.4, yoyChange: +1.2 },
    { dept: "IT & Digital",    total: 33, withResults: 31, kpiScore: 78.2, attScore: 81.4, finalScore: 79.6, yoyChange: +1.3 },
    { dept: "Retail Banking",  total: 40, withResults: 39, kpiScore: 76.8, attScore: 80.3, finalScore: 78.3, yoyChange: +1.3 },
    { dept: "Finance",         total: 26, withResults: 25, kpiScore: 74.8, attScore: 78.9, finalScore: 76.6, yoyChange: +1.2 },
    { dept: "Retail Sales",    total: 36, withResults: 35, kpiScore: 73.8, attScore: 78.4, finalScore: 75.8, yoyChange: +1.2 },
    { dept: "Operations",      total: 43, withResults: 41, kpiScore: 67.9, attScore: 72.8, finalScore: 70.1, yoyChange: +1.5 },
  ],
  "2024 Annual KPI Review": [
    { dept: "Human Resources", total: 20, withResults: 19, kpiScore: 78.4, attScore: 82.4, finalScore: 80.2, yoyChange: +1.2 },
    { dept: "IT & Digital",    total: 34, withResults: 32, kpiScore: 76.8, attScore: 80.2, finalScore: 78.3, yoyChange: +1.7 },
    { dept: "Retail Banking",  total: 39, withResults: 37, kpiScore: 75.2, attScore: 79.1, finalScore: 77.0, yoyChange: -0.5 },
    { dept: "Finance",         total: 25, withResults: 24, kpiScore: 73.4, attScore: 77.8, finalScore: 75.4, yoyChange: +1.2 },
    { dept: "Retail Sales",    total: 35, withResults: 33, kpiScore: 72.6, attScore: 77.2, finalScore: 74.6, yoyChange: +0.8 },
    { dept: "Operations",      total: 42, withResults: 39, kpiScore: 66.4, attScore: 71.5, finalScore: 68.6, yoyChange: +1.0 },
  ],
};

// ── Appraisal Recommendation Distribution ────────────────────────────────────
interface RecItem { label: string; count: number; pct: number; }
const APPRAISAL_REC: Record<string, { manager: RecItem[]; hr: RecItem[] }> = {
  "2027 Annual KPI Review": {
    manager: [{ label: "Promotion", count: 28, pct: 15.1 }, { label: "Salary Increment", count: 56, pct: 30.1 }, { label: "Both", count: 42, pct: 22.6 }, { label: "No Recommendation", count: 60, pct: 32.3 }],
    hr:      [{ label: "Promotion", count: 24, pct: 12.9 }, { label: "Salary Increment", count: 52, pct: 28.0 }, { label: "Both", count: 38, pct: 20.4 }, { label: "No Recommendation", count: 72, pct: 38.7 }],
  },
  "2026 Annual KPI Review": {
    manager: [{ label: "Promotion", count: 32, pct: 16.2 }, { label: "Salary Increment", count: 62, pct: 31.3 }, { label: "Both", count: 48, pct: 24.2 }, { label: "No Recommendation", count: 56, pct: 28.3 }],
    hr:      [{ label: "Promotion", count: 28, pct: 14.1 }, { label: "Salary Increment", count: 58, pct: 29.3 }, { label: "Both", count: 44, pct: 22.2 }, { label: "No Recommendation", count: 68, pct: 34.3 }],
  },
  "2025 Annual KPI Review": {
    manager: [{ label: "Promotion", count: 26, pct: 13.6 }, { label: "Salary Increment", count: 58, pct: 30.4 }, { label: "Both", count: 40, pct: 20.9 }, { label: "No Recommendation", count: 67, pct: 35.1 }],
    hr:      [{ label: "Promotion", count: 22, pct: 11.5 }, { label: "Salary Increment", count: 54, pct: 28.3 }, { label: "Both", count: 36, pct: 18.8 }, { label: "No Recommendation", count: 79, pct: 41.4 }],
  },
  "2024 Annual KPI Review": {
    manager: [{ label: "Promotion", count: 24, pct: 13.0 }, { label: "Salary Increment", count: 55, pct: 29.9 }, { label: "Both", count: 38, pct: 20.7 }, { label: "No Recommendation", count: 67, pct: 36.4 }],
    hr:      [{ label: "Promotion", count: 20, pct: 10.9 }, { label: "Salary Increment", count: 51, pct: 27.7 }, { label: "Both", count: 34, pct: 18.5 }, { label: "No Recommendation", count: 79, pct: 42.9 }],
  },
};

const REC_COLORS: Record<string, string> = {
  "Promotion":         BLUE,
  "Salary Increment":  PURPLE,
  "Both":              TEAL,
  "No Recommendation": "#9CA3AF",
};

// ── Small shared UI ───────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}>{label}</span>
  );
}

function MetricTabs({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-md" style={{ backgroundColor: "#F1F3F6" }}>
      {(["final", "kpi", "attitude"] as Metric[]).map(m => (
        <button key={m} onClick={() => onChange(m)}
          className="px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap"
          style={value === m
            ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
            : { color: MUTED }}>
          {m === "final" ? "Final" : m === "kpi" ? "KPI" : "Attitude"}
        </button>
      ))}
    </div>
  );
}

function WindowTabs({ value, onChange }: { value: TrendWindow; onChange: (w: TrendWindow) => void }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-md" style={{ backgroundColor: "#F1F3F6" }}>
      {(["3Y", "5Y"] as TrendWindow[]).map(w => (
        <button key={w} onClick={() => onChange(w)}
          className="px-2.5 py-1 rounded text-[11px] font-semibold transition-all"
          style={value === w
            ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
            : { color: MUTED }}>
          {w}
        </button>
      ))}
    </div>
  );
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: "asc" | "desc" }) {
  if (sortCol !== col) return <ArrowUpDown size={10} style={{ color: "#D1D5DB" }} />;
  return sortDir === "asc" ? <ArrowUp size={10} style={{ color: BLUE }} /> : <ArrowDown size={10} style={{ color: BLUE }} />;
}

// Custom chart tooltips
function OrgTrendTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const slice = ORG_YEAR_DATA[label];
  return (
    <div className="bg-white rounded-lg px-3 py-2.5 text-[11px]"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
      <p className="font-bold mb-1" style={{ color: TEXT }}>{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span style={{ color: MUTED }}>Organisation Average:</span>
        <span className="font-bold" style={{ color: TEXT }}>{d.value?.toFixed(1)}</span>
      </div>
      {slice && <p className="mt-0.5" style={{ color: MUTED }}>{slice.employees} employees with results</p>}
    </div>
  );
}

function DeptTrendTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg px-3 py-2.5 text-[11px]"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
      <p className="font-bold mb-1.5" style={{ color: TEXT }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: MUTED }}>{p.dataKey}:</span>
          <span className="font-bold" style={{ color: TEXT }}>{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function DistTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DistBucket;
  return (
    <div className="bg-white rounded-lg px-3 py-2.5 text-[11px]"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
      <p className="font-bold mb-1" style={{ color: TEXT }}>Score range: {d.range}</p>
      <p style={{ color: MUTED }}>Employees: <span className="font-bold" style={{ color: TEXT }}>{d.count}</span></p>
      <p style={{ color: MUTED }}>% of employees with results: <span className="font-bold" style={{ color: TEXT }}>{d.pct}%</span></p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OrgWideEvaluation() {
  const navigate = useNavigate();
  const [period,      setPeriod]      = useState(LIVE_PERIOD);
  const [showPeriodDd, setShowPeriodDd] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  // Chart state
  const [orgMetric,  setOrgMetric]   = useState<Metric>("final");
  const [orgWindow,  setOrgWindow]   = useState<TrendWindow>("3Y");
  const [deptMetric, setDeptMetric]  = useState<Metric>("final");
  const [deptWindow, setDeptWindow]  = useState<TrendWindow>("3Y");
  const [distMetric, setDistMetric]  = useState<Metric>("final");

  // Dept multi-select for growth trend
  const [selectedDepts, setSelectedDepts] = useState<string[]>(["Retail Banking", "Retail Sales", "IT & Digital"]);
  const [showDeptDd, setShowDeptDd] = useState(false);
  const deptDdRef = useRef<HTMLDivElement>(null);

  // Dept table sort
  const [sortCol, setSortCol] = useState<SortCol>("finalScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Rec tab
  const [recTab, setRecTab] = useState<RecTab>("manager");

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!periodRef.current?.contains(e.target as Node)) setShowPeriodDd(false);
      if (!deptDdRef.current?.contains(e.target as Node)) setShowDeptDd(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const summary     = PERIOD_SUMMARY[period] ?? PERIOD_SUMMARY[LIVE_PERIOD];
  const periodYear  = parseInt(period.split(" ")[0]);
  const pStatus     = PERIOD_STATUS[period] ?? "Closed";
  const pStatusSty  = PERIOD_STATUS_STYLE[pStatus];

  // ── Org Trend ──────────────────────────────────────────────────────────────
  const orgTrendRows = useMemo(() => {
    const count = orgWindow === "3Y" ? 3 : 5;
    return Array.from({ length: count }, (_, i) => periodYear - (count - 1) + i)
      .map(y => {
        const yr = String(y);
        const d  = ORG_YEAR_DATA[yr];
        if (!d) return null;
        return { year: yr, value: d[orgMetric as keyof DeptSlice] as number };
      })
      .filter(Boolean);
  }, [period, orgMetric, orgWindow]);

  // ── Dept Growth Trend ──────────────────────────────────────────────────────
  const deptTrendRows = useMemo(() => {
    const count = deptWindow === "3Y" ? 3 : 5;
    return Array.from({ length: count }, (_, i) => periodYear - (count - 1) + i).map(y => {
      const yr  = String(y);
      const row: Record<string, any> = { year: yr };
      selectedDepts.forEach(dept => {
        const d = DEPT_YEAR_DATA[dept]?.[yr];
        if (d) row[dept] = d[deptMetric as keyof DeptSlice];
      });
      return row;
    });
  }, [period, deptMetric, deptWindow, selectedDepts]);

  // ── Distribution ───────────────────────────────────────────────────────────
  const distData = useMemo(() =>
    SCORE_DIST[period]?.[distMetric] ?? SCORE_DIST[LIVE_PERIOD][distMetric],
    [period, distMetric]);

  // ── Dept Table ─────────────────────────────────────────────────────────────
  const deptRows = useMemo(() => {
    const rows = DEPT_PERF[period] ?? DEPT_PERF[LIVE_PERIOD];
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [period, sortCol, sortDir]);

  // ── Rec Data ───────────────────────────────────────────────────────────────
  const recItems   = (APPRAISAL_REC[period] ?? APPRAISAL_REC[LIVE_PERIOD])[recTab];
  const maxRecCount = Math.max(...recItems.map(r => r.count));

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }
  function toggleDept(d: string) {
    setSelectedDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* 1 — HEADER ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Organisation Performance</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              Organisation-wide performance overview and historical trends.
            </p>
          </div>

          {/* Period Selector */}
          <div ref={periodRef} className="relative shrink-0">
            <button onClick={() => setShowPeriodDd(o => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-md text-[13px]"
              style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Period</span>
              <span className="font-semibold" style={{ color: BLUE }}>{period.split(" ")[0]}</span>
              <span style={{ color: MUTED }}>Annual KPI Review</span>
              <Pill label={pStatus} color={pStatusSty.color} bg={pStatusSty.bg} />
              <ChevronDown size={13} style={{ color: MUTED }} />
            </button>
            {showPeriodDd && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                style={{ minWidth: 260, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                {PERIOD_OPTIONS.map(p => {
                  const ps = PERIOD_STATUS[p] ?? "Closed";
                  const ps_sty = PERIOD_STATUS_STYLE[ps];
                  return (
                    <button key={p} onClick={() => { setPeriod(p); setShowPeriodDd(false); }}
                      className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between"
                      style={{ color: period === p ? BLUE : TEXT, fontWeight: period === p ? 600 : 400 }}>
                      {p}
                      <Pill label={ps} color={ps_sty.color} bg={ps_sty.bg} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2 — ORGANISATION SUMMARY ─────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {/* Employees with Available Results */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Employees with Available Results</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: "#EEF3FC" }}>
                <Users size={14} style={{ color: BLUE }} />
              </div>
            </div>
            <div className="flex items-end gap-1.5 mb-2">
              <span className="text-[26px] font-bold leading-none" style={{ color: TEXT }}>{summary.withResults}</span>
              <span className="text-[15px] mb-0.5" style={{ color: MUTED }}>/ {summary.total}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF3FC" }}>
              <div className="h-full rounded-full" style={{ width: `${(summary.withResults / summary.total) * 100}%`, backgroundColor: BLUE }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>{summary.total - summary.withResults} pending results</p>
          </div>

          {/* KPI Performance */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Organisation KPI Performance</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: "#ECFDF9" }}>
                <Target size={14} style={{ color: TEAL }} />
              </div>
            </div>
            <p className="text-[26px] font-bold leading-none mb-1" style={{ color: TEXT }}>{summary.kpiScore.toFixed(1)}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Based on {summary.withResults} employees with available results</p>
          </div>

          {/* Attitude Score */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Organisation Attitude Score</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: "#F5F3FF" }}>
                <Star size={14} style={{ color: PURPLE }} />
              </div>
            </div>
            <p className="text-[26px] font-bold leading-none mb-1" style={{ color: TEXT }}>{summary.attScore.toFixed(1)}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Based on {summary.withResults} employees with available results</p>
          </div>

          {/* Final Appraisal Score */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Organisation Final Appraisal Score</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2" style={{ backgroundColor: "#ECFDF5" }}>
                <BarChart2 size={14} style={{ color: GREEN }} />
              </div>
            </div>
            <p className="text-[26px] font-bold leading-none mb-1" style={{ color: TEXT }}>{summary.finalScore.toFixed(1)}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Based on {summary.withResults} employees with available results</p>
          </div>
        </div>

        {/* 3 — HISTORICAL ANALYTICS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">

          {/* LEFT — Organisation Performance Trend */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Organisation Performance Trend</h2>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Organisation average · hover for detail</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <MetricTabs value={orgMetric} onChange={setOrgMetric} />
                <WindowTabs value={orgWindow} onChange={setOrgWindow} />
              </div>
            </div>
            <div className="text-[11px] mb-3 flex items-center gap-1.5" style={{ color: MUTED }}>
              <span className="w-6 h-0.5 inline-block rounded-full" style={{ backgroundColor: BLUE }} />
              {METRIC_LABELS[orgMetric]}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={orgTrendRows as any[]} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false}
                  domain={["auto", "auto"]} tickFormatter={v => v.toFixed(0)} />
                <ReTooltip content={<OrgTrendTip />} cursor={{ stroke: BORDER, strokeWidth: 1 }} />
                <Line type="monotone" dataKey="value" stroke={BLUE} strokeWidth={2.5}
                  dot={{ fill: BLUE, r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5, fill: BLUE }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT — Growth Trend by Department */}
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Growth Trend by Department</h2>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Compare department trajectories over time</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <MetricTabs value={deptMetric} onChange={setDeptMetric} />
                <WindowTabs value={deptWindow} onChange={setDeptWindow} />
              </div>
            </div>

            {/* Department Multi-Select */}
            <div ref={deptDdRef} className="relative mb-3">
              <button onClick={() => setShowDeptDd(o => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] border transition-colors hover:bg-gray-50"
                style={{ color: TEXT, borderColor: BORDER }}>
                <span style={{ color: MUTED }}>Departments:</span>
                <span className="font-semibold" style={{ color: BLUE }}>
                  {selectedDepts.length === 0 ? "None selected" : selectedDepts.length === DEPARTMENTS.length ? "All" : selectedDepts.join(", ")}
                </span>
                <ChevronDown size={11} style={{ color: MUTED }} />
              </button>
              {showDeptDd && (
                <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg py-1.5"
                  style={{ minWidth: 220, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                  {DEPARTMENTS.map(dept => {
                    const sel = selectedDepts.includes(dept);
                    return (
                      <button key={dept} onClick={() => toggleDept(dept)}
                        className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F8FAFC] flex items-center gap-2.5 transition-colors">
                        <div className="w-3 h-3 rounded-sm border flex items-center justify-center transition-all"
                          style={sel ? { backgroundColor: DEPT_COLORS[dept], borderColor: DEPT_COLORS[dept] } : { borderColor: BORDER }}>
                          {sel && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPT_COLORS[dept] }} />
                        <span style={{ color: TEXT }}>{dept}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dept toggle pills */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {selectedDepts.map(d => (
                <span key={d} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: DEPT_COLORS[d] + "20", color: DEPT_COLORS[d] }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DEPT_COLORS[d] }} />
                  {d}
                </span>
              ))}
              {selectedDepts.length === 0 && (
                <p className="text-[11px]" style={{ color: MUTED }}>Select departments above to compare trends</p>
              )}
            </div>

            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={deptTrendRows} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false}
                  domain={["auto", "auto"]} tickFormatter={v => v.toFixed(0)} />
                <ReTooltip content={<DeptTrendTip />} cursor={{ stroke: BORDER, strokeWidth: 1 }} />
                {selectedDepts.map(dept => (
                  <Line key={dept} type="monotone" dataKey={dept} stroke={DEPT_COLORS[dept]}
                    strokeWidth={2} dot={{ fill: DEPT_COLORS[dept], r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 4.5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 — SCORE DISTRIBUTION ───────────────────────────────────────── */}
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Score Distribution</h2>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Employee count by score range · hover bar for detail</p>
            </div>
            <MetricTabs value={distMetric} onChange={setDistMetric} />
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={distData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ReTooltip content={<DistTip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="count" fill={BLUE} fillOpacity={0.82} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-end mt-2">
            <p className="text-[11px]" style={{ color: MUTED }}>
              Showing {METRIC_LABELS[distMetric]} · {summary.withResults} employees with available results
            </p>
          </div>
        </div>

        {/* 5 — DEPARTMENT PERFORMANCE ───────────────────────────────────── */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Department Performance</h2>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              {period} · {DEPARTMENTS.length} departments · Click column headers to sort
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: MUTED }}>Department</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: MUTED }}>Employees with Results</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap" style={{ color: MUTED }}
                    onClick={() => toggleSort("kpiScore")}>
                    <span className="flex items-center gap-1">KPI Score <SortIcon col="kpiScore" sortCol={sortCol} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap" style={{ color: MUTED }}
                    onClick={() => toggleSort("attScore")}>
                    <span className="flex items-center gap-1">Attitude Score <SortIcon col="attScore" sortCol={sortCol} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap" style={{ color: MUTED }}
                    onClick={() => toggleSort("finalScore")}>
                    <span className="flex items-center gap-1">Final Score <SortIcon col="finalScore" sortCol={sortCol} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide cursor-pointer whitespace-nowrap" style={{ color: MUTED }}
                    onClick={() => toggleSort("yoyChange")}>
                    <span className="flex items-center gap-1">YoY Change <SortIcon col="yoyChange" sortCol={sortCol} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deptRows.map((row, i) => (
                  <tr key={row.dept} className="hover:bg-[#F8FAFC] transition-colors group"
                    style={{ borderBottom: i < deptRows.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DEPT_COLORS[row.dept] }} />
                        <span className="font-semibold" style={{ color: TEXT }}>{row.dept}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px]" style={{ color: TEXT }}>{row.withResults}</span>
                      <span className="text-[11px] ml-1" style={{ color: MUTED }}>/ {row.total}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[12px]" style={{ color: TEXT }}>{row.kpiScore.toFixed(1)}</td>
                    <td className="px-4 py-3 font-semibold text-[12px]" style={{ color: TEXT }}>{row.attScore.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold text-[12px]" style={{ color: TEXT }}>{row.finalScore.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-0.5 text-[12px] font-semibold"
                        style={{ color: row.yoyChange >= 0 ? GREEN : "#D14343" }}>
                        {row.yoyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {row.yoyChange >= 0 ? "↑" : "↓"} {Math.abs(row.yoyChange).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate("/dashboard")}
                        className="text-[11px] font-semibold whitespace-nowrap px-2.5 py-1.5 rounded-md transition-all"
                        style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>
                        View Team →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6 — APPRAISAL RECOMMENDATION DISTRIBUTION ───────────────────── */}
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h2 className="text-[13px] font-bold" style={{ color: TEXT }}>Appraisal Recommendation Distribution</h2>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                Distribution of recommendations submitted by Managers and final HR decisions.
              </p>
            </div>
            {/* Manager / HR toggle */}
            <div className="flex p-0.5 rounded-md" style={{ backgroundColor: "#F1F3F6" }}>
              <button onClick={() => setRecTab("manager")}
                className="px-3 py-1.5 rounded text-[11px] font-semibold transition-all"
                style={recTab === "manager"
                  ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: MUTED }}>
                Manager Recommendation
              </button>
              <button onClick={() => setRecTab("hr")}
                className="px-3 py-1.5 rounded text-[11px] font-semibold transition-all"
                style={recTab === "hr"
                  ? { backgroundColor: "white", color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: MUTED }}>
                HR Final Decision
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {recItems.map(item => {
              const barPct = maxRecCount > 0 ? (item.count / maxRecCount) * 100 : 0;
              const barColor = REC_COLORS[item.label] ?? MUTED;
              return (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="w-36 text-[12px] font-medium text-right shrink-0" style={{ color: TEXT }}>
                    {item.label}
                  </span>
                  <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ backgroundColor: "#F4F6F9" }}>
                    <div className="h-full rounded-md flex items-center px-2 transition-all duration-500"
                      style={{ width: `${barPct}%`, backgroundColor: barColor, minWidth: barPct > 0 ? 32 : 0 }}>
                      {barPct > 18 && (
                        <span className="text-[11px] font-bold text-white whitespace-nowrap">{item.count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className="text-[12px] font-bold" style={{ color: TEXT }}>{item.count}</span>
                    <span className="text-[11px] ml-1" style={{ color: MUTED }}>({item.pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] mt-4" style={{ color: MUTED }}>
            {recTab === "manager"
              ? "Manager Recommendation — based on manager submissions for this review period."
              : "HR Final Decision — based on completed HR appraisal reviews for this period."}
          </p>
        </div>

      </div>
    </div>
  );
}

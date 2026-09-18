import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, X, ChevronDown, Eye, BookOpen, AlertTriangle,
  Pencil, Trash2, CheckCircle, Info, Building2,
} from "lucide-react";
import { PERIOD_OPTIONS, LIVE_PERIOD } from "./appraisalData";
import { usePerformanceStore } from "../performance/store";

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const RED    = "#D14343";
const GREEN  = "#059669";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";

// ── Types ─────────────────────────────────────────────────────────────────────
type KpiStatus    = "Draft" | "Published";
type PeriodStatus = "Upcoming" | "Open" | "Closed";

interface ScoreDef {
  s5: string; s4: string; s3: string; s2: string; s1: string;
}
interface KpiRow {
  id: string;
  perspective: string;
  kra: string;
  name: string;
  target: string;
  weightage: number;
  status: KpiStatus;
  scoreDef: ScoreDef;
  publishedOn?: string;
  overdue?: boolean;
  version?: number;
  revisedOn?: string;
  revisedBy?: string;
  revisionReason?: string;
  previousVersions?: KpiVersion[];
}
interface KpiVersion {
  version: number;
  revisedOn?: string;
  revisedBy?: string;
  revisionReason?: string;
  perspective: string;
  kra: string;
  name: string;
  target: string;
  weightage: number;
  scoreDef: ScoreDef;
}
interface EditFormData {
  perspective: string; kra: string; name: string;
  target: string; weightage: number; scoreDef: ScoreDef; revisionReason?: string;
}

const EMPTY_SCORE: ScoreDef = { s5: "", s4: "", s3: "", s2: "", s1: "" };
const SCORE_KEYS: (keyof ScoreDef)[] = ["s5", "s4", "s3", "s2", "s1"];

const KPI_STATUS_STYLE: Record<KpiStatus, { color: string; bg: string }> = {
  "Draft":     { color: "#374151", bg: "#F3F4F6" },
  "Published": { color: GREEN,     bg: "#ECFDF5" },
};

const PERIOD_STATUS_STYLE: Record<PeriodStatus, { color: string; bg: string; label: string }> = {
  "Upcoming": { color: AMBER, bg: "#FEF9EC", label: "Upcoming" },
  "Open":     { color: GREEN, bg: "#ECFDF5", label: "Open"     },
  "Closed":   { color: MUTED, bg: "#F2F4F7", label: "Closed"   },
};

// ── Per-period configuration ──────────────────────────────────────────────────
const PERIOD_CONFIG: Record<string, { status: PeriodStatus; maxAllocation: number; kpiSetupDeadline: string }> = {
  "2027 Annual KPI Review": { status: "Upcoming", maxAllocation: 15, kpiSetupDeadline: "2027-01-15" },
  "2026 Annual KPI Review": { status: "Open",     maxAllocation: 15, kpiSetupDeadline: "2026-01-15" },
  "2025 Annual KPI Review": { status: "Closed",   maxAllocation: 12, kpiSetupDeadline: "2025-01-15" },
  "2024 Annual KPI Review": { status: "Closed",   maxAllocation: 10, kpiSetupDeadline: "2024-01-15" },
};

const PERSPECTIVES = ["Financial", "Customer", "Internal Process", "Learning & Growth"];
const KRA_BY_PERSPECTIVE: Record<string, string[]> = {
  "Financial":         ["Company Target", "Revenue Growth"],
  "Customer":          ["Customer Satisfaction", "Service Quality"],
  "Internal Process":  ["Branch Operations", "Process Compliance"],
  "Learning & Growth": ["Organisational Development", "Knowledge Management"],
};

// ── Mock seed data ────────────────────────────────────────────────────────────
const SEED_KPIS: Record<string, KpiRow[]> = {
  "2027 Annual KPI Review": [
    {
      id: "c27-1", perspective: "Financial", kra: "Revenue Growth",
      name: "Company Revenue Growth", target: "≥ 8% YoY", weightage: 5, status: "Published", publishedOn: "2026-12-20", overdue: false, version: 1,
      scoreDef: {
        s5: "Revenue grows 12% or more above target YoY",
        s4: "Revenue grows 9%–11.9% YoY",
        s3: "Revenue grows 8%–8.9% YoY",
        s2: "Revenue grows 4%–7.9% YoY",
        s1: "Revenue grows 0%–3.9% YoY",
      },
    },
    {
      id: "c27-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Index", target: "≥ 85%", weightage: 7, status: "Published", publishedOn: "2026-12-20", overdue: false, version: 1,
      scoreDef: {
        s5: "CSI score 95% or above",
        s4: "CSI score 90%–94%",
        s3: "CSI score 85%–89%",
        s2: "CSI score 75%–84%",
        s1: "CSI score 60%–74%",
      },
    },
    {
      id: "c27-3", perspective: "Internal Process", kra: "Branch Operations",
      name: "Branch Operations Score", target: "≥ 90%", weightage: 3, status: "Published", publishedOn: "2026-12-20", overdue: false, version: 1,
      scoreDef: {
        s5: "Operations score 98% or above", s4: "Operations score 94%–97%", s3: "Operations score 90%–93%",
        s2: "Operations score 80%–89%", s1: "Operations score 70%–79%",
      },
    },
  ],
  "2026 Annual KPI Review": [
    {
      id: "c26-1", perspective: "Financial", kra: "Revenue Growth",
      name: "Company Revenue Growth", target: "≥ 7% YoY", weightage: 5, status: "Published", publishedOn: "2026-01-17", overdue: true, version: 1,
      scoreDef: {
        s5: "Revenue grows 11% or more YoY",
        s4: "Revenue grows 8%–10.9% YoY",
        s3: "Revenue grows 7%–7.9% YoY",
        s2: "Revenue grows 3%–6.9% YoY",
        s1: "Revenue grows 0%–2.9% YoY",
      },
    },
    {
      id: "c26-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Index", target: "≥ 83%", weightage: 7, status: "Published", publishedOn: "2026-01-14", overdue: false, version: 1,
      scoreDef: {
        s5: "CSI score 94% or above",
        s4: "CSI score 89%–93%",
        s3: "CSI score 83%–88%",
        s2: "CSI score 73%–82%",
        s1: "CSI score 58%–72%",
      },
    },
    {
      id: "c26-3", perspective: "Internal Process", kra: "Branch Operations",
      name: "Branch Operations Score", target: "≥ 90%", weightage: 3, status: "Published", publishedOn: "2026-01-15", overdue: false, version: 1,
      scoreDef: {
        s5: "Operations score 98% or above",
        s4: "Operations score 94%–97%",
        s3: "Operations score 90%–93%",
        s2: "Operations score 80%–89%",
        s1: "Operations score 70%–79%",
      },
    },
  ],
  "2025 Annual KPI Review": [
    {
      id: "c25-1", perspective: "Financial", kra: "Revenue Growth",
      name: "Company Revenue Growth", target: "≥ 6% YoY", weightage: 5, status: "Published",
      scoreDef: {
        s5: "Revenue grows 10% or more YoY",
        s4: "Revenue grows 8%–9.9% YoY",
        s3: "Revenue grows 6%–7.9% YoY",
        s2: "Revenue grows 2%–5.9% YoY",
        s1: "Revenue grows 0%–1.9% YoY",
      },
    },
    {
      id: "c25-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Index", target: "≥ 80%", weightage: 7, status: "Published",
      scoreDef: {
        s5: "CSI score 92% or above",
        s4: "CSI score 87%–91%",
        s3: "CSI score 80%–86%",
        s2: "CSI score 70%–79%",
        s1: "CSI score 55%–69%",
      },
    },
  ],
  "2024 Annual KPI Review": [
    {
      id: "c24-1", perspective: "Financial", kra: "Revenue Growth",
      name: "Company Revenue Growth", target: "≥ 5% YoY", weightage: 5, status: "Published",
      scoreDef: {
        s5: "Revenue grows 9% or more YoY",
        s4: "Revenue grows 7%–8.9% YoY",
        s3: "Revenue grows 5%–6.9% YoY",
        s2: "Revenue grows 2%–4.9% YoY",
        s1: "Revenue grows 0%–1.9% YoY",
      },
    },
    {
      id: "c24-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Index", target: "≥ 78%", weightage: 5, status: "Published",
      scoreDef: {
        s5: "CSI score 90% or above",
        s4: "CSI score 85%–89%",
        s3: "CSI score 78%–84%",
        s2: "CSI score 68%–77%",
        s1: "CSI score 53%–67%",
      },
    },
  ],
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info size={12} className="cursor-help align-middle" style={{ color: MUTED }}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <span className="absolute z-50 left-5 top-0 w-52 p-2.5 rounded-md text-[11px] leading-snug bg-[#1A1F2E] text-white shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function ScoreRow({ label, value, onChange, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-14 shrink-0 pt-2 text-[11px] font-bold" style={{ color: BLUE }}>{label}</span>
      {readOnly
        ? <p className="flex-1 text-[12px] py-2" style={{ color: value ? TEXT : MUTED }}>{value || "—"}</p>
        : <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={2}
            placeholder="Describe the achievement required for this score…"
            className="flex-1 px-3 py-2 rounded-md text-[12px] outline-none resize-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
      }
    </div>
  );
}

// ── Scoring Guide Modal ───────────────────────────────────────────────────────
function ScoringGuideModal({ onClose }: { onClose: () => void }) {
  const GUIDE = [
    { score: "5", label: "Exceptional",                  desc: "Performance significantly exceeded all expectations." },
    { score: "4", label: "Exceeds Expectations",          desc: "Performance consistently exceeded requirements." },
    { score: "3", label: "Meets Expectations",            desc: "Performance fully met the defined target." },
    { score: "2", label: "Partially Meets Expectations",  desc: "Performance partially met the target; improvement is needed." },
    { score: "1", label: "Needs Significant Improvement", desc: "Performance fell significantly short of the target." },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[520px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>KPI Scoring Guide</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-1">
          {GUIDE.map(g => (
            <div key={g.score} className="flex gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: BORDER }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ backgroundColor: BLUE }}>{g.score}</div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: TEXT }}>Point {g.score} · {g.label}</p>
                <p className="text-[12px]" style={{ color: MUTED }}>{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <p className="text-[11px] p-3 rounded-md" style={{ color: AMBER, backgroundColor: "#FEF9EC" }}>
            Actual achievement thresholds are defined separately for each KPI.
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Version History ───────────────────────────────────────────────────────────
function VersionHistoryModal({ kpi, onClose }: { kpi: KpiRow; onClose: () => void }) {
  const versions = kpi.previousVersions ?? [];
  const [selectedIndex, setSelectedIndex] = useState(versions.length - 1);
  const selected = versions[selectedIndex];
  const [showAll, setShowAll] = useState(false);
  const current: KpiVersion = {
    version: kpi.version ?? 1, perspective: kpi.perspective, kra: kpi.kra, name: kpi.name,
    target: kpi.target, weightage: kpi.weightage, scoreDef: kpi.scoreDef,
    revisedOn: kpi.revisedOn, revisedBy: kpi.revisedBy, revisionReason: kpi.revisionReason,
  };
  const fields = [
    ["Perspective", selected?.perspective, current.perspective], ["KRA", selected?.kra, current.kra],
    ["KPI Name", selected?.name, current.name], ["Target", selected?.target, current.target],
    ["Weightage", selected ? `${selected.weightage}%` : "", `${current.weightage}%`],
    ...SCORE_KEYS.map((key, i) => [`Point ${5 - i}`, selected?.scoreDef[key], current.scoreDef[key]]),
  ] as [string, string | undefined, string][];
  const visibleFields = showAll ? fields : fields.filter(([, before, after]) => before !== after);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <div><h2 className="text-[16px] font-bold" style={{ color: TEXT }}>Version History</h2><p className="text-[11px]" style={{ color: MUTED }}>Company KPI revision audit</p></div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="rounded-lg p-4" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <p className="text-[13px] font-bold" style={{ color: TEXT }}>Version {current.version} — Current</p>
            <p className="text-[12px] mt-1" style={{ color: MUTED }}>Revised on: {current.revisedOn ?? "—"} · Revised by: {current.revisedBy ?? "Super Admin"}</p>
            <p className="text-[12px] mt-2"><span className="font-semibold" style={{ color: TEXT }}>Revision Reason: </span><span style={{ color: MUTED }}>{current.revisionReason ?? "—"}</span></p>
          </div>
          {selected && <>
            <div className="flex items-center justify-between gap-3"><p className="text-[12px] font-semibold" style={{ color: TEXT }}>Comparing Version {selected.version} with Version {current.version}</p><button onClick={() => setShowAll(value => !value)} className="text-[12px] font-semibold" style={{ color: BLUE }}>{showAll ? "Show changed fields" : "Show all fields"}</button></div>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: BORDER }}>
              <table className="w-full text-[12px]"><thead><tr style={{ backgroundColor: "#F8FAFC" }}><th className="px-3 py-2 text-left" style={{ color: MUTED }}>Field</th><th className="px-3 py-2 text-left" style={{ color: MUTED }}>Version {selected.version}</th><th className="px-3 py-2 text-left" style={{ color: MUTED }}>Version {current.version}</th></tr></thead><tbody>{visibleFields.map(([label, before, after]) => { const changed = before !== after; return <tr key={label} style={{ borderTop: `1px solid ${BORDER}` }}><td className="px-3 py-2 font-medium" style={{ color: TEXT }}>{label}</td><td className="px-3 py-2" style={{ color: changed ? MUTED : TEXT }}>{before || "—"}</td><td className="px-3 py-2 font-semibold" style={{ color: changed ? BLUE : MUTED, backgroundColor: changed ? "#EEF3FC" : undefined }}>{after || "—"}</td></tr>; })}</tbody></table>
            </div>
          </>}
          <div><p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Version History</p><div className="flex flex-wrap gap-2"><button className="px-3 py-2 rounded-md text-[12px] font-semibold" style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>Version {current.version} — Current version</button>{versions.map((version, index) => <button key={version.version} onClick={() => { setSelectedIndex(index); setShowAll(false); }} className="px-3 py-2 rounded-md text-[12px] font-medium border" style={{ color: selectedIndex === index ? BLUE : TEXT, borderColor: selectedIndex === index ? "#93B4E8" : BORDER }}>Version {version.version} — {version.revisionReason ? "Previous version" : "Original published version"}</button>)}</div></div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: BORDER }}><button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Close</button></div>
      </div>
    </div>
  );
}

// ── View Drawer ───────────────────────────────────────────────────────────────
function ViewDrawer({ kpi, period, periodStatus, onClose, onEdit, onRevise }: {
  kpi: KpiRow; period: string; periodStatus: PeriodStatus;
  onClose: () => void; onEdit: () => void; onRevise: () => void;
}) {
  const ss = KPI_STATUS_STYLE[kpi.status];
  const canEdit = periodStatus === "Upcoming";
  const canRevise = kpi.status === "Published" && periodStatus !== "Closed";
  const [showHistory, setShowHistory] = useState(false);
  const previous = kpi.previousVersions?.[kpi.previousVersions.length - 1];

  function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: BORDER }}>
        <span className="text-[11px] w-44 shrink-0 pt-0.5 leading-snug" style={{ color: MUTED }}>{label}</span>
        <div className="text-[13px] font-medium flex-1" style={{ color: TEXT }}>{children}</div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>KPI Detail</h3>
            <p className="text-[11px]" style={{ color: MUTED }}>Company-Level · Read-only view</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>KPI Details</h4>
            <DetailRow label="KPI Level">
              <Pill label="Company-Level" color={BLUE} bg="#EEF3FC" />
            </DetailRow>
            <DetailRow label="Perspective">{kpi.perspective}</DetailRow>
            <DetailRow label="KRA">{kpi.kra}</DetailRow>
            <DetailRow label="KPI Name / Description">{kpi.name}</DetailRow>
            <DetailRow label="Target">{kpi.target}</DetailRow>
            <DetailRow label="Weightage">{kpi.weightage}%</DetailRow>
            <DetailRow label="Review Period">{period}</DetailRow>
            <DetailRow label="Status">
              <span className="flex items-center gap-1.5"><Pill label={kpi.status} color={ss.color} bg={ss.bg} />{kpi.overdue && <Pill label="Overdue" color={RED} bg="#FEF3F2" />}</span>
            </DetailRow>
            {kpi.status === "Published" && <DetailRow label="Overdue">{kpi.overdue ? "Yes" : "No"}</DetailRow>}
            {kpi.status === "Published" && <DetailRow label="Version">
              <span className="flex items-center gap-2 flex-wrap">Version {kpi.version ?? 1}{kpi.revisedOn && <>· Revised on {kpi.revisedOn}</>}{previous && <button onClick={() => setShowHistory(true)} className="text-[12px] font-semibold" style={{ color:BLUE }}>View Version History</button>}</span>
            </DetailRow>}
            <DetailRow label="Applies To">
              <span className="flex items-center gap-1.5">
                <Building2 size={13} style={{ color: MUTED }} />
                All eligible employees in the organisation
              </span>
            </DetailRow>
          </div>

          {canRevise && (
            <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: "#ECFDF5" }}>
              <CheckCircle size={14} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
              <p className="text-[12px]" style={{ color: GREEN }}>
                This KPI is published and applied to all eligible employees in the organisation for {period}.
              </p>
            </div>
          )}


          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>Scoring Definition</h4>
            <div className="space-y-2">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Point ${5 - i}`} value={kpi.scoreDef[key]} readOnly />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          {kpi.status === "Draft" && canEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
              style={{ backgroundColor: BLUE }}>
              <Pencil size={13} /> Edit KPI
            </button>
          )}
          {canRevise && (
            <button onClick={onRevise}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
              style={{ backgroundColor: BLUE }}>
              <Pencil size={13} /> Revise KPI
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
      {showHistory && <VersionHistoryModal kpi={kpi} onClose={() => setShowHistory(false)} />}
    </>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteDialog({ kpiName, onClose, onConfirm }: {
  kpiName: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Delete Draft KPI</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-[13px]" style={{ color: TEXT }}>Are you sure you want to delete the Draft KPI:</p>
          <p className="text-[13px] font-semibold px-3 py-2 rounded-md"
            style={{ color: TEXT, backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            {kpiName}
          </p>
          <p className="text-[12px]" style={{ color: MUTED }}>
            This action cannot be undone. The KPI will be permanently removed from this Review Period.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: RED }}>Delete KPI</button>
        </div>
      </div>
    </div>
  );
}

// ── Publish Confirm Dialog ────────────────────────────────────────────────────
function PublishDialog({ kpiName, period, onClose, onConfirm }: {
  kpiName: string; period: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Publish Company KPI</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md"
            style={{ backgroundColor: "#EEF3FC", border: `1px solid #C7D8F5` }}>
            <Building2 size={14} style={{ color: BLUE }} className="mt-0.5 shrink-0" />
            <p className="text-[12px]" style={{ color: BLUE }}>
              Publishing this KPI will apply it to all eligible employees in the organisation for the{" "}
              <span className="font-semibold">{period}</span>.
            </p>
          </div>
          <div className="p-3 rounded-md" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>KPI being published</p>
            <p className="text-[13px] font-medium" style={{ color: TEXT }}>{kpiName}</p>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            No approval is required. Published Company KPIs appear as read-only Company-Level KPIs
            in each eligible employee's KPI Plan.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}>Confirm & Publish</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit / Create Drawer ──────────────────────────────────────────────────────
function EditDrawer({
  editKpi, isCreate, isRevision, maxAllocation, publishedWeightageExcludingThis,
  onClose, onSaveAsDraft, onPublishAttempt, onCreateRevision,
}: {
  editKpi: KpiRow | null;
  isCreate: boolean;
  isRevision: boolean;
  maxAllocation: number;
  publishedWeightageExcludingThis: number;
  onClose: () => void;
  onSaveAsDraft: (data: EditFormData) => void;
  onPublishAttempt: (data: EditFormData) => void;
  onCreateRevision: (data: EditFormData) => void;
}) {
  const [perspective, setPerspective] = useState(editKpi?.perspective ?? "Financial");
  const [kra, setKra]                 = useState(editKpi?.kra ?? "Company Target");
  const [name, setName]               = useState(editKpi?.name ?? "");
  const [target, setTarget]           = useState(editKpi?.target ?? "");
  const [weightage, setWeightage]     = useState(editKpi?.weightage ?? 5);
  const [scoreDef, setScoreDef]       = useState<ScoreDef>(editKpi?.scoreDef ?? { ...EMPTY_SCORE });
  const [attempted, setAttempted]     = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  const kraOptions = KRA_BY_PERSPECTIVE[perspective] ?? [];

  function changePerspective(p: string) {
    setPerspective(p);
    const opts = KRA_BY_PERSPECTIVE[p] ?? [];
    if (!opts.includes(kra)) setKra(opts[0] ?? "");
  }

  function setScore(key: keyof ScoreDef, val: string) {
    setScoreDef(prev => ({ ...prev, [key]: val }));
  }

  const nameOk   = name.trim() !== "";
  const targetOk = target.trim() !== "";
  const revisionReasonOk = !isRevision || revisionReason.trim() !== "";
  const publishedAfter     = publishedWeightageExcludingThis + weightage;
  const exceedsAllocation  = publishedAfter > maxAllocation;

  function collectData(): EditFormData {
    return { perspective, kra, name, target, weightage, scoreDef, revisionReason };
  }

  function handleSaveAsDraft() {
    setAttempted(true);
    if (!nameOk || !targetOk) return;
    onSaveAsDraft(collectData());
  }

  function handlePublish() {
    setAttempted(true);
    if (!nameOk || !targetOk || exceedsAllocation) return;
    onPublishAttempt(collectData());
  }
  function handleCreateRevision() {
    setAttempted(true);
    if (!nameOk || !targetOk || !revisionReasonOk || exceedsAllocation) return;
    onCreateRevision(collectData());
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>
              {isCreate ? "Create Company KPI" : isRevision ? "Revise Company KPI" : "Edit Company KPI"}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Company-Level · Organisation-wide · No approval required
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* 1 — KPI Information */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider pb-2 mb-4 border-b"
              style={{ color: MUTED, borderColor: BORDER }}>1 — KPI Information</h4>
            <div className="space-y-4">

              <div>
                <label className="flex items-center text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  Perspective <InfoTip text="The broad performance area that the KPI contributes to." />
                </label>
                <select value={perspective} onChange={e => changePerspective(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none border"
                  style={{ borderColor: BORDER, color: TEXT }}>
                  {PERSPECTIVES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <p className="text-[10px] mt-1 italic" style={{ color: MUTED }}>
                  Example predefined values — To Be Confirmed with TBM
                </p>
              </div>

              <div>
                <label className="flex items-center text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  KRA (Key Result Area) <InfoTip text="The specific performance area that the KPI measures." />
                </label>
                <select value={kra} onChange={e => setKra(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none border"
                  style={{ borderColor: BORDER, color: TEXT }}>
                  {kraOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <p className="text-[10px] mt-1 italic" style={{ color: MUTED }}>
                  Example predefined values — To Be Confirmed with TBM
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  KPI Name / Description *
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Company Revenue Growth"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${attempted && !nameOk ? RED : BORDER}`, color: TEXT }} />
                {attempted && !nameOk && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} /> KPI Name is required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Target *</label>
                <input value={target} onChange={e => setTarget(e.target.value)}
                  placeholder="e.g. ≥ 8% YoY · ≥ 85% · ≥ 90%"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${attempted && !targetOk ? RED : BORDER}`, color: TEXT }} />
                {attempted && !targetOk && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} /> Target is required.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Weightage (%)</label>
                <input type="number" min={1} max={100} value={weightage}
                  onChange={e => setWeightage(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${exceedsAllocation && attempted ? RED : BORDER}`, color: TEXT }} />

                <div className="mt-2 p-3 rounded-md space-y-1.5"
                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>Company KPI allocation</span>
                    <span className="font-semibold" style={{ color: TEXT }}>{maxAllocation}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>Published KPIs {isCreate ? "" : "(excl. this KPI)"}</span>
                    <span className="font-semibold" style={{ color: TEXT }}>{publishedWeightageExcludingThis}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>This KPI</span>
                    <span className="font-semibold" style={{ color: TEXT }}>+ {weightage}%</span>
                  </div>
                  <div className="h-px" style={{ backgroundColor: BORDER }} />
                  <div className="flex justify-between text-[12px] font-bold">
                    <span style={{ color: TEXT }}>Published total if published</span>
                    <span style={{ color: exceedsAllocation ? RED : publishedAfter === maxAllocation ? GREEN : TEXT }}>
                      {publishedAfter}% / {maxAllocation}%
                    </span>
                  </div>
                </div>

                {exceedsAllocation && (
                  <p className="text-[11px] mt-1.5 flex items-start gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                    Publishing would exceed the Company KPI allocation of {maxAllocation}%. Reduce weightage by at least {publishedAfter - maxAllocation}%.
                  </p>
                )}
                {!exceedsAllocation && publishedAfter === maxAllocation && (
                  <p className="text-[11px] mt-1.5" style={{ color: GREEN }}>
                    ✓ Publishing this KPI will fully utilise the Company KPI allocation.
                  </p>
                )}
                {!exceedsAllocation && publishedAfter < maxAllocation && (
                  <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>
                    {maxAllocation - publishedAfter}% of the Company KPI allocation remains after publishing.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2 — Scoring Definition */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider pb-2 mb-4 border-b"
              style={{ color: MUTED, borderColor: BORDER }}>2 — Scoring Definition</h4>
            <p className="text-[12px] mb-3" style={{ color: MUTED }}>
              Define the achievement criteria for each point level. These apply to all eligible employees in the organisation.
            </p>
            <div className="space-y-3">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Point ${5 - i}`} value={scoreDef[key]}
                  onChange={v => setScore(key, v)} />
              ))}
            </div>
          </div>

          {isRevision && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider pb-2 mb-4 border-b" style={{ color:MUTED, borderColor:BORDER }}>3 — Revision Reason</h4>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color:TEXT }}>Revision Reason *</label>
              <textarea value={revisionReason} onChange={e => setRevisionReason(e.target.value)} rows={3}
                placeholder="Explain why this published KPI is being revised…"
                className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
                style={{ border:`1px solid ${attempted && !revisionReasonOk ? RED : BORDER}`, color:TEXT }} />
              {attempted && !revisionReasonOk && <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color:RED }}><AlertTriangle size={10}/> Revision Reason is required.</p>}
              <p className="text-[11px] mt-2" style={{ color:MUTED }}>The current version is preserved. Effective-version behaviour after a Review Period opens remains to be confirmed.</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          {!isRevision && <button onClick={handleSaveAsDraft}
            className="px-4 py-2 rounded-md text-[13px] font-semibold border transition-colors hover:bg-gray-50"
            style={{ color: BLUE, borderColor: "#93B4E8" }}>
            Save as Draft
          </button>}
          <button onClick={isRevision ? handleCreateRevision : handlePublish} disabled={exceedsAllocation}
            className="flex-1 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
            style={{ backgroundColor: exceedsAllocation ? "#9CA3AF" : GREEN }}>
            {isRevision ? "Create New Version" : "Publish KPI"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CompanyKPIs() {
  const performanceStore = usePerformanceStore();
  const sharedPeriods = performanceStore.periods;
  const defaultPeriodId = performanceStore.getConfigurationDefaultPeriodId();
  const defaultPeriodName = sharedPeriods.find(period => period.id === defaultPeriodId)?.name ?? LIVE_PERIOD;
  const seededKpis = useMemo(() => Object.fromEntries(Object.entries(SEED_KPIS).map(([k, v]) => [k, [...v]])) as Record<string, KpiRow[]>, []);
  const hasStoredKpis = Object.keys(performanceStore.state.companyKpisByPeriod).length > 0;
  const kpisByPeriod = (hasStoredKpis ? performanceStore.state.companyKpisByPeriod : seededKpis) as Record<string, KpiRow[]>;
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodName);
  const [showPeriodDd, setShowPeriodDd]     = useState(false);

  const [viewId, setViewId]             = useState<string | null>(null);
  const [historyId, setHistoryId]       = useState<string | null>(null);
  const [editId, setEditId]             = useState<string | null>(null);
  const [editIsCreate, setEditIsCreate] = useState(false);
  const [editIsRevision, setEditIsRevision] = useState(false);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState<
    { data: EditFormData; isFromTable: boolean; id?: string } | null
  >(null);
  const [showGuide, setShowGuide] = useState(false);

  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasStoredKpis) performanceStore.setCompanyKpisByPeriod(seededKpis);
  }, [hasStoredKpis, seededKpis, performanceStore]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!periodRef.current?.contains(e.target as Node)) setShowPeriodDd(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const kpis         = kpisByPeriod[selectedPeriod] ?? [];
  const sharedPeriod = sharedPeriods.find(period => period.name === selectedPeriod);
  const config       = sharedPeriod
    ? { status: sharedPeriod.status as PeriodStatus, maxAllocation: sharedPeriod.allocations.company, kpiSetupDeadline: sharedPeriod.deadlines.kpiSetup }
    : { status: "Closed" as PeriodStatus, maxAllocation: 10, kpiSetupDeadline: "" };
  const periodStatus = config.status;
  const maxAlloc     = config.maxAllocation;

  const publishedWeight = useMemo(
    () => kpis.filter(k => k.status === "Published").reduce((s, k) => s + k.weightage, 0),
    [kpis]
  );
  const remaining = maxAlloc - publishedWeight;

  const viewKpi = viewId ? (kpis.find(k => k.id === viewId) ?? null) : null;
  const historyKpi = historyId ? (kpis.find(k => k.id === historyId) ?? null) : null;
  const editKpi = editId ? (kpis.find(k => k.id === editId) ?? null) : null;

  const publishedExcludingEdit = useMemo(() => {
    if (editIsCreate) return publishedWeight;
    if (editKpi?.status === "Published") return publishedWeight - editKpi.weightage;
    return publishedWeight;
  }, [kpis, editKpi, editIsCreate, publishedWeight]);

  // ── Mutations ──
  function mutatePeriod(updater: (prev: KpiRow[]) => KpiRow[]) {
    performanceStore.setCompanyKpisByPeriod({ ...kpisByPeriod, [selectedPeriod]: updater(kpisByPeriod[selectedPeriod] ?? []) });
  }

  function changePeriod(p: string) {
    setSelectedPeriod(p);
    setShowPeriodDd(false);
    setViewId(null); setEditId(null); setEditIsCreate(false); setEditIsRevision(false);
    setDeleteId(null); setPublishConfirm(null);
  }

  function openCreate() { setEditId(null); setEditIsCreate(true); setEditIsRevision(false); setViewId(null); }
  function openEdit(id: string) { setEditId(id); setEditIsCreate(false); setEditIsRevision(false); setViewId(null); }
  function openRevision(id: string) { setEditId(id); setEditIsCreate(false); setEditIsRevision(true); setViewId(null); }
  function closeEdit() { setEditId(null); setEditIsCreate(false); setEditIsRevision(false); }

  function handleSaveAsDraft(data: EditFormData) {
    if (editIsCreate) {
      mutatePeriod(prev => [...prev, { id: `c-${Date.now()}`, ...data, status: "Draft" }]);
    } else if (editId) {
      mutatePeriod(prev => prev.map(k => k.id === editId ? { ...k, ...data, status: "Draft" } : k));
    }
    closeEdit();
  }

  function handlePublishAttempt(data: EditFormData) {
    setPublishConfirm({ data, isFromTable: false });
  }

  function handlePublishFromTable(id: string) {
    const kpi = kpis.find(k => k.id === id);
    if (kpi) setPublishConfirm({ data: { ...kpi }, isFromTable: true, id });
  }

  function confirmPublish() {
    if (!publishConfirm) return;
    const publishedOn = performanceStore.state.effectiveDate;
    const publication = {
      status: "Published" as KpiStatus,
      publishedOn,
      overdue: Boolean(config.kpiSetupDeadline && publishedOn > config.kpiSetupDeadline),
      version: 1,
    };
    if (publishConfirm.isFromTable && publishConfirm.id) {
      mutatePeriod(prev => prev.map(k => k.id === publishConfirm.id ? { ...k, ...publication } : k));
    } else if (editIsCreate) {
      mutatePeriod(prev => [...prev, { id: `c-${Date.now()}`, ...publishConfirm.data, ...publication }]);
      closeEdit();
    } else if (editId) {
      mutatePeriod(prev => prev.map(k => k.id === editId ? { ...k, ...publishConfirm.data, ...publication } : k));
      closeEdit();
    }
    setPublishConfirm(null);
  }

  function confirmDelete() {
    if (!deleteId) return;
    mutatePeriod(prev => prev.filter(k => k.id !== deleteId));
    if (viewId === deleteId) setViewId(null);
    setDeleteId(null);
  }

  function createRevision(data: EditFormData) {
    if (!editId) return;
    const revisedOn = performanceStore.state.effectiveDate;
    mutatePeriod(prev => prev.map(kpi => {
      if (kpi.id !== editId) return kpi;
      const previous: KpiVersion = {
        version: kpi.version ?? 1, revisedOn: kpi.revisedOn, revisedBy: kpi.revisedBy, revisionReason: kpi.revisionReason,
        perspective: kpi.perspective, kra: kpi.kra, name: kpi.name, target: kpi.target,
        weightage: kpi.weightage, scoreDef: kpi.scoreDef,
      };
      return {
        ...kpi, ...data, status: "Published", version: (kpi.version ?? 1) + 1,
        revisedOn, revisedBy: "Super Admin", revisionReason: data.revisionReason, previousVersions: [...(kpi.previousVersions ?? []), previous],
      };
    }));
    closeEdit();
  }

  const pss      = PERIOD_STATUS_STYLE[periodStatus];
  const canCreate = periodStatus === "Upcoming";

  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Company KPIs</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              Manage organisation-wide KPIs for the Annual KPI Review Period.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Period Selector */}
            <div ref={periodRef} className="relative">
              <button onClick={() => setShowPeriodDd(o => !o)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-md text-[13px] transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: TEXT, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Period</span>
                <span className="font-semibold" style={{ color: BLUE }}>{selectedPeriod.split(" ")[0]}</span>
                <span style={{ color: MUTED }}>Annual KPI Review</span>
                <Pill label={pss.label} color={pss.color} bg={pss.bg} />
                <ChevronDown size={13} style={{ color: MUTED }} />
              </button>
              {showPeriodDd && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                  style={{ minWidth: 240, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                  {sharedPeriods.map(shared => {
                    const p = shared.name;
                    const ps = PERIOD_STATUS_STYLE[(shared.status === "Draft" ? "Upcoming" : shared.status) as PeriodStatus] ?? PERIOD_STATUS_STYLE["Closed"];
                    return (
                      <button key={p} onClick={() => changePeriod(p)}
                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between"
                        style={{ color: selectedPeriod === p ? BLUE : TEXT, fontWeight: selectedPeriod === p ? 600 : 400 }}>
                        {p}
                        <Pill label={ps.label} color={ps.color} bg={ps.bg} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {periodStatus === "Open" && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md text-[11px]" style={{ backgroundColor:"#FEF9EC", color:AMBER, border:"1px solid #F5D98A" }}>
                <AlertTriangle size={12} className="mt-0.5 shrink-0"/>
                Open-period revision effective-version behaviour is TBC. Version history is preserved, but assessment propagation and recalculation are not modelled.
              </div>
            )}

            <button onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
              style={{ color: TEXT, borderColor: BORDER }}>
              <BookOpen size={14} /> Scoring Guide
            </button>

            {canCreate && (
              <button onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BLUE }}>
                <Plus size={14} /> Create Company KPI
              </button>
            )}
          </div>
        </div>

        {/* ── Period restriction banners ── */}
        {periodStatus === "Open" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px]"
            style={{ backgroundColor: "#EEF3FC", color: BLUE, border: `1px solid #C7D8F5` }}>
            <Info size={13} className="shrink-0" />
            This Review Period is Open. Published KPIs are viewable. Structural changes are restricted.
          </div>
        )}
        {periodStatus === "Closed" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px]"
            style={{ backgroundColor: "#F2F4F7", color: MUTED }}>
            <Info size={13} className="shrink-0" />
            This Review Period is Closed. This is a read-only historical view.
          </div>
        )}

        {/* ── Weightage Summary ── */}
        <div className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>
                Company KPI Weightage
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[26px] font-bold leading-none"
                  style={{ color: publishedWeight > maxAlloc ? RED : publishedWeight === maxAlloc ? GREEN : AMBER }}>
                  {publishedWeight}
                </span>
                <span className="text-[15px] mb-0.5" style={{ color: MUTED }}>/ {maxAlloc}%</span>
              </div>
              <div className="w-48 h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, (publishedWeight / maxAlloc) * 100)}%`,
                  backgroundColor: publishedWeight > maxAlloc ? RED : publishedWeight === maxAlloc ? GREEN : AMBER,
                }} />
              </div>
              <p className="text-[11px]" style={{
                color: publishedWeight > maxAlloc ? RED : publishedWeight === maxAlloc ? GREEN : MUTED,
              }}>
                {publishedWeight > maxAlloc
                  ? `${publishedWeight - maxAlloc}% over allocation — reduce Published KPI weightages`
                  : publishedWeight === maxAlloc
                  ? "✓ Company KPI allocation fully utilised"
                  : `${remaining}% remaining in Company KPI allocation`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Max Allocation", value: `${maxAlloc}%`,                        color: BLUE  },
                { label: "Published",      value: `${publishedWeight}%`,                  color: GREEN },
                { label: "Remaining",      value: `${Math.max(0, remaining)}%`,            color: remaining < 0 ? RED : AMBER },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 rounded-lg"
                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Table ── */}
        <div className="bg-white rounded-lg overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>
              Company KPIs — {selectedPeriod}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              {kpis.length} KPI{kpis.length !== 1 ? "s" : ""} · Published KPIs apply to all eligible employees in the organisation.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                  {["KPI Name", "Target", "Weightage", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px]" style={{ color: MUTED }}>
                      {periodStatus !== "Upcoming"
                        ? "No Company KPIs for this period."
                        : "No Company KPIs yet. Click \"Create Company KPI\" to get started."}
                    </td>
                  </tr>
                )}
                {kpis.map((kpi, i) => {
                  const ss = KPI_STATUS_STYLE[kpi.status];
                  const canEditRow    = periodStatus === "Upcoming" && kpi.status === "Draft";
                  const canDeleteRow  = periodStatus === "Upcoming" && kpi.status === "Draft";
                  const wouldExceed   = publishedWeight + kpi.weightage > maxAlloc;
                  const canPublishRow = periodStatus === "Upcoming" && kpi.status === "Draft" && !wouldExceed;
                  return (
                    <tr key={kpi.id} className="hover:bg-[#F8FAFC] transition-colors"
                      style={{ borderBottom: i < kpis.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: TEXT }}>{kpi.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{kpi.perspective} · {kpi.kra}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: TEXT }}>{kpi.target}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: TEXT }}>{kpi.weightage}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Pill label={kpi.status} color={ss.color} bg={ss.bg} />
                          {kpi.overdue && <Pill label="Overdue" color={RED} bg="#FEF3F2" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setViewId(kpi.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-gray-50"
                            style={{ color: MUTED, borderColor: BORDER }}>
                            <Eye size={11} /> View
                          </button>
                          {kpi.previousVersions?.length ? <button onClick={() => setHistoryId(kpi.id)} className="px-2.5 py-1.5 rounded text-[11px] font-medium border" style={{ color: BLUE, borderColor: "#93B4E8" }}>View Version History</button> : null}
                          {canEditRow && (
                            <button onClick={() => openEdit(kpi.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                              style={{ color: BLUE, borderColor: "#93B4E8" }}>
                              <Pencil size={11} /> Edit
                            </button>
                          )}
                          {kpi.status === "Published" && periodStatus !== "Closed" && (
                            <button onClick={() => openRevision(kpi.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                              style={{ color: BLUE, borderColor: "#93B4E8" }}>
                              <Pencil size={11} /> Revise KPI
                            </button>
                          )}
                          {canDeleteRow && (
                            <button onClick={() => setDeleteId(kpi.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-red-50"
                              style={{ color: RED, borderColor: "#FECACA" }}>
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                          {kpi.status === "Draft" && canEditRow && (
                            <button
                              onClick={() => handlePublishFromTable(kpi.id)}
                              disabled={!canPublishRow}
                              title={wouldExceed ? `Publishing would exceed the ${maxAlloc}% allocation` : undefined}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors"
                              style={canPublishRow
                                ? { color: "white", backgroundColor: GREEN }
                                : { color: MUTED, backgroundColor: "#F3F4F6", cursor: "not-allowed" }}>
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {kpis.length > 0 && (
            <div className="px-4 py-2.5 border-t" style={{ borderColor: BORDER }}>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {kpis.filter(k => k.status === "Published").length} Published ·{" "}
                {kpis.filter(k => k.status === "Draft").length} Draft ·{" "}
                Total published weightage: {publishedWeight}% / {maxAlloc}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawers & Modals ── */}
      {viewKpi && (
        <ViewDrawer
          kpi={viewKpi} period={selectedPeriod} periodStatus={periodStatus}
          onClose={() => setViewId(null)} onEdit={() => openEdit(viewKpi.id)} onRevise={() => openRevision(viewKpi.id)} />
      )}
      {historyKpi && <VersionHistoryModal kpi={historyKpi} onClose={() => setHistoryId(null)} />}
      {(editIsCreate || editId) && (
        <EditDrawer
          editKpi={editIsCreate ? null : editKpi}
          isCreate={editIsCreate}
          isRevision={editIsRevision}
          maxAllocation={maxAlloc}
          publishedWeightageExcludingThis={publishedExcludingEdit}
          onClose={closeEdit}
          onSaveAsDraft={handleSaveAsDraft}
          onPublishAttempt={handlePublishAttempt} onCreateRevision={createRevision} />
      )}
      {publishConfirm && (
        <PublishDialog
          kpiName={publishConfirm.isFromTable
            ? (kpis.find(k => k.id === publishConfirm.id)?.name ?? "")
            : publishConfirm.data.name}
          period={selectedPeriod}
          onClose={() => setPublishConfirm(null)}
          onConfirm={confirmPublish} />
      )}
      {deleteId && (
        <DeleteDialog
          kpiName={kpis.find(k => k.id === deleteId)?.name ?? ""}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete} />
      )}
      {showGuide && <ScoringGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

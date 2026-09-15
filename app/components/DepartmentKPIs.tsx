import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, X, ChevronDown, Eye, BookOpen, AlertTriangle,
  Pencil, Trash2, CheckCircle, Info, Globe,
} from "lucide-react";
import { PERIOD_OPTIONS, LIVE_PERIOD } from "./appraisalData";

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
type DeptKpiStatus = "Draft" | "Published";
type PeriodStatus  = "Upcoming" | "Open" | "Closed";

interface ScoreDef {
  s5: string; s4: string; s3: string; s2: string; s1: string; s0: string;
}
interface DeptKpiRow {
  id: string;
  perspective: string;
  kra: string;
  name: string;
  target: string;
  weightage: number;
  status: DeptKpiStatus;
  scoreDef: ScoreDef;
}

const EMPTY_SCORE: ScoreDef = { s5: "", s4: "", s3: "", s2: "", s1: "", s0: "" };
const SCORE_KEYS: (keyof ScoreDef)[] = ["s5", "s4", "s3", "s2", "s1", "s0"];

const KPI_STATUS_STYLE: Record<DeptKpiStatus, { color: string; bg: string }> = {
  "Draft":     { color: "#374151", bg: "#F3F4F6" },
  "Published": { color: GREEN,     bg: "#ECFDF5" },
};

const PERIOD_STATUS_STYLE: Record<PeriodStatus, { color: string; bg: string; label: string }> = {
  "Upcoming": { color: AMBER,  bg: "#FEF9EC", label: "Upcoming" },
  "Open":     { color: GREEN,  bg: "#ECFDF5", label: "Open"     },
  "Closed":   { color: MUTED,  bg: "#F2F4F7", label: "Closed"   },
};

// ── Per-period configuration ──────────────────────────────────────────────────
const PERIOD_CONFIG: Record<string, { status: PeriodStatus; maxAllocation: number }> = {
  "2027 Annual KPI Review": { status: "Upcoming", maxAllocation: 25 },
  "2026 Annual KPI Review": { status: "Open",     maxAllocation: 25 },
  "2025 Annual KPI Review": { status: "Closed",   maxAllocation: 20 },
  "2024 Annual KPI Review": { status: "Closed",   maxAllocation: 20 },
};

const PERSPECTIVES = ["Financial", "Customer", "Internal Process", "Learning & Growth"];
const KRA_BY_PERSPECTIVE: Record<string, string[]> = {
  "Financial":         ["Sales Performance", "Company Target"],
  "Customer":          ["Customer Satisfaction", "Service Quality"],
  "Internal Process":  ["Service Quality", "Process Compliance"],
  "Learning & Growth": ["Staff Development", "Knowledge Sharing"],
};

// ── Mock initial data per period ──────────────────────────────────────────────
const SEED_KPIS: Record<string, DeptKpiRow[]> = {
  "2027 Annual KPI Review": [
    {
      id: "d27-1", perspective: "Financial", kra: "Sales Performance",
      name: "Monthly Sales Achievement", target: "RM 85,000 / month", weightage: 15, status: "Draft",
      scoreDef: {
        s5: "Achieves RM 95,000 or more per month",
        s4: "Achieves RM 90,000–RM 94,999 per month",
        s3: "Achieves RM 85,000–RM 89,999 per month",
        s2: "Achieves RM 70,000–RM 84,999 per month",
        s1: "Achieves RM 55,000–RM 69,999 per month",
        s0: "Achieves less than RM 55,000 per month",
      },
    },
    {
      id: "d27-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Score", target: "≥ 4.2 / 5.0", weightage: 5, status: "Draft",
      scoreDef: {
        s5: "Average satisfaction score 4.8 or above",
        s4: "Average satisfaction score 4.5–4.79",
        s3: "Average satisfaction score 4.2–4.49",
        s2: "Average satisfaction score 3.8–4.19",
        s1: "Average satisfaction score 3.2–3.79",
        s0: "Average satisfaction score below 3.2",
      },
    },
  ],
  "2026 Annual KPI Review": [
    {
      id: "d26-1", perspective: "Financial", kra: "Sales Performance",
      name: "Monthly Sales Achievement", target: "RM 80,000 / month", weightage: 15, status: "Published",
      scoreDef: {
        s5: "Achieves RM 90,000 or more per month",
        s4: "Achieves RM 85,000–RM 89,999 per month",
        s3: "Achieves RM 80,000–RM 84,999 per month",
        s2: "Achieves RM 65,000–RM 79,999 per month",
        s1: "Achieves RM 50,000–RM 64,999 per month",
        s0: "Achieves less than RM 50,000 per month",
      },
    },
    {
      id: "d26-2", perspective: "Financial", kra: "Sales Performance",
      name: "Product Coverage Rate", target: "≥ 80% product range", weightage: 10, status: "Published",
      scoreDef: {
        s5: "Covers 95% or more of the product range",
        s4: "Covers 90%–94% of the product range",
        s3: "Covers 80%–89% of the product range",
        s2: "Covers 70%–79% of the product range",
        s1: "Covers 50%–69% of the product range",
        s0: "Covers less than 50% of the product range",
      },
    },
  ],
  "2025 Annual KPI Review": [
    {
      id: "d25-1", perspective: "Financial", kra: "Sales Performance",
      name: "Monthly Sales Achievement", target: "RM 75,000 / month", weightage: 12, status: "Published",
      scoreDef: {
        s5: "Achieves RM 85,000 or more per month",
        s4: "Achieves RM 80,000–RM 84,999 per month",
        s3: "Achieves RM 75,000–RM 79,999 per month",
        s2: "Achieves RM 60,000–RM 74,999 per month",
        s1: "Achieves RM 45,000–RM 59,999 per month",
        s0: "Achieves less than RM 45,000 per month",
      },
    },
    {
      id: "d25-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Customer Satisfaction Score", target: "≥ 4.0 / 5.0", weightage: 8, status: "Published",
      scoreDef: {
        s5: "Average satisfaction score 4.7 or above",
        s4: "Average satisfaction score 4.3–4.69",
        s3: "Average satisfaction score 4.0–4.29",
        s2: "Average satisfaction score 3.5–3.99",
        s1: "Average satisfaction score 3.0–3.49",
        s0: "Average satisfaction score below 3.0",
      },
    },
  ],
  "2024 Annual KPI Review": [
    {
      id: "d24-1", perspective: "Financial", kra: "Sales Performance",
      name: "Monthly Sales Achievement", target: "RM 70,000 / month", weightage: 10, status: "Published",
      scoreDef: {
        s5: "Achieves RM 80,000 or more per month",
        s4: "Achieves RM 75,000–RM 79,999 per month",
        s3: "Achieves RM 70,000–RM 74,999 per month",
        s2: "Achieves RM 58,000–RM 69,999 per month",
        s1: "Achieves RM 45,000–RM 57,999 per month",
        s0: "Achieves less than RM 45,000 per month",
      },
    },
    {
      id: "d24-2", perspective: "Customer", kra: "Customer Satisfaction",
      name: "Cross-Sell Achievement", target: "≥ 25% of transactions", weightage: 10, status: "Published",
      scoreDef: {
        s5: "Cross-sell rate 35% or above",
        s4: "Cross-sell rate 30%–34%",
        s3: "Cross-sell rate 25%–29%",
        s2: "Cross-sell rate 18%–24%",
        s1: "Cross-sell rate 10%–17%",
        s0: "Cross-sell rate below 10%",
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
    { score: "0", label: "Not Achieved",                  desc: "Target was not achieved." },
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
                <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{g.label}</p>
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

// ── View Drawer ───────────────────────────────────────────────────────────────
function ViewDrawer({ kpi, period, periodStatus, onClose, onEdit }: {
  kpi: DeptKpiRow;
  period: string;
  periodStatus: PeriodStatus;
  onClose: () => void;
  onEdit: () => void;
}) {
  const ss = KPI_STATUS_STYLE[kpi.status];
  const canEdit = periodStatus === "Upcoming";

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
            <p className="text-[11px]" style={{ color: MUTED }}>Department-Level · Read-only view</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              KPI Details
            </h4>
            <DetailRow label="KPI Level">
              <Pill label="Department-Level" color="#8B5CF6" bg="#F5F3FF" />
            </DetailRow>
            <DetailRow label="Perspective">{kpi.perspective}</DetailRow>
            <DetailRow label="KRA">{kpi.kra}</DetailRow>
            <DetailRow label="KPI Name / Description">{kpi.name}</DetailRow>
            <DetailRow label="Target">{kpi.target}</DetailRow>
            <DetailRow label="Weightage">{kpi.weightage}%</DetailRow>
            <DetailRow label="Review Period">{period}</DetailRow>
            <DetailRow label="Status">
              <Pill label={kpi.status} color={ss.color} bg={ss.bg} />
            </DetailRow>
            <DetailRow label="Applies To">
              <span className="flex items-center gap-1.5">
                <Globe size={13} style={{ color: MUTED }} />
                All eligible employees in Retail Sales Department
              </span>
            </DetailRow>
          </div>

          {kpi.status === "Published" && (
            <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: "#ECFDF5" }}>
              <CheckCircle size={14} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
              <p className="text-[12px]" style={{ color: GREEN }}>
                This KPI is published and applied to all eligible employees in Retail Sales for {period}.
              </p>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              Scoring Definition
            </h4>
            <div className="space-y-2">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Score ${5 - i}`} value={kpi.scoreDef[key]} readOnly />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          {canEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
              style={{ backgroundColor: BLUE }}>
              <Pencil size={13} /> Edit KPI
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
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
          <p className="text-[13px]" style={{ color: TEXT }}>
            Are you sure you want to delete the Draft KPI:
          </p>
          <p className="text-[13px] font-semibold px-3 py-2 rounded-md" style={{ color: TEXT, backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
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
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Publish Department KPI</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: "#EEF3FC", border: `1px solid #C7D8F5` }}>
            <Globe size={14} style={{ color: BLUE }} className="mt-0.5 shrink-0" />
            <p className="text-[12px]" style={{ color: BLUE }}>
              Publishing this KPI will apply it to all eligible employees in the Retail Sales Department
              for the <span className="font-semibold">{period}</span>.
            </p>
          </div>
          <div className="p-3 rounded-md" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>KPI being published</p>
            <p className="text-[13px] font-medium" style={{ color: TEXT }}>{kpiName}</p>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            No Manager or HR approval is required. Published KPIs appear as read-only Department-Level KPIs
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

// ── Create / Edit Drawer ──────────────────────────────────────────────────────
interface EditFormData {
  perspective: string; kra: string; name: string;
  target: string; weightage: number; scoreDef: ScoreDef;
}

function EditDrawer({
  editKpi, isCreate, maxAllocation, publishedWeightageExcludingThis,
  onClose, onSaveAsDraft, onPublishAttempt,
}: {
  editKpi: DeptKpiRow | null;
  isCreate: boolean;
  maxAllocation: number;
  publishedWeightageExcludingThis: number;
  onClose: () => void;
  onSaveAsDraft: (data: EditFormData) => void;
  onPublishAttempt: (data: EditFormData) => void;
}) {
  const [perspective, setPerspective] = useState(editKpi?.perspective ?? "Financial");
  const [kra, setKra]                 = useState(editKpi?.kra ?? "Sales Performance");
  const [name, setName]               = useState(editKpi?.name ?? "");
  const [target, setTarget]           = useState(editKpi?.target ?? "");
  const [weightage, setWeightage]     = useState(editKpi?.weightage ?? 10);
  const [scoreDef, setScoreDef]       = useState<ScoreDef>(editKpi?.scoreDef ?? { ...EMPTY_SCORE });
  const [attempted, setAttempted]     = useState(false);

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
  const publishedAfter = publishedWeightageExcludingThis + weightage;
  const exceedsAllocation = publishedAfter > maxAllocation;

  function collectData(): EditFormData {
    return { perspective, kra, name, target, weightage, scoreDef };
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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>
              {isCreate ? "Create Department KPI" : "Edit Department KPI"}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Department-Level · Retail Sales · No approval required
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
              {/* Perspective */}
              <div>
                <label className="flex items-center text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  Perspective
                  <InfoTip text="The broad performance area that the KPI contributes to." />
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

              {/* KRA */}
              <div>
                <label className="flex items-center text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  KRA (Key Result Area)
                  <InfoTip text="The specific performance area that the KPI measures." />
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

              {/* KPI Name */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>
                  KPI Name / Description *
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Monthly Sales Achievement"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${attempted && !nameOk ? RED : BORDER}`, color: TEXT }} />
                {attempted && !nameOk && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} /> KPI Name is required.
                  </p>
                )}
              </div>

              {/* Target */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Target *</label>
                <input value={target} onChange={e => setTarget(e.target.value)}
                  placeholder="e.g. RM 80,000 / month · ≥ 4.2 / 5.0"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${attempted && !targetOk ? RED : BORDER}`, color: TEXT }} />
                {attempted && !targetOk && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} /> Target is required.
                  </p>
                )}
              </div>

              {/* Weightage */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Weightage (%)</label>
                <input type="number" min={1} max={100} value={weightage}
                  onChange={e => setWeightage(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${exceedsAllocation && attempted ? RED : BORDER}`, color: TEXT }} />

                {/* Weightage breakdown */}
                <div className="mt-2 p-3 rounded-md space-y-1.5" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>Department allocation</span>
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
                    Publishing would exceed the Department KPI allocation of {maxAllocation}%. Reduce weightage by at least {publishedAfter - maxAllocation}%.
                  </p>
                )}
                {!exceedsAllocation && publishedAfter === maxAllocation && (
                  <p className="text-[11px] mt-1.5" style={{ color: GREEN }}>
                    ✓ Publishing this KPI will fully utilise the Department KPI allocation.
                  </p>
                )}
                {!exceedsAllocation && publishedAfter < maxAllocation && (
                  <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>
                    {maxAllocation - publishedAfter}% of the Department KPI allocation remains after publishing.
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
              Define the achievement criteria for each score level. These apply to all eligible employees in the department.
            </p>
            <div className="space-y-3">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Score ${5 - i}`} value={scoreDef[key]}
                  onChange={v => setScore(key, v)} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={handleSaveAsDraft}
            className="px-4 py-2 rounded-md text-[13px] font-semibold border transition-colors hover:bg-gray-50"
            style={{ color: BLUE, borderColor: "#93B4E8" }}>
            Save as Draft
          </button>
          <button onClick={handlePublish} disabled={exceedsAllocation}
            className="flex-1 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
            style={{ backgroundColor: exceedsAllocation ? "#9CA3AF" : GREEN }}>
            Publish KPI
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function DepartmentKPIs() {
  const [kpisByPeriod, setKpisByPeriod] = useState<Record<string, DeptKpiRow[]>>(() =>
    Object.fromEntries(Object.entries(SEED_KPIS).map(([k, v]) => [k, [...v]]))
  );
  const [selectedPeriod, setSelectedPeriod] = useState(LIVE_PERIOD);
  const [showPeriodDd, setShowPeriodDd]     = useState(false);

  const [viewId, setViewId]             = useState<string | null>(null);
  const [editId, setEditId]             = useState<string | null>(null);
  const [editIsCreate, setEditIsCreate] = useState(false);

  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState<{ data: EditFormData; isFromTable: boolean; id?: string } | null>(null);

  const [showGuide, setShowGuide] = useState(false);

  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!periodRef.current?.contains(e.target as Node)) setShowPeriodDd(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const kpis         = kpisByPeriod[selectedPeriod] ?? [];
  const config       = PERIOD_CONFIG[selectedPeriod] ?? { status: "Closed" as PeriodStatus, maxAllocation: 20 };
  const periodStatus = config.status;
  const maxAlloc     = config.maxAllocation;

  // Weightage helpers
  const publishedWeight = useMemo(
    () => kpis.filter(k => k.status === "Published").reduce((s, k) => s + k.weightage, 0),
    [kpis]
  );
  const remaining = maxAlloc - publishedWeight;

  const viewKpi  = viewId ? (kpis.find(k => k.id === viewId) ?? null) : null;
  const editKpi  = editId ? (kpis.find(k => k.id === editId) ?? null) : null;

  // Published weight excluding current edit target
  const publishedExcludingEdit = useMemo(() => {
    if (editIsCreate) return publishedWeight;
    // If editing a Published KPI, exclude its own weight from the published total
    if (editKpi?.status === "Published") return publishedWeight - (editKpi.weightage);
    return publishedWeight;
  }, [kpis, editKpi, editIsCreate, publishedWeight]);

  // ── Helpers ──
  function mutatePeriod(updater: (prev: DeptKpiRow[]) => DeptKpiRow[]) {
    setKpisByPeriod(prev => ({ ...prev, [selectedPeriod]: updater(prev[selectedPeriod] ?? []) }));
  }

  function changePeriod(p: string) {
    setSelectedPeriod(p);
    setShowPeriodDd(false);
    setViewId(null);
    setEditId(null);
    setEditIsCreate(false);
    setDeleteId(null);
    setPublishConfirm(null);
  }

  function openCreate() { setEditId(null); setEditIsCreate(true); setViewId(null); }
  function openEdit(id: string) { setEditId(id); setEditIsCreate(false); setViewId(null); }
  function closeEdit() { setEditId(null); setEditIsCreate(false); }

  function handleSaveAsDraft(data: EditFormData) {
    if (editIsCreate) {
      const newKpi: DeptKpiRow = { id: `d-${Date.now()}`, ...data, status: "Draft" };
      mutatePeriod(prev => [...prev, newKpi]);
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
    if (!kpi) return;
    setPublishConfirm({ data: { ...kpi }, isFromTable: true, id });
  }

  function confirmPublish() {
    if (!publishConfirm) return;
    if (publishConfirm.isFromTable && publishConfirm.id) {
      mutatePeriod(prev => prev.map(k => k.id === publishConfirm.id ? { ...k, status: "Published" } : k));
    } else if (editIsCreate) {
      const newKpi: DeptKpiRow = { id: `d-${Date.now()}`, ...publishConfirm.data, status: "Published" };
      mutatePeriod(prev => [...prev, newKpi]);
      closeEdit();
    } else if (editId) {
      mutatePeriod(prev => prev.map(k => k.id === editId ? { ...k, ...publishConfirm.data, status: "Published" } : k));
      closeEdit();
    }
    setPublishConfirm(null);
  }

  function confirmDelete() {
    if (!deleteId) return;
    mutatePeriod(prev => prev.filter(k => k.id !== deleteId));
    setDeleteId(null);
    if (viewId === deleteId) setViewId(null);
  }

  const pss = PERIOD_STATUS_STYLE[periodStatus];

  const isReadOnly    = periodStatus === "Closed" || periodStatus === "Open";
  const canCreate     = periodStatus === "Upcoming";

  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Department KPIs</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              Retail Sales Department · Department-Level KPI management
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
                  {PERIOD_OPTIONS.map(p => {
                    const cfg = PERIOD_CONFIG[p];
                    const ps  = cfg ? PERIOD_STATUS_STYLE[cfg.status] : PERIOD_STATUS_STYLE["Closed"];
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

            <button onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
              style={{ color: TEXT, borderColor: BORDER }}>
              <BookOpen size={14} /> Scoring Guide
            </button>

            {canCreate && (
              <button onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BLUE }}>
                <Plus size={14} /> Create Department KPI
              </button>
            )}
          </div>
        </div>

        {/* ── Period restriction banner ── */}
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
                Department KPI Weightage
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
                  ? "✓ Department KPI allocation fully utilised"
                  : `${remaining}% remaining in Department KPI allocation`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Max Allocation",       value: `${maxAlloc}%`, color: BLUE  },
                { label: "Published",            value: `${publishedWeight}%`, color: GREEN },
                { label: "Remaining",            value: `${Math.max(0, remaining)}%`, color: remaining < 0 ? RED : AMBER },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
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
              Department KPIs — {selectedPeriod}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              {kpis.length} KPI{kpis.length !== 1 ? "s" : ""} · Published KPIs apply to all eligible employees in Retail Sales.
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
                      {isReadOnly ? "No Department KPIs for this period." : "No Department KPIs yet. Click \"Create Department KPI\" to get started."}
                    </td>
                  </tr>
                )}
                {kpis.map((kpi, i) => {
                  const ss = KPI_STATUS_STYLE[kpi.status];
                  const canEditRow   = periodStatus === "Upcoming";
                  const canDeleteRow = periodStatus === "Upcoming" && kpi.status === "Draft";
                  const canPublishRow = periodStatus === "Upcoming" && kpi.status === "Draft"
                    && (publishedWeight + kpi.weightage) <= maxAlloc;
                  return (
                    <tr key={kpi.id} className="hover:bg-[#F8FAFC] transition-colors"
                      style={{ borderBottom: i < kpis.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: TEXT }}>{kpi.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{kpi.perspective} · {kpi.kra}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: TEXT }}>
                        {kpi.target}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: TEXT }}>
                        {kpi.weightage}%
                      </td>
                      <td className="px-4 py-3">
                        <Pill label={kpi.status} color={ss.color} bg={ss.bg} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* View */}
                          <button onClick={() => setViewId(kpi.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-gray-50"
                            style={{ color: MUTED, borderColor: BORDER }}>
                            <Eye size={11} /> View
                          </button>
                          {/* Edit */}
                          {canEditRow && (
                            <button onClick={() => openEdit(kpi.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                              style={{ color: BLUE, borderColor: "#93B4E8" }}>
                              <Pencil size={11} /> Edit
                            </button>
                          )}
                          {/* Delete */}
                          {canDeleteRow && (
                            <button onClick={() => setDeleteId(kpi.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-red-50"
                              style={{ color: RED, borderColor: "#FECACA" }}>
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                          {/* Publish */}
                          {kpi.status === "Draft" && canEditRow && (
                            <button
                              onClick={() => handlePublishFromTable(kpi.id)}
                              disabled={!canPublishRow}
                              title={!canPublishRow && publishedWeight + kpi.weightage > maxAlloc
                                ? `Publishing would exceed the ${maxAlloc}% allocation`
                                : undefined}
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
                {kpis.filter(k => k.status === "Published").length} Published · {kpis.filter(k => k.status === "Draft").length} Draft · Total published weightage: {publishedWeight}% / {maxAlloc}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawers and Modals ── */}
      {viewKpi && (
        <ViewDrawer
          kpi={viewKpi} period={selectedPeriod} periodStatus={periodStatus}
          onClose={() => setViewId(null)} onEdit={() => openEdit(viewKpi.id)} />
      )}
      {(editIsCreate || editId) && (
        <EditDrawer
          editKpi={editIsCreate ? null : editKpi}
          isCreate={editIsCreate}
          maxAllocation={maxAlloc}
          publishedWeightageExcludingThis={publishedExcludingEdit}
          onClose={closeEdit}
          onSaveAsDraft={handleSaveAsDraft}
          onPublishAttempt={handlePublishAttempt} />
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

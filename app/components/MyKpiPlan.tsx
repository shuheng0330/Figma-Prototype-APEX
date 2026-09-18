import { useState, useMemo, useEffect } from "react";
import { Plus, X, CheckCircle, Info, Eye, BookOpen, Send, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { usePerformanceStore } from "../performance/store";

const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const RED    = "#D14343";
const GREEN  = "#059669";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";
const PURPLE = "#7C3AED";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApprovalStatus =
  | "Published"
  | "Approved"
  | "Pending Approval"
  | "Draft"
  | "Returned";

type KpiLevel = "Company" | "Department" | "Individual";

interface ScoreDef { s5: string; s4: string; s3: string; s2: string; s1: string; }
interface KpiVersion { version: number; perspective: string; kra: string; name: string; target: string; weightage: number; scoreDef: ScoreDef; revisedOn?: string; revisedBy?: string; revisionReason?: string; }

interface KpiRow {
  id: string;
  level: KpiLevel;
  perspective: string;
  kra: string;
  name: string;
  target: string;
  weightage: number;
  status: ApprovalStatus;
  returnReason?: string;
  scoreDef: ScoreDef;
  overdue?: boolean;
  version?: number;
  revisedOn?: string;
  revisedBy?: string;
  revisionReason?: string;
  previousVersions?: KpiVersion[];
  employeeId?: string;
}

const EMPTY_SCORE: ScoreDef = { s5: "", s4: "", s3: "", s2: "", s1: "" };
const SCORE_KEYS: (keyof ScoreDef)[] = ["s5", "s4", "s3", "s2", "s1"];

const STATUS_STYLE: Record<ApprovalStatus, { color: string; bg: string }> = {
  "Published":                { color: GREEN,  bg: "#ECFDF5" },
  "Approved":                 { color: TEAL,   bg: "#ECFDF9" },
  "Pending Approval":         { color: AMBER,  bg: "#FEF9EC" },
  "Draft":                    { color: "#374151", bg: "#F3F4F6" },
  "Returned":                 { color: RED,    bg: "#FEF3F2" },
};

const LEVEL_STYLE: Record<KpiLevel, { color: string; bg: string }> = {
  Company:    { color: BLUE,   bg: "#EEF3FC" },
  Department: { color: PURPLE, bg: "#F5F3FF" },
  Individual: { color: TEAL,   bg: "#ECFDF9" },
};

const PERSPECTIVES = ["Financial", "Customer", "Internal Process", "Learning & Growth"];
const KRA_BY_PERSPECTIVE: Record<string, string[]> = {
  "Financial":         ["Company Target", "Sales Performance"],
  "Customer":          ["Customer Satisfaction", "Service Quality"],
  "Internal Process":  ["Service Quality"],
  "Learning & Growth": ["Staff Development"],
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const INIT_KPIS: KpiRow[] = [
  {
    id: "c1", level: "Company", perspective: "Financial", kra: "Company Target",
    name: "Company Revenue Growth", target: "≥ 8% YoY", weightage: 5, status: "Published",
    scoreDef: {
      s5: "Revenue grows 10% or more above target YoY",
      s4: "Revenue grows 8%–9.9% YoY",
      s3: "Revenue grows 5%–7.9% YoY",
      s2: "Revenue grows 2%–4.9% YoY",
      s1: "Revenue grows 0%–1.9% YoY",
    },
  },
  {
    id: "c2", level: "Company", perspective: "Customer", kra: "Customer Satisfaction",
    name: "Customer Satisfaction Index", target: "≥ 85%", weightage: 7, status: "Published",
    scoreDef: {
      s5: "CSI score 95% or above",
      s4: "CSI score 90%–94%",
      s3: "CSI score 85%–89%",
      s2: "CSI score 75%–84%",
      s1: "CSI score 60%–74%",
    },
  },
  {
    id: "c3", level: "Company", perspective: "Internal Process", kra: "Service Quality",
    name: "Branch Operations Score", target: "≥ 90%", weightage: 3, status: "Published",
    scoreDef: {
      s5: "Operations score 98% or above",
      s4: "Operations score 93%–97%",
      s3: "Operations score 90%–92%",
      s2: "Operations score 80%–89%",
      s1: "Operations score 70%–79%",
    },
  },
  {
    id: "d1", level: "Department", perspective: "Financial", kra: "Sales Performance",
    name: "Monthly Sales Achievement", target: "RM 80,000/month", weightage: 15, status: "Published",
    scoreDef: {
      s5: "Achieves 110% or more of monthly sales target",
      s4: "Achieves 100%–109% of monthly sales target",
      s3: "Achieves 90%–99% of monthly sales target",
      s2: "Achieves 75%–89% of monthly sales target",
      s1: "Achieves 50%–74% of monthly sales target",
    },
  },
  {
    id: "d2", level: "Department", perspective: "Financial", kra: "Sales Performance",
    name: "Product Coverage", target: "≥ 80% range", weightage: 10, status: "Published",
    scoreDef: {
      s5: "Covers 95% or more of the product range",
      s4: "Covers 90%–94% of the product range",
      s3: "Covers 80%–89% of the product range",
      s2: "Covers 70%–79% of the product range",
      s1: "Covers 50%–69% of the product range",
    },
  },
  {
    id: "i1", level: "Individual", perspective: "Customer", kra: "Customer Satisfaction",
    name: "New Customer Acquisition", target: "10 new customers/month", weightage: 30,
    status: "Approved", version: 2, revisedOn: "15 Sep 2026", revisedBy: "Amir Hassan", revisionReason: "Updated acquisition target to reflect the revised sales plan.",
    previousVersions: [{ version: 1, perspective: "Customer", kra: "Customer Satisfaction", name: "New Customer Acquisition", target: "8 new customers/month", weightage: 30, scoreDef: { s5: "Acquires 11 or more new customers per month", s4: "Acquires 9–10 new customers per month", s3: "Acquires 8 new customers per month", s2: "Acquires 6–7 new customers per month", s1: "Acquires fewer than 6 new customers per month" } }],
    scoreDef: {
      s5: "Acquires 13 or more new customers per month",
      s4: "Acquires 11–12 new customers per month",
      s3: "Acquires 10 new customers per month",
      s2: "Acquires 8–9 new customers per month",
      s1: "Acquires 5–7 new customers per month",
    },
  },
  {
    id: "i2", level: "Individual", perspective: "Financial", kra: "Sales Performance",
    name: "Cross-Sell Rate", target: "≥ 20%", weightage: 30,
    status: "Returned", overdue: true,
    returnReason: "Target is unclear. Please clarify whether this is measured as a percentage of transactions or percentage of customers served. Update the scoring definition and resubmit.",
    scoreDef: {
      s5: "Cross-sell rate 25% or above",
      s4: "Cross-sell rate 22%–24%",
      s3: "Cross-sell rate 20%–21%",
      s2: "Cross-sell rate 15%–19%",
      s1: "Cross-sell rate 10%–14%",
    },
  },
];

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}>{label}</span>
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
      {readOnly ? (
        <p className="flex-1 text-[12px] py-2" style={{ color: value ? TEXT : MUTED }}>
          {value || "—"}
        </p>
      ) : (
        <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={2}
          placeholder="Describe the achievement required for this score…"
          className="flex-1 px-3 py-2 rounded-md text-[12px] outline-none resize-none"
          style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
      )}
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
                <p className="text-[12px] font-semibold" style={{ color: TEXT }}>{g.label}</p>
                <p className="text-[12px]" style={{ color: MUTED }}>{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <p className="text-[11px] p-3 rounded-md" style={{ color: AMBER, backgroundColor: "#FEF9EC" }}>
            Actual achievement thresholds are defined separately for each KPI. These ratings are not linked to fixed percentage thresholds.
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

function VersionHistoryModal({ kpi, onClose }: { kpi: KpiRow; onClose: () => void }) {
  const versions = kpi.previousVersions ?? [];
  const [selectedIndex, setSelectedIndex] = useState(versions.length - 1);
  const [showAll, setShowAll] = useState(false);
  const selected = versions[selectedIndex];
  const current: KpiVersion = { version: kpi.version ?? 1, perspective: kpi.perspective, kra: kpi.kra, name: kpi.name, target: kpi.target, weightage: kpi.weightage, scoreDef: kpi.scoreDef, revisedOn: kpi.revisedOn, revisedBy: kpi.revisedBy, revisionReason: kpi.revisionReason };
  const fields = [["Perspective", selected?.perspective, current.perspective], ["KRA", selected?.kra, current.kra], ["KPI Name", selected?.name, current.name], ["Target", selected?.target, current.target], ["Weightage", selected ? `${selected.weightage}%` : "", `${current.weightage}%`], ...SCORE_KEYS.map((key, i) => [`Point ${5 - i}`, selected?.scoreDef[key], current.scoreDef[key]])] as [string, string | undefined, string][];
  const visible = showAll ? fields : fields.filter(([, before, after]) => before !== after);
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,.45)" }}><div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"><div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}><div><h2 className="text-[16px] font-bold" style={{ color: TEXT }}>Version History</h2><p className="text-[11px]" style={{ color: MUTED }}>Individual KPI revision audit</p></div><button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button></div><div className="flex-1 overflow-y-auto p-6 space-y-4"><div className="p-4 rounded-lg" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}><p className="font-bold text-[13px]" style={{ color: TEXT }}>Version {current.version} — Current</p><p className="text-[12px] mt-1" style={{ color: MUTED }}>Revised on: {current.revisedOn ?? "—"} · Revised by: {current.revisedBy ?? "—"}</p><p className="text-[12px] mt-2" style={{ color: TEXT }}><b>Revision Reason:</b> {current.revisionReason ?? "—"}</p></div>{selected && <><div className="flex justify-between"><p className="text-[12px] font-semibold" style={{ color: TEXT }}>Comparing Version {selected.version} with Version {current.version}</p><button onClick={() => setShowAll(v => !v)} className="text-[12px] font-semibold" style={{ color: BLUE }}>{showAll ? "Show changed fields" : "Show all fields"}</button></div><table className="w-full text-[12px] border rounded-lg overflow-hidden" style={{ borderColor: BORDER }}><thead><tr style={{ backgroundColor: "#F8FAFC" }}><th className="p-2 text-left">Field</th><th className="p-2 text-left">Version {selected.version}</th><th className="p-2 text-left">Version {current.version}</th></tr></thead><tbody>{visible.map(([label, before, after]) => <tr key={label} style={{ borderTop: `1px solid ${BORDER}` }}><td className="p-2 font-medium">{label}</td><td className="p-2" style={{ color: before !== after ? MUTED : TEXT }}>{before || "—"}</td><td className="p-2 font-semibold" style={{ color: before !== after ? BLUE : MUTED, backgroundColor: before !== after ? "#EEF3FC" : undefined }}>{after || "—"}</td></tr>)}</tbody></table></>}<div className="flex gap-2 flex-wrap"><button className="px-3 py-2 rounded text-[12px] font-semibold" style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>Version {current.version} — Current version</button>{versions.map((version, index) => <button key={version.version} onClick={() => { setSelectedIndex(index); setShowAll(false); }} className="px-3 py-2 rounded text-[12px] border" style={{ borderColor: BORDER, color: TEXT }}>Version {version.version} — {version.revisionReason ? "Previous version" : "Original published version"}</button>)}</div></div><div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: BORDER }}><button onClick={onClose} className="px-4 py-2 border rounded-md" style={{ borderColor: BORDER }}>Close</button></div></div></div>;
}

// ── KPI Detail Drawer (View) ──────────────────────────────────────────────────

function ViewDrawer({ kpi, period, readOnly, onClose, onEdit, onRevise }: {
  kpi: KpiRow; period: string; readOnly: boolean; onClose: () => void; onEdit: () => void; onRevise: () => void;
}) {
  const ls = LEVEL_STYLE[kpi.level];
  const ss = STATUS_STYLE[kpi.status];
  const canEdit = kpi.level === "Individual"
    && !readOnly && (kpi.status === "Draft" || kpi.status === "Returned");
  const canRevise = kpi.level === "Individual" && !readOnly && kpi.status === "Approved";
  const [showHistory, setShowHistory] = useState(false);

  function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: BORDER }}>
        <span className="text-[11px] w-40 shrink-0 pt-0.5 leading-snug" style={{ color: MUTED }}>{label}</span>
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
            <p className="text-[11px]" style={{ color: MUTED }}>Read-only view</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: KPI Details */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              KPI Details
            </h4>
            <DetailRow label="KPI Level">
              <Pill label={`${kpi.level}-Level`} color={ls.color} bg={ls.bg} />
            </DetailRow>
            <DetailRow label="Perspective">{kpi.perspective}</DetailRow>
            <DetailRow label="KRA">{kpi.kra}</DetailRow>
            <DetailRow label="KPI Name / Description">{kpi.name}</DetailRow>
            <DetailRow label="Target">{kpi.target}</DetailRow>
            <DetailRow label="Weightage">{kpi.weightage}%</DetailRow>
            <DetailRow label="Review Period">{period}</DetailRow>
            <DetailRow label="Status">
              <span className="flex gap-1.5"><Pill label={kpi.status} color={ss.color} bg={ss.bg} />{kpi.overdue && <Pill label="Overdue" color={RED} bg="#FEF3F2" />}</span>
            </DetailRow>
          </div>

          {/* Contextual messages */}
          {kpi.status === "Returned" && kpi.returnReason && (
            <div className="p-3 rounded-md" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color: RED }}>Superior Return Reason</p>
              <p className="text-[12px]" style={{ color: RED }}>{kpi.returnReason}</p>
            </div>
          )}
          {kpi.status === "Pending Approval" && (
            <div className="p-3 rounded-md" style={{ backgroundColor: "#FEF9EC" }}>
              <p className="text-[12px]" style={{ color: AMBER }}>
                This KPI is awaiting Superior approval. No changes can be made until the Superior responds.
              </p>
            </div>
          )}
          {kpi.status === "Approved" && (
            <div className="flex items-start gap-2 p-3 rounded-md" style={{ backgroundColor: "#ECFDF9" }}>
              <CheckCircle size={14} style={{ color: TEAL }} className="mt-0.5 shrink-0" />
              <p className="text-[12px]" style={{ color: TEAL }}>
                This KPI has been approved and is part of your confirmed KPI plan.
              </p>
            </div>
          )}

          {/* Section 2: Scoring Definition */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
              Scoring Definition
            </h4>
            <div className="space-y-2">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Point ${5 - i}`} value={kpi.scoreDef[key]} readOnly />
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
          {canRevise && <button onClick={onRevise} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white" style={{ backgroundColor: BLUE }}><Pencil size={13} /> Revise KPI</button>}
          {kpi.previousVersions?.length ? <button onClick={() => setShowHistory(true)} className="px-4 py-2 rounded-md text-[13px] font-semibold border" style={{ color: BLUE, borderColor: "#93B4E8" }}>View Version History</button> : null}
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
      {showHistory && <VersionHistoryModal kpi={kpi} onClose={() => setShowHistory(false)} />}
    </>
  );
}

// ── Create / Edit Individual KPI Drawer ───────────────────────────────────────

function EditDrawer({ editKpi, isRevision, totalExcludingThis, onClose, onSave }: {
  editKpi: KpiRow | null;
  isRevision: boolean;
  totalExcludingThis: number;
  onClose: () => void;
  onSave: (data: Omit<KpiRow, "id" | "level" | "status" | "returnReason">) => void;
}) {
  const isCreate = editKpi === null;

  const [perspective, setPerspective] = useState(editKpi?.perspective ?? "Financial");
  const [kra, setKra] = useState(editKpi?.kra ?? "Sales Performance");
  const [name, setName] = useState(editKpi?.name ?? "");
  const [target, setTarget] = useState(editKpi?.target ?? "");
  const [weightage, setWeightage] = useState(editKpi?.weightage ?? 10);
  const [scoreDef, setScoreDef] = useState<ScoreDef>(editKpi?.scoreDef ?? { ...EMPTY_SCORE });
  const [attempted, setAttempted] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  const kraOptions = KRA_BY_PERSPECTIVE[perspective] ?? [];

  function changePerspective(p: string) {
    setPerspective(p);
    const opts = KRA_BY_PERSPECTIVE[p] ?? [];
    if (!opts.includes(kra)) setKra(opts[0] ?? "");
  }

  const resultingTotal = totalExcludingThis + weightage;
  const weightageOver = resultingTotal > 100;
  const remaining = 100 - resultingTotal;

  const nameOk   = name.trim() !== "";
  const targetOk = target.trim() !== "";
  const allScoresFilled = SCORE_KEYS.every(k => scoreDef[k].trim() !== "");
  const revisionReasonOk = !isRevision || revisionReason.trim() !== "";

  function handleSave() {
    setAttempted(true);
    if (!nameOk || !targetOk || weightageOver || !revisionReasonOk) return;
    onSave({ perspective, kra, name, target, weightage, scoreDef, revisionReason });
  }

  function setScore(key: keyof ScoreDef, val: string) {
    setScoreDef(prev => ({ ...prev, [key]: val }));
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>
              {isCreate ? "Create Individual KPI" : isRevision ? "Revise Individual KPI" : "Edit Individual KPI"}
            </h3>
            {editKpi?.status === "Returned" && (
              <p className="text-[11px] mt-0.5" style={{ color: RED }}>
                This KPI was returned for revision
              </p>
            )}
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* Return reason (edit mode only) */}
          {editKpi?.returnReason && (
            <div className="p-3 rounded-md" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color: RED }}>Superior Return Reason</p>
              <p className="text-[12px]" style={{ color: RED }}>{editKpi.returnReason}</p>
            </div>
          )}

          {/* Section 1: KPI Information */}
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
                  <InfoTip text="Key Result Area; the specific performance area that the KPI measures." />
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
                  placeholder="e.g. New Customer Acquisition"
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
                  placeholder="e.g. RM 80,000 / 95% / 10 new customers per month"
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
                  style={{ border: `1px solid ${weightageOver ? RED : BORDER}`, color: TEXT }} />

                {/* Weightage breakdown */}
                <div className="mt-2 p-3 rounded-md space-y-1.5" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>Current total {isCreate ? "" : "(excl. this KPI)"}</span>
                    <span className="font-semibold" style={{ color: TEXT }}>{totalExcludingThis}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: MUTED }}>This KPI</span>
                    <span className="font-semibold" style={{ color: TEXT }}>+ {weightage}%</span>
                  </div>
                  <div className="h-px" style={{ backgroundColor: BORDER }} />
                  <div className="flex justify-between text-[12px] font-bold">
                    <span style={{ color: TEXT }}>Resulting total</span>
                    <span style={{ color: weightageOver ? RED : resultingTotal === 100 ? TEAL : TEXT }}>
                      {resultingTotal}%
                    </span>
                  </div>
                </div>

                {weightageOver && (
                  <p className="text-[11px] mt-1.5 flex items-start gap-1" style={{ color: RED }}>
                    <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                    This weightage would increase your total KPI weightage to {resultingTotal}%. Reduce it by at least {resultingTotal - 100}%.
                  </p>
                )}
                {!weightageOver && remaining > 0 && (
                  <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>
                    Your total KPI weightage will be {resultingTotal}% after saving. Add {remaining}% more before submitting.
                  </p>
                )}
                {!weightageOver && remaining === 0 && (
                  <p className="text-[11px] mt-1.5" style={{ color: TEAL }}>
                    ✓ Weightage will reach exactly 100% after saving.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Scoring Definition */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider pb-2 mb-4 border-b"
              style={{ color: MUTED, borderColor: BORDER }}>2 — Scoring Definition</h4>

            <p className="text-[12px] mb-3" style={{ color: MUTED }}>
              Define the achievement required for each point. Your Superior will review these criteria together with the proposed KPI.
            </p>
            <div className="space-y-3">
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={`Point ${5 - i}`} value={scoreDef[key]}
                  onChange={v => setScore(key, v)} />
              ))}
            </div>

            {attempted && !allScoresFilled && (
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: AMBER }}>
                <AlertTriangle size={11} />
                All point criteria should be filled before submitting to your Superior.
              </p>
            )}
          </div>
          {isRevision && <div><h4 className="text-[10px] font-bold uppercase tracking-wider pb-2 mb-4 border-b" style={{ color: MUTED, borderColor: BORDER }}>3 — Revision Reason</h4><textarea value={revisionReason} onChange={e => setRevisionReason(e.target.value)} rows={3} placeholder="Explain why this KPI is being revised" className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none" style={{ border: `1px solid ${attempted && !revisionReasonOk ? RED : BORDER}` }} />{attempted && !revisionReasonOk && <p className="text-[11px] mt-1" style={{ color: RED }}>Revision Reason is required.</p>}</div>}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={handleSave} disabled={weightageOver}
            className="flex-1 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
            style={{ backgroundColor: weightageOver ? "#9CA3AF" : BLUE }}>
            {isRevision ? "Submit Revision for Superior Approval" : "Save Draft"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Submit Confirmation Dialog ─────────────────────────────────────────────────

function SubmitDialog({ kpis, onClose, onSubmit }: {
  kpis: KpiRow[]; onClose: () => void; onSubmit: () => void;
}) {
  const toSubmit = kpis.filter(k =>
    k.level === "Individual" && k.status === "Draft"
  );
  const indivWeightage = toSubmit.reduce((s, k) => s + k.weightage, 0);
  const totalWeightage = kpis.reduce((s, k) => s + k.weightage, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Submit Individual KPIs for Approval</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            The following Individual KPIs will be submitted to your Superior for approval:
          </p>
          <ul className="space-y-1.5">
            {toSubmit.map(k => (
              <li key={k.id} className="flex items-center gap-2 text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TEAL }} />
                <span style={{ color: TEXT }}>{k.name}</span>
                {k.status === "Returned" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style={{ color: RED, backgroundColor: "#FEF3F2" }}>Resubmitting</span>
                )}
                <span className="ml-auto font-semibold" style={{ color: MUTED }}>{k.weightage}%</span>
              </li>
            ))}
          </ul>
          <div className="p-3 rounded-md space-y-1.5" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            {[
              { label: "KPIs being submitted", value: String(toSubmit.length) },
              { label: "Individual-Level weightage", value: `${indivWeightage}%` },
              { label: "Overall KPI weightage", value: `${totalWeightage}%` },
              { label: "Submission to", value: "Sales Manager (Superior)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[12px]">
                <span style={{ color: MUTED }}>{label}</span>
                <span className="font-semibold" style={{ color: TEXT }}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Your Superior may approve the KPIs or return them to you for revision.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={onSubmit}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: TEAL }}>Submit to Superior</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MyKpiPlan() {
  const performanceStore = usePerformanceStore();
  const defaultPeriodId = performanceStore.getConfigurationDefaultPeriodId();
  const defaultPeriodName = performanceStore.periods.find(period => period.id === defaultPeriodId)?.name ?? "2027 Annual KPI Review";
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodName);
  const planMap = performanceStore.state.employeeKpiPlansByPeriod as Record<string, KpiRow[]>;
  const selectedPeriodRecord = performanceStore.periods.find(period => period.name === selectedPeriod);
  const kpis = (selectedPeriodRecord
    ? performanceStore.getEmployeeKpiPlan(selectedPeriodRecord.id, "amir")
    : []) as KpiRow[];
  const [viewId, setViewId]                 = useState<string | null>(null);
  const [historyId, setHistoryId]           = useState<string | null>(null);
  const [editId, setEditId]                 = useState<string | null>(null);
  const [editIsCreate, setEditIsCreate]     = useState(false);
  const [editIsRevision, setEditIsRevision] = useState(false);
  const [showSubmitDialog, setShowDialog]   = useState(false);
  const [showGuide, setShowGuide]           = useState(false);
  const [submitted, setSubmitted]           = useState(false);

  function setKpis(updater: (previous: KpiRow[]) => KpiRow[]) {
    const updated = updater(kpis);
    performanceStore.setEmployeeKpiPlansByPeriod({
      ...planMap,
      [selectedPeriod]: updated.filter(kpi => kpi.level === "Individual").map(kpi => ({ ...kpi, employeeId: "amir" })),
    });
  }
  const selectedSharedPeriod = selectedPeriodRecord;
  const isHistorical = selectedSharedPeriod?.status === "Closed";
  const isOpenPeriod = selectedSharedPeriod?.status === "Open";
  const isSetupPastDeadline = Boolean(selectedSharedPeriod && performanceStore.state.effectiveDate > selectedSharedPeriod.deadlines.kpiSetup);
  const isKpiOverdue = (kpi: KpiRow) => Boolean(kpi.overdue || (isSetupPastDeadline && kpi.level === "Individual" && kpi.status !== "Approved"));

  const totalWeightage = useMemo(() => kpis.reduce((s, k) => s + k.weightage, 0), [kpis]);
  const pct = Math.min(100, totalWeightage);

  const byLevelWeight = useMemo(() => ({
    Company:    kpis.filter(k => k.level === "Company").reduce((s, k) => s + k.weightage, 0),
    Department: kpis.filter(k => k.level === "Department").reduce((s, k) => s + k.weightage, 0),
    Individual: kpis.filter(k => k.level === "Individual").reduce((s, k) => s + k.weightage, 0),
  }), [kpis]);

  const submittableKpis = useMemo(() =>
    kpis.filter(k => k.level === "Individual" &&
      k.status === "Draft"),
  [kpis]);

  const allScoresDefined = useMemo(() =>
    submittableKpis.every(k => SCORE_KEYS.every(key => k.scoreDef[key].trim() !== "")),
  [submittableKpis]);

  const canSubmit = !isHistorical && totalWeightage === 100 && submittableKpis.length > 0 && allScoresDefined;

  const submitBlockReason = useMemo(() => {
    if (submittableKpis.length === 0) return "There are no ready Individual KPIs to submit. Edit a returned KPI first, if applicable.";
    if (totalWeightage < 100) return `Total KPI weightage is ${totalWeightage}% — it must equal 100% before submitting.`;
    if (totalWeightage > 100) return `Total KPI weightage is ${totalWeightage}% — reduce by ${totalWeightage - 100}% before submitting.`;
    if (!allScoresDefined) return "Some Individual KPIs have incomplete point criteria. Complete all Point 1–5 fields before submitting.";
    return "";
  }, [submittableKpis, totalWeightage, allScoresDefined]);

  // Resolved objects for open drawers
  const rawViewKpi = viewId ? (kpis.find(k => k.id === viewId) ?? null) : null;
  const viewKpi = rawViewKpi ? { ...rawViewKpi, overdue: isKpiOverdue(rawViewKpi) } : null;
  const historyKpi = historyId ? (kpis.find(k => k.id === historyId) ?? null) : null;
  const editKpi = editId ? (kpis.find(k => k.id === editId) ?? null) : null;

  const totalExcludingEdit = useMemo(() => {
    if (editIsCreate) return totalWeightage;
    return kpis.filter(k => k.id !== editId).reduce((s, k) => s + k.weightage, 0);
  }, [kpis, editId, editIsCreate, totalWeightage]);

  // Plan status
  const planStatus: ApprovalStatus = submitted || kpis.some(k => k.level === "Individual" && k.status === "Pending Approval")
    ? "Pending Approval"
    : kpis.some(k => k.level === "Individual" && k.status === "Returned")
    ? "Returned"
    : "Draft";

  // ── Actions ──
  function openView(id: string) { setViewId(id); }
  function closeView() { setViewId(null); }

  function openEdit(id: string) { if (isHistorical) return; setEditId(id); setEditIsCreate(false); setEditIsRevision(false); setViewId(null); }
  function openRevision(id: string) { if (isHistorical) return; setEditId(id); setEditIsCreate(false); setEditIsRevision(true); setViewId(null); }
  function openCreate() { if (isHistorical) return; setEditId(null); setEditIsCreate(true); setEditIsRevision(false); setViewId(null); }
  function closeEdit() { setEditId(null); setEditIsCreate(false); setEditIsRevision(false); }
  function deleteDraft(id: string) { if (!isHistorical) setKpis(prev => prev.filter(k => k.id !== id)); }

  function saveEdit(data: Omit<KpiRow, "id" | "level" | "status" | "returnReason">) {
    if (editIsCreate) {
      const newKpi: KpiRow = {
        id: `i${Date.now()}`, level: "Individual", employeeId: "amir", status: "Draft", ...data,
      };
      setKpis(prev => [...prev, newKpi]);
    } else if (editId) {
      setKpis(prev => prev.map(k =>
        k.id === editId
          ? editIsRevision
            ? { ...k, ...data, status: "Pending Approval", version: (k.version ?? 1) + 1, revisedOn: performanceStore.state.effectiveDate, revisedBy: "Amir Hassan", revisionReason: data.revisionReason, previousVersions: [...(k.previousVersions ?? []), { version: k.version ?? 1, perspective: k.perspective, kra: k.kra, name: k.name, target: k.target, weightage: k.weightage, scoreDef: k.scoreDef, revisedOn: k.revisedOn, revisedBy: k.revisedBy, revisionReason: k.revisionReason }] }
            : { ...k, ...data, status: k.status === "Returned" ? "Draft" : k.status }
          : k
      ));
    }
    closeEdit();
  }

  function handleSubmit() {
    setKpis(prev => prev.map(k =>
      k.level === "Individual" && (k.status === "Draft" || k.status === "Returned")
        ? { ...k, status: "Pending Approval" }
        : k
    ));
    setSubmitted(true);
    setShowDialog(false);
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>My KPI Plan</h1>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              {selectedPeriod} · Retail Sales Executive · Monthly Review Frequency
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="px-3 py-2 rounded-md text-[13px] bg-white border" style={{ borderColor: BORDER, color: TEXT }}>
              {performanceStore.periods.filter(period => period.status !== "Draft").map(period => (
                <option key={period.id} value={period.name}>{period.name}{period.status === "Closed" ? " — Closed" : ""}</option>
              ))}
            </select>
            <button onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
              style={{ color: TEXT, borderColor: BORDER }}>
              <BookOpen size={14} /> View Scoring Guide
            </button>
            {!isHistorical && <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}>
              <Plus size={14} /> Add Individual KPI
            </button>}
            {!isHistorical && <button
              onClick={() => canSubmit && setShowDialog(true)}
              disabled={!canSubmit}
              title={submitBlockReason || undefined}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
              style={{ backgroundColor: canSubmit ? TEAL : "#9CA3AF" }}>
              <Send size={14} /> Submit Individual KPIs for Approval
            </button>}
          </div>
        </div>

        {/* Submit block reason */}
        {isHistorical && <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px]" style={{ backgroundColor: "#F2F4F7", color: MUTED }}><Info size={13} />This is a closed Review Period. The KPI plan is historical and read-only.</div>}
        {isOpenPeriod && <div className="flex items-start gap-2 px-4 py-3 rounded-md text-[12px]" style={{ backgroundColor: "#FFFAEB", color: "#92400E", border: "1px solid #FDE68A" }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span><strong>Requirement gap:</strong> An approved revision is preserved and returned for Superior approval, but which KPI version applies to existing or future checkpoints remains TBC. The prototype will not propagate or recalculate assessments automatically.</span></div>}
        {!isHistorical && !submitted && submitBlockReason && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px]"
            style={{ backgroundColor: "#FEF9EC", color: AMBER }}>
            <AlertTriangle size={13} className="shrink-0" />
            {submitBlockReason}
          </div>
        )}

        {/* ── Employee Summary + Weightage ── */}
        <div className="grid grid-cols-5 gap-4">
          {/* Employee card */}
          <div className="bg-white rounded-lg p-5 col-span-3"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[16px] shrink-0"
                style={{ backgroundColor: BLUE }}>AH</div>
              <div className="flex-1">
                <p className="text-[15px] font-bold" style={{ color: TEXT }}>Amir Hassan</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1.5">
                  {([
                    ["Staff ID", "RS-1042"],
                    ["Role", "Retail Sales Executive"],
                    ["Department", "Retail Sales"],
                    ["Superior", "Sales Manager"],
                  ] as [string, string][]).map(([label, value]) => (
                    <p key={label} className="text-[12px]">
                      <span className="font-semibold" style={{ color: MUTED }}>{label}:</span>{" "}
                      <span style={{ color: TEXT }}>{value}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weightage card */}
          <div className="bg-white rounded-lg p-5 col-span-2"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2.5" style={{ color: MUTED }}>
              KPI Weightage Total
            </p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-[28px] font-bold leading-none" style={{
                color: totalWeightage === 100 ? TEAL : totalWeightage > 100 ? RED : AMBER,
              }}>{totalWeightage}%</span>
              <span className="text-[13px] mb-1" style={{ color: MUTED }}>/ 100%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all" style={{
                width: `${pct}%`,
                backgroundColor: totalWeightage === 100 ? TEAL : totalWeightage > 100 ? RED : AMBER,
              }} />
            </div>
            <div className="space-y-1.5">
              {(["Company", "Department", "Individual"] as KpiLevel[]).map(lvl => (
                <div key={lvl} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LEVEL_STYLE[lvl].color }} />
                    <span style={{ color: MUTED }}>{lvl}</span>
                  </span>
                  <span className="font-semibold" style={{ color: TEXT }}>{byLevelWeight[lvl]}%</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-2.5 pt-2.5 border-t" style={{
              borderColor: BORDER,
              color: totalWeightage === 100 ? TEAL : totalWeightage > 100 ? RED : AMBER,
            }}>
              {totalWeightage === 100
                ? "✓ Total weightage reached"
                : totalWeightage < 100
                ? `${100 - totalWeightage}% remaining`
                : `${totalWeightage - 100}% over limit`}
            </p>
          </div>
        </div>

        {/* Submission success banner */}
        {submitted && (
          <div className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "#ECFDF9", border: `1px solid #6EE7B7` }}>
            <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: TEAL }}>
                Your Individual KPIs and their point definitions have been submitted to your Superior for approval.
              </p>
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                Your Superior may approve the KPIs or return them to you for revision.
                Company and Department KPIs are pre-assigned and do not require approval.
              </p>
            </div>
          </div>
        )}

        {/* ── KPI Table ── */}
        <div className="bg-white rounded-lg overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>
              KPI Plan — {selectedPeriod}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
              Company and Department KPIs are assigned to you. Individual KPIs are proposed by you and require Superior approval.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                  {["KPI Level", "KPI Name", "Target", "Weightage", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.map((k, i) => {
                  const ls = LEVEL_STYLE[k.level];
                  const ss = STATUS_STYLE[k.status];
                  const canEdit = k.level === "Individual"
                    && !isHistorical && (k.status === "Draft" || k.status === "Returned");
                  const canRevise = k.level === "Individual" && !isHistorical && k.status === "Approved";
                  return (
                    <tr key={k.id} className="hover:bg-[#F8FAFC] transition-colors"
                      style={{ borderBottom: i < kpis.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td className="px-4 py-3">
                        <Pill label={`${k.level}-Level`} color={ls.color} bg={ls.bg} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium" style={{ color: TEXT }}>{k.name}</p>
                        {k.status === "Returned" && (
                          <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: RED }}>
                            <AlertTriangle size={9} /> Returned — revision required
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: TEXT }}>
                        {k.target}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: TEXT }}>
                        {k.weightage}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5"><Pill label={k.status} color={ss.color} bg={ss.bg} />{isKpiOverdue(k) && <Pill label="Overdue" color={RED} bg="#FEF3F2" />}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openView(k.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-gray-50"
                            style={{ color: MUTED, borderColor: BORDER }}>
                            <Eye size={11} /> View
                          </button>
                          {canEdit && (
                            <button onClick={() => openEdit(k.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors hover:bg-blue-50"
                              style={{ color: BLUE, borderColor: "#93B4E8" }}>
                              <Pencil size={11} /> Edit
                            </button>
                          )}
                          {k.level === "Individual" && !isHistorical && k.status === "Draft" && <button onClick={() => deleteDraft(k.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border" style={{ color: RED, borderColor: "#FECACA" }}><Trash2 size={11} /> Delete</button>}
                          {canRevise && <button onClick={() => openRevision(k.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border" style={{ color: BLUE, borderColor: "#93B4E8" }}><Pencil size={11} /> Revise KPI</button>}
                          {k.previousVersions?.length ? <button onClick={() => setHistoryId(k.id)} className="px-2.5 py-1.5 rounded text-[11px] font-medium border" style={{ color: BLUE, borderColor: "#93B4E8" }}>View Version History</button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t" style={{ borderColor: BORDER }}>
            <span className="text-[11px]" style={{ color: MUTED }}>
              {kpis.length} KPIs · Total weightage: {totalWeightage}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Drawers and Modals ── */}
      {viewKpi && (
        <ViewDrawer kpi={viewKpi} period={selectedPeriod} readOnly={isHistorical} onClose={closeView} onEdit={() => openEdit(viewKpi.id)} onRevise={() => openRevision(viewKpi.id)} />
      )}
      {(editId || editIsCreate) && (
        <EditDrawer
          editKpi={editIsCreate ? null : editKpi}
          isRevision={editIsRevision}
          totalExcludingThis={totalExcludingEdit}
          onClose={closeEdit}
          onSave={saveEdit}
        />
      )}
      {showSubmitDialog && (
        <SubmitDialog kpis={kpis} onClose={() => setShowDialog(false)} onSubmit={handleSubmit} />
      )}
      {showGuide && <ScoringGuideModal onClose={() => setShowGuide(false)} />}
      {historyKpi && <VersionHistoryModal kpi={historyKpi} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

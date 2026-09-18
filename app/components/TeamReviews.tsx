import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  X, ChevronDown, CheckCircle, RotateCcw, ArrowUp, ArrowDown, FileText,
  ArrowLeft,
} from "lucide-react";
import { generateCheckpoints } from "../performance/domain";
import { usePerformanceStore } from "../performance/store";

const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const RED    = "#D14343";
const GREEN  = "#059669";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const PURPLE = "#7C3AED";

const SCORE_META: Record<number, { label: string; color: string }> = {
  5: { label: "Exceptional",                  color: GREEN     },
  4: { label: "Exceeds Expectations",          color: TEAL      },
  3: { label: "Meets Expectations",            color: BLUE      },
  2: { label: "Partially Meets Expectations",  color: AMBER     },
  1: { label: "Needs Significant Improvement", color: "#E06B3A" },
};

const SCORE_KEYS = ["s5","s4","s3","s2","s1"] as const;

type KpiLevel          = "Company" | "Department" | "Individual";
type ReviewStatus      = "Pending Review" | "Pending Approval" | "Reviewed" | "Approved" | "Returned";
type ReviewType        = "Individual KPI Approval" | "KPI Assessment" | "Attitude Evaluation";
type KpiApprovalStatus = "Pending" | "Approved" | "Returned";

interface ScoreDef { s5: string; s4: string; s3: string; s2: string; s1: string; }
interface KpiRow {
  id: string; level: KpiLevel; perspective: string; kra: string;
  name: string; target: string; weightage: number; scoreDef: ScoreDef;
  isRevision?: boolean; revisionReason?: string; previousTarget?: string; previousWeightage?: number;
}
interface ReviewItem {
  id: string; employee: string; initials: string; role: string; dept: string;
  type: ReviewType; checkpoint: string; due: string; dueTs: number; status: ReviewStatus; overdue?: boolean;
}
interface EmpAssessment {
  score: number; comment: string; evidence?: { name: string; size: string };
}

const LEVEL_STYLE: Record<KpiLevel, { color: string; bg: string }> = {
  Company:    { color: BLUE,   bg: "#EEF3FC" },
  Department: { color: PURPLE, bg: "#F5F3FF" },
  Individual: { color: TEAL,   bg: "#ECFDF9" },
};

const STATUS_STYLE: Record<ReviewStatus, { color: string; bg: string }> = {
  "Pending Review":        { color: AMBER, bg: "#FEF9EC" },
  "Reviewed":              { color: TEAL,  bg: "#ECFDF9" },
  "Approved":              { color: TEAL,  bg: "#ECFDF9" },
  "Returned":              { color: RED,   bg: "#FEF3F2" },
  "Pending Approval":      { color: AMBER, bg: "#FEF9EC" },
};

const STATUS_ORDER: Record<ReviewStatus, number> = {
  "Pending Approval": 0, "Pending Review": 1, "Returned": 2, "Approved": 3, "Reviewed": 4,
};

// ── Individual KPIs for Amir's approval ──────────────────────────────────────
const IND_KPIS: KpiRow[] = [
  {
    id: "i1", level: "Individual", perspective: "Customer", kra: "Customer Growth",
    name: "New Customer Acquisition", target: "10 new customers/month", weightage: 15, isRevision: true, previousTarget: "8 new customers/month", previousWeightage: 15, revisionReason: "Updated acquisition target to reflect the revised sales plan.",
    scoreDef: {
      s5: "Acquires 13 or more new customers per month",
      s4: "Acquires 11–12 new customers per month",
      s3: "Acquires 10 new customers per month",
      s2: "Acquires 8–9 new customers per month",
      s1: "Acquires 5–7 new customers per month",
    },
  },
  {
    id: "i2", level: "Individual", perspective: "Customer", kra: "Revenue per Customer",
    name: "Cross-Sell Rate", target: "≥ 20%", weightage: 10,
    scoreDef: {
      s5: "Cross-sell rate 25% or above",
      s4: "Cross-sell rate 22%–24%",
      s3: "Cross-sell rate 20%–21%",
      s2: "Cross-sell rate 15%–19%",
      s1: "Cross-sell rate 10%–14%",
    },
  },
];

// ── All KPIs for KPI Assessment ───────────────────────────────────────────────
const ALL_KPIS: KpiRow[] = [
  {
    id: "c1", level: "Company", perspective: "Financial", kra: "Revenue Management",
    name: "Company Revenue Growth", target: "≥ 8% YoY", weightage: 10,
    scoreDef: { s5: "Revenue grows 10% or more above target YoY", s4: "Revenue grows 8%–9.9% YoY", s3: "Revenue grows 5%–7.9% YoY", s2: "Revenue grows 2%–4.9% YoY", s1: "Revenue grows 0%–1.9% YoY" },
  },
  {
    id: "c2", level: "Company", perspective: "Customer", kra: "Customer Experience",
    name: "Customer Satisfaction Index", target: "≥ 85%", weightage: 10,
    scoreDef: { s5: "CSI score 95% or above", s4: "CSI score 90%–94%", s3: "CSI score 85%–89%", s2: "CSI score 75%–84%", s1: "CSI score 60%–74%" },
  },
  {
    id: "c3", level: "Company", perspective: "Internal Process", kra: "Operational Excellence",
    name: "Branch Operations Score", target: "≥ 90%", weightage: 10,
    scoreDef: { s5: "Operations score 98% or above", s4: "Operations score 93%–97%", s3: "Operations score 90%–92%", s2: "Operations score 80%–89%", s1: "Operations score 70%–79%" },
  },
  {
    id: "d1", level: "Department", perspective: "Financial", kra: "Sales Performance",
    name: "Monthly Sales Achievement", target: "RM 80,000/month", weightage: 30,
    scoreDef: { s5: "Achieves 110% or more of monthly sales target", s4: "Achieves 100%–109% of monthly sales target", s3: "Achieves 90%–99% of monthly sales target", s2: "Achieves 75%–89% of monthly sales target", s1: "Achieves 50%–74% of monthly sales target" },
  },
  {
    id: "d2", level: "Department", perspective: "Customer", kra: "Product Distribution",
    name: "Product Coverage", target: "≥ 80% product range", weightage: 15,
    scoreDef: { s5: "Covers 95% or more of the product range", s4: "Covers 90%–94% of the product range", s3: "Covers 80%–89% of the product range", s2: "Covers 70%–79% of the product range", s1: "Covers 50%–69% of the product range" },
  },
  {
    id: "i1", level: "Individual", perspective: "Customer", kra: "Customer Growth",
    name: "New Customer Acquisition", target: "10 new customers/month", weightage: 15,
    scoreDef: { s5: "Acquires 13 or more new customers per month", s4: "Acquires 11–12 new customers per month", s3: "Acquires 10 new customers per month", s2: "Acquires 8–9 new customers per month", s1: "Acquires 5–7 new customers per month" },
  },
  {
    id: "i2", level: "Individual", perspective: "Customer", kra: "Revenue per Customer",
    name: "Cross-Sell Rate", target: "≥ 20%", weightage: 10,
    scoreDef: { s5: "Cross-sell rate 25% or above", s4: "Cross-sell rate 22%–24%", s3: "Cross-sell rate 20%–21%", s2: "Cross-sell rate 15%–19%", s1: "Cross-sell rate 10%–14%" },
  },
];

// ── Amir's January 2027 self-assessment ───────────────────────────────────────
const AMIR_JAN: Record<string, EmpAssessment> = {
  c1: { score: 4, comment: "Strong start to the year. Company revenue tracking ahead of target." },
  c2: { score: 3, comment: "" },
  c3: { score: 4, comment: "" },
  d1: { score: 3, comment: "Achieved RM 73,200 against the RM 80,000 target. Narrowly missed due to the public holiday period.", evidence: { name: "sales-report-jan-2027.pdf", size: "2.4 MB" } },
  d2: { score: 4, comment: "" },
  i1: { score: 3, comment: "" },
  i2: { score: 2, comment: "Cross-sell at 16% for January. Will focus on increasing product pairing conversations in February." },
};

// ── Attitude criteria ─────────────────────────────────────────────────────────
const ATTITUDE_ROWS = [
  { id: "a1", criterion: "Integrity & Professionalism", desc: "Demonstrates honesty, ethical conduct and professional standards at all times.",                               selfScore: 4 },
  { id: "a2", criterion: "Customer Focus",               desc: "Consistently prioritises customer needs, resolves issues promptly and delivers quality service.",              selfScore: 3 },
  { id: "a3", criterion: "Sales Initiative & Drive",     desc: "Proactively identifies sales opportunities, takes ownership of targets and drives results.",                   selfScore: 4 },
  { id: "a4", criterion: "Teamwork & Collaboration",     desc: "Supports colleagues, shares product knowledge and contributes to a positive team environment.",               selfScore: 3 },
  { id: "a5", criterion: "Product Knowledge",            desc: "Demonstrates up-to-date knowledge of products, promotions and services to effectively advise customers.",     selfScore: 4 },
  { id: "a6", criterion: "Adaptability",                 desc: "Responds positively to change, learns quickly and adjusts approach when needed.",                              selfScore: 3 },
];

// ── Queue ─────────────────────────────────────────────────────────────────────
const INIT_QUEUE: ReviewItem[] = [
  { id: "r1", employee: "Amir Hassan",  initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales", type: "Individual KPI Approval", checkpoint: "Jan 2027",    due: "14 Jan 2027", dueTs: 20270114, status: "Pending Approval", overdue: true },
  { id: "r2", employee: "Amir Hassan",  initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales", type: "KPI Assessment",          checkpoint: "Jan 2027",    due: "25 Jan 2027", dueTs: 20270125, status: "Pending Review"        },
  { id: "r3", employee: "Sarah Chen",   initials: "SC", role: "Retail Sales Executive", dept: "Retail Sales", type: "Individual KPI Approval", checkpoint: "Jan 2027",    due: "14 Jan 2027", dueTs: 20270114, status: "Approved"              },
  { id: "r4", employee: "Amir Hassan",  initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales", type: "Attitude Evaluation",     checkpoint: "Annual 2027", due: "20 Dec 2027", dueTs: 20271220, status: "Pending Review", overdue: true },
  { id: "r5", employee: "Rizal Hamdan", initials: "RH", role: "Retail Sales Executive", dept: "Retail Sales", type: "KPI Assessment",          checkpoint: "Jan 2027",    due: "25 Jan 2027", dueTs: 20270125, status: "Pending Review", overdue: true },
  { id: "r6", employee: "Sarah Chen",   initials: "SC", role: "Retail Sales Executive", dept: "Retail Sales", type: "KPI Assessment",          checkpoint: "Jan 2027",    due: "25 Jan 2027", dueTs: 20270125, status: "Reviewed"             },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreSelector({ value, onChange, readOnly }: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => {
          const sel = value === n;
          const m = SCORE_META[n];
          return (
            <button key={n} onClick={() => !readOnly && onChange?.(n)} title={m.label}
              className="w-8 h-8 rounded text-[12px] font-bold transition-colors shrink-0"
              style={{ backgroundColor: sel ? m.color : "#F2F4F7", color: sel ? "white" : MUTED, cursor: readOnly ? "default" : "pointer" }}>
              {n}
            </button>
          );
        })}
      </div>
      {value !== null && value !== undefined && SCORE_META[value] && (
        <p className="text-[10px] mt-0.5" style={{ color: SCORE_META[value].color }}>{SCORE_META[value].label}</p>
      )}
    </div>
  );
}

function ScoringDefModal({ kpi, helperText, onClose }: {
  kpi: KpiRow; helperText: string; onClose: () => void;
}) {
  const ls = LEVEL_STYLE[kpi.level];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>KPI-Specific Scoring Criteria</h3>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{helperText}</p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0"><X size={16} style={{ color: MUTED }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: BORDER }}>
            <span className="text-[13px] font-bold" style={{ color: TEXT }}>{kpi.name}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: ls.color, backgroundColor: ls.bg }}>{kpi.level}-Level</span>
          </div>
          <div className="space-y-3">
            {SCORE_KEYS.map((key, i) => {
              const score = 5 - i;
              const m = SCORE_META[score];
              return (
                <div key={key} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: m.color }}>{score}</div>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: m.color }}>{m.label}</p>
                    <p className="text-[12px]" style={{ color: TEXT }}>{kpi.scoreDef[key]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function EvidenceModal({ file, onClose }: { file: { name: string; size: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>Attached Evidence</h3>
          <button onClick={onClose}><X size={16} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <FileText size={28} style={{ color: BLUE }} className="shrink-0" />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{file.name}</p>
              <p className="text-[12px]" style={{ color: MUTED }}>{file.size}</p>
            </div>
          </div>
          <p className="text-[12px] p-3 rounded-md" style={{ color: MUTED, backgroundColor: "#F8FAFC" }}>
            File preview is not available in this prototype. In the live application, the file would open in a viewer here.
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ReturnDialog({ label, desc, onClose, onConfirm }: {
  label: string; desc: string; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>Return for Revision</h3>
          <button onClick={onClose}><X size={16} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{label}</p>
          <p className="text-[12px]" style={{ color: MUTED }}>{desc}</p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>
              Return Reason <span style={{ color: RED }}>*</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Please clarify how this KPI will be measured and revise the scoring criteria."
              rows={4} autoFocus
              className="w-full px-3 py-2 rounded-md text-[12px] outline-none resize-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: reason.trim() ? RED : "#9CA3AF" }}>
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionDialog({ item, summaryRows, onClose, onConfirm }: {
  item: ReviewItem; summaryRows: [string, string][]; onClose: () => void; onConfirm: () => void;
}) {
  const isApproval = item.type === "Individual KPI Approval";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>
            {isApproval ? "Complete Approval Review?" : "Complete Review?"}
          </h3>
          <button onClick={onClose}><X size={16} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            {isApproval
              ? `Completing the approval review for ${item.employee}. Approved KPIs will proceed to the assessment phase.`
              : `This will finalise your review of ${item.employee}'s submission for the ${item.checkpoint} checkpoint.`}
          </p>
          <div className="p-3 rounded-md space-y-1.5" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            {summaryRows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-[12px]">
                <span style={{ color: MUTED }}>{label}</span>
                <span className="font-semibold" style={{ color: TEXT }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-[13px] font-semibold text-white" style={{ backgroundColor: TEAL }}>
            {isApproval ? "Complete Approval Review" : "Complete Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TeamReviews() {
  const navigate = useNavigate();
  const performanceStore = usePerformanceStore();
  const [searchParams] = useSearchParams();
  const returnToTeamPerformance = searchParams.get("from") === "team-performance";
  const returnPeriod = searchParams.get("period");
  const [staticQueue, setStaticQueue]   = useState<ReviewItem[]>(() => INIT_QUEUE.filter(item => !["r1", "r2", "r4"].includes(item.id)));
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEmp, setFilterEmp]       = useState("All");
  const [sortField, setSortField]       = useState<"due" | "status" | null>(null);
  const [sortAsc, setSortAsc]           = useState(true);
  const [drawerItem, setDrawerItem]     = useState<ReviewItem | null>(null);
  const [draftSaved, setDraftSaved]     = useState(false);

  // Per-KPI approval state: [reviewId][kpiId]
  const [kpiApprovals, setKpiApprovals] = useState<Record<string, Record<string, { status: KpiApprovalStatus; returnReason?: string }>>>({});

  // KPI Assessment manager scores/comments: [reviewId][kpiId]
  const [mgrScores, setMgrScores]     = useState<Record<string, Record<string, number | null>>>({});
  const [mgrComments, setMgrComments] = useState<Record<string, Record<string, string>>>({});

  // Attitude manager scores/comments: [reviewId][criterionId]
  const [attScores, setAttScores]     = useState<Record<string, Record<string, number | null>>>({});
  const [attComments, setAttComments] = useState<Record<string, Record<string, string>>>({});

  // Return reasons stored when manager returns an assessment
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});

  // Dialogs/modals
  const [returnDialog, setReturnDialog]       = useState<{ label: string; desc: string; onConfirm: (r: string) => void } | null>(null);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<ReviewItem | null>(null);
  const [scoringDefKpi, setScoringDefKpi]     = useState<KpiRow | null>(null);
  const [evidenceFile, setEvidenceFile]       = useState<{ name: string; size: string } | null>(null);

  const period2027 = performanceStore.getPeriod("2027");
  const monthlyCheckpoints = period2027 ? generateCheckpoints(period2027, "Monthly") : [];
  const sharedAssessmentItems: ReviewItem[] = Object.values(performanceStore.state.kpiAssessments)
    .filter(record => record.periodId === "2027" && record.employeeId === "amir" && record.status !== "Draft")
    .map(record => {
      const checkpoint = monthlyCheckpoints.find(item => item.id === record.checkpointId);
      const dueIso = checkpoint?.superiorDeadline ?? "2027-12-31";
      return {
        id: `assessment:${record.id}`, employee: "Amir Hassan", initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales",
        type: "KPI Assessment" as const, checkpoint: record.checkpointLabel, due: formatDate(dueIso),
        dueTs: Number(dueIso.replaceAll("-", "")), status: record.status === "Reviewed" ? "Reviewed" : "Pending Review",
        overdue: Boolean(record.completedLate || (record.status !== "Reviewed" && performanceStore.state.effectiveDate > dueIso)),
      };
    });
  const sharedAttitudeItems: ReviewItem[] = Object.values(performanceStore.state.attitudeAssessments)
    .filter(record => record.periodId === "2027" && record.employeeId === "amir" && record.status !== "Draft")
    .map(record => {
      const dueIso = period2027?.deadlines.attitudeSuperior ?? "2027-12-27";
      return {
        id: `attitude:${record.id}`, employee: "Amir Hassan", initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales",
        type: "Attitude Evaluation" as const, checkpoint: "Annual 2027", due: formatDate(dueIso),
        dueTs: Number(dueIso.replaceAll("-", "")), status: record.status === "Reviewed" ? "Reviewed" : "Pending Review",
        overdue: Boolean(record.completedLate || (record.status !== "Reviewed" && performanceStore.state.effectiveDate > dueIso)),
      };
    });
  const sharedPlanItems: ReviewItem[] = Object.entries(performanceStore.state.employeeKpiPlansByPeriod).flatMap(([periodName, plan]) => {
    const individual = plan.filter((kpi: any) => kpi.level === "Individual");
    if (!individual.length || individual.every((kpi: any) => kpi.status === "Draft")) return [];
    const status: ReviewStatus = individual.some((kpi: any) => kpi.status === "Pending Approval")
      ? "Pending Approval" : individual.some((kpi: any) => kpi.status === "Returned") ? "Returned" : "Approved";
    return [{
      id: `kpi-plan:${periodName}`, employee: "Amir Hassan", initials: "AH", role: "Retail Sales Executive", dept: "Retail Sales",
      type: "Individual KPI Approval" as const, checkpoint: periodName.split(" ")[0], due: "1 Jan 2027", dueTs: 20270101,
      status, overdue: status === "Pending Approval" && performanceStore.state.effectiveDate > "2027-01-01",
    }];
  });
  const queue = [...staticQueue, ...sharedAssessmentItems, ...sharedAttitudeItems, ...sharedPlanItems];
  const employees = useMemo(() => Array.from(new Set(queue.map(r => r.employee))), [queue]);

  const filtered = useMemo(() => {
    let rows = queue.filter(r =>
      (filterType === "All" || r.type === filterType) &&
      (filterStatus === "All" || r.status === filterStatus) &&
      (filterEmp === "All" || r.employee === filterEmp)
    );
    if (sortField === "due") {
      rows = [...rows].sort((a, b) => sortAsc ? a.dueTs - b.dueTs : b.dueTs - a.dueTs);
    } else if (sortField === "status") {
      rows = [...rows].sort((a, b) =>
        sortAsc ? STATUS_ORDER[a.status] - STATUS_ORDER[b.status] : STATUS_ORDER[b.status] - STATUS_ORDER[a.status]
      );
    }
    return rows;
  }, [queue, filterType, filterStatus, filterEmp, sortField, sortAsc]);

  function toggleSort(field: "due" | "status") {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  }

  function updateStatus(id: string, status: ReviewStatus) {
    if (id.startsWith("assessment:")) {
      const recordId = id.slice("assessment:".length);
      const record = performanceStore.state.kpiAssessments[recordId];
      if (record) performanceStore.upsertKpiAssessment({ ...record, status: status === "Reviewed" ? "Reviewed" : record.status });
      return;
    }
    if (id.startsWith("attitude:")) {
      const recordId = id.slice("attitude:".length);
      const record = performanceStore.state.attitudeAssessments[recordId];
      if (record) performanceStore.upsertAttitudeAssessment({ ...record, status: status === "Reviewed" ? "Reviewed" : record.status });
      return;
    }
    setStaticQueue(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  // ── Derived state for the active drawer ──
  const rid         = drawerItem?.id ?? "";
  const isCompleted = drawerItem?.status === "Reviewed" || drawerItem?.status === "Approved";
  const isReturned  = drawerItem?.status === "Returned";
  const isReadOnly  = isCompleted || isReturned;

  // Individual KPI Approval
  const activePlanName = rid.startsWith("kpi-plan:") ? rid.slice("kpi-plan:".length) : undefined;
  const activePlan = activePlanName ? performanceStore.state.employeeKpiPlansByPeriod[activePlanName] ?? [] : [];
  const approvals = Object.fromEntries(IND_KPIS.map(kpi => {
    const local = kpiApprovals[rid]?.[kpi.id];
    const shared = activePlan.find((item: any) => item.id === kpi.id);
    const sharedStatus = shared?.status === "Approved" ? "Approved" : shared?.status === "Returned" ? "Returned" : "Pending";
    return [kpi.id, local ?? { status: sharedStatus, returnReason: shared?.returnReason }];
  })) as Record<string, { status: KpiApprovalStatus; returnReason?: string }>;
  const approvCount = IND_KPIS.filter(k => approvals[k.id]?.status === "Approved").length;
  const retCount    = IND_KPIS.filter(k => approvals[k.id]?.status === "Returned").length;
  const allReviewed = IND_KPIS.every(k => approvals[k.id]?.status && approvals[k.id]?.status !== "Pending");

  function setKpiApproval(kpiId: string, status: KpiApprovalStatus, reason?: string) {
    setKpiApprovals(prev => ({ ...prev, [rid]: { ...(prev[rid] ?? {}), [kpiId]: { status, returnReason: reason } } }));
  }

  // KPI Assessment
  const activeAssessment = rid.startsWith("assessment:")
    ? performanceStore.state.kpiAssessments[rid.slice("assessment:".length)]
    : undefined;
  const scores      = activeAssessment?.superiorPoints ?? mgrScores[rid] ?? {};
  const comments    = activeAssessment?.superiorComments ?? mgrComments[rid] ?? {};
  const allScored   = ALL_KPIS.every(k => (scores[k.id] ?? null) !== null);
  const commentCount = Object.values(comments).filter(c => c.trim()).length;

  function setScore(kpiId: string, v: number) {
    if (activeAssessment) {
      performanceStore.upsertKpiAssessment({ ...activeAssessment, superiorPoints: { ...activeAssessment.superiorPoints, [kpiId]: v } });
      return;
    }
    setMgrScores(prev => ({ ...prev, [rid]: { ...(prev[rid] ?? {}), [kpiId]: v } }));
  }
  function setComment(kpiId: string, v: string) {
    if (activeAssessment) {
      performanceStore.upsertKpiAssessment({ ...activeAssessment, superiorComments: { ...activeAssessment.superiorComments, [kpiId]: v } });
      return;
    }
    setMgrComments(prev => ({ ...prev, [rid]: { ...(prev[rid] ?? {}), [kpiId]: v } }));
  }

  // Attitude
  const activeAttitude = rid.startsWith("attitude:")
    ? performanceStore.state.attitudeAssessments[rid.slice("attitude:".length)]
    : undefined;
  const aScores     = activeAttitude?.superiorPoints ?? attScores[rid] ?? {};
  const aComments   = activeAttitude?.superiorComments ?? attComments[rid] ?? {};
  const allAttScored = ATTITUDE_ROWS.every(c => (aScores[c.id] ?? null) !== null);

  function setAttScore(id: string, v: number) {
    if (activeAttitude) {
      performanceStore.upsertAttitudeAssessment({ ...activeAttitude, superiorPoints: { ...activeAttitude.superiorPoints, [id]: v } });
      return;
    }
    setAttScores(prev => ({ ...prev, [rid]: { ...(prev[rid] ?? {}), [id]: v } }));
  }
  function setAttComment(id: string, v: string) {
    if (activeAttitude) {
      performanceStore.upsertAttitudeAssessment({ ...activeAttitude, superiorComments: { ...activeAttitude.superiorComments, [id]: v } });
      return;
    }
    setAttComments(prev => ({ ...prev, [rid]: { ...(prev[rid] ?? {}), [id]: v } }));
  }

  function handleSaveDraft() {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }

  function handleCompleteReview() {
    if (!drawerItem) return;
    if (activePlanName) {
      const updated = activePlan.map((kpi: any) => {
        if (kpi.level !== "Individual") return kpi;
        const decision = approvals[kpi.id];
        if (!decision || decision.status === "Pending") return kpi;
        return { ...kpi, status: decision.status, returnReason: decision.returnReason };
      });
      performanceStore.setEmployeeKpiPlansByPeriod({ ...performanceStore.state.employeeKpiPlansByPeriod, [activePlanName]: updated });
    } else if (activeAssessment) {
      const deadline = monthlyCheckpoints.find(item => item.id === activeAssessment.checkpointId)?.superiorDeadline;
      performanceStore.upsertKpiAssessment({
        ...activeAssessment, status: "Reviewed", reviewedAt: performanceStore.state.effectiveDate,
        completedLate: activeAssessment.completedLate || Boolean(deadline && performanceStore.state.effectiveDate > deadline),
      });
    } else if (activeAttitude) {
      const deadline = period2027?.deadlines.attitudeSuperior;
      performanceStore.upsertAttitudeAssessment({
        ...activeAttitude, status: "Reviewed", reviewedAt: performanceStore.state.effectiveDate,
        completedLate: activeAttitude.completedLate || Boolean(deadline && performanceStore.state.effectiveDate > deadline),
      });
    } else {
      updateStatus(drawerItem.id, drawerItem.type === "Individual KPI Approval" ? "Approved" : "Reviewed");
    }
    setCompletionDialog(null);
    setDrawerItem(null);
  }

  function handleReturn(reason: string) {
    if (!drawerItem) return;
    setReturnReasons(prev => ({ ...prev, [drawerItem.id]: reason }));
    updateStatus(drawerItem.id, "Returned");
    setReturnDialog(null);
    setDrawerItem(null);
  }

  function actionLabel(status: ReviewStatus): string {
    if (status === "Reviewed" || status === "Approved") return "View Result";
    if (status === "Returned") return "View";
    return "Review";
  }

  // ── Completion dialog summary rows ──
  function buildSummaryRows(item: ReviewItem): [string, string][] {
    if (item.type === "Individual KPI Approval") return [
      ["Employee", item.employee],
      ["Review Checkpoint", item.checkpoint],
      ["KPIs Approved", `${approvCount}`],
      ["KPIs Returned for Revision", `${retCount}`],
      ["Total Individual Weightage", `${IND_KPIS.reduce((s, k) => s + k.weightage, 0)}%`],
    ];
    if (item.type === "KPI Assessment") return [
      ["Employee", item.employee],
      ["Review Checkpoint", item.checkpoint],
      ["KPIs Reviewed", `${ALL_KPIS.length}`],
      ["Manager Comments", `${commentCount}`],
    ];
    return [
      ["Employee", item.employee],
      ["Evaluation Form", "Sales"],
      ["Criteria Reviewed", `${ATTITUDE_ROWS.length}`],
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div>
          {returnToTeamPerformance && (
            <button onClick={() => navigate(`/dashboard${returnPeriod ? `?period=${encodeURIComponent(returnPeriod)}` : ""}`)}
              className="flex items-center gap-1.5 text-[12px] font-semibold mb-3" style={{ color: BLUE }}>
              <ArrowLeft size={14} /> Back to Team Performance
            </button>
          )}
          <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Team Review Workspace</h1>
          <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>Superior view · 2027 Annual KPI Review · Retail Sales Department</p>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>
            Review Individual KPI proposals, KPI Self-Assessments and Attitude Evaluations submitted by your team.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-lg px-5 py-4 flex items-center gap-3 flex-wrap"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <span className="text-[12px] font-semibold" style={{ color: MUTED }}>Filter by</span>
          {[
            { label: "Type",     value: filterType,   set: setFilterType,   opts: ["Individual KPI Approval","KPI Assessment","Attitude Evaluation"] },
            { label: "Status",   value: filterStatus, set: setFilterStatus, opts: ["Pending Approval","Pending Review","Returned","Approved","Reviewed"]   },
            { label: "Employee", value: filterEmp,    set: setFilterEmp,    opts: employees                                                         },
          ].map(f => (
            <div key={f.label} className="relative">
              <select value={f.value} onChange={e => f.set(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-md text-[12px] outline-none"
                style={{ border: `1px solid ${BORDER}`, color: TEXT }}>
                <option value="All">{f.label}: All</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
            </div>
          ))}
          <button onClick={() => { setFilterType("All"); setFilterStatus("All"); setFilterEmp("All"); }}
            className="text-[12px]" style={{ color: BLUE }}>Clear</button>
          <span className="ml-auto text-[12px]" style={{ color: MUTED }}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-lg overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {[
                  { label: "Employee",          sf: null       },
                  { label: "Review Type",        sf: null       },
                  { label: "Review Checkpoint",  sf: null       },
                  { label: "Due Date",           sf: "due"      },
                  { label: "Status",             sf: "status"   },
                  { label: "Action",             sf: null       },
                ].map(col => (
                  <th key={col.label}
                    onClick={() => col.sf && toggleSort(col.sf as "due" | "status")}
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${col.sf ? "cursor-pointer select-none hover:bg-gray-50" : ""}`}
                    style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sf && (
                        sortField === col.sf
                          ? (sortAsc ? <ArrowUp size={10} style={{ color: BLUE }} /> : <ArrowDown size={10} style={{ color: BLUE }} />)
                          : <span style={{ color: MUTED, opacity: 0.35, fontSize: 11 }}>↕</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ss = STATUS_STYLE[r.status];
                const isLast = i === filtered.length - 1;
                return (
                  <tr key={r.id} onClick={() => setDrawerItem(r)}
                    style={{ borderBottom: isLast ? "none" : `1px solid ${BORDER}` }}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: BLUE }}>
                          {r.initials}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: TEXT }}>{r.employee}</p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{r.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: TEXT }}>{r.type}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: MUTED }}>{r.checkpoint}</td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: MUTED }}>{r.due}</td>
                    <td className="px-4 py-3">
                      <span className="flex gap-1.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: ss.color, backgroundColor: ss.bg }}>{r.status}</span>{r.overdue && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: RED, backgroundColor: "#FEF3F2" }}>Overdue</span>}</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDrawerItem(r)}
                        className="px-3 py-1.5 rounded-md text-[12px] font-semibold whitespace-nowrap"
                        style={{ color: (r.status === "Reviewed" || r.status === "Approved") ? MUTED : BLUE, backgroundColor: (r.status === "Reviewed" || r.status === "Approved") ? "#F2F4F7" : "#EEF3FC" }}>
                        {actionLabel(r.status)}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13px]" style={{ color: MUTED }}>
                    No items match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          REVIEW DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
      {drawerItem && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDrawerItem(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "clamp(720px, 65vw, 1000px)", borderLeft: `1px solid ${BORDER}` }}>

            {/* ── Sticky Header ── */}
            <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: STATUS_STYLE[drawerItem.status].color, backgroundColor: STATUS_STYLE[drawerItem.status].bg }}>
                      {drawerItem.status}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold leading-tight" style={{ color: TEXT }}>{drawerItem.type}</h3>
                  <p className="text-[13px] mt-0.5">
                    <span style={{ color: TEXT }}>{drawerItem.employee}</span>
                    <span style={{ color: MUTED }}> · {drawerItem.role}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[12px] flex-wrap" style={{ color: MUTED }}>
                    <span>{drawerItem.checkpoint} Review Checkpoint</span>
                    <span>·</span>
                    <span>Due: {drawerItem.due}</span>
                  </div>
                </div>
                <button onClick={() => setDrawerItem(null)} className="shrink-0 p-1 rounded hover:bg-gray-50 mt-0.5">
                  <X size={18} style={{ color: MUTED }} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── INDIVIDUAL KPI APPROVAL ── */}
              {drawerItem.type === "Individual KPI Approval" && (
                <>
                  {!isReadOnly && (
                    <p className="text-[12px] mb-5 p-3 rounded-md" style={{ color: MUTED, backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                      Review the KPI details and Point 1–5 achievement criteria before approving or returning each KPI.
                    </p>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-5" style={{ backgroundColor: "#ECFDF9", border: `1px solid #6EE7B7` }}>
                      <CheckCircle size={14} style={{ color: TEAL }} />
                      <p className="text-[12px] font-semibold" style={{ color: TEAL }}>Individual KPI Approval Approved</p>
                      <span className="text-[12px]" style={{ color: MUTED }}>· {approvCount} approved · {retCount} returned</span>
                    </div>
                  )}
                  {isReturned && (
                    <div className="p-3 rounded-lg mb-5" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw size={13} style={{ color: RED }} />
                        <p className="text-[12px] font-semibold" style={{ color: RED }}>Waiting for Employee Resubmission</p>
                      </div>
                      <p className="text-[12px]" style={{ color: TEXT }}>This approval was returned. Waiting for the employee to revise and resubmit.</p>
                    </div>
                  )}

                  <div className="space-y-5 pb-6">
                    {IND_KPIS.map(kpi => {
                      const ls = LEVEL_STYLE[kpi.level];
                      const approval = approvals[kpi.id];
                      const kpiStatus = approval?.status ?? "Pending";
                      return (
                        <div key={kpi.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                          {/* KPI card header */}
                          <div className="px-5 py-3 flex items-start justify-between gap-3"
                            style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-bold" style={{ color: TEXT }}>{kpi.name}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ color: ls.color, backgroundColor: ls.bg }}>{kpi.level}-Level</span>
                              </div>
                              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{kpi.perspective} · {kpi.kra}</p>
                              {kpi.isRevision && <div className="mt-2 p-2 rounded-md text-[11px]" style={{ color: BLUE, backgroundColor: "#EEF3FC" }}><b>KPI Revision · Version 2</b><br />Revision Reason: {kpi.revisionReason}<br /><span style={{ color: MUTED }}>Target: {kpi.previousTarget} → {kpi.target} · Weightage: {kpi.previousWeightage}% → {kpi.weightage}%</span></div>}
                            </div>
                            {kpiStatus !== "Pending" && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={kpiStatus === "Approved" ? { color: TEAL, backgroundColor: "#ECFDF9" } : { color: RED, backgroundColor: "#FEF3F2" }}>
                                {kpiStatus === "Approved" ? "Approved" : "Returned for Revision"}
                              </span>
                            )}
                          </div>

                          {/* Details grid */}
                          <div className="px-5 py-3 grid grid-cols-3 gap-4 text-[12px]"
                            style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Target</p>
                              <p style={{ color: TEXT }}>{kpi.target}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Weightage</p>
                              <p style={{ color: TEXT }}>{kpi.weightage}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Review Period</p>
                              <p style={{ color: TEXT }}>2027 Annual KPI Review</p>
                            </div>
                          </div>

                          {/* Scoring Definition */}
                          <div className="px-5 py-4"
                            style={{ borderBottom: (!isReadOnly && kpiStatus === "Pending") ? `1px solid ${BORDER}` : "none" }}>
                            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: MUTED }}>
                              Scoring Definition (Point 1–5)
                            </p>
                            <div className="space-y-2">
                              {SCORE_KEYS.map((key, i) => {
                                const score = 5 - i;
                                const m = SCORE_META[score];
                                return (
                                  <div key={key} className="flex gap-2.5 items-start">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                                      style={{ backgroundColor: m.color }}>{score}</div>
                                    <div>
                                      <span className="text-[11px] font-semibold" style={{ color: m.color }}>{m.label}: </span>
                                      <span className="text-[11px]" style={{ color: TEXT }}>{kpi.scoreDef[key]}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] mt-3 italic" style={{ color: MUTED }}>
                              These criteria will be used by both the employee and Superior during KPI assessment.
                            </p>
                            {kpi.isRevision && <button onClick={() => setShowRevisionHistory(true)} className="text-[11px] font-semibold mt-2" style={{ color: BLUE }}>View Version History</button>}
                            {kpiStatus === "Returned" && approval?.returnReason && (
                              <div className="mt-3 p-3 rounded-md" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: RED }}>Return Reason</p>
                                <p className="text-[12px]" style={{ color: TEXT }}>{approval.returnReason}</p>
                              </div>
                            )}
                          </div>

                          {/* Per-KPI actions */}
                          {!isReadOnly && kpiStatus === "Pending" && (
                            <div className="px-5 py-3 flex gap-2" style={{ backgroundColor: "#FAFBFC" }}>
                              <button
                                onClick={() => setReturnDialog({
                                  label: `Return "${kpi.name}" for Revision`,
                                  desc: "The employee will be able to edit and resubmit this KPI. Provide a clear reason so they know what to correct.",
                                  onConfirm: reason => { setKpiApproval(kpi.id, "Returned", reason); setReturnDialog(null); },
                                })}
                                className="px-3 py-1.5 rounded-md text-[12px] font-medium border"
                                style={{ color: RED, borderColor: "#FECACA" }}>
                                Return for Revision
                              </button>
                              <button onClick={() => setKpiApproval(kpi.id, "Approved")}
                                className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-white"
                                style={{ backgroundColor: TEAL }}>
                                Approve KPI
                              </button>
                            </div>
                          )}
                          {!isReadOnly && kpiStatus !== "Pending" && (
                            <div className="px-5 py-2" style={{ backgroundColor: "#FAFBFC" }}>
                              <button onClick={() => setKpiApproval(kpi.id, "Pending")}
                                className="text-[11px] underline underline-offset-2" style={{ color: MUTED }}>
                                Undo
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── KPI ASSESSMENT ── */}
              {drawerItem.type === "KPI Assessment" && (
                <>
                  {isReturned && (
                    <div className="p-4 rounded-lg mb-5" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw size={13} style={{ color: RED }} />
                        <p className="text-[13px] font-semibold" style={{ color: RED }}>Waiting for Employee Resubmission</p>
                      </div>
                      <p className="text-[12px] mt-1" style={{ color: TEXT }}>
                        <strong>Reason: </strong>
                        {returnReasons[rid] ?? "Please provide additional supporting information for the Cross-Sell Rate KPI. The current comment does not sufficiently explain the score difference."}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: MUTED }}>Returned: 8 Jan 2027</p>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-5"
                      style={{ backgroundColor: "#ECFDF9", border: `1px solid #6EE7B7` }}>
                      <CheckCircle size={14} style={{ color: TEAL }} />
                      <p className="text-[12px] font-semibold" style={{ color: TEAL }}>
                        Reviewed · {ALL_KPIS.length} KPIs assessed
                      </p>
                    </div>
                  )}
                  <div className="space-y-4 pb-6">
                    {ALL_KPIS.map(kpi => {
                      const ls = LEVEL_STYLE[kpi.level];
                      const storedSelfPoint = activeAssessment?.selfPoints[kpi.id];
                      const fallbackSelf = AMIR_JAN[kpi.id];
                      const emp = {
                        score: storedSelfPoint ?? fallbackSelf?.score ?? 1,
                        comment: activeAssessment?.selfComments[kpi.id] ?? fallbackSelf?.comment ?? "",
                        evidence: activeAssessment?.evidence[kpi.id] ?? fallbackSelf?.evidence,
                      };
                      const mgrScore   = scores[kpi.id]   ?? null;
                      const mgrComment = comments[kpi.id] ?? "";
                      const scoreDiff  = mgrScore !== null && Math.abs(mgrScore - emp.score) >= 2;
                      return (
                        <div key={kpi.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                          {/* Card header */}
                          <div className="px-5 py-3 flex items-center gap-2 flex-wrap"
                            style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ color: ls.color, backgroundColor: ls.bg }}>{kpi.level}</span>
                            <span className="text-[13px] font-semibold" style={{ color: TEXT }}>{kpi.name}</span>
                            <span className="ml-auto text-[11px]" style={{ color: MUTED }}>Target: {kpi.target}</span>
                          </div>

                          {/* Card body: 2-column */}
                          <div className="px-5 py-4 grid grid-cols-2 gap-6">
                            {/* Employee Self-Assessment */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
                                Employee Self-Assessment
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded flex items-center justify-center text-[13px] font-bold text-white"
                                  style={{ backgroundColor: SCORE_META[emp.score].color }}>{emp.score}</div>
                                <span className="text-[12px]" style={{ color: SCORE_META[emp.score].color }}>
                                  {SCORE_META[emp.score].label}
                                </span>
                              </div>
                              {emp.comment
                                ? <p className="text-[12px] mb-2" style={{ color: TEXT }}>{emp.comment}</p>
                                : <p className="text-[12px] mb-2 italic" style={{ color: MUTED }}>No comment</p>
                              }
                              {emp.evidence && (
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-2"
                                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                                  <FileText size={12} style={{ color: BLUE }} className="shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium truncate" style={{ color: TEXT }}>{emp.evidence.name}</p>
                                    <p className="text-[10px]" style={{ color: MUTED }}>{emp.evidence.size}</p>
                                  </div>
                                  <button onClick={() => setEvidenceFile(emp.evidence!)}
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                                    style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>
                                    View
                                  </button>
                                </div>
                              )}
                              <button onClick={() => setScoringDefKpi(kpi)}
                                className="text-[11px] font-medium hover:underline underline-offset-2"
                                style={{ color: BLUE }}>
                                View Scoring Definition
                              </button>
                            </div>

                            {/* Superior Assessment */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
                                Superior Assessment Point
                              </p>
                              {isReadOnly ? (
                                mgrScore !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded flex items-center justify-center text-[13px] font-bold text-white"
                                      style={{ backgroundColor: SCORE_META[mgrScore].color }}>{mgrScore}</div>
                                    <span className="text-[12px]" style={{ color: SCORE_META[mgrScore].color }}>
                                      {SCORE_META[mgrScore].label}
                                    </span>
                                  </div>
                                ) : <span className="text-[12px]" style={{ color: MUTED }}>—</span>
                              ) : (
                                <ScoreSelector value={mgrScore} onChange={v => setScore(kpi.id, v)} />
                              )}
                              {!isReadOnly && scoreDiff && (
                                <p className="text-[10px] mt-1.5" style={{ color: AMBER }}>
                                  Consider adding a comment to explain the score difference.
                                </p>
                              )}
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>
                                  Superior Comment
                                </p>
                                {isReadOnly ? (
                                  mgrComment
                                    ? <p className="text-[12px]" style={{ color: TEXT }}>{mgrComment}</p>
                                    : <p className="text-[12px] italic" style={{ color: MUTED }}>No comment</p>
                                ) : (
                                  <textarea value={mgrComment} onChange={e => setComment(kpi.id, e.target.value)}
                                    placeholder="Optional Superior comment…" rows={2}
                                    className="w-full px-2 py-1.5 rounded text-[12px] outline-none resize-none"
                                    style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── ATTITUDE EVALUATION ── */}
              {drawerItem.type === "Attitude Evaluation" && (
                <>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>Sales Evaluation Form</span>
                    <span className="text-[12px]" style={{ color: MUTED }}>2027 Annual KPI Review · Annual Assessment</span>
                  </div>

                  {isReturned && (
                    <div className="p-4 rounded-lg mb-5" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FECACA` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw size={13} style={{ color: RED }} />
                        <p className="text-[13px] font-semibold" style={{ color: RED }}>Waiting for Employee Resubmission</p>
                      </div>
                      <p className="text-[12px] mt-1" style={{ color: TEXT }}>
                        <strong>Reason: </strong>
                        {returnReasons[rid] ?? "Please review and revise the Customer Focus score with more specific examples from the review period."}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: MUTED }}>Returned: 15 Jan 2027</p>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-5"
                      style={{ backgroundColor: "#ECFDF9", border: `1px solid #6EE7B7` }}>
                      <CheckCircle size={14} style={{ color: TEAL }} />
                      <p className="text-[12px] font-semibold" style={{ color: TEAL }}>Attitude Evaluation Reviewed</p>
                    </div>
                  )}

                  <div className="space-y-3 pb-6">
                    {ATTITUDE_ROWS.map(c => {
                      const mgrScore   = aScores[c.id]   ?? null;
                      const mgrComment = aComments[c.id] ?? "";
                      const selfScore = activeAttitude?.selfPoints[c.id] ?? c.selfScore;
                      return (
                        <div key={c.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                          <div className="px-5 py-3" style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                            <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{c.criterion}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{c.desc}</p>
                          </div>
                          <div className="px-5 py-4 grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Self-Assessment</p>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded flex items-center justify-center text-[12px] font-bold text-white"
                                  style={{ backgroundColor: SCORE_META[selfScore].color }}>{selfScore}</div>
                                <span className="text-[12px]" style={{ color: SCORE_META[selfScore].color }}>
                                  {SCORE_META[selfScore].label}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Superior Assessment</p>
                              {isReadOnly ? (
                                mgrScore !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded flex items-center justify-center text-[12px] font-bold text-white"
                                      style={{ backgroundColor: SCORE_META[mgrScore].color }}>{mgrScore}</div>
                                    <span className="text-[12px]" style={{ color: SCORE_META[mgrScore].color }}>
                                      {SCORE_META[mgrScore].label}
                                    </span>
                                  </div>
                                ) : <span className="text-[12px]" style={{ color: MUTED }}>—</span>
                              ) : (
                                <>
                                  <ScoreSelector value={mgrScore} onChange={v => setAttScore(c.id, v)} />
                                  <textarea value={mgrComment} onChange={e => setAttComment(c.id, e.target.value)}
                                    placeholder="Optional comment…" rows={2}
                                    className="mt-2 w-full px-2 py-1.5 rounded text-[12px] outline-none resize-none"
                                    style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
                                </>
                              )}
                              {isReadOnly && mgrComment && (
                                <p className="text-[12px] mt-1" style={{ color: TEXT }}>{mgrComment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── Sticky Footer ── */}
            {(isCompleted || isReturned) ? (
              <div className="px-6 py-4 border-t shrink-0 flex justify-end" style={{ borderColor: BORDER }}>
                <button onClick={() => setDrawerItem(null)}
                  className="px-4 py-2 rounded-md text-[13px] font-medium border"
                  style={{ color: TEXT, borderColor: BORDER }}>
                  Close
                </button>
              </div>
            ) : drawerItem.type === "Individual KPI Approval" ? (
              <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between" style={{ borderColor: BORDER }}>
                <p className="text-[12px]" style={{ color: MUTED }}>
                  {approvCount + retCount} of {IND_KPIS.length} KPIs reviewed
                </p>
                <button onClick={() => setCompletionDialog(drawerItem)} disabled={!allReviewed}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                  style={{ backgroundColor: allReviewed ? TEAL : "#9CA3AF" }}>
                  <CheckCircle size={14} /> Complete Approval Review
                </button>
              </div>
            ) : drawerItem.type === "KPI Assessment" ? (
              <div className="px-6 py-4 border-t shrink-0 flex items-center gap-2" style={{ borderColor: BORDER }}>
                <button onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-md text-[13px] font-medium border"
                  style={{ color: TEXT, borderColor: BORDER }}>
                  {draftSaved ? "Saved ✓" : "Save Draft"}
                </button>
                <button onClick={() => setCompletionDialog(drawerItem)} disabled={!allScored}
                  className="flex items-center gap-1.5 ml-auto px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                  style={{ backgroundColor: allScored ? TEAL : "#9CA3AF" }}>
                  <CheckCircle size={14} /> Submit Review
                </button>
              </div>
            ) : drawerItem.type === "Attitude Evaluation" ? (
              <div className="px-6 py-4 border-t shrink-0 flex items-center gap-2" style={{ borderColor: BORDER }}>
                <button onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-md text-[13px] font-medium border"
                  style={{ color: TEXT, borderColor: BORDER }}>
                  {draftSaved ? "Saved ✓" : "Save Draft"}
                </button>
                <button onClick={() => setCompletionDialog(drawerItem)} disabled={!allAttScored}
                  className="flex items-center gap-1.5 ml-auto px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                  style={{ backgroundColor: allAttScored ? TEAL : "#9CA3AF" }}>
                  <CheckCircle size={14} /> Submit Review
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {returnDialog && (
        <ReturnDialog
          label={returnDialog.label}
          desc={returnDialog.desc}
          onClose={() => setReturnDialog(null)}
          onConfirm={returnDialog.onConfirm}
        />
      )}
      {showRevisionHistory && <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,.4)" }}><div className="bg-white w-[540px] rounded-xl shadow-2xl overflow-hidden"><div className="flex justify-between p-5 border-b" style={{ borderColor: BORDER }}><div><h3 className="font-bold">KPI Version History</h3><p className="text-[11px]" style={{ color: MUTED }}>New Customer Acquisition</p></div><button onClick={() => setShowRevisionHistory(false)}><X size={18} /></button></div><div className="p-5 text-[12px] space-y-3"><p><b>Version 2 — Current KPI Revision</b></p><p>Revision Reason: Updated acquisition target to reflect the revised sales plan.</p><div className="grid grid-cols-3 gap-2 p-3 rounded" style={{ backgroundColor: "#F8FAFC" }}><b>Field</b><b>Version 1</b><b>Version 2</b><span>Target</span><span>8 new customers/month</span><span style={{ color: BLUE, fontWeight: 600 }}>10 new customers/month</span><span>Weightage</span><span>15%</span><span>15%</span></div></div><div className="flex justify-end p-4 border-t" style={{ borderColor: BORDER }}><button onClick={() => setShowRevisionHistory(false)} className="px-4 py-2 border rounded">Close</button></div></div></div>}

      {completionDialog && (
        <CompletionDialog
          item={completionDialog}
          summaryRows={buildSummaryRows(completionDialog)}
          onClose={() => setCompletionDialog(null)}
          onConfirm={handleCompleteReview}
        />
      )}

      {scoringDefKpi && (
        <ScoringDefModal
          kpi={scoringDefKpi}
          helperText="Use these criteria when selecting the Superior Assessment Point."
          onClose={() => setScoringDefKpi(null)}
        />
      )}

      {evidenceFile && (
        <EvidenceModal
          file={evidenceFile}
          onClose={() => setEvidenceFile(null)}
        />
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

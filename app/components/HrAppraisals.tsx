import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { X, ChevronDown, ChevronRight, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import {
  EMPLOYEES, PERIOD_OPTIONS, LIVE_PERIOD, AppStatus, Decision,
  PeriodAppraisal, resolvePeriodData, writeLive,
} from "./appraisalData";

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

const EMP_META: Record<string, { department: string; manager: string }> = {
  amir:  { department: "Retail Sales", manager: "Lee Seng Wah" },
  sarah: { department: "Retail Sales", manager: "Lee Seng Wah" },
  rizal: { department: "Retail Sales", manager: "Ahmad Faiz" },
  nurul: { department: "Retail Sales", manager: "Ahmad Faiz" },
};

function DistBar(props: any) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  return <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} rx={3} ry={3} />;
}

const DIST_DATA = [
  { range: "< 60",  count: 2,  fill: RED    },
  { range: "60–69", count: 6,  fill: AMBER  },
  { range: "70–79", count: 18, fill: BLUE   },
  { range: "80–89", count: 20, fill: TEAL   },
  { range: "≥ 90",  count: 4,  fill: GREEN  },
];

function getAiInsight(firstName: string, kpi: number, _att: number, final: number) {
  return {
    Strengths: `Consistent improvement in performance scores. Strong attitude and customer-facing skills are evident in evaluation data.`,
    "Areas for Development": kpi < 75
      ? `KPI score (${kpi.toFixed(1)}) remains below the 80-point threshold. Coaching on key commercial metrics is recommended.`
      : `Overall performance is solid. Continued focus on cross-sell and consultative selling will sustain the upward trend.`,
    Trend: `Steady trajectory across all dimensions. If maintained, ${firstName} is on track for continued improvement in the next review cycle.`,
    Policy: `A Final Score above 78.0 may qualify for merit increment consideration under example TBM guidelines. Confirm eligibility with current HR policy before communicating to the employee.`,
  };
}

// Historical details drawer — same layout as Final Appraisal Recommendation screen
function HistoryDrawer({ period, data, onClose }: {
  period: string; data: PeriodAppraisal; onClose: () => void;
}) {
  const ss = STATUS_STYLE[data.status];
  const isOverride = data.status === "Override and Approve";

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 bg-white flex flex-col overflow-hidden"
        style={{ width: "clamp(380px, 38vw, 520px)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Historical Record</p>
            <h3 className="text-[15px] font-bold mt-0.5" style={{ color: TEXT }}>{period}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={17} style={{ color: MUTED }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Scores */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: MUTED }}>Performance Scores</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "KPI Score",      value: data.kpiScore,   color: BLUE   },
                { label: "Attitude Score", value: data.attScore,   color: TEAL   },
                { label: "Final Score",    value: data.hrFinalScore ?? data.finalScore, color: PURPLE },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}
                >
                  <p className="text-[10px]" style={{ color: MUTED }}>{s.label}</p>
                  <p className="text-[20px] font-bold leading-snug" style={{ color: s.color }}>{s.value.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Recommendation */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Manager Recommendation</p>
            <div
              className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold mb-3"
              style={{ backgroundColor: "#EEF3FC", color: BLUE }}
            >
              {data.managerDecision ?? "—"}
            </div>
            {data.justification && (
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{data.justification}</p>
            )}
          </div>

          {/* Appraisal Status */}
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-semibold" style={{ color: MUTED }}>Appraisal Status:</p>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ color: ss.color, backgroundColor: ss.bg }}
            >
              {data.status}
            </span>
          </div>

          {/* HR Decision */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: MUTED }}>HR Decision</p>

            {isOverride && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Original Manager Recommendation</p>
                <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{data.managerDecision}</p>
              </div>
            )}

            <div className="mb-3">
              <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>HR Final Decision</p>
              <div
                className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold"
                style={{ backgroundColor: "#ECFDF5", color: GREEN }}
              >
                {data.hrDecision ?? "—"}
              </div>
            </div>

            {isOverride && data.hrOverrideReason && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: RED }}>HR Override Reason</p>
                <p
                  className="text-[12px] leading-relaxed p-3 rounded-lg"
                  style={{ color: TEXT, backgroundColor: "#FEF3F2", border: `1px solid #FECDCA` }}
                >
                  {data.hrOverrideReason}
                </p>
              </div>
            )}

            {data.hrRemarks && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>HR Finalisation Remarks</p>
                <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{data.hrRemarks}</p>
              </div>
            )}

            {data.finalDate && (
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                Finalised on: <span className="font-semibold" style={{ color: TEXT }}>{data.finalDate}</span>
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// Approve modal
function ApproveModal({ empName, decision, finalScore, onConfirm, onClose }: {
  empName: string; decision: Decision | null; finalScore: number;
  onConfirm: (remarks: string) => void; onClose: () => void;
}) {
  const [remarks, setRemarks] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Approve Appraisal</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            You are approving <strong>{empName}</strong>'s appraisal with the Manager's recommendation of{" "}
            <strong>{decision ?? "—"}</strong> and a Final Score of <strong>{finalScore.toFixed(1)}</strong>.
          </p>
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>HR Remarks (optional)</label>
            <textarea
              value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
              placeholder="Add any remarks to the appraisal record…"
              className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            />
          </div>
          <p className="text-[12px] p-3 rounded-md" style={{ backgroundColor: "#F8FAFC", color: MUTED }}>
            <strong>Important:</strong> Approving this record confirms the appraisal outcome. It does not automatically execute any promotion or salary increment — separate HR processes apply.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={() => onConfirm(remarks)} className="px-4 py-2 rounded-md text-[13px] font-semibold text-white" style={{ backgroundColor: GREEN }}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// Override and Approve modal
function OverrideModal({ empName, decision, finalScore, onConfirm, onClose }: {
  empName: string; decision: Decision | null; finalScore: number;
  onConfirm: (hrDecision: Decision, hrFinalScore: number, reason: string, remarks: string) => void;
  onClose: () => void;
}) {
  const [overrideScore,    setOverrideScore]    = useState(finalScore.toFixed(1));
  const [overrideDecision, setOverrideDecision] = useState<Decision>(decision ?? "Salary Increment");
  const [overrideReason,   setOverrideReason]   = useState("");
  const [remarks,          setRemarks]          = useState("");
  const canSubmit = overrideReason.trim().length > 10;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[520px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Override and Approve</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            The original Manager recommendation (<strong>{decision ?? "—"}</strong>, score <strong>{finalScore.toFixed(1)}</strong>) will be preserved in the record alongside the HR override.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>Override Final Score</label>
              <input
                type="number" step="0.1" min={0} max={100}
                value={overrideScore} onChange={e => setOverrideScore(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                style={{ border: `1px solid ${BORDER}`, color: TEXT }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>Final Decision</label>
              <div className="relative">
                <select
                  value={overrideDecision}
                  onChange={e => setOverrideDecision(e.target.value as Decision)}
                  className="w-full appearance-none px-3 pr-8 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }}
                >
                  {(["Promotion", "Salary Increment", "Both", "No Recommendation"] as Decision[]).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>Override Reason *</label>
            <textarea
              value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={3}
              placeholder="Provide a clear reason for the override (min. 10 characters)…"
              className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>HR Remarks (optional)</label>
            <textarea
              value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              placeholder="Additional remarks for the record…"
              className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button
            onClick={() => canSubmit && onConfirm(overrideDecision, parseFloat(overrideScore), overrideReason, remarks)}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: canSubmit ? AMBER : "#9CA3AF", cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            Override and Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// Return for Revision modal
function ReturnModal({ empName, onConfirm, onClose }: {
  empName: string; onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length > 10;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Return for Revision</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            The appraisal will be returned to the manager for revision. <strong>{empName}</strong>'s status will be updated to "Return for Revision".
          </p>
          <div>
            <label className="block text-[12px] font-semibold mb-1" style={{ color: TEXT }}>Reason for Return *</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="Specify what the manager needs to correct or resubmit (min. 10 characters)…"
              className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
              style={{ border: `1px solid #FCA5A5`, color: TEXT, backgroundColor: "#FEF3F2" }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button
            onClick={() => canSubmit && onConfirm(reason)}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: canSubmit ? RED : "#9CA3AF", cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            Return for Revision
          </button>
        </div>
      </div>
    </div>
  );
}

export function HrAppraisals() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const empId = id ?? "rizal";
  const emp = EMPLOYEES[empId];
  const selectedPeriod = searchParams.get("period") ?? LIVE_PERIOD;
  const isLivePeriod = selectedPeriod === LIVE_PERIOD;

  const [refreshKey, setRefreshKey] = useState(0);
  const pd = useMemo(() => resolvePeriodData(empId, selectedPeriod), [empId, selectedPeriod, refreshKey]);

  const [showApproveModal,  setShowApproveModal]  = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showReturnModal,   setShowReturnModal]   = useState(false);
  const [showDistNote,      setShowDistNote]      = useState(true);
  const [prevExpanded,      setPrevExpanded]      = useState(false);
  const [histDrawer,        setHistDrawer]        = useState<{ period: string; data: PeriodAppraisal } | null>(null);

  useEffect(() => {
    setShowApproveModal(false);
    setShowOverrideModal(false);
    setShowReturnModal(false);
    setPrevExpanded(false);
    setHistDrawer(null);
  }, [empId, selectedPeriod]);

  if (!emp || !pd) {
    return <div className="p-6"><p style={{ color: MUTED }}>Employee not found.</p></div>;
  }

  const meta = EMP_META[empId] ?? { department: "—", manager: "—" };
  const status = pd.status;
  const isActionable = isLivePeriod && status === "Pending Review";
  const displayedFinalScore = pd.hrFinalScore ?? pd.finalScore;
  const ss = STATUS_STYLE[status];

  function patch(updates: Partial<PeriodAppraisal>) {
    writeLive(empId, updates);
    setRefreshKey(k => k + 1);
  }

  function handleApprove(remarks: string) {
    patch({
      status: "Approve",
      hrDecision: pd!.managerDecision,
      hrRemarks: remarks,
      finalDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
    setShowApproveModal(false);
  }

  function handleOverride(hrDecision: Decision, hrFinalScore: number, reason: string, remarks: string) {
    patch({
      status: "Override and Approve",
      hrDecision,
      hrFinalScore,
      hrOverrideReason: reason,
      hrRemarks: remarks,
      finalDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
    setShowOverrideModal(false);
  }

  function handleReturn(reason: string) {
    patch({ status: "Return for Revision", hrReturnReason: reason });
    setShowReturnModal(false);
  }

  const selectedYear = parseInt(selectedPeriod.split(" ")[0]);
  const prevAppraisals = PERIOD_OPTIONS.filter(p =>
    parseInt(p.split(" ")[0]) < selectedYear && emp.periods[p]
  ).map(p => ({ period: p, data: emp.periods[p] }));

  const aiInsight = getAiInsight(emp.name.split(" ")[0], pd.kpiScore, pd.attScore, displayedFinalScore);

  const bandLabel = displayedFinalScore >= 90 ? "≥ 90"
    : displayedFinalScore >= 80 ? "80–89"
    : displayedFinalScore >= 70 ? "70–79"
    : displayedFinalScore >= 60 ? "60–69" : "< 60";

  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>HR Appraisal Review</h1>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: ss.color, backgroundColor: ss.bg }}>
                {status}
              </span>
            </div>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              HR / Super Admin view · {emp.name} ({emp.staffId}) · {selectedPeriod}
              {pd.submittedDate ? ` · Submitted ${pd.submittedDate}` : ""}
            </p>
          </div>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={e => navigate(`/performance/hr-appraisals/${empId}?period=${encodeURIComponent(e.target.value)}`)}
              className="appearance-none pl-3 pr-8 py-2 rounded-md text-[13px] font-semibold outline-none bg-white"
              style={{ border: `1px solid ${BORDER}`, color: TEXT }}
            >
              {PERIOD_OPTIONS.filter(p => emp.periods[p] || p === LIVE_PERIOD).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          </div>
        </div>

        {/* Status banners */}
        {status === "Approve" && (
          <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#ECFDF5", border: `1px solid ${GREEN}` }}>
            <CheckCircle size={18} style={{ color: GREEN }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-bold" style={{ color: GREEN }}>Appraisal Approved</p>
              <p className="text-[13px] mt-0.5" style={{ color: TEXT }}>
                HR decision: <strong>{pd.hrDecision ?? "—"}</strong>. Final Score: <strong>{displayedFinalScore.toFixed(1)}</strong>.
                {pd.finalDate ? ` Finalised ${pd.finalDate}.` : ""}
              </p>
              {pd.hrRemarks && <p className="text-[12px] mt-1.5" style={{ color: TEXT }}>{pd.hrRemarks}</p>}
              {!isLivePeriod && <p className="text-[11px] mt-2" style={{ color: MUTED }}>Historical record — read only.</p>}
            </div>
          </div>
        )}

        {status === "Override and Approve" && (
          <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#FFFBEB", border: `1px solid #FDE68A` }}>
            <AlertCircle size={18} style={{ color: AMBER }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-bold" style={{ color: AMBER }}>HR Override Applied</p>
              <p className="text-[13px] mt-0.5" style={{ color: TEXT }}>
                Final Score adjusted to <strong>{displayedFinalScore.toFixed(1)}</strong>. HR decision: <strong>{pd.hrDecision ?? "—"}</strong>.
                {pd.finalDate ? ` Finalised ${pd.finalDate}.` : ""}
              </p>
              {pd.hrOverrideReason && (
                <p className="text-[12px] mt-1.5" style={{ color: TEXT }}><strong>Override reason:</strong> {pd.hrOverrideReason}</p>
              )}
              {pd.hrRemarks && <p className="text-[12px] mt-1" style={{ color: TEXT }}>{pd.hrRemarks}</p>}
              <p className="text-[12px] mt-1.5" style={{ color: MUTED }}>
                Manager's original recommendation (<strong>{pd.managerDecision ?? "—"}</strong>, score <strong>{pd.finalScore.toFixed(1)}</strong>) is preserved in the record.
              </p>
            </div>
          </div>
        )}

        {status === "Return for Revision" && (
          <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#FEF3F2", border: `1px solid #FCA5A5` }}>
            <RotateCcw size={18} style={{ color: RED }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-bold" style={{ color: RED }}>Returned for Revision</p>
              <p className="text-[13px] mt-0.5" style={{ color: TEXT }}>This appraisal has been returned to the manager for revision.</p>
              {pd.hrReturnReason && (
                <p className="text-[12px] mt-2 p-3 rounded-md" style={{ backgroundColor: "white", color: TEXT, border: `1px solid #FCA5A5` }}>
                  <strong>Reason:</strong> {pd.hrReturnReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Employee Info + Score Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[16px]" style={{ backgroundColor: BLUE }}>
                {emp.initials}
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ color: TEXT }}>{emp.name}</p>
                <p className="text-[12px]" style={{ color: MUTED }}>{emp.staffId} · {emp.role}</p>
                <p className="text-[12px]" style={{ color: MUTED }}>{meta.department} Department</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Manager",                  value: meta.manager },
                { label: "Annual KPI Review Period",  value: selectedPeriod },
                { label: "Mgr Recommendation",        value: pd.managerDecision ?? "—" },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-[12px]">
                  <span style={{ color: MUTED }}>{f.label}</span>
                  <span className="font-medium" style={{ color: TEXT }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button
                onClick={() => navigate(`/staff-profile/${empId}`)}
                className="text-[12px] font-semibold hover:opacity-70 transition-opacity"
                style={{ color: BLUE }}
              >
                View Full Performance Profile →
              </button>
            </div>
          </div>

          {[
            { label: "KPI Performance Score", value: pd.kpiScore, color: BLUE, bg: "#EEF3FC" },
            { label: "Attitude Score",         value: pd.attScore, color: TEAL, bg: "#ECFDF9" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>{c.label}</p>
              <p className="text-[32px] font-bold" style={{ color: c.color }}>
                {c.value.toFixed(1)}<span className="text-[14px] font-normal" style={{ color: MUTED }}>/100</span>
              </p>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Final Score */}
        <div className="bg-white rounded-lg p-5 flex items-center gap-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Final Appraisal Score</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-[36px] font-bold" style={{ color: PURPLE }}>{displayedFinalScore.toFixed(1)}</span>
              <span className="text-[14px] mb-1.5" style={{ color: MUTED }}>/100</span>
              {status === "Override and Approve" && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1.5" style={{ color: AMBER, backgroundColor: "#FEF9EC" }}>HR Override</span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: MUTED }}>50% KPI + 50% Attitude — Example formula, to be confirmed</p>
          </div>
          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(displayedFinalScore, 100)}%`, backgroundColor: PURPLE }} />
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <h2 className="text-[14px] font-bold mb-1" style={{ color: TEXT }}>5-Year Performance Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={emp.trendData} margin={{ top: 8, right: 24, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <ReTooltip contentStyle={{ fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="kpi"      name="KPI"      stroke={BLUE}   strokeWidth={2}   dot={{ r: 3, fill: BLUE   }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="attitude" name="Attitude" stroke={TEAL}   strokeWidth={2}   dot={{ r: 3, fill: TEAL   }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="final"    name="Final"    stroke={PURPLE} strokeWidth={2.5} dot={{ r: 4, fill: PURPLE }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-5 mt-2">
            {[{ label: "KPI", color: BLUE }, { label: "Attitude", color: TEAL }, { label: "Final", color: PURPLE }].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px]" style={{ color: MUTED }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Previous Appraisals — table design matching Screen 5 ── */}
        {prevAppraisals.length > 0 && (
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
          >
            <button
              onClick={() => setPrevExpanded(e => !e)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2">
                {prevExpanded
                  ? <ChevronDown  size={15} style={{ color: MUTED }} />
                  : <ChevronRight size={15} style={{ color: MUTED }} />
                }
                <p className="text-[13px] font-semibold" style={{ color: TEXT }}>Previous Appraisals</p>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#F3F4F6", color: MUTED }}
                >
                  {prevAppraisals.length}
                </span>
              </div>
              <p className="text-[12px]" style={{ color: MUTED }}>
                {prevExpanded ? "Collapse" : "View historical appraisal records"}
              </p>
            </button>

            {prevExpanded && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC" }}>
                      {["Review Period", "Final Score", "Manager Recommendation", "Appraisal Status", "HR Final Decision", "Action"].map(h => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                          style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prevAppraisals.map(({ period, data: d }, i) => {
                      const pss = STATUS_STYLE[d.status];
                      return (
                        <tr
                          key={period}
                          className="hover:bg-[#F8FAFC] transition-colors"
                          style={{ borderBottom: i < prevAppraisals.length - 1 ? `1px solid ${BORDER}` : "none" }}
                        >
                          <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>
                            {period.split(" ")[0]}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold" style={{ color: PURPLE }}>
                              {(d.hrFinalScore ?? d.finalScore).toFixed(1)}
                            </span>
                            <span className="ml-1" style={{ color: MUTED }}>/100</span>
                          </td>
                          <td className="px-4 py-3" style={{ color: TEXT }}>{d.managerDecision ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                              style={{ color: pss.color, backgroundColor: pss.bg }}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: GREEN }}>
                            {d.hrDecision ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setHistDrawer({ period, data: d })}
                              className="text-[11px] font-semibold hover:underline"
                              style={{ color: BLUE }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Manager Comments + AI Insight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT }}>Manager Comments</h2>
            {pd.justification ? (
              <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{pd.justification}</p>
            ) : (
              <p className="text-[13px]" style={{ color: MUTED }}>No manager comments submitted.</p>
            )}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
              {pd.managerDecision ? (
                <>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: BLUE, backgroundColor: "#EEF3FC" }}>
                    {pd.managerDecision}
                  </span>
                  <span className="text-[11px] ml-2" style={{ color: MUTED }}>Manager Recommendation</span>
                </>
              ) : (
                <span className="text-[11px]" style={{ color: MUTED }}>No recommendation submitted.</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
            <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT }}>AI Appraisal Insight</h2>
            <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: 220 }}>
              {Object.entries(aiInsight).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[11px] font-bold" style={{ color: PURPLE }}>{key}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Org Score Distribution */}
        <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Organisation Score Distribution</h2>
              <p className="text-[12px]" style={{ color: MUTED }}>Provisional — dashboard content to be validated</p>
            </div>
            {showDistNote && (
              <button onClick={() => setShowDistNote(false)} className="text-[11px]" style={{ color: MUTED }}>Dismiss</button>
            )}
          </div>
          {showDistNote && (
            <div className="mb-4 px-3 py-2 rounded-md text-[12px]" style={{ backgroundColor: "#FEF9EC", color: AMBER }}>
              This chart is for contextual reference only. Data shown is provisional mock data for prototype validation.
            </div>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DIST_DATA} margin={{ top: 4, right: 16, bottom: 0, left: -20 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <ReTooltip contentStyle={{ fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
              <Bar dataKey="count" name="Staff Count" shape={(p: any) => <DistBar {...p} fill={DIST_DATA.find(d => d.range === p.range)?.fill ?? BLUE} />} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[11px] text-center" style={{ color: MUTED }}>
            {emp.name.split(" ")[0]}'s score ({displayedFinalScore.toFixed(1)}) falls in the {bandLabel} band
          </p>
        </div>

        {/* ── HR Appraisal Decision ── */}
        {isLivePeriod && (
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>HR Appraisal Decision</h2>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                {isActionable
                  ? "Review the evidence above, then select an action to finalise this appraisal."
                  : "This appraisal has already been processed for the current review period."}
              </p>
            </div>

            <div className="p-5 grid grid-cols-3 gap-4">

              {/* Approve */}
              <div
                className="rounded-xl flex flex-col overflow-hidden"
                style={{
                  border: `1px solid ${isActionable ? "#6EE7B7" : BORDER}`,
                  opacity: isActionable ? 1 : 0.55,
                }}
              >
                <div className="px-5 pt-5 pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
                      <CheckCircle size={16} style={{ color: GREEN }} />
                    </div>
                    <p className="text-[14px] font-bold" style={{ color: TEXT }}>Approve</p>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: MUTED }}>
                    Accept the Manager Recommendation as submitted. The appraisal will be finalised with the manager's decision and score.
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: GREEN }}>Action: Approve</p>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => isActionable && setShowApproveModal(true)}
                    disabled={!isActionable}
                    className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      backgroundColor: isActionable ? GREEN : "#E5E7EB",
                      color: isActionable ? "white" : "#9CA3AF",
                      cursor: isActionable ? "pointer" : "not-allowed",
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>

              {/* Override and Approve */}
              <div
                className="rounded-xl flex flex-col overflow-hidden"
                style={{
                  border: `1px solid ${isActionable ? "#FDE68A" : BORDER}`,
                  opacity: isActionable ? 1 : 0.55,
                }}
              >
                <div className="px-5 pt-5 pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
                      <AlertCircle size={16} style={{ color: AMBER }} />
                    </div>
                    <p className="text-[14px] font-bold" style={{ color: TEXT }}>Override and Approve</p>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: MUTED }}>
                    Select a different HR Final Decision and/or adjust the final score. The manager's original recommendation is preserved in the record.
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: AMBER }}>Requires Override Reason · Action: Override and Approve</p>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => isActionable && setShowOverrideModal(true)}
                    disabled={!isActionable}
                    className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      backgroundColor: isActionable ? AMBER : "#E5E7EB",
                      color: isActionable ? "white" : "#9CA3AF",
                      cursor: isActionable ? "pointer" : "not-allowed",
                    }}
                  >
                    Override and Approve
                  </button>
                </div>
              </div>

              {/* Return for Revision */}
              <div
                className="rounded-xl flex flex-col overflow-hidden"
                style={{
                  border: `1px solid ${isActionable ? "#FCA5A5" : BORDER}`,
                  opacity: isActionable ? 1 : 0.55,
                }}
              >
                <div className="px-5 pt-5 pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3F2" }}>
                      <RotateCcw size={16} style={{ color: RED }} />
                    </div>
                    <p className="text-[14px] font-bold" style={{ color: TEXT }}>Return for Revision</p>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: MUTED }}>
                    Send the appraisal back to the Manager with a reason. The manager will be required to revise and resubmit.
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: RED }}>Requires Return Reason · Action: Return for Revision</p>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => isActionable && setShowReturnModal(true)}
                    disabled={!isActionable}
                    className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      backgroundColor: isActionable ? RED : "#E5E7EB",
                      color: isActionable ? "white" : "#9CA3AF",
                      cursor: isActionable ? "pointer" : "not-allowed",
                    }}
                  >
                    Return for Revision
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showApproveModal && (
        <ApproveModal
          empName={emp.name} decision={pd.managerDecision} finalScore={pd.finalScore}
          onConfirm={handleApprove} onClose={() => setShowApproveModal(false)}
        />
      )}
      {showOverrideModal && (
        <OverrideModal
          empName={emp.name} decision={pd.managerDecision} finalScore={pd.finalScore}
          onConfirm={handleOverride} onClose={() => setShowOverrideModal(false)}
        />
      )}
      {showReturnModal && (
        <ReturnModal
          empName={emp.name} onConfirm={handleReturn} onClose={() => setShowReturnModal(false)}
        />
      )}
      {histDrawer && (
        <HistoryDrawer
          period={histDrawer.period} data={histDrawer.data}
          onClose={() => setHistDrawer(null)}
        />
      )}
    </div>
  );
}

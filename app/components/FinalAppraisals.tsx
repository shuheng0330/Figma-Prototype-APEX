import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import { Sparkles, X, Send, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import {
  EMPLOYEES, PERIOD_OPTIONS, LIVE_PERIOD, AppStatus, Decision,
  PeriodAppraisal, resolvePeriodData, writeLive,
} from "./appraisalData";

const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const GREEN  = "#059669";
const RED    = "#D14343";
const PURPLE = "#8B5CF6";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";

const STATUS_STYLE: Record<AppStatus, { color: string; bg: string }> = {
  "Ready for Appraisal":  { color: BLUE,     bg: "#EEF3FC" },
  "Draft":                { color: AMBER,    bg: "#FEF9EC" },
  "Pending Review":       { color: TEAL,     bg: "#ECFDF9" },
  "Return for Revision":  { color: RED,      bg: "#FEF3F2" },
  "Approve":              { color: GREEN,    bg: "#ECFDF5" },
  "Override and Approve": { color: "#7C3AED",bg: "#F5F3FF" },
};

function todayStr() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function buildAiInsight(firstName: string) {
  return {
    strengths: `${firstName} has demonstrated consistent improvement in KPI performance over the past three years, with a steady uplift in overall scores. Monthly Sales Achievement and Customer Acquisition figures reflect strong commercial capability and resilience in a competitive retail environment.`,
    areas: "Cross-sell rate remains below target, suggesting an opportunity to deepen product knowledge and consultative selling skills. Targeted coaching in product bundling may yield measurable improvement in the next assessment period.",
    trend: "A steady upward trajectory is evident across all three dimensions (KPI, Attitude, Final Score). The rate of improvement has been consistent at approximately 1.5–2 points per year. If this trend continues, the employee may approach the 85-point range within the next two review cycles.",
    evidence: "KPI achievements are primarily system-verified via POS and CRM data. The Cross-Sell Rate is self-reported and should be validated against branch transaction records before finalisation.",
    policy: "Based on current TBM guidelines (example), a Final Score above 78.0 may qualify an employee for consideration for a merit increment. Promotion eligibility also requires a minimum of 2 years in the current role and departmental head endorsement. These are indicative thresholds — confirm with HR before communicating to the employee.",
  };
}

// ── Historical Appraisal Details Drawer ─────────────────────────────────────

interface HistoryDrawerProps {
  period: string;
  data: PeriodAppraisal;
  onClose: () => void;
}

function HistoryDrawer({ period, data, onClose }: HistoryDrawerProps) {
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
                { label: "KPI Score",     value: data.kpiScore,   color: BLUE   },
                { label: "Attitude Score",value: data.attScore,   color: TEAL   },
                { label: "Final Score",   value: data.finalScore, color: PURPLE },
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

          {/* Manager recommendation */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Superior Recommendation</p>
            <div className="inline-flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold mb-3" style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
              {data.managerDecision ?? "—"}
            </div>
            {data.justification && (
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{data.justification}</p>
            )}
          </div>

          {/* Status */}
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
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Original Superior Recommendation</p>
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

// ── Main Component ────────────────────────────────────────────────────────────

export function FinalAppraisals() {
  const { id }          = useParams<{ id: string }>();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const empId          = id ?? "amir";
  const selectedPeriod = searchParams.get("period") ?? LIVE_PERIOD;
  const emp            = EMPLOYEES[empId] ?? EMPLOYEES.amir;
  const firstName      = emp.name.split(" ")[0];
  const isLivePeriod   = selectedPeriod === LIVE_PERIOD;

  // refreshKey forces re-evaluation of pd after localStorage writes
  const [refreshKey, setRefreshKey] = useState(0);

  const pd = useMemo(
    () => resolvePeriodData(empId, selectedPeriod),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empId, selectedPeriod, refreshKey]
  );

  // Editable local state (only used when isEditable)
  const [decision,   setDecision]   = useState<Decision | null>(pd?.managerDecision ?? null);
  const [mgrComment, setMgrComment] = useState<string>(pd?.justification ?? "");
  const [chartYears, setChartYears] = useState<3 | 5>(5);
  const [aiShown,    setAiShown]    = useState(false);
  const [aiGen,      setAiGen]      = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [prevOpen,   setPrevOpen]   = useState(false);
  const [histDrawer, setHistDrawer] = useState<{ period: string; data: PeriodAppraisal } | null>(null);

  // Sync editable fields when navigating between employees or periods
  useEffect(() => {
    const data = resolvePeriodData(empId, selectedPeriod);
    setDecision(data?.managerDecision ?? null);
    setMgrComment(data?.justification ?? "");
    setAiShown(false);
    setAiGen(false);
    setDraftSaved(false);
    setPrevOpen(false);
    setHistDrawer(null);
    setChartYears(5);
    setRefreshKey(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId, selectedPeriod]);

  if (!pd) {
    return (
      <div
        style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}
        className="flex items-center justify-center"
      >
        <p style={{ color: MUTED }}>No appraisal record found for this period.</p>
      </div>
    );
  }

  const status     = pd.status;
  const ss         = STATUS_STYLE[status];
  const isEditable = isLivePeriod && (
    status === "Ready for Appraisal" || status === "Draft" || status === "Return for Revision"
  );
  const isReadOnly = !isEditable;
  const canSubmit  = decision !== null && mgrComment.trim().length > 20;

  const chartData = chartYears === 3 ? emp.trendData.slice(-3) : emp.trendData;
  const aiInsight = buildAiInsight(firstName);

  // Previous appraisals: older than selected period, periods that have a record for this employee
  const selectedYear    = parseInt(selectedPeriod.split(" ")[0]);
  const prevAppraisals  = PERIOD_OPTIONS
    .filter(p => parseInt(p.split(" ")[0]) < selectedYear && emp.periods[p])
    .map(p => ({ period: p, data: emp.periods[p] }));

  function patch(updates: Partial<PeriodAppraisal>) {
    writeLive(empId, updates);
    setRefreshKey(k => k + 1);
  }

  function saveDraft() {
    patch({ status: "Draft", managerDecision: decision, justification: mgrComment });
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }

  function handleSubmit() {
    patch({
      status: "Pending Review",
      managerDecision: decision,
      justification: mgrComment,
      submittedDate: todayStr(),
    });
    setShowSubmit(false);
  }

  function resubmit() {
    patch({
      status: "Pending Review",
      managerDecision: decision,
      justification: mgrComment,
      submittedDate: todayStr(),
    });
  }

  function simulateHrReturn() {
    patch({
      status: "Return for Revision",
      hrReturnReason: `Please provide more detailed justification for your recommendation. Include specific examples of ${firstName}'s performance contributions and explain how the cross-sell target will be addressed before resubmission.`,
    });
  }

  function simulateHrApprove() {
    patch({
      status: "Approve",
      hrDecision: decision,
      hrOverrideReason: "",
      hrRemarks: "Approved. The Superior's recommendation has been reviewed and endorsed by HR.",
      finalDate: todayStr(),
    });
  }

  function simulateHrOverride() {
    const map: Record<Decision, Decision> = {
      "Promotion": "Salary Increment",
      "Salary Increment": "No Recommendation",
      "Both": "Salary Increment",
      "No Recommendation": "No Recommendation",
    };
    const overrideDec = decision ? map[decision] : "No Recommendation";
    patch({
      status: "Override and Approve",
      hrDecision: overrideDec,
      hrOverrideReason: `HR has applied an override per company policy. Original recommendation of "${decision}" has been adjusted to "${overrideDec}". See policy guidelines for override criteria.`,
      hrRemarks: "Override applied. HR final decision takes precedence per company guidelines. Superior to be notified separately.",
      finalDate: todayStr(),
    });
  }

  // Displayed recommendation — use local state when editable, pd value when read-only
  const displayedDecision  = isEditable ? decision  : pd.managerDecision;
  const displayedComment   = isEditable ? mgrComment : (pd.justification ?? "");

  return (
    <div style={{ backgroundColor: "#F4F6F9", minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={() => navigate("/performance/final-appraisals")}
              className="flex items-center gap-1.5 text-[12px] mb-2 hover:opacity-70 transition-opacity"
              style={{ color: BLUE }}
            >
              <ArrowLeft size={14} />
              Back to Team Appraisals
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Final Appraisal Recommendation</h1>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ color: ss.color, backgroundColor: ss.bg }}
              >
                {status}
              </span>
            </div>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              Superior view · {emp.name} ({emp.staffId}) · {selectedPeriod}
            </p>
            <button
              onClick={() => navigate(`/staff-profile/${empId}`)}
              className="text-[12px] font-semibold mt-1.5 hover:opacity-70 transition-opacity"
              style={{ color: BLUE }}
            >
              View Full Performance Profile →
            </button>
          </div>
          {isEditable && (
            <div className="flex gap-2">
              <button
                onClick={saveDraft}
                className="px-4 py-2 rounded-md text-[13px] font-medium border transition-all"
                style={{
                  color: draftSaved ? GREEN : TEXT,
                  borderColor: draftSaved ? GREEN : BORDER,
                  backgroundColor: draftSaved ? "#ECFDF5" : "white",
                }}
              >
                {draftSaved ? "✓ Saved" : "Save Draft"}
              </button>
              {status === "Return for Revision" ? (
                <button
                  onClick={resubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                  style={{ backgroundColor: canSubmit ? BLUE : "#9CA3AF", cursor: canSubmit ? "pointer" : "not-allowed" }}
                >
                  <Send size={14} /> Resubmit to HR
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmit(true)}
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                  style={{ backgroundColor: canSubmit ? BLUE : "#9CA3AF", cursor: canSubmit ? "pointer" : "not-allowed" }}
                >
                  <Send size={14} /> Submit to HR
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Status Banners ── */}

        {status === "Pending Review" && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "#ECFDF9", border: `1px solid ${TEAL}` }}
          >
            <span style={{ color: TEAL }}>✓</span>
            <div className="flex-1">
              <p className="text-[13px] font-semibold" style={{ color: TEAL }}>Recommendation submitted to HR</p>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                Submitted on {pd.submittedDate || todayStr()}. HR will review scores, your recommendation, and justification.
                You will be notified once the appraisal is finalised.
              </p>
            </div>
            {isLivePeriod && (
              <div className="flex flex-col gap-1.5 shrink-0 ml-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-center" style={{ color: MUTED }}>Prototype</p>
                <button onClick={simulateHrReturn}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ backgroundColor: RED }}>
                  Simulate HR Return
                </button>
                <button onClick={simulateHrApprove}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ backgroundColor: GREEN }}>
                  Simulate HR Approve
                </button>
                <button onClick={simulateHrOverride}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ backgroundColor: "#7C3AED" }}>
                  Simulate Override
                </button>
              </div>
            )}
          </div>
        )}

        {status === "Return for Revision" && pd.hrReturnReason && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "#FEF3F2", border: `1px solid ${RED}` }}
          >
            <span className="shrink-0" style={{ color: RED }}>↩</span>
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: RED }}>Returned for Revision by HR</p>
              <p className="text-[13px]" style={{ color: TEXT }}>{pd.hrReturnReason}</p>
            </div>
          </div>
        )}

        {(status === "Approve" || status === "Override and Approve") && (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${status === "Override and Approve" ? "#C4B5FD" : "#6EE7B7"}` }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ backgroundColor: status === "Override and Approve" ? "#F5F3FF" : "#ECFDF5" }}
            >
              <span style={{ color: status === "Override and Approve" ? "#7C3AED" : GREEN }}>✓</span>
              <p className="text-[13px] font-semibold flex-1" style={{ color: status === "Override and Approve" ? "#7C3AED" : GREEN }}>
                {status === "Override and Approve" ? "HR Override and Approve" : "Appraisal Approved by HR"}
              </p>
              {pd.finalDate && (
                <span className="text-[11px]" style={{ color: MUTED }}>Finalised {pd.finalDate}</span>
              )}
            </div>
            <div className="bg-white px-5 py-4 space-y-3">
              {status === "Override and Approve" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Original Superior Recommendation</p>
                    <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{pd.managerDecision}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>HR Final Decision</p>
                    <p className="text-[13px] font-semibold" style={{ color: GREEN }}>{pd.hrDecision}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>HR Final Decision</p>
                  <p className="text-[13px] font-semibold" style={{ color: GREEN }}>{pd.hrDecision}</p>
                </div>
              )}
              {status === "Override and Approve" && pd.hrOverrideReason && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: RED }}>HR Override Reason</p>
                  <p
                    className="text-[12px] leading-relaxed p-3 rounded-lg"
                    style={{ color: TEXT, backgroundColor: "#FEF3F2", border: "1px solid #FECDCA" }}
                  >
                    {pd.hrOverrideReason}
                  </p>
                </div>
              )}
              {pd.hrRemarks && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>HR Finalisation Remarks</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{pd.hrRemarks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Score Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "KPI Performance Score",    value: pd.kpiScore,   color: BLUE,   bg: "#EEF3FC", note: `${selectedYear} Annual KPI Review result` },
            { label: "Attitude Evaluation Score", value: pd.attScore,   color: TEAL,   bg: "#ECFDF9", note: "Superior evaluation across core values" },
            { label: "Final Appraisal Score",     value: pd.finalScore, color: PURPLE, bg: "#F5F3FF", note: "50% KPI + 50% Attitude" },
          ].map(c => (
            <div
              key={c.label}
              className="bg-white rounded-lg p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>{c.label}</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-[32px] font-bold leading-none" style={{ color: c.color }}>{c.value.toFixed(1)}</span>
                <span className="text-[13px] mb-1" style={{ color: MUTED }}>/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }} />
              </div>
              <p className="text-[11px] mt-2" style={{ color: MUTED }}>{c.note}</p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: "#EEF3FC", border: "1px solid #C7D8F5" }}
        >
          <span className="text-[12px]" style={{ color: BLUE }}>
            Final Appraisal Score uses the confirmed 50% KPI + 50% Attitude default. The allocation is configurable in Review Period.
          </span>
        </div>

        {/* ── Historical Performance Trend ── */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>Historical Performance Trend</h2>
            <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ border: `1px solid ${BORDER}` }}>
              {([3, 5] as const).map(y => (
                <button
                  key={y}
                  onClick={() => setChartYears(y)}
                  className="px-3 py-1 text-[11px] font-semibold rounded transition-colors"
                  style={chartYears === y
                    ? { backgroundColor: BLUE, color: "white" }
                    : { backgroundColor: "transparent", color: MUTED }
                  }
                >
                  {y} Years
                </button>
              ))}
            </div>
          </div>
          <p className="text-[12px] mb-4" style={{ color: MUTED }}>
            {chartYears}-year view of KPI, Attitude and Final scores for {emp.name}.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <ReTooltip contentStyle={{ fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="kpi"      name="KPI Score"     stroke={BLUE}   strokeWidth={2}   dot={{ r: 4, fill: BLUE }}   activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="attitude" name="Attitude Score" stroke={TEAL}   strokeWidth={2}   dot={{ r: 4, fill: TEAL }}   activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="final"    name="Final Score"   stroke={PURPLE} strokeWidth={2.5} dot={{ r: 5, fill: PURPLE }} activeDot={{ r: 7 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-5 mt-2">
            {[
              { label: "KPI Score",     color: BLUE   },
              { label: "Attitude Score",color: TEAL   },
              { label: "Final Score",   color: PURPLE },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px]" style={{ color: MUTED }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Previous Appraisals (collapsed by default) ── */}
        {prevAppraisals.length > 0 && (
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
          >
            <button
              onClick={() => setPrevOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2">
                {prevOpen
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
                {prevOpen ? "Collapse" : "View historical appraisal records"}
              </p>
            </button>

            {prevOpen && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC" }}>
                      {["Review Period", "Final Score", "Superior Recommendation", "Appraisal Status", "HR Final Decision", "Action"].map(h => (
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
                            <span className="font-bold" style={{ color: PURPLE }}>{d.finalScore.toFixed(1)}</span>
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

        {/* ── Superior Recommendation ── */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-[14px] font-bold mb-1" style={{ color: TEXT }}>Superior Recommendation</h2>
          <p className="text-[12px] mb-4" style={{ color: MUTED }}>
            Select a recommendation to submit to HR. This is a recommendation only — HR will review and confirm.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["Promotion", "Salary Increment", "Both", "No Recommendation"] as Decision[]).map(d => {
              const active = displayedDecision === d;
              return (
                <button
                  key={d}
                  onClick={() => isEditable && setDecision(d)}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all"
                  style={{
                    borderColor: active ? BLUE : BORDER,
                    backgroundColor: active ? "#EEF3FC" : "white",
                    cursor: isEditable ? "pointer" : "default",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: active ? BLUE : "#D1D5DB" }}
                  >
                    {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BLUE }} />}
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: active ? BLUE : TEXT }}>{d}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Recommendation Justification ── */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-[14px] font-bold mb-1" style={{ color: TEXT }}>Recommendation Justification</h2>
          <p className="text-[12px] mb-3" style={{ color: MUTED }}>
            Explain the reasons for your recommendation using the employee&apos;s current performance and historical trend.
            {isEditable && " Minimum 20 characters."}
          </p>
          <textarea
            value={displayedComment}
            onChange={e => isEditable && setMgrComment(e.target.value)}
            readOnly={isReadOnly}
            rows={4}
            placeholder={isEditable
              ? `e.g. ${firstName} has shown consistent improvement over the review period...`
              : ""
            }
            className="w-full px-3 py-3 rounded-md text-[13px] outline-none resize-none"
            style={{
              border: `1px solid ${BORDER}`,
              color: TEXT,
              backgroundColor: isReadOnly ? "#F8FAFC" : "white",
            }}
          />
        </div>

        {/* ── AI Appraisal Insight ── */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>AI Appraisal Insight</h2>
              <p className="text-[12px]" style={{ color: MUTED }}>AI-generated commentary based on displayed KPI data. Does not make the final decision.</p>
            </div>
            {!aiShown && (
              <button
                onClick={() => { setAiGen(true); setTimeout(() => { setAiGen(false); setAiShown(true); }, 1400); }}
                disabled={aiGen}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                style={{ backgroundColor: aiGen ? "#9CA3AF" : PURPLE }}
              >
                <Sparkles size={14} />
                {aiGen ? "Generating…" : "Generate Insight"}
              </button>
            )}
          </div>

          {!aiShown && !aiGen && (
            <div
              className="py-10 text-center rounded-lg"
              style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${BORDER}` }}
            >
              <Sparkles size={24} className="mx-auto mb-2" style={{ color: "#C4B5FD" }} />
              <p className="text-[13px]" style={{ color: MUTED }}>
                Click &quot;Generate Insight&quot; to produce AI-written commentary based on {firstName}&apos;s performance data.
              </p>
            </div>
          )}

          {aiGen && (
            <div
              className="py-10 text-center rounded-lg"
              style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${BORDER}` }}
            >
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: PURPLE, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-[12px] mt-3" style={{ color: MUTED }}>Analysing performance data…</p>
            </div>
          )}

          {aiShown && (
            <div className="space-y-4">
              {[
                { title: "Strengths",             content: aiInsight.strengths },
                { title: "Areas for Improvement", content: aiInsight.areas     },
                { title: "Performance Trend",      content: aiInsight.trend     },
                { title: "Supporting Evidence",    content: aiInsight.evidence  },
                { title: "Policy Considerations",  content: aiInsight.policy    },
              ].map(s => (
                <div key={s.title}>
                  <p className="text-[12px] font-bold mb-1" style={{ color: BLUE }}>{s.title}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{s.content}</p>
                </div>
              ))}
              <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  This insight is AI-generated based on the data displayed above. It does not constitute a formal HR recommendation or management decision.
                  Always verify figures with source systems before making people decisions.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Submit Dialog ── */}
      {showSubmit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Submit Appraisal Recommendation to HR?</h2>
              <button onClick={() => setShowSubmit(false)}><X size={18} style={{ color: MUTED }} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-3 rounded-lg flex-1" style={{ backgroundColor: "#EEF3FC" }}>
                  <p className="text-[11px]" style={{ color: MUTED }}>Final Score</p>
                  <p className="text-[20px] font-bold" style={{ color: BLUE }}>{pd.finalScore.toFixed(1)}</p>
                </div>
                <div className="text-center px-4 py-3 rounded-lg flex-1" style={{ backgroundColor: "#F5F3FF" }}>
                  <p className="text-[11px]" style={{ color: MUTED }}>Recommendation</p>
                  <p className="text-[14px] font-bold" style={{ color: PURPLE }}>{decision}</p>
                </div>
              </div>
              <p className="text-[13px]" style={{ color: TEXT }}>
                HR will review {emp.name}&apos;s final appraisal record including scores, your justification, and the AI insight.
                They may approve, override, or return for revision.
              </p>
              <p className="text-[12px]" style={{ color: MUTED }}>
                <strong>What HR will review:</strong> Final Score ({pd.finalScore.toFixed(1)}), Recommendation ({decision}),
                Recommendation Justification, AI Insight, and the full KPI and Attitude history.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
              <button
                onClick={() => setShowSubmit(false)}
                className="px-4 py-2 rounded-md text-[13px] font-medium border"
                style={{ color: TEXT, borderColor: BORDER }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                style={{ backgroundColor: BLUE }}
              >
                Submit to HR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Historical Drawer ── */}
      {histDrawer && (
        <HistoryDrawer
          period={histDrawer.period}
          data={histDrawer.data}
          onClose={() => setHistDrawer(null)}
        />
      )}
    </div>
  );
}

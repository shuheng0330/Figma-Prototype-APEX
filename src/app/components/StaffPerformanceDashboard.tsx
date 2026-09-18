import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Clock, Sparkles, ChevronDown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "Staff" | "Manager" | "HR Admin";
type PanelState = "Empty" | "Pending" | "Returned" | "Approved";
type DecisionType = "Promotion" | "Salary Increment" | "Both" | "None";
type Category = "Ready" | "Borderline" | "Needs Improvement";
type YearRange = "1Y" | "3Y" | "5Y" | "All";

interface PerformanceData {
  year: string;
  score: number;
  yoyChange: number;
}

interface Competency {
  name: string;
  score: number;
}

interface HistoricalEval {
  cycle: string;
  score: number;
  yoyChange: number;
}

interface AppraisalData {
  reviewPeriod: string;
  decisionType: DecisionType;
  promotionScore?: number;
  promotionCategory?: Category;
  salaryScore?: number;
  salaryCategory?: Category;
  promotionOverride?: { category: Category; reason: string };
  salaryOverride?: { category: Category; reason: string };
  aiInsight?: string;
  managerComment?: string;
  hrOverride?: { promotionCategory?: Category; salaryCategory?: Category; reason: string };
  returnReason?: string;
  approvalDate?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const STAFF_INFO = {
  name: "Alice Morgan",
  email: "alice.morgan@apex.com",
  department: "IT",
  role: "Senior Developer",
  initials: "AM",
  avatarColor: "#00C9A7",
};

const PERF_DATA_ALL: PerformanceData[] = [
  { year: "2021", score: 72, yoyChange: 0 },
  { year: "2022", score: 75, yoyChange: 3 },
  { year: "2023", score: 78, yoyChange: 3 },
  { year: "2024", score: 82, yoyChange: 4 },
  { year: "2025", score: 88, yoyChange: 6 },
];

const COMPETENCIES: Competency[] = [
  { name: "Technical Proficiency", score: 9.2 },
  { name: "Problem Solving", score: 8.8 },
  { name: "Communication", score: 7.9 },
  { name: "Leadership", score: 7.5 },
  { name: "Collaboration", score: 8.4 },
  { name: "Adaptability", score: 8.1 },
];

const HISTORICAL: HistoricalEval[] = [
  { cycle: "Cycle 2024–2025", score: 88, yoyChange: 6 },
  { cycle: "Cycle 2023–2024", score: 82, yoyChange: 4 },
  { cycle: "Cycle 2022–2023", score: 78, yoyChange: 3 },
  { cycle: "Cycle 2021–2022", score: 75, yoyChange: 3 },
];

const MOCK_APPRAISAL: AppraisalData = {
  reviewPeriod: "Last 3 year",
  decisionType: "Both",
  promotionScore: 78,
  promotionCategory: "Borderline",
  salaryScore: 82,
  salaryCategory: "Borderline",
  promotionOverride: { category: "Ready", reason: "Demonstrated exceptional leadership in Q4 project delivery" },
  aiInsight: "Alice has consistently demonstrated strong technical capabilities and cross-functional collaboration. Her performance trajectory shows sustained improvement over the past 3 cycles, with particular strength in problem-solving and technical proficiency. Recent project delivery in Q4 2024 exceeded expectations, suggesting readiness for increased responsibility.",
  managerComment: "Alice has been a key contributor to our team's success this year. She led the migration project to the new infrastructure with minimal disruption and mentored two junior developers. I believe she's ready for the next level.",
};

// ── Helper Functions ──────────────────────────────────────────────────────────
function getCategoryColor(cat: Category) {
  switch (cat) {
    case "Ready": return { color: "#059669", bg: "#ECFDF5" };
    case "Borderline": return { color: "#D97706", bg: "#FEF3C7" };
    case "Needs Improvement": return { color: "#DC2626", bg: "#FEE2E2" };
  }
}

function getScoreColor(score: number) {
  if (score >= 85) return "#059669";
  if (score >= 70) return TEAL;
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function getYearData(range: YearRange): PerformanceData[] {
  switch (range) {
    case "1Y": return PERF_DATA_ALL.slice(-1);
    case "3Y": return PERF_DATA_ALL.slice(-3);
    case "5Y": return PERF_DATA_ALL.slice(-5);
    case "All": return PERF_DATA_ALL;
  }
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function PerfTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p className="text-[11px] font-bold text-[#1A1F2E] mb-1">{d.year}</p>
      <p className="text-[12px] text-[#6B7280]">Score: <span className="font-semibold text-[#1A1F2E]">{d.score}%</span></p>
      {d.yoyChange !== 0 && (
        <p className={`text-[11px] font-semibold ${d.yoyChange > 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
          YoY: {d.yoyChange > 0 ? "+" : ""}{d.yoyChange}%
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function StaffPerformanceDashboard() {
  const navigate = useNavigate();

  // View mode toggle
  const [viewMode, setViewMode] = useState<ViewMode>("Staff");

  // Panel state (for Manager/HR)
  const [panelState, setPanelState] = useState<PanelState>("Pending");

  // Year range toggle
  const [yearRange, setYearRange] = useState<YearRange>("5Y");

  // Manager panel form state
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [decisionType, setDecisionType] = useState<DecisionType>("None");
  const [promotionOverride, setPromotionOverride] = useState(false);
  const [salaryOverride, setSalaryOverride] = useState(false);
  const [promotionOverrideCategory, setPromotionOverrideCat] = useState<Category>("Ready");
  const [salaryOverrideCategory, setSalaryOverrideCat] = useState<Category>("Ready");
  const [promotionOverrideReason, setPromotionOverrideReason] = useState("");
  const [salaryOverrideReason, setSalaryOverrideReason] = useState("");
  const [managerComment, setManagerComment] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // HR panel actions
  const [hrAction, setHrAction] = useState<"" | "override" | "return">("");
  const [hrOverridePromotionCat, setHrOverridePromotionCat] = useState<Category>("Ready");
  const [hrOverrideSalaryCat, setHrOverrideSalaryCat] = useState<Category>("Ready");
  const [hrOverrideReason, setHrOverrideReason] = useState("");
  const [hrReturnReason, setHrReturnReason] = useState("");

  const perfData = useMemo(() => getYearData(yearRange), [yearRange]);

  const latestScore = PERF_DATA_ALL[PERF_DATA_ALL.length - 1].score;
  const latestCategory: Category = latestScore >= 85 ? "Ready" : latestScore >= 70 ? "Borderline" : "Needs Improvement";

  const consecutiveMeeting = HISTORICAL.filter((h) => h.score >= 70).length;

  const handleGenerateAI = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      setAiGenerated(true);
    }, 2000);
  };

  const handleHrApprove = () => {
    setPanelState("Approved");
    setHrAction("");
  };

  const handleHrOverrideApprove = () => {
    setPanelState("Approved");
    setHrAction("");
  };

  const handleHrReturn = () => {
    setPanelState("Returned");
    setHrAction("");
  };

  const handleManagerResubmit = () => {
    setPanelState("Empty");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header with View Mode Toggle ────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} className="text-[#6B7280]" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#1A1F2E]">Staff Performance Dashboard</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-0.5">{STAFF_INFO.name} · {STAFF_INFO.role}</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9CA3AF] font-semibold">Viewing as:</span>
          <div className="flex gap-1 bg-[#F4F6F9] rounded-lg p-1">
            {(["Staff", "Manager", "HR Admin"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all"
                style={viewMode === mode ? { backgroundColor: "white", color: TEAL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#9CA3AF" }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel State Toggle (only for Manager/HR) */}
      {viewMode !== "Staff" && (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <span className="text-[11px] text-[#9CA3AF] font-semibold">Panel state (prototype):</span>
          <div className="flex gap-1">
            {viewMode === "Manager" && (
              <>
                {(["Empty", "Pending", "Returned", "Approved"] as PanelState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => setPanelState(state)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded transition-all"
                    style={panelState === state ? { backgroundColor: TEAL, color: "white" } : { backgroundColor: "#F4F6F9", color: "#9CA3AF" }}
                  >
                    {state}
                  </button>
                ))}
              </>
            )}
            {viewMode === "HR Admin" && (
              <>
                {(["Pending", "Returned", "Approved"] as PanelState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => setPanelState(state)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded transition-all"
                    style={panelState === state ? { backgroundColor: TEAL, color: "white" } : { backgroundColor: "#F4F6F9", color: "#9CA3AF" }}
                  >
                    {state}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ZONE A — Performance Data (shown in all view modes)
          ═══════════════════════════════════════════════════════════════ */}

      {/* ── Profile Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0"
            style={{ backgroundColor: STAFF_INFO.avatarColor }}>
            {STAFF_INFO.initials}
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-[#1A1F2E]">{STAFF_INFO.name}</h2>
            <p className="text-[12px] text-[#6B7280] mt-1">{STAFF_INFO.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-[#9CA3AF]">Department: <span className="font-semibold text-[#1A1F2E]">{STAFF_INFO.department}</span></span>
              <span className="text-[11px] text-[#9CA3AF]">·</span>
              <span className="text-[11px] text-[#9CA3AF]">Role: <span className="font-semibold text-[#1A1F2E]">{STAFF_INFO.role}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Performance Trend Chart ──────────────────────────────────── */}
      <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#1A1F2E]">Performance Trend</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Score progression over time</p>
          </div>
          <div className="flex gap-1">
            {(["1Y", "3Y", "5Y", "All"] as YearRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setYearRange(range)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded transition-all"
                style={yearRange === range ? { backgroundColor: TEAL, color: "white" } : { color: "#9CA3AF" }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart id="staff-perf-trend" data={perfData} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <ReTooltip content={<PerfTooltip />} />
            <Line type="monotone" dataKey="score" name="Score" stroke={TEAL} strokeWidth={2.5}
              dot={{ fill: TEAL, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Latest Evaluation Card ───────────────────────────────────── */}
      <div className="bg-white rounded-lg p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h2 className="text-[14px] font-bold text-[#1A1F2E] mb-4">Latest Evaluation</h2>
        <div className="flex items-center gap-6 mb-5">
          <div>
            <p className="text-[11px] text-[#9CA3AF] mb-1">Overall Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold" style={{ color: getScoreColor(latestScore) }}>{latestScore}%</span>
              <Chip label={latestCategory} {...getCategoryColor(latestCategory)} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {COMPETENCIES.map((comp) => (
            <div key={comp.name} className="p-3 bg-[#F9FAFB] rounded-lg">
              <p className="text-[10px] text-[#9CA3AF] mb-1">{comp.name}</p>
              <p className="text-[16px] font-bold text-[#1A1F2E]">{comp.score}<span className="text-[11px] text-[#9CA3AF] font-semibold">/10</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Historical Evaluations ───────────────────────────────────── */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-[#1A1F2E]">Historical Evaluations</h2>
          <p className="text-[11px] font-semibold mt-1" style={{ color: "#059669" }}>
            {consecutiveMeeting} consecutive cycles meeting expectation (≥70%)
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {HISTORICAL.map((evaluation) => (
            <div key={evaluation.cycle} className="px-5 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
              <span className="text-[12px] font-semibold text-[#1A1F2E]">{evaluation.cycle}</span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#1A1F2E]">{evaluation.score}%</span>
                {evaluation.yoyChange !== 0 && (
                  <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${evaluation.yoyChange > 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    {evaluation.yoyChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {evaluation.yoyChange > 0 ? "+" : ""}{evaluation.yoyChange}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE B — Manager Appraisal Panel (only shown in Manager view)
          ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "Manager" && (
        <div className="bg-white rounded-lg p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "2px solid #F59E0B" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-bold text-[#1A1F2E]">Appraisal Panel — Manager Only</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Submit appraisal for HR review</p>
            </div>
            {panelState === "Pending" && (
              <Chip label="Pending HR Review" color="#D97706" bg="#FEF3C7" />
            )}
            {panelState === "Approved" && (
              <Chip label="Approved" color="#059669" bg="#ECFDF5" />
            )}
            {panelState === "Returned" && (
              <Chip label="Returned for Revision" color="#DC2626" bg="#FEE2E2" />
            )}
          </div>

          {panelState === "Empty" && (
            <div className="space-y-5">
              {/* Review Period */}
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5">Review Period</label>
                <select
                  value={reviewPeriod}
                  onChange={(e) => setReviewPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select period...</option>
                  <option value="Last 1 year">Last 1 year</option>
                  <option value="Last 3 year">Last 3 year</option>
                  <option value="Last 5 year">Last 5 year</option>
                </select>
              </div>

              {/* Decision Type */}
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-2">Decision Type</label>
                <div className="flex gap-3">
                  {(["Promotion", "Salary Increment", "Both", "None"] as DecisionType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="decision" checked={decisionType === type} onChange={() => setDecisionType(type)}
                        className="w-4 h-4 accent-teal-500" />
                      <span className="text-[12px] text-[#1A1F2E]">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Single Decision (Promotion OR Salary) */}
              {(decisionType === "Promotion" || decisionType === "Salary Increment") && (
                <div className="p-4 bg-[#F9FAFB] rounded-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                      <p className="text-[20px] font-bold text-[#1A1F2E]">{decisionType === "Promotion" ? MOCK_APPRAISAL.promotionScore : MOCK_APPRAISAL.salaryScore}</p>
                    </div>
                    <Chip label={decisionType === "Promotion" ? MOCK_APPRAISAL.promotionCategory! : MOCK_APPRAISAL.salaryCategory!}
                      {...getCategoryColor(decisionType === "Promotion" ? MOCK_APPRAISAL.promotionCategory! : MOCK_APPRAISAL.salaryCategory!)} />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={decisionType === "Promotion" ? promotionOverride : salaryOverride}
                      onChange={(e) => decisionType === "Promotion" ? setPromotionOverride(e.target.checked) : setSalaryOverride(e.target.checked)}
                      className="w-4 h-4 accent-teal-500" />
                    <span className="text-[11px] font-semibold text-[#1A1F2E]">Override system category</span>
                  </label>

                  {(decisionType === "Promotion" ? promotionOverride : salaryOverride) && (
                    <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: TEAL }}>
                      <div>
                        <p className="text-[10px] text-[#6B7280] mb-1">Override to:</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="line-through text-[#9CA3AF] text-[11px]">
                            {decisionType === "Promotion" ? MOCK_APPRAISAL.promotionCategory : MOCK_APPRAISAL.salaryCategory}
                          </span>
                          <span className="text-[#9CA3AF]">→</span>
                          <select value={decisionType === "Promotion" ? promotionOverrideCategory : salaryOverrideCategory}
                            onChange={(e) => decisionType === "Promotion" ? setPromotionOverrideCat(e.target.value as Category) : setSalaryOverrideCat(e.target.value as Category)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option>Ready</option>
                            <option>Borderline</option>
                            <option>Needs Improvement</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#6B7280] mb-1">Override Reason</label>
                        <textarea value={decisionType === "Promotion" ? promotionOverrideReason : salaryOverrideReason}
                          onChange={(e) => decisionType === "Promotion" ? setPromotionOverrideReason(e.target.value) : setSalaryOverrideReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                          rows={2} placeholder="Explain why you're overriding..." />
                      </div>
                    </div>
                  )}

                  <div>
                    <button onClick={handleGenerateAI} disabled={aiGenerating || aiGenerated}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                      style={aiGenerating || aiGenerated ? { backgroundColor: "#F3F4F6", color: "#9CA3AF" } : { backgroundColor: "#EEF2FF", color: "#6366F1" }}>
                      <Sparkles size={12} /> {aiGenerating ? "Generating..." : aiGenerated ? "AI Insight Generated" : "Generate AI Insight"}
                    </button>
                    {aiGenerated && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-[10px] font-semibold text-[#9CA3AF] mb-1">AI-generated insight</p>
                        <p className="text-[11px] text-[#374151] leading-relaxed">{MOCK_APPRAISAL.aiInsight}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Both Decisions */}
              {reviewPeriod && decisionType === "Both" && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Promotion */}
                  <div className="p-4 bg-[#EEF2FF] rounded-lg space-y-4">
                    <h3 className="text-[12px] font-bold text-[#6366F1]">Promotion</h3>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-0.5">Readiness Score</p>
                      <p className="text-[20px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.promotionScore}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1">System Category</p>
                      <Chip label={MOCK_APPRAISAL.promotionCategory!} {...getCategoryColor(MOCK_APPRAISAL.promotionCategory!)} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={promotionOverride} onChange={(e) => setPromotionOverride(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500" />
                      <span className="text-[11px] font-semibold text-[#1A1F2E]">Override category</span>
                    </label>
                    {promotionOverride && (
                      <div className="space-y-3 pl-3 border-l-2 border-indigo-300">
                        <div>
                          <p className="text-[10px] text-[#6B7280] mb-1">Override to:</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="line-through text-[#9CA3AF] text-[11px]">{MOCK_APPRAISAL.promotionCategory}</span>
                            <span className="text-[#9CA3AF]">→</span>
                            <select value={promotionOverrideCategory} onChange={(e) => setPromotionOverrideCat(e.target.value as Category)}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <option>Ready</option>
                              <option>Borderline</option>
                              <option>Needs Improvement</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#6B7280] mb-1">Override Reason</label>
                          <textarea value={promotionOverrideReason} onChange={(e) => setPromotionOverrideReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2} placeholder="Explain why you're overriding..." />
                        </div>
                      </div>
                    )}
                    <button onClick={handleGenerateAI} disabled={aiGenerating || aiGenerated}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                      style={aiGenerating || aiGenerated ? { backgroundColor: "#F3F4F6", color: "#9CA3AF" } : { backgroundColor: "#6366F1", color: "white" }}>
                      <Sparkles size={12} /> {aiGenerating ? "Generating..." : aiGenerated ? "Generated" : "Generate AI"}
                    </button>
                  </div>

                  {/* Salary Increment */}
                  <div className="p-4 bg-[#F5F3FF] rounded-lg space-y-4">
                    <h3 className="text-[12px] font-bold text-[#8B5CF6]">Salary Increment</h3>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-0.5">Readiness Score</p>
                      <p className="text-[20px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.salaryScore}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] mb-1">System Category</p>
                      <Chip label={MOCK_APPRAISAL.salaryCategory!} {...getCategoryColor(MOCK_APPRAISAL.salaryCategory!)} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={salaryOverride} onChange={(e) => setSalaryOverride(e.target.checked)}
                        className="w-4 h-4 accent-purple-500" />
                      <span className="text-[11px] font-semibold text-[#1A1F2E]">Override category</span>
                    </label>
                    {salaryOverride && (
                      <div className="space-y-3 pl-3 border-l-2 border-purple-300">
                        <div>
                          <p className="text-[10px] text-[#6B7280] mb-1">Override to:</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="line-through text-[#9CA3AF] text-[11px]">{MOCK_APPRAISAL.salaryCategory}</span>
                            <span className="text-[#9CA3AF]">→</span>
                            <select value={salaryOverrideCategory} onChange={(e) => setSalaryOverrideCat(e.target.value as Category)}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <option>Ready</option>
                              <option>Borderline</option>
                              <option>Needs Improvement</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#6B7280] mb-1">Override Reason</label>
                          <textarea value={salaryOverrideReason} onChange={(e) => setSalaryOverrideReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={2} placeholder="Explain why you're overriding..." />
                        </div>
                      </div>
                    )}
                    <button onClick={handleGenerateAI} disabled={aiGenerating || aiGenerated}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                      style={aiGenerating || aiGenerated ? { backgroundColor: "#F3F4F6", color: "#9CA3AF" } : { backgroundColor: "#8B5CF6", color: "white" }}>
                      <Sparkles size={12} /> {aiGenerating ? "Generating..." : aiGenerated ? "Generated" : "Generate AI"}
                    </button>
                  </div>
                </div>
              )}

              {decisionType !== "None" && (
                <>
                  {/* Manager Comment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5">Manager Comment <span className="text-[#DC2626]">*</span></label>
                    <textarea value={managerComment} onChange={(e) => setManagerComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={4} placeholder="Provide your assessment and recommendations..." />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[12px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors">
                      Save Draft
                    </button>
                    <button
                      onClick={() => setPanelState("Pending")}
                      className="flex-1 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white transition-colors"
                      style={{ backgroundColor: TEAL }}
                    >
                      Submit to HR
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {panelState === "Pending" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg flex items-start gap-3">
                <Clock size={16} className="text-[#D97706] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#92400E]">
                  Your appraisal has been submitted and is awaiting HR review. You will be notified once HR takes action.
                </p>
              </div>
              {/* Read-only display */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#9CA3AF]">Review Period:</span>
                  <span className="font-semibold text-[#1A1F2E]">{MOCK_APPRAISAL.reviewPeriod}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#9CA3AF]">Decision Type:</span>
                  <Chip label={MOCK_APPRAISAL.decisionType} color={TEAL} bg="#E8FAF7" />
                </div>
                {MOCK_APPRAISAL.decisionType === "Both" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F9FAFB] rounded-lg space-y-2">
                      <p className="text-[10px] font-bold text-[#6B7280]">Promotion</p>
                      <p className="text-[11px] text-[#9CA3AF]">Score: <span className="font-semibold text-[#1A1F2E]">{MOCK_APPRAISAL.promotionScore}</span></p>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                        <Chip label={MOCK_APPRAISAL.promotionCategory!} {...getCategoryColor(MOCK_APPRAISAL.promotionCategory!)} />
                      </div>
                      {MOCK_APPRAISAL.promotionOverride && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                          <p className="text-[11px] text-[#374151]">
                            <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.promotionCategory}</span> → <Chip label={MOCK_APPRAISAL.promotionOverride.category} {...getCategoryColor(MOCK_APPRAISAL.promotionOverride.category)} />
                          </p>
                          <p className="text-[10px] text-[#6B7280] mt-1 italic">"{MOCK_APPRAISAL.promotionOverride.reason}"</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-[#F9FAFB] rounded-lg space-y-2">
                      <p className="text-[10px] font-bold text-[#6B7280]">Salary Increment</p>
                      <p className="text-[11px] text-[#9CA3AF]">Score: <span className="font-semibold text-[#1A1F2E]">{MOCK_APPRAISAL.salaryScore}</span></p>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                        <Chip label={MOCK_APPRAISAL.salaryCategory!} {...getCategoryColor(MOCK_APPRAISAL.salaryCategory!)} />
                      </div>
                      {MOCK_APPRAISAL.salaryOverride ? (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                          <p className="text-[11px] text-[#374151]">
                            <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.salaryCategory}</span> → <Chip label={MOCK_APPRAISAL.salaryOverride.category} {...getCategoryColor(MOCK_APPRAISAL.salaryOverride.category)} />
                          </p>
                          <p className="text-[10px] text-[#6B7280] mt-1 italic">"{MOCK_APPRAISAL.salaryOverride.reason}"</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#9CA3AF] pt-2 border-t border-gray-200">No override</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="p-3 bg-[#F9FAFB] rounded-lg">
                  <p className="text-[10px] font-bold text-[#6B7280] mb-1">Manager Comment</p>
                  <p className="text-[11px] text-[#374151] italic">"{MOCK_APPRAISAL.managerComment}"</p>
                </div>
              </div>
            </div>
          )}

          {panelState === "Returned" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FEE2E2] border border-[#DC2626] rounded-lg flex items-start gap-3">
                <AlertCircle size={16} className="text-[#DC2626] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#991B1B] mb-1">Returned for Revision</p>
                  <p className="text-[11px] text-[#991B1B]">
                    HR Reason: "Please provide more specific examples of leadership demonstrated in Q4 project delivery."
                  </p>
                </div>
              </div>
              <button onClick={handleManagerResubmit}
                className="w-full px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: TEAL }}>
                Edit and Resubmit
              </button>
            </div>
          )}

          {panelState === "Approved" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#ECFDF5] border border-[#059669] rounded-lg flex items-start gap-3">
                <CheckCircle size={16} className="text-[#059669] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#065F46] mb-1">Approved by HR</p>
                  <p className="text-[11px] text-[#065F46]">Approval Date: May 8, 2026</p>
                  {MOCK_APPRAISAL.hrOverride && (
                    <p className="text-[10px] text-[#065F46] mt-2">
                      HR Override applied: {MOCK_APPRAISAL.hrOverride.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Read-only appraisal details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#9CA3AF]">Review Period:</span>
                  <span className="font-semibold text-[#1A1F2E]">{MOCK_APPRAISAL.reviewPeriod}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#9CA3AF]">Decision Type:</span>
                  <Chip label={MOCK_APPRAISAL.decisionType} color={TEAL} bg="#E8FAF7" />
                </div>

                {/* Decision details */}
                {MOCK_APPRAISAL.decisionType === "Both" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F9FAFB] rounded-lg space-y-2">
                      <p className="text-[10px] font-bold text-[#6B7280]">Promotion</p>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                        <p className="text-[18px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.promotionScore}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                        <Chip label={MOCK_APPRAISAL.promotionCategory!} {...getCategoryColor(MOCK_APPRAISAL.promotionCategory!)} />
                      </div>
                      {MOCK_APPRAISAL.promotionOverride && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                          <p className="text-[11px] text-[#374151] mb-1">
                            <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.promotionCategory}</span> →{" "}
                            <Chip label={MOCK_APPRAISAL.promotionOverride.category} {...getCategoryColor(MOCK_APPRAISAL.promotionOverride.category)} />
                          </p>
                          <p className="text-[10px] text-[#6B7280] italic">"{MOCK_APPRAISAL.promotionOverride.reason}"</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[#F9FAFB] rounded-lg space-y-2">
                      <p className="text-[10px] font-bold text-[#6B7280]">Salary Increment</p>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                        <p className="text-[18px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.salaryScore}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                        <Chip label={MOCK_APPRAISAL.salaryCategory!} {...getCategoryColor(MOCK_APPRAISAL.salaryCategory!)} />
                      </div>
                      {MOCK_APPRAISAL.salaryOverride ? (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                          <p className="text-[11px] text-[#374151] mb-1">
                            <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.salaryCategory}</span> →{" "}
                            <Chip label={MOCK_APPRAISAL.salaryOverride.category} {...getCategoryColor(MOCK_APPRAISAL.salaryOverride.category)} />
                          </p>
                          <p className="text-[10px] text-[#6B7280] italic">"{MOCK_APPRAISAL.salaryOverride.reason}"</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#9CA3AF] pt-2 border-t border-gray-200">No override</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F9FAFB] rounded-lg space-y-2">
                    <div>
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                      <p className="text-[18px] font-bold text-[#1A1F2E]">
                        {MOCK_APPRAISAL.decisionType === "Promotion" ? MOCK_APPRAISAL.promotionScore : MOCK_APPRAISAL.salaryScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                      <Chip label={MOCK_APPRAISAL.decisionType === "Promotion" ? MOCK_APPRAISAL.promotionCategory! : MOCK_APPRAISAL.salaryCategory!}
                        {...getCategoryColor(MOCK_APPRAISAL.decisionType === "Promotion" ? MOCK_APPRAISAL.promotionCategory! : MOCK_APPRAISAL.salaryCategory!)} />
                    </div>
                    {MOCK_APPRAISAL.promotionOverride && MOCK_APPRAISAL.decisionType === "Promotion" && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                        <p className="text-[11px] text-[#374151] mb-1">
                          <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.promotionCategory}</span> →{" "}
                          <Chip label={MOCK_APPRAISAL.promotionOverride.category} {...getCategoryColor(MOCK_APPRAISAL.promotionOverride.category)} />
                        </p>
                        <p className="text-[10px] text-[#6B7280] italic">"{MOCK_APPRAISAL.promotionOverride.reason}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Insight */}
                {MOCK_APPRAISAL.aiInsight && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-[10px] font-semibold text-[#9CA3AF] mb-2">AI-generated insight</p>
                    <p className="text-[11px] text-[#374151] leading-relaxed">{MOCK_APPRAISAL.aiInsight}</p>
                  </div>
                )}

                {/* Manager Comment */}
                <div className="p-4 bg-[#F9FAFB] rounded-lg border-l-4" style={{ borderColor: TEAL }}>
                  <p className="text-[10px] font-semibold text-[#6B7280] mb-2">Manager Comment</p>
                  <p className="text-[11px] text-[#374151] italic">"{MOCK_APPRAISAL.managerComment}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ZONE C — HR Appraisal Review Panel (only shown in HR Admin view)
          ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "HR Admin" && (
        <div className="bg-white rounded-lg p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "2px solid #DC2626" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-bold text-[#1A1F2E]">Appraisal Review — HR Admin</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Read-only manager submission + HR actions</p>
            </div>
            {panelState === "Pending" && (
              <Chip label="Pending" color="#D97706" bg="#FEF3C7" />
            )}
            {panelState === "Approved" && (
              <Chip label="Approved" color="#059669" bg="#ECFDF5" />
            )}
            {panelState === "Returned" && (
              <Chip label="Returned" color="#DC2626" bg="#FEE2E2" />
            )}
          </div>

          {/* Read-only Manager Submission */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[#9CA3AF]">Review Period:</span>
              <span className="font-semibold text-[#1A1F2E]">{MOCK_APPRAISAL.reviewPeriod}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[#9CA3AF]">Decision Type:</span>
              <Chip label={MOCK_APPRAISAL.decisionType} color={TEAL} bg="#E8FAF7" />
            </div>

            {/* Both decisions */}
            {MOCK_APPRAISAL.decisionType === "Both" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F9FAFB] rounded-lg space-y-3">
                  <h3 className="text-[11px] font-bold text-[#1A1F2E]">Promotion</h3>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                    <p className="text-[18px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.promotionScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                    <Chip label={MOCK_APPRAISAL.promotionCategory!} {...getCategoryColor(MOCK_APPRAISAL.promotionCategory!)} />
                  </div>
                  {MOCK_APPRAISAL.promotionOverride ? (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[10px] font-semibold text-[#6B7280] mb-1">Manager Override</p>
                      <p className="text-[11px] text-[#374151]">
                        <span className="line-through text-[#9CA3AF]">{MOCK_APPRAISAL.promotionCategory}</span> →{" "}
                        <Chip label={MOCK_APPRAISAL.promotionOverride.category} {...getCategoryColor(MOCK_APPRAISAL.promotionOverride.category)} />
                      </p>
                      <p className="text-[10px] text-[#6B7280] mt-2 italic">"{MOCK_APPRAISAL.promotionOverride.reason}"</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#9CA3AF]">No override</p>
                  )}
                </div>

                <div className="p-4 bg-[#F9FAFB] rounded-lg space-y-3">
                  <h3 className="text-[11px] font-bold text-[#1A1F2E]">Salary Increment</h3>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Readiness Score</p>
                    <p className="text-[18px] font-bold text-[#1A1F2E]">{MOCK_APPRAISAL.salaryScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-1">System Category</p>
                    <Chip label={MOCK_APPRAISAL.salaryCategory!} {...getCategoryColor(MOCK_APPRAISAL.salaryCategory!)} />
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">No override</p>
                </div>
              </div>
            )}

            {/* AI Insight */}
            {MOCK_APPRAISAL.aiInsight && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-semibold text-[#9CA3AF] mb-2">AI-generated insight</p>
                <p className="text-[11px] text-[#374151] leading-relaxed">{MOCK_APPRAISAL.aiInsight}</p>
              </div>
            )}

            {/* Manager Comment */}
            <div className="p-4 bg-[#F9FAFB] rounded-lg border-l-4" style={{ borderColor: TEAL }}>
              <p className="text-[10px] font-semibold text-[#6B7280] mb-2">Manager Comment</p>
              <p className="text-[11px] text-[#374151] italic">"{MOCK_APPRAISAL.managerComment}"</p>
            </div>
          </div>

          {/* HR Actions */}
          {panelState === "Pending" && hrAction === "" && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleHrApprove}
                className="flex-1 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: "#059669" }}>
                <CheckCircle size={14} className="inline mr-1" /> Approve
              </button>
              <button onClick={() => setHrAction("override")}
                className="flex-1 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: "#F59E0B" }}>
                <AlertCircle size={14} className="inline mr-1" /> Override and Approve
              </button>
              <button onClick={() => setHrAction("return")}
                className="flex-1 px-4 py-2.5 border-2 rounded-lg text-[12px] font-semibold transition-colors"
                style={{ borderColor: "#DC2626", color: "#DC2626" }}>
                <XCircle size={14} className="inline mr-1" /> Return for Revision
              </button>
            </div>
          )}

          {panelState === "Pending" && hrAction === "override" && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <p className="text-[12px] font-semibold text-[#1A1F2E]">HR Override</p>
              {MOCK_APPRAISAL.decisionType === "Both" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-[#6B7280]">Promotion Category</label>
                    <select value={hrOverridePromotionCat} onChange={(e) => setHrOverridePromotionCat(e.target.value as Category)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option>Ready</option>
                      <option>Borderline</option>
                      <option>Needs Improvement</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-[#6B7280]">Salary Category</label>
                    <select value={hrOverrideSalaryCat} onChange={(e) => setHrOverrideSalaryCat(e.target.value as Category)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option>Ready</option>
                      <option>Borderline</option>
                      <option>Needs Improvement</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-[#6B7280]">Final Category</label>
                  <select value={hrOverridePromotionCat} onChange={(e) => setHrOverridePromotionCat(e.target.value as Category)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Ready</option>
                    <option>Borderline</option>
                    <option>Needs Improvement</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-semibold text-[#6B7280] mb-1">HR Override Reason <span className="text-[#DC2626]">*</span></label>
                <textarea value={hrOverrideReason} onChange={(e) => setHrOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3} placeholder="Provide detailed reason for override..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setHrAction("")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-[11px] font-semibold text-[#374151] hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleHrOverrideApprove}
                  className="px-4 py-2 rounded-lg text-[11px] font-semibold text-white"
                  style={{ backgroundColor: "#F59E0B" }}>
                  Confirm Override and Approve
                </button>
              </div>
            </div>
          )}

          {panelState === "Pending" && hrAction === "return" && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5">Return Reason for Manager <span className="text-[#DC2626]">*</span></label>
                <textarea value={hrReturnReason} onChange={(e) => setHrReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-[#1A1F2E] resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3} placeholder="Explain what needs to be revised..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setHrAction("")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-[11px] font-semibold text-[#374151] hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleHrReturn}
                  className="px-4 py-2 rounded-lg text-[11px] font-semibold text-white"
                  style={{ backgroundColor: "#DC2626" }}>
                  Confirm Return
                </button>
              </div>
            </div>
          )}

          {panelState === "Approved" && (
            <div className="pt-4 border-t border-gray-200">
              <div className="p-4 bg-[#ECFDF5] border border-[#059669] rounded-lg flex items-start gap-3">
                <CheckCircle size={16} className="text-[#059669] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#065F46] mb-1">Approved by HR</p>
                  <p className="text-[11px] text-[#065F46]">Approval Date: May 8, 2026</p>
                  {MOCK_APPRAISAL.hrOverride && (
                    <p className="text-[10px] text-[#065F46] mt-2">
                      HR Override applied: {MOCK_APPRAISAL.hrOverride.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {panelState === "Returned" && (
            <div className="pt-4 border-t border-gray-200">
              <div className="p-4 bg-[#FEE2E2] border border-[#DC2626] rounded-lg flex items-start gap-3">
                <XCircle size={16} className="text-[#DC2626] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#991B1B] mb-1">Returned to Manager</p>
                  <p className="text-[11px] text-[#991B1B]">
                    Return Reason: "Please provide more specific examples of leadership demonstrated in Q4 project delivery."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, File, Sparkles, Loader } from "lucide-react";
import { ALL_QUIZZES as STORE_QUIZZES, quizStatus as storeQuizStatus, updateQuizStatus } from "../courseStore";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
type QuizModuleStatus = "pending" | "approved" | "rejected" | "regenerating" | "regenerated";
type DifficultyLevel = "Easy" | "Medium" | "Hard";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  difficulty: DifficultyLevel;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  sopName: string;
  department: string;
  dateGenerated: string;
  questions: QuizQuestion[];
}

interface QuizModuleData {
  status: QuizModuleStatus;
  rejectionReason: string;
  version: number;
}

interface ReviewHistoryEntry {
  type: "approved" | "rejected" | "regenerated";
  reason?: string;
  timestamp: string;
  reviewer?: string;
}

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<QuizModuleStatus, { color: string; bg: string; label: string }> = {
  pending:      { color: "#D97706", bg: "#FEF3C7", label: "Pending" },
  approved:     { color: "#059669", bg: "#ECFDF5", label: "Approved" },
  rejected:     { color: "#DC2626", bg: "#FEE2E2", label: "Rejected" },
  regenerating: { color: TEAL,      bg: "#E8FAF7", label: "Regenerating" },
  regenerated:  { color: TEAL,      bg: "#E8FAF7", label: "Regenerated" },
};

function getDifficultyPill(d: DifficultyLevel): { color: string; bg: string } {
  switch (d) {
    case "Easy":   return { color: "#059669", bg: "#ECFDF5" };
    case "Medium": return { color: "#D97706", bg: "#FEF3C7" };
    case "Hard":   return { color: "#DC2626", bg: "#FEE2E2" };
  }
}

// ── Mock quiz content ─────────────────────────────────────────────────────────
const MOCK_QUIZZES: Quiz[] = [
  {
    id: "Q001", sopName: "R32 Refrigerant Safety & Handling", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q001-1", questionNumber: 1, questionText: "What is the minimum password length required according to the Data Security Protocol?", difficulty: "Easy",
        options: [{ id: "A", text: "6 characters", isCorrect: false }, { id: "B", text: "8 characters", isCorrect: false }, { id: "C", text: "12 characters", isCorrect: true }, { id: "D", text: "16 characters", isCorrect: false }] },
      { id: "Q001-2", questionNumber: 2, questionText: "How often should employees change their system passwords?", difficulty: "Medium",
        options: [{ id: "A", text: "Every 30 days", isCorrect: false }, { id: "B", text: "Every 60 days", isCorrect: false }, { id: "C", text: "Every 90 days", isCorrect: true }, { id: "D", text: "Every 180 days", isCorrect: false }] },
      { id: "Q001-3", questionNumber: 3, questionText: "What action should be taken if a phishing email is detected?", difficulty: "Easy",
        options: [{ id: "A", text: "Delete it immediately", isCorrect: false }, { id: "B", text: "Forward to IT Security team", isCorrect: true }, { id: "C", text: "Reply to confirm sender identity", isCorrect: false }, { id: "D", text: "Click links to investigate", isCorrect: false }] },
      { id: "Q001-4", questionNumber: 4, questionText: "Which of the following is NOT allowed when handling sensitive data?", difficulty: "Hard",
        options: [{ id: "A", text: "Storing on encrypted drives", isCorrect: false }, { id: "B", text: "Sharing via personal email", isCorrect: true }, { id: "C", text: "Using VPN for remote access", isCorrect: false }, { id: "D", text: "Locking computer when away", isCorrect: false }] },
      { id: "Q001-5", questionNumber: 5, questionText: "What is the recommended action when leaving your workstation?", difficulty: "Easy",
        options: [{ id: "A", text: "Leave it running", isCorrect: false }, { id: "B", text: "Lock the screen (Win+L)", isCorrect: true }, { id: "C", text: "Turn off monitor only", isCorrect: false }, { id: "D", text: "Close all applications", isCorrect: false }] },
    ],
  },
  {
    id: "Q002", sopName: "Site Selection & Mounting", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q002-1", questionNumber: 1, questionText: "What is the minimum clearance required for outdoor unit installation?", difficulty: "Medium",
        options: [{ id: "A", text: "10 cm from wall", isCorrect: false }, { id: "B", text: "15 cm from wall", isCorrect: true }, { id: "C", text: "20 cm from wall", isCorrect: false }, { id: "D", text: "25 cm from wall", isCorrect: false }] },
      { id: "Q002-2", questionNumber: 2, questionText: "Which surface is NOT suitable for mounting the indoor unit?", difficulty: "Easy",
        options: [{ id: "A", text: "Concrete wall", isCorrect: false }, { id: "B", text: "Plasterboard only", isCorrect: true }, { id: "C", text: "Brick wall", isCorrect: false }, { id: "D", text: "Reinforced drywall", isCorrect: false }] },
      { id: "Q002-3", questionNumber: 3, questionText: "What should be checked before drilling mounting holes?", difficulty: "Hard",
        options: [{ id: "A", text: "Wall color", isCorrect: false }, { id: "B", text: "Hidden pipes and wiring", isCorrect: true }, { id: "C", text: "Room temperature", isCorrect: false }, { id: "D", text: "Time of day", isCorrect: false }] },
    ],
  },
  {
    id: "Q003", sopName: "Piping Connection & Air Purging", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q003-1", questionNumber: 1, questionText: "What is the correct torque specification for φ6mm flare nut connections?", difficulty: "Medium",
        options: [{ id: "A", text: "10–15 N·m", isCorrect: false }, { id: "B", text: "15–20 N·m", isCorrect: true }, { id: "C", text: "30–35 N·m", isCorrect: false }, { id: "D", text: "50–55 N·m", isCorrect: false }] },
      { id: "Q003-2", questionNumber: 2, questionText: "What vacuum level must be achieved before opening refrigerant valves?", difficulty: "Hard",
        options: [{ id: "A", text: "500Pa absolute", isCorrect: false }, { id: "B", text: "200Pa absolute", isCorrect: false }, { id: "C", text: "100Pa absolute", isCorrect: true }, { id: "D", text: "50Pa absolute", isCorrect: false }] },
      { id: "Q003-3", questionNumber: 3, questionText: "Which side must ALL piping connections be made on for R32 models?", difficulty: "Medium",
        options: [{ id: "A", text: "Indoor side only", isCorrect: false }, { id: "B", text: "Either side", isCorrect: false }, { id: "C", text: "Outdoor side only", isCorrect: true }, { id: "D", text: "Junction box side", isCorrect: false }] },
      { id: "Q003-4", questionNumber: 4, questionText: "Which tool is essential for flaring copper pipes before connection?", difficulty: "Easy",
        options: [{ id: "A", text: "Pipe cutter", isCorrect: false }, { id: "B", text: "Flaring tool", isCorrect: true }, { id: "C", text: "Wrench", isCorrect: false }, { id: "D", text: "Screwdriver", isCorrect: false }] },
    ],
  },
  {
    id: "Q004", sopName: "Electrical Wiring & Cable Specs", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q004-1", questionNumber: 1, questionText: "What is the minimum cable size for a 3-phase 5HP unit?", difficulty: "Hard",
        options: [{ id: "A", text: "1.5 mm²", isCorrect: false }, { id: "B", text: "2.5 mm²", isCorrect: true }, { id: "C", text: "4.0 mm²", isCorrect: false }, { id: "D", text: "6.0 mm²", isCorrect: false }] },
      { id: "Q004-2", questionNumber: 2, questionText: "Which safety device must be installed in the circuit to protect against earth faults?", difficulty: "Easy",
        options: [{ id: "A", text: "Timer", isCorrect: false }, { id: "B", text: "ELCB/RCD", isCorrect: true }, { id: "C", text: "Dimmer", isCorrect: false }, { id: "D", text: "Transformer", isCorrect: false }] },
      { id: "Q004-3", questionNumber: 3, questionText: "What should be verified before energizing the system after wiring?", difficulty: "Medium",
        options: [{ id: "A", text: "Cable color only", isCorrect: false }, { id: "B", text: "All connections and earthing continuity", isCorrect: true }, { id: "C", text: "Unit color", isCorrect: false }, { id: "D", text: "Remote batteries", isCorrect: false }] },
      { id: "Q004-4", questionNumber: 4, questionText: "What is the correct voltage tolerance range for standard single-phase units?", difficulty: "Medium",
        options: [{ id: "A", text: "180–200V", isCorrect: false }, { id: "B", text: "200–240V (±10%)", isCorrect: true }, { id: "C", text: "240–280V", isCorrect: false }, { id: "D", text: "280–320V", isCorrect: false }] },
      { id: "Q004-5", questionNumber: 5, questionText: "What is the minimum ELCB trip current sensitivity required for AC installation circuits?", difficulty: "Hard",
        options: [{ id: "A", text: "100mA", isCorrect: false }, { id: "B", text: "30mA", isCorrect: true }, { id: "C", text: "60mA", isCorrect: false }, { id: "D", text: "10mA", isCorrect: false }] },
    ],
  },
  {
    id: "Q005", sopName: "Maintenance & Troubleshooting", department: "Technical", dateGenerated: "2026-05-15",
    questions: [
      { id: "Q005-1", questionNumber: 1, questionText: "How often should air filters be cleaned according to the SOP?", difficulty: "Easy",
        options: [{ id: "A", text: "Every week", isCorrect: false }, { id: "B", text: "Every 2 weeks or 100 hours of operation", isCorrect: true }, { id: "C", text: "Every month", isCorrect: false }, { id: "D", text: "Every 3 months", isCorrect: false }] },
      { id: "Q005-2", questionNumber: 2, questionText: "What symptom most clearly indicates a refrigerant leak?", difficulty: "Medium",
        options: [{ id: "A", text: "Loud compressor noise", isCorrect: false }, { id: "B", text: "Ice formation on pipes with reduced cooling", isCorrect: true }, { id: "C", text: "High power consumption only", isCorrect: false }, { id: "D", text: "Remote not responding", isCorrect: false }] },
      { id: "Q005-3", questionNumber: 3, questionText: "Which component should be checked first when a unit fails to start?", difficulty: "Easy",
        options: [{ id: "A", text: "Compressor winding", isCorrect: false }, { id: "B", text: "Power supply and circuit breaker", isCorrect: true }, { id: "C", text: "Indoor fan blade", isCorrect: false }, { id: "D", text: "Drain pipe blockage", isCorrect: false }] },
      { id: "Q005-4", questionNumber: 4, questionText: "What does fault code E1 typically indicate on this unit?", difficulty: "Hard",
        options: [{ id: "A", text: "Filter clogged", isCorrect: false }, { id: "B", text: "High-pressure protection triggered", isCorrect: true }, { id: "C", text: "Remote signal loss", isCorrect: false }, { id: "D", text: "Drain pump failure", isCorrect: false }] },
    ],
  },
];

// Demo: Q004 = STATE 4 (regenerated), Q005 = STATE 2 (rejected)
const INITIAL_QUIZ_DATA: Record<string, QuizModuleData> = {
  "Q001": { status: "approved",    rejectionReason: "", version: 1 },
  "Q002": { status: "approved",    rejectionReason: "", version: 1 },
  "Q003": { status: "pending",     rejectionReason: "", version: 1 },
  "Q004": {
    status: "regenerated",
    rejectionReason: "Quiz questions don't cover cable sizing calculations or fault current determination. Need questions on ELCB trip current settings, earthing compliance checks, and voltage tolerance verification per the SOP.",
    version: 2,
  },
  "Q005": {
    status: "rejected",
    rejectionReason: "The troubleshooting table is incomplete — it only covers 3 fault cases but the SOP has 9. The filter cleaning procedure is also missing the 100-hour cleaning interval requirement. Please regenerate with all fault cases and full maintenance steps.",
    version: 1,
  },
};

// Initial review history per quiz
const INITIAL_HISTORY: Record<string, ReviewHistoryEntry[]> = {
  "Q001": [{ type: "approved", timestamp: "2026-05-16 09:15", reviewer: "Sarah Chen" }],
  "Q002": [{ type: "approved", timestamp: "2026-05-16 10:22", reviewer: "Michael Torres" }],
  "Q003": [],
  "Q004": [
    { type: "regenerated", timestamp: "2026-05-16 14:30" },
    { type: "rejected", reason: "Quiz questions don't cover cable sizing calculations or fault current determination. Need questions on ELCB trip current settings, earthing compliance checks, and voltage tolerance verification per the SOP.", timestamp: "2026-05-16 13:55", reviewer: "Sarah Chen" },
  ],
  "Q005": [
    { type: "rejected", reason: "The troubleshooting table is incomplete — it only covers 3 fault cases but the SOP has 9. The filter cleaning procedure is also missing the 100-hour cleaning interval requirement. Please regenerate with all fault cases and full maintenance steps.", timestamp: "2026-05-15 16:45", reviewer: "David Kim" },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export function QuizReview() {
  const [quizData, setQuizData] = useState<Record<string, QuizModuleData>>(INITIAL_QUIZ_DATA);
  const [history, setHistory] = useState<Record<string, ReviewHistoryEntry[]>>(INITIAL_HISTORY);
  const [selected, setSelected] = useState<Quiz>(MOCK_QUIZZES[2]);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [barWidth, setBarWidth] = useState(0);

  const qd = quizData[selected.id];
  const st = STATUS_STYLE[qd.status];

  useEffect(() => {
    if (qd.status === "regenerating") {
      setBarWidth(0);
      const t = setTimeout(() => setBarWidth(100), 60);
      return () => clearTimeout(t);
    }
  }, [selected.id, qd.status]);

  const startRegeneration = (id: string) => {
    setQuizData(prev => ({ ...prev, [id]: { ...prev[id], status: "regenerating" } }));
    setTimeout(() => {
      setQuizData(prev => ({ ...prev, [id]: { ...prev[id], status: "regenerated", version: 2 } }));
      setHistory(prev => ({
        ...prev,
        [id]: [{ type: "regenerated", timestamp: new Date().toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) }, ...(prev[id] || [])],
      }));
    }, 3000);
  };

  const approve = () => {
    const ts = new Date().toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    setQuizData(prev => ({ ...prev, [selected.id]: { ...prev[selected.id], status: "approved" } }));
    setHistory(prev => ({ ...prev, [selected.id]: [{ type: "approved", timestamp: ts, reviewer: "Current Trainer" }, ...(prev[selected.id] || [])] }));
    updateQuizStatus(selected.id, "approved");
    setRejecting(false);
    setRejectReason("");
  };

  const submitRejection = (reason: string) => {
    const id = selected.id;
    const ts = new Date().toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    setQuizData(prev => ({ ...prev, [id]: { ...prev[id], status: "rejected", rejectionReason: reason } }));
    setHistory(prev => ({ ...prev, [id]: [{ type: "rejected", reason, timestamp: ts, reviewer: "Current Trainer" }, ...(prev[id] || [])] }));
    updateQuizStatus(id, "rejected");
    setRejecting(false);
    setRejectReason("");
    setTimeout(() => startRegeneration(id), 900);
  };

  const selectQuiz = (quiz: Quiz) => {
    if (quizData[quiz.id].status === "regenerating") return;
    setSelected(quiz);
    setRejecting(false);
    setRejectReason("");
  };

  const awaitingCount = MOCK_QUIZZES.filter(q => ["pending", "regenerated"].includes(quizData[q.id].status)).length;
  const selectedHistory = history[selected.id] || [];

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-[#F4F6F9]">

      {/* ── Left Panel ────────────────────────────────────────────────────────── */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#1A1F2E]">Pending Review</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: TEAL, backgroundColor: "#E8FAF7" }}>{awaitingCount}</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{awaitingCount} awaiting review</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <File size={14} className="text-[#9CA3AF] shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-[#1A1F2E]">Installation-Manual.pdf</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{MOCK_QUIZZES.length} quizzes generated</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[24px] top-0 bottom-0 w-[2px] bg-[#E5E7EB]" />
            {MOCK_QUIZZES.map((quiz, index) => {
              const data = quizData[quiz.id];
              const isSelected = selected.id === quiz.id;
              const isRegen = data.status === "regenerating";
              const isRegenerated = data.status === "regenerated";
              const isRejected = data.status === "rejected";
              const ss = STATUS_STYLE[data.status];
              return (
                <button
                  key={quiz.id}
                  onClick={() => selectQuiz(quiz)}
                  disabled={isRegen}
                  className={`w-full text-left pl-6 pr-4 py-3 transition-all relative ${
                    isRegen ? "cursor-not-allowed animate-pulse" : ""
                  } ${isSelected ? "bg-[#E8FAF7]" : isRegen ? "bg-white" : "hover:bg-[#F9FAFB]"}`}
                >
                  {isSelected && !isRegen && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r" style={{ backgroundColor: TEAL }} />
                  )}
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[12px] font-semibold truncate ${isSelected ? "text-[#1A1F2E]" : "text-[#374151]"}`}>
                          Quiz {index + 1}: {quiz.sopName}
                        </p>
                        {isRegenerated && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] shrink-0">v2</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{quiz.department} · {quiz.questions.length} Qs</p>
                      <div className="mt-1.5">
                        {isRegen ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin shrink-0" style={{ borderColor: `${TEAL} transparent ${TEAL} ${TEAL}` }} />
                            <span className="text-[10px]" style={{ color: TEAL }}>Regenerating...</span>
                          </div>
                        ) : isRegenerated ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: TEAL, backgroundColor: "#E8FAF7" }}>Regenerated</span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: ss.color, backgroundColor: ss.bg }}>{ss.label}</span>
                        )}
                      </div>
                      {isRejected && data.rejectionReason && (
                        <p className="text-[10px] italic text-[#DC2626] mt-1 truncate">Reason: {data.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Center Panel ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-[#1A1F2E]">{selected.sopName}</h1>
                {qd.version === 2 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: TEAL, backgroundColor: "#E8FAF7" }}>v2</span>}
              </div>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{selected.department} · {selected.questions.length} Questions</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
          </div>
        </div>

        {/* State banner */}
        {qd.status === "rejected" && (
          <div className="flex items-center gap-2 px-6 py-2.5 shrink-0" style={{ backgroundColor: "#FEF2F2", borderBottom: "1px solid #FECACA" }}>
            <XCircle size={14} style={{ color: "#DC2626" }} />
            <span className="text-[12px] font-bold text-[#991B1B]">This quiz was rejected —</span>
            <span className="text-[12px] italic text-[#DC2626] truncate flex-1">{qd.rejectionReason}</span>
          </div>
        )}
        {qd.status === "regenerated" && (
          <div className="flex items-center gap-2 px-6 py-2.5 shrink-0" style={{ backgroundColor: "#F0FDF9", borderBottom: "1px solid #A7F3D0" }}>
            <Sparkles size={13} style={{ color: TEAL }} />
            <span className="text-[12px] font-bold text-[#065F46]">Version 2 ready for review</span>
            <span className="text-[12px] italic text-[#059669] ml-1 truncate flex-1">Regenerated based on: {qd.rejectionReason.slice(0, 55)}…</span>
          </div>
        )}

        {/* STATE 3 — Regenerating center */}
        {qd.status === "regenerating" ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start pt-16 bg-[#F4F6F9]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: "#E8FAF7" }}>
              <Sparkles size={28} style={{ color: TEAL }} />
            </div>
            <h2 className="text-[18px] font-bold text-[#1A1F2E] mt-5">AI Regenerating Quiz</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-1.5">Analysing trainer feedback and rewriting quiz questions...</p>
            <div className="mt-6 bg-white border border-[#E5E7EB] rounded-lg p-4" style={{ maxWidth: 480 }}>
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Trainer Feedback:</p>
              <p className="text-[13px] italic text-[#374151] leading-relaxed">{qd.rejectionReason}</p>
            </div>
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TEAL, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${qd.status === "rejected" ? "opacity-50 pointer-events-none" : ""}`}>
            {selected.questions.map((question) => {
              const diffPill = getDifficultyPill(question.difficulty);
              return (
                <div key={question.id} className="bg-white rounded-lg p-5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E8FAF7", color: TEAL }}>
                        <span className="text-[12px] font-bold">{question.questionNumber}</span>
                      </div>
                      <p className="text-[14px] font-semibold text-[#1A1F2E] leading-relaxed">{question.questionText}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: diffPill.color, backgroundColor: diffPill.bg }}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 ${option.isCorrect ? "border-[#00C9A7] bg-[#E8FAF7]" : "border-gray-100 bg-white"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${option.isCorrect ? "bg-[#00C9A7] text-white" : "bg-gray-100 text-[#9CA3AF]"}`}>
                          <span className="text-[11px] font-bold">{option.id}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <p className={`text-[13px] ${option.isCorrect ? "font-semibold text-[#1A1F2E]" : "text-[#6B7280]"}`}>{option.text}</p>
                          {option.isCorrect && <CheckCircle size={16} style={{ color: TEAL }} className="shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Right Panel ───────────────────────────────────────────────────────── */}
      <aside className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[14px] font-bold text-[#1A1F2E]">Review Actions</h2>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Approve or request changes</p>
        </div>

        {/* Actions area */}
        <div className="shrink-0 p-5 border-b border-gray-100 space-y-3">

          {/* STATE 1 — Pending */}
          {qd.status === "pending" && (
            <>
              <button onClick={approve} className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ backgroundColor: TEAL }}>
                <CheckCircle size={14} className="inline mr-2" /> Approve Quiz
              </button>
              <button onClick={() => setRejecting(r => !r)} className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold border-2 hover:bg-red-50 transition-all" style={{ borderColor: "#DC2626", color: "#DC2626" }}>
                <XCircle size={14} className="inline mr-2" /> Reject Quiz
              </button>
              {rejecting && (
                <div className="pt-3 space-y-3 border-t border-gray-100">
                  <label className="block text-[11px] font-semibold text-[#6B7280]">Rejection Reason <span className="text-[#DC2626]">*</span></label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain what needs to be improved in the quiz..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={4}
                  />
                  <button onClick={() => { if (rejectReason.trim()) submitRejection(rejectReason); }} disabled={!rejectReason.trim()}
                    className="w-full px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ backgroundColor: "#DC2626" }}>
                    Submit Feedback to AI
                  </button>
                </div>
              )}
            </>
          )}

          {/* STATE 2 — Rejected */}
          {qd.status === "rejected" && (
            <>
              <div className="rounded-lg p-3.5" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} style={{ color: "#DC2626" }} />
                  <span className="text-[13px] font-bold text-[#991B1B]">Rejected</span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mb-2">Rejection reason sent to AI:</p>
                <div className="px-3 py-2 rounded" style={{ backgroundColor: "#F9FAFB", borderLeft: "2px solid #D1D5DB" }}>
                  <p className="text-[12px] italic text-[#374151] leading-relaxed">{qd.rejectionReason}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <Loader size={11} className="animate-spin shrink-0" style={{ color: TEAL }} />
                  <span className="text-[11px]" style={{ color: TEAL }}>AI is analysing feedback and regenerating...</span>
                </div>
              </div>
              <button onClick={() => startRegeneration(selected.id)} className="w-full py-2.5 rounded-md text-[12px] font-semibold border transition-colors" style={{ color: TEAL, borderColor: TEAL, backgroundColor: "#E8FAF7" }}>
                ↻ Regenerate Now
              </button>
            </>
          )}

          {/* STATE 3 — Regenerating */}
          {qd.status === "regenerating" && (
            <div className="flex flex-col items-center py-6">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${TEAL} transparent ${TEAL} ${TEAL}` }} />
              <p className="text-[14px] font-bold text-[#1A1F2E] mt-4 text-center">Regenerating Quiz</p>
              <p className="text-[12px] text-[#9CA3AF] mt-1 text-center leading-relaxed">AI is rewriting questions based on trainer feedback</p>
              <div className="w-full mt-5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F9FAFB", borderLeft: "2px solid #D1D5DB" }}>
                <p className="text-[11px] font-semibold text-[#9CA3AF] mb-1">Feedback:</p>
                <p className="text-[11px] italic text-[#374151] leading-relaxed">{qd.rejectionReason}</p>
              </div>
              <div className="w-full mt-5">
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                  <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: TEAL, transition: "width 3s linear" }} />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">Estimated time: ~30 seconds</p>
              </div>
            </div>
          )}

          {/* STATE 4 — Regenerated */}
          {qd.status === "regenerated" && (
            <>
              <div className="rounded-lg p-3.5" style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} style={{ color: "#059669" }} />
                  <span className="text-[13px] font-bold text-[#065F46]">New Version Ready</span>
                </div>
                <p className="text-[11px] text-[#059669]">Version 2 generated based on your feedback</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9CA3AF] mb-1.5">Your feedback was:</p>
                <div className="px-3 py-2 rounded" style={{ backgroundColor: "#F9FAFB", borderLeft: "2px solid #D1D5DB" }}>
                  <p className="text-[12px] italic text-[#374151] leading-relaxed">{qd.rejectionReason}</p>
                </div>
              </div>
              <button onClick={approve} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90" style={{ backgroundColor: TEAL }}>
                <CheckCircle size={14} /> Approve v2
              </button>
              <button onClick={() => setRejecting(r => !r)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold border-2 hover:bg-red-50 transition-all" style={{ borderColor: "#DC2626", color: "#DC2626" }}>
                <XCircle size={14} /> Reject Again
              </button>
              {rejecting && (
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Describe why this version is still unsatisfactory…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                    rows={3}
                  />
                  <button onClick={() => { if (rejectReason.trim()) submitRejection(rejectReason); }} disabled={!rejectReason.trim()}
                    className="w-full py-2 rounded-lg text-[12px] font-semibold text-white bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed">
                    Submit &amp; Regenerate Again
                  </button>
                </div>
              )}
            </>
          )}

          {/* Approved */}
          {qd.status === "approved" && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <CheckCircle size={16} style={{ color: "#059669" }} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-[#065F46]">Quiz Approved</p>
                <p className="text-[11px] text-[#059669] mt-0.5">This quiz is ready for staff training</p>
              </div>
            </div>
          )}
        </div>

        {/* Review History */}
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-[12px] font-bold text-[#1A1F2E] mb-3">Review History</h3>
          {selectedHistory.length === 0 ? (
            <p className="text-[11px] text-[#9CA3AF] italic">No review history yet</p>
          ) : (
            <div className="space-y-3">
              {selectedHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F9FAFB] rounded-lg"
                  style={{
                    borderLeft: `2px solid ${item.type === "approved" ? "#059669" : item.type === "rejected" ? "#DC2626" : TEAL}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === "approved" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">Approved</span>
                    )}
                    {item.type === "rejected" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626]">Rejected</span>
                    )}
                    {item.type === "regenerated" && (
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} style={{ color: TEAL }} />
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8FAF7", color: TEAL }}>AI Regenerated</span>
                      </div>
                    )}
                    <span className="text-[10px] text-[#9CA3AF]">{item.timestamp}</span>
                  </div>
                  {item.reviewer && <p className="text-[11px] text-[#6B7280] mb-1">by {item.reviewer}</p>}
                  {item.type === "regenerated" && (
                    <p className="text-[11px] text-[#059669] leading-relaxed">v2 generated based on trainer feedback</p>
                  )}
                  {item.type === "rejected" && item.reason && (
                    <div className="mt-2 px-3 py-2 rounded" style={{ backgroundColor: "#F9FAFB", borderLeft: "2px solid #D1D5DB" }}>
                      <p className="text-[11px] text-[#9CA3AF] mb-0.5">Rejection reason:</p>
                      <p className="text-[11px] italic text-[#374151] leading-relaxed">{item.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

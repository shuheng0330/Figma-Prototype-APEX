import { useState } from "react";
import { Clock, ChevronRight, CheckCircle, BookOpen, Award, File, Lock } from "lucide-react";

const TEAL = "#00C9A7";

interface Training {
  id: string;
  moduleNumber: number;
  title: string;
  dueDate: string;
  progress: number;
  module: string;
  locked: boolean;
}

const TRAININGS: Training[] = [
  {
    id: "1",
    moduleNumber: 1,
    title: "R32 Refrigerant Safety",
    dueDate: "30 May 2026",
    progress: 100,
    module: "R32 Refrigerant Safety",
    locked: false,
  },
  {
    id: "2",
    moduleNumber: 2,
    title: "Site Selection & Mounting",
    dueDate: "30 May 2026",
    progress: 100,
    module: "Site Selection & Mounting",
    locked: false,
  },
  {
    id: "3",
    moduleNumber: 3,
    title: "Piping Connection & Air Purging",
    dueDate: "30 May 2026",
    progress: 60,
    module: "Piping Connection & Air Purging",
    locked: false,
  },
  {
    id: "4",
    moduleNumber: 4,
    title: "Electrical Wiring & Cable Specs",
    dueDate: "30 May 2026",
    progress: 0,
    module: "Electrical Wiring & Cable Specs",
    locked: true,
  },
  {
    id: "5",
    moduleNumber: 5,
    title: "Maintenance & Troubleshooting",
    dueDate: "30 May 2026",
    progress: 0,
    module: "Maintenance & Troubleshooting",
    locked: true,
  },
];

const COMPLETED = [
  { title: "Safety Procedures Manual", modules: 5, date: "16 Apr 2026", score: 94 },
  { title: "Customer Handover Protocol", modules: 3, date: "28 Mar 2026", score: 100 },
];

const QUIZ_QUESTIONS = [
  {
    q: "What is the first step in the data privacy protocol?",
    options: [
      "Encrypt all data immediately",
      "Classify data according to sensitivity level",
      "Report to the security team",
      "Share access credentials with colleagues",
    ],
    correct: 1,
  },
  {
    q: "How should sensitive data be transmitted across the network?",
    options: [
      "Via personal email for convenience",
      "Without encryption for speed",
      "Using approved encrypted channels only",
      "Any available communication tool",
    ],
    correct: 2,
  },
  {
    q: "When should you lock your workstation?",
    options: [
      "At the end of the day only",
      "When leaving your desk for any reason",
      "Once a week is sufficient",
      "Only when asked by your manager",
    ],
    correct: 1,
  },
  {
    q: "Who should you contact for suspected data breaches?",
    options: [
      "Your nearest colleague",
      "Post on the company forum",
      "The security team within 24 hours",
      "Wait and monitor the situation",
    ],
    correct: 2,
  },
  {
    q: "Which of these is classified as 'Restricted' data?",
    options: [
      "Company website content",
      "Public press releases",
      "Personal employee salary details",
      "Office building address",
    ],
    correct: 2,
  },
];

export function StaffPortal() {
  const [view, setView] = useState<"portal" | "material" | "quiz">("portal");
  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const startTraining = (t: Training) => {
    if (t.locked) return; // Don't start locked modules
    setActiveTraining(t);
    setView("material");
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  const startQuiz = () => {
    setView("quiz");
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  const submitAnswer = () => {
    if (selected === null) return;
    const correct = selected === QUIZ_QUESTIONS[qIdx].correct;
    if (correct) setScore((s) => s + 1);
    if (qIdx < QUIZ_QUESTIONS.length - 1) {
      setQIdx((i) => i + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  const total = QUIZ_QUESTIONS.length;
  const pct = Math.round(((qIdx + 1) / total) * 100);

  // ── Material View ─────────────────────────────────────────────────────────
  if (view === "material" && activeTraining) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-[840px]">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: activeTraining.deptColor, backgroundColor: `${activeTraining.deptColor}18` }}
              >
                {activeTraining.dept}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">{activeTraining.module}</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#1A1F2E] mb-2">
              {activeTraining.title}
            </h1>
            <p className="text-[13px] text-[#9CA3AF]">
              Please review the material below before proceeding to the quiz
            </p>
          </div>

          {/* Material Content */}
          <div
            className="bg-white rounded-lg p-8 mb-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <div className="prose prose-sm max-w-none">
              <h2 className="text-[18px] font-bold text-[#1A1F2E] mb-4">Overview</h2>
              <p className="text-[13px] text-[#374151] leading-relaxed mb-4">
                This training module covers essential guidelines and procedures that all staff members must understand and follow. The material presented here is critical for maintaining compliance and ensuring operational excellence.
              </p>

              <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-3 mt-6">Key Learning Objectives</h3>
              <ul className="list-disc list-inside space-y-2 text-[13px] text-[#374151] mb-4">
                <li>Understand the fundamental principles and requirements</li>
                <li>Recognize scenarios that require immediate action</li>
                <li>Apply best practices in day-to-day operations</li>
                <li>Know when and how to escalate issues appropriately</li>
              </ul>

              <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-3 mt-6">Core Procedures</h3>
              <p className="text-[13px] text-[#374151] leading-relaxed mb-4">
                The following procedures must be followed at all times to ensure compliance with company policies and industry standards. Failure to adhere to these guidelines may result in security incidents or regulatory violations.
              </p>

              <div className="bg-[#F9FAFB] border-l-4 border-[#00C9A7] p-4 rounded-r-lg mb-4">
                <p className="text-[12px] font-semibold text-[#1A1F2E] mb-1">Important Note</p>
                <p className="text-[12px] text-[#6B7280]">
                  Make sure to review all sections carefully. You will be tested on this material in the quiz that follows.
                </p>
              </div>

              <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-3 mt-6">Best Practices</h3>
              <ol className="list-decimal list-inside space-y-2 text-[13px] text-[#374151] mb-4">
                <li>Always classify and handle data according to its sensitivity level</li>
                <li>Use approved tools and channels for all communications</li>
                <li>Report any suspicious activity or potential violations immediately</li>
                <li>Keep your credentials secure and never share them with others</li>
                <li>Stay current with policy updates and training requirements</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setView("portal"); setActiveTraining(null); }}
              className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              ← Back to Portal
            </button>
            <button
              onClick={startQuiz}
              className="px-6 py-3 rounded-md text-[13px] font-semibold text-white transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: TEAL }}
            >
              Proceed to Quiz
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz Done ─────────────────────────────────────────────────────────
  if (view === "quiz" && done) {
    const finalPct = Math.round((score / total) * 100);
    const passed = finalPct >= 70;
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div
          className="bg-white rounded-lg p-10 w-full max-w-[520px] text-center"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: passed ? "#ECFDF5" : "#FEE2E2" }}
          >
            {passed ? (
              <Award size={28} style={{ color: TEAL }} />
            ) : (
              <CheckCircle size={28} className="text-[#DC2626]" />
            )}
          </div>
          <h2 className="text-[20px] font-bold text-[#1A1F2E] mb-1">
            {passed ? "Well done!" : "Keep practising"}
          </h2>
          <p className="text-[13px] text-[#9CA3AF] mb-6">
            You scored{" "}
            <span className="font-bold text-[#1A1F2E]">
              {score} / {total}
            </span>{" "}
            &nbsp;({finalPct}%)
          </p>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
            <div
              className="h-2 rounded-full"
              style={{ width: `${finalPct}%`, backgroundColor: passed ? TEAL : "#EF4444" }}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setView("portal"); setActiveTraining(null); }}
              className="px-5 py-2.5 rounded-md text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Back to Portal
            </button>
            <button
              onClick={() => { setQIdx(0); setSelected(null); setScore(0); setDone(false); }}
              className="px-5 py-2.5 rounded-md text-[13px] font-semibold text-[#1A1F2E] border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz Active ───────────────────────────────────────────────────────
  if (view === "quiz") {
    const q = QUIZ_QUESTIONS[qIdx];
    return (
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-[640px]">
          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] font-semibold text-[#1A1F2E]">
                  Question {qIdx + 1} of {total}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {activeTraining?.module}
                </p>
              </div>
              <span className="text-[12px] font-bold" style={{ color: TEAL }}>
                {pct}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: TEAL }}
              />
            </div>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-lg p-6"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <h2 className="text-[18px] font-bold text-[#1A1F2E] leading-snug mb-6">
              {q.q}
            </h2>

            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-md border-2 transition-all text-[13px] ${
                    selected === i
                      ? "border-[#00C9A7] bg-[#E8FAF7] text-[#1A1F2E]"
                      : "border-gray-100 bg-white text-[#374151] hover:border-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected === i
                        ? "border-[#00C9A7] bg-[#00C9A7]"
                        : "border-gray-300"
                    }`}
                  >
                    {selected === i && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setView("material")}
                className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                ← Back to Material
              </button>
              <div className="flex items-center gap-3">
                <button className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                  Skip
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={selected === null}
                  className="px-5 py-2.5 rounded-md text-[13px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: TEAL }}
                >
                  {qIdx < total - 1 ? "Submit Answer" : "Finish Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Portal Dashboard ──────────────────────────────────────────────────
  const inProgress = TRAININGS.filter((t) => t.progress > 0 && t.progress < 100).length;
  const completed = TRAININGS.filter((t) => t.progress === 100).length;
  const totalModules = TRAININGS.length;

  return (
    <div className="p-6">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg px-6 py-5 mb-6 flex items-center justify-between"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        <div>
          <h1 className="text-[18px] font-bold text-[#1A1F2E] leading-tight">
            Hello Ahmad 👋, you have{" "}
            <span style={{ color: TEAL }}>{inProgress} SOP training</span> in progress
          </h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            Complete your training modules to stay up to date with company standards.
          </p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0 ml-4"
          style={{ backgroundColor: TEAL }}
        >
          AS
        </div>
      </div>

      {/* ── SOP Label Above Cards ────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <File size={16} className="text-[#9CA3AF]" />
        <span className="text-[14px] font-bold text-[#1A1F2E]">AC Installation Manual</span>
        <span className="text-[#9CA3AF]">·</span>
        <span className="text-[12px] text-[#9CA3AF] italic">Complete all 5 modules to be verified</span>
      </div>

      {/* ── Training Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {TRAININGS.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg p-5 hover:shadow-md transition-shadow"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            {/* Module Tag */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: TEAL, backgroundColor: "#E8FAF7" }}
              >
                Module {t.moduleNumber}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[13px] font-bold text-[#1A1F2E] leading-snug mb-1.5">
              {t.title}
            </h3>

            {/* Due Date */}
            <div className="flex items-center gap-1.5 mb-4">
              <Clock size={12} className="text-[#9CA3AF]" />
              <span className="text-[11px] text-[#9CA3AF]">Due: {t.dueDate}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#9CA3AF]">Progress</span>
                <span className="text-[11px] font-semibold" style={{ color: TEAL }}>
                  {t.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${t.progress}%`, backgroundColor: TEAL }}
                />
              </div>
            </div>

            {/* Button */}
            {t.progress === 100 ? (
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] cursor-default"
              >
                Completed ✓
              </button>
            ) : t.locked ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-[12px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] cursor-not-allowed"
              >
                <Lock size={12} />
                Locked
              </button>
            ) : (
              <button
                onClick={() => startTraining(t)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-[12px] font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: TEAL }}
              >
                {t.progress > 0 ? "Continue" : "Start"}
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── SOP Completion Banner ────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg px-6 py-5 mb-6 flex items-center gap-6"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        {/* Progress Ring */}
        <div className="relative shrink-0">
          <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="4"
            />
            {/* Progress arc */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={TEAL}
              strokeWidth="4"
              strokeDasharray={`${(completed / totalModules) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-[#1A1F2E]">{completed}/{totalModules}</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[#1A1F2E]">AC Installation Manual</p>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
            Complete all 5 modules to earn SOP certification
          </p>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-full">
          <Lock size={12} className="text-[#9CA3AF]" />
          <span className="text-[11px] font-semibold text-[#9CA3AF]">Not yet certified</span>
        </div>
      </div>

      {/* ── Completed Trainings ─────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#1A1F2E]">Completed Trainings</h2>
          <span className="text-[11px] text-[#9CA3AF]">{COMPLETED.length} completed</span>
        </div>
        <div className="divide-y divide-gray-50">
          {COMPLETED.map((c) => (
            <div key={c.title} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                <CheckCircle size={15} className="text-[#059669]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1F2E] truncate">{c.title}</p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {c.modules} modules &nbsp;·&nbsp; Certified {c.date}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 relative group">
                <BookOpen size={13} className="text-[#9CA3AF]" />
                <span className="text-[12px] font-bold text-[#059669]">{c.score}%</span>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#1A1F2E] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Avg. across all modules
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

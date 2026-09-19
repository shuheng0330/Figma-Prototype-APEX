import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Play,
  Clock,
  Sparkles,
  X,
  Lock,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  MapPin,
  Ticket,
  LayoutGrid,
  Tag,
  Zap,
  Bell,
  Inbox,
  Plus,
  Trash2,
  Settings2,
  BookOpen as BookIcon,
} from "lucide-react";
import {
  ALL_MODULES, MODULE_BLOCKS, ALL_QUIZZES, MODULE_QUIZ,
  moduleStatus, quizStatus,
  type Block, type ModuleQuiz, type CourseModule,
} from "../courseStore";
import { useRole, can } from "../access";
import {
  COURSES, SESSIONS, CATEGORIES, CATEGORY_PALETTE, catStyle, categoryById,
  activeCategories, coursesInCategory, addCategory, updateCategory, retireCategory,
  toggleCourseCategory, setPrimaryCategory,
  STATUS_GROUPS, STATUS_GROUP_STYLE, ROLE_IDENTITY, statusGroupOf, staffById,
  seatCount, waitCount, myReg, fmtDateShort, fmtDate, daysUntil, useStoreVersion,
  immediateAssignments,
  type PortalCourse, type DocType, type OfflineSession, type CourseStatusGroup,
} from "../trainingStore";

const TEAL = "#00C9A7";

type BadgeType = DocType;
type Filter = "All" | "Mandatory" | "Optional" | "In Progress" | "Completed";

/** The portal renders the shared catalogue straight from the training store. */
type Course = PortalCourse;

interface SlideData {
  type: "title" | "agenda" | "content" | "callout" | "table" | "summary";
  heading: string;
  sub?: string;
  items?: string[];
  note?: string;
  table?: { cols: string[]; rows: string[][] };
}

const TYPE_STYLE: Record<BadgeType, { bg: string; color: string }> = {
  Video: { bg: "#312E81", color: "#A5B4FC" },
  PDF:   { bg: "#7F1D1D", color: "#FCA5A5" },
  PPT:   { bg: "#78350F", color: "#FCD34D" },
  Word:  { bg: "#1E3A5F", color: "#93C5FD" },
};

const TYPE_BADGE_LIGHT: Record<BadgeType, { bg: string; color: string }> = {
  Video: { bg: "#EEF2FF", color: "#4F46E5" },
  PDF:   { bg: "#FEF2F2", color: "#DC2626" },
  PPT:   { bg: "#FFFBEB", color: "#D97706" },
  Word:  { bg: "#EFF6FF", color: "#2563EB" },
};

const DOC_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PPT:   { bg: "#FEF3C7", color: "#B45309", label: "PPT" },
  Word:  { bg: "#DBEAFE", color: "#1D4ED8", label: "DOC" },
  Excel: { bg: "#D1FAE5", color: "#059669", label: "XLS" },
};

const OUTCOMES = [
  "Understand core safety requirements and protocols",
  "Apply standard operating procedures correctly",
  "Identify and mitigate common operational risks",
  "Complete quality verification at each checkpoint",
  "Document compliance records accurately",
];


const FILTERS: Filter[] = ["All", "Mandatory", "Optional", "In Progress", "Completed"];

function getSlides(course: Course): SlideData[] {
  return [
    {
      type: "title",
      heading: course.title,
      sub: `${course.dept} Department  ·  ${course.duration}  ·  ${course.types.join(" / ")}`,
    },
    {
      type: "agenda",
      heading: "Session Overview",
      items: [
        "Introduction and prerequisites",
        "Core concepts and terminology",
        "Step-by-step procedures",
        "Safety considerations and best practices",
        "Assessment and documentation",
      ],
    },
    {
      type: "content",
      heading: "Prerequisites",
      items: [
        "Completion of all prior modules in this series",
        "Review of departmental safety guidelines",
        "Signed acknowledgment of compliance requirements",
        "Access to required tools and reference materials",
      ],
    },
    {
      type: "content",
      heading: "Key Concepts",
      items: [
        "Understanding the core framework and its applications",
        "Identifying critical control points in the process",
        "Applying standard operating procedures consistently",
        "Recognizing deviations and escalation triggers",
      ],
    },
    {
      type: "callout",
      heading: "⚠  Important Safety Notice",
      note: "All personnel must ensure personal protective equipment (PPE) is worn at all times during practical application. Non-compliance may result in immediate work suspension and disciplinary review.",
    },
    {
      type: "content",
      heading: "Procedure — Steps 1–4",
      items: [
        "1.  Verify workspace conditions meet all safety standards",
        "2.  Inspect all tools and equipment for compliance",
        "3.  Confirm authorization and access clearances",
        "4.  Prepare documentation before commencing work",
      ],
    },
    {
      type: "content",
      heading: "Procedure — Steps 5–8",
      items: [
        "5.  Execute the procedure per the approved SOP flowchart",
        "6.  Conduct real-time quality checks at each checkpoint",
        "7.  Record all measurements and observations accurately",
        "8.  Obtain supervisor sign-off upon section completion",
      ],
    },
    {
      type: "table",
      heading: "Reference Values & Tolerances",
      table: {
        cols: ["Parameter", "Standard Value", "Tolerance", "Action if Exceeded"],
        rows: [
          ["Pressure (kPa)", "850", "± 50", "Shut down immediately"],
          ["Temperature (°C)", "24", "± 3", "Adjust settings"],
          ["Flow Rate (L/min)", "12.5", "± 1.5", "Inspect valves"],
          ["Voltage (V)", "240", "± 10", "Contact electrician"],
        ],
      },
    },
    {
      type: "content",
      heading: "Common Mistakes to Avoid",
      items: [
        "Skipping pre-inspection steps under time pressure",
        "Using non-calibrated or non-approved equipment",
        "Failing to document deviations from standard procedure",
        "Bypassing supervisor sign-off for routine steps",
        "Neglecting PPE due to perceived low-risk environment",
      ],
    },
    {
      type: "callout",
      heading: "✓  Quick Knowledge Check",
      note: "Before proceeding, confirm you can identify: (1) the two mandatory checkpoints in this section, (2) the escalation path for pressure deviations, and (3) your supervisor's contact for sign-off authorization.",
    },
    {
      type: "content",
      heading: "Documentation Requirements",
      items: [
        "Complete the Section Log in the online compliance portal",
        "Attach photographic evidence where required by SOP",
        "Submit records within 24 hours of completing the section",
        "Retain physical copies for a minimum of 12 months",
      ],
    },
    {
      type: "summary",
      heading: "Section Summary",
      items: [
        "Safety prerequisites and PPE are non-negotiable",
        "Follow the 8-step procedure strictly in sequence",
        "Reference values must remain within stated tolerances",
        "Document everything — it protects you and the company",
        "Your supervisor is the first point of contact for any deviation",
      ],
    },
  ];
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function Watermark() {
  const name = localStorage.getItem("userName") || "Ahmad Samsudin";
  const ts = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const label = `${name}  ·  ${ts}`;
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ userSelect: "none", zIndex: 10 }}
      aria-hidden
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="apex-wm"
            x="0" y="0"
            width="270" height="115"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-32)"
          >
            <text
              x="0" y="68"
              fontSize="10.5"
              fill="rgba(26,31,46,0.055)"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              letterSpacing="0.3"
            >
              {label}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#apex-wm)" />
      </svg>
    </div>
  );
}

// ── Slide renderer ────────────────────────────────────────────────────────────
function SlideView({ slide, accent }: { slide: SlideData; accent: string }) {
  switch (slide.type) {
    case "title":
      return (
        <div className="h-full flex flex-col items-center justify-center px-16 text-center">
          <div className="w-12 h-1 rounded-full mb-8" style={{ backgroundColor: accent }} />
          <h1 className="text-[28px] font-extrabold text-[#1A1F2E] leading-tight mb-4">
            {slide.heading}
          </h1>
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{slide.sub}</p>
          <div className="w-12 h-1 rounded-full mt-8" style={{ backgroundColor: accent }} />
        </div>
      );

    case "agenda":
      return (
        <div className="h-full flex flex-col px-14 py-9">
          <h2 className="text-[22px] font-bold text-[#1A1F2E] mb-6">{slide.heading}</h2>
          <div className="flex-1 flex flex-col justify-center gap-3.5">
            {slide.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-bold"
                  style={{ backgroundColor: accent }}
                >
                  {i + 1}
                </div>
                <span className="text-[14px] text-[#374151]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "content":
      return (
        <div className="h-full flex flex-col px-14 py-9">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-[22px] font-bold text-[#1A1F2E]">{slide.heading}</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-3">
            {slide.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <span className="text-[13.5px] text-[#374151] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="h-full flex flex-col items-center justify-center px-12">
          <div
            className="w-full rounded-xl p-8"
            style={{ backgroundColor: `${accent}0D`, border: `1.5px solid ${accent}35` }}
          >
            <h2 className="text-[18px] font-bold text-[#1A1F2E] mb-4">{slide.heading}</h2>
            <p className="text-[13.5px] text-[#374151] leading-relaxed">{slide.note}</p>
          </div>
        </div>
      );

    case "table":
      return (
        <div className="h-full flex flex-col px-10 py-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-7 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-[20px] font-bold text-[#1A1F2E]">{slide.heading}</h2>
          </div>
          <div className="flex-1 overflow-auto rounded-lg border border-gray-100">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: accent }}>
                  {slide.table?.cols.map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-white whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.table?.rows.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#F9FAFB" : "white" }}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 py-2.5 text-[12px] text-[#374151] border-b border-gray-100"
                        style={j === 0 ? { fontWeight: 600, color: "#1A1F2E" } : {}}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "summary":
      return (
        <div className="h-full flex flex-col px-14 py-9">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={22} style={{ color: accent }} />
            <h2 className="text-[22px] font-bold text-[#1A1F2E]">{slide.heading}</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-3">
            {slide.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                <span className="text-[13.5px] text-[#374151] leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ── Sidebar progress ring ─────────────────────────────────────────────────────
function SidebarRing({ progress, size = 56 }: { progress: number; size?: number }) {
  const sw = 5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={sw} />
      {progress > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={progress >= 100 ? "#10B981" : TEAL}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ── SOP Block renderer ────────────────────────────────────────────────────────
function BlockView({ block }: { block: Block }) {
  const { type, data } = block;
  const d = data as Record<string, unknown>;

  if (type === "paragraph") {
    return (
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Content</span>
        </div>
        <div className="p-5">
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#374151" }}>{String(d.text ?? "")}</p>
        </div>
      </div>
    );
  }

  if (type === "table") {
    const headers = d.headers as string[];
    const rows = d.rows as string[][];
    return (
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Reference Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ backgroundColor: TEAL }}>
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[10px] font-bold text-white uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#F9FAFB" }}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 border-b border-gray-50" style={{ color: j === 0 ? "#1A1F2E" : "#374151", fontWeight: j === 0 ? 600 : 400 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "warning") {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #FECACA" }}>
        <div className="px-4 py-2.5 border-b border-red-100 bg-red-50 flex items-center gap-2">
          <AlertTriangle size={11} className="text-red-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Warning</span>
        </div>
        <div className="p-5 bg-red-50">
          <div className="flex gap-3 items-start">
            <span className="text-[18px] shrink-0">⛔</span>
            <p className="text-[13px] leading-relaxed" style={{ color: "#991B1B" }}>{String(d.text ?? "")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "steps") {
    const items = d.items as string[];
    return (
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Procedure</span>
        </div>
        <div className="p-5 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                style={{ backgroundColor: TEAL, marginTop: 1 }}
              >
                {i + 1}
              </div>
              <p className="text-[13.5px] leading-relaxed pt-0.5" style={{ color: "#374151" }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ── SOP Course Detail — Coursera-style Material → Quiz → Results ──────────────
function SopCourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const sopId = course.sopId!;
  const allSopModules = ALL_MODULES.filter(m => m.sopId === sopId);

  type Phase = "material" | "quiz" | "result";

  const firstModule = allSopModules[0];
  const [activeModuleId, setActiveModuleId] = useState<string>(firstModule?.id ?? "");
  const [phase, setPhase] = useState<Phase>("material");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completions, setCompletions] = useState<Record<string, { correct: number; total: number }>>({});

  const activeModule = allSopModules.find(m => m.id === activeModuleId);
  const blocks = activeModuleId ? (MODULE_BLOCKS[activeModuleId] ?? []) : [];
  const quizId = MODULE_QUIZ[activeModuleId];
  const quiz: ModuleQuiz | undefined = quizId ? ALL_QUIZZES.find(q => q.id === quizId) : undefined;
  const quizApproved = quizId ? quizStatus[quizId] === "approved" : false;
  const materialApproved = activeModuleId ? moduleStatus[activeModuleId] === "approved" : false;

  const selectModule = (id: string) => {
    setActiveModuleId(id);
    setPhase("material");
    setQIndex(0);
    setAnswers({});
  };

  const handleAnswer = (qId: string, optId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    const correct = quiz.questions.filter(q => {
      const correctOpt = q.options.find(o => o.isCorrect);
      return correctOpt && answers[q.id] === correctOpt.id;
    }).length;
    setCompletions(prev => ({ ...prev, [activeModuleId]: { correct, total: quiz.questions.length } }));
    setPhase("result");
  };

  const handleNextModule = () => {
    const idx = allSopModules.findIndex(m => m.id === activeModuleId);
    if (idx < allSopModules.length - 1) {
      selectModule(allSopModules[idx + 1].id);
    }
  };

  const hasNextModule = allSopModules.findIndex(m => m.id === activeModuleId) < allSopModules.length - 1;

  const totalApproved = allSopModules.filter(m => moduleStatus[m.id] === "approved").length;
  const totalCompleted = Object.keys(completions).length;

  return (
    <div className="apex-sop-course flex" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Left sidebar — module list ──────────────────────────────────── */}
      <div
        className="apex-sop-course-nav shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden"
        style={{ width: 252 }}
      >
        {/* Back button + course title */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] font-medium mb-3 transition-colors"
            style={{ color: "#9CA3AF" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1F2E"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
          >
            <ArrowLeft size={12} />
            Back to Portal
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[15px]"
              style={{ background: `linear-gradient(135deg, ${course.from}, ${course.to})` }}
            >
              <span style={{ userSelect: "none" }}>{course.emoji}</span>
            </div>
            <h3 className="text-[12px] font-bold leading-snug" style={{ color: "#1A1F2E" }}>{course.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${totalApproved > 0 ? (totalCompleted / totalApproved) * 100 : 0}%`, backgroundColor: TEAL }}
              />
            </div>
            <span className="text-[10px] font-semibold shrink-0" style={{ color: "#9CA3AF" }}>
              {totalCompleted}/{totalApproved}
            </span>
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin" }}>
          <p className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#B0B8C8" }}>
            Course Modules
          </p>
          {allSopModules.map((mod, idx) => {
            const status = moduleStatus[mod.id];
            const active = mod.id === activeModuleId;
            const comp = completions[mod.id];
            const pct = comp ? Math.round((comp.correct / comp.total) * 100) : null;
            const passed = pct !== null && pct >= 70;

            return (
              <button
                key={mod.id}
                onClick={() => selectModule(mod.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: active ? "#E8FAF7" : "transparent",
                  borderLeft: active ? `3px solid ${TEAL}` : "3px solid transparent",
                  opacity: status === "rejected" ? 0.45 : 1,
                }}
                disabled={status === "rejected"}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5"
                  style={comp
                    ? { backgroundColor: passed ? "#10B981" : "#EF4444", color: "white" }
                    : { backgroundColor: active ? TEAL : "#E5E7EB", color: active ? "white" : "#9CA3AF" }
                  }
                >
                  {comp ? (passed ? "✓" : "✗") : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-snug" style={{ color: active ? TEAL : "#1A1F2E" }}>
                    {mod.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    {status === "pending" ? "Pending review" :
                     status === "rejected" ? "Not available" :
                     comp ? `${comp.correct}/${comp.total} correct · ${pct}%` :
                     "Module available"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="apex-sop-course-content flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#F4F6F9" }}>

        {/* Phase header strip */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0 flex items-center gap-3">
          {["material", "quiz", "result"].map((p, i) => {
            const labels = ["Material", "Quiz", "Results"];
            const done = (phase === "quiz" && i === 0) || (phase === "result" && i < 2);
            const active = phase === p;
            return (
              <div key={p} className="flex items-center gap-2">
                {i > 0 && <ChevronRight size={12} style={{ color: "#D1D5DB" }} />}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      backgroundColor: done ? "#10B981" : active ? TEAL : "#E5E7EB",
                      color: done || active ? "white" : "#9CA3AF",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: active ? TEAL : done ? "#10B981" : "#9CA3AF" }}>
                    {labels[i]}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="flex-1" />
          {activeModule && (
            <p className="text-[12px] font-medium" style={{ color: "#6B7280" }}>
              Module {activeModule.number}: <span style={{ color: "#1A1F2E", fontWeight: 600 }}>{activeModule.title}</span>
            </p>
          )}
        </div>

        {/* ── PHASE: MATERIAL ─── */}
        {phase === "material" && (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

              {!materialApproved && (
                <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
                    This module is pending review and has not been published yet.
                  </p>
                </div>
              )}

              {materialApproved && blocks.length === 0 && (
                <div className="rounded-xl p-5 text-center border border-gray-100 bg-white">
                  <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No content blocks available for this module.</p>
                </div>
              )}

              {blocks.map(block => (
                <BlockView key={block.id} block={block} />
              ))}

              {materialApproved && blocks.length > 0 && (
                <div className="pt-4 pb-6">
                  {quizApproved && quiz ? (
                    <button
                      onClick={() => { setPhase("quiz"); setQIndex(0); setAnswers({}); }}
                      className="w-full py-3.5 rounded-xl font-bold text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2"
                      style={{ backgroundColor: TEAL }}
                    >
                      Continue to Quiz
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="rounded-xl p-4 text-center border border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                      <p className="text-[12px]" style={{ color: "#9CA3AF" }}>
                        No quiz is available for this module yet.
                        {hasNextModule && (
                          <button
                            onClick={handleNextModule}
                            className="ml-2 font-semibold underline"
                            style={{ color: TEAL }}
                          >
                            Continue to next module →
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PHASE: QUIZ ─── */}
        {phase === "quiz" && quiz && (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            <div className="max-w-2xl mx-auto px-6 py-6">

              {/* Progress bar */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>
                  Question {qIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  {Object.keys(answers).length}/{quiz.questions.length} answered
                </span>
              </div>
              <div className="flex gap-1 mb-6">
                {quiz.questions.map((_, i) => {
                  const ans = answers[quiz.questions[i].id];
                  return (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: i === qIndex ? TEAL : ans ? "#10B981" : "#E5E7EB",
                      }}
                    />
                  );
                })}
              </div>

              {/* Question card */}
              {(() => {
                const q = quiz.questions[qIndex];
                const diffColors: Record<string, { bg: string; color: string }> = {
                  Easy:   { bg: "#ECFDF5", color: "#059669" },
                  Medium: { bg: "#FEF3C7", color: "#D97706" },
                  Hard:   { bg: "#FEE2E2", color: "#DC2626" },
                };
                const dc = diffColors[q.difficulty] ?? diffColors.Easy;
                return (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: dc.bg, color: dc.color }}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-[15px] font-semibold leading-relaxed mb-6" style={{ color: "#1A1F2E" }}>
                      {q.questionText}
                    </p>
                    <div className="space-y-3">
                      {q.options.map(opt => {
                        const selected = answers[q.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleAnswer(q.id, opt.id)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                            style={{
                              border: `2px solid ${selected ? TEAL : "#E5E7EB"}`,
                              backgroundColor: selected ? "#E8FAF7" : "white",
                            }}
                            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#C4E8E3"; }}
                            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; }}
                          >
                            <div
                              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: selected ? TEAL : "#D1D5DB", backgroundColor: selected ? TEAL : "white" }}
                            >
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[13px]" style={{ color: "#374151" }}>
                              <span className="font-bold" style={{ color: "#1A1F2E" }}>{opt.id}.&nbsp;</span>
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setQIndex(i => Math.max(0, i - 1))}
                  disabled={qIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all disabled:opacity-30"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280", backgroundColor: "white" }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <button
                  onClick={() => setPhase("material")}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "#9CA3AF" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  ← Back to material
                </button>

                {qIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setQIndex(i => Math.min(quiz.questions.length - 1, i + 1))}
                    disabled={!answers[quiz.questions[qIndex].id]}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30"
                    style={{ backgroundColor: TEAL, color: "#fff" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(answers).length < quiz.questions.length}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-bold transition-all disabled:opacity-30"
                    style={{ backgroundColor: "#10B981", color: "#fff" }}
                  >
                    Submit Quiz ✓
                  </button>
                )}
              </div>

              <p className="text-center text-[11px] mt-3" style={{ color: "#B0B8C8" }}>
                Answer all questions to submit
              </p>
            </div>
          </div>
        )}

        {/* ── PHASE: RESULT ─── */}
        {phase === "result" && quiz && (() => {
          const comp = completions[activeModuleId];
          if (!comp) return null;
          const pct = Math.round((comp.correct / comp.total) * 100);
          const passed = pct >= 70;

          return (
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              <div className="max-w-2xl mx-auto px-6 py-6">

                {/* Score banner */}
                <div
                  className="rounded-xl p-6 mb-6 text-center"
                  style={{
                    background: passed
                      ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
                      : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
                    border: `1.5px solid ${passed ? "#6EE7B7" : "#FECACA"}`,
                  }}
                >
                  <div className="text-5xl mb-3">{passed ? "🎉" : "📚"}</div>
                  <h2 className="text-[22px] font-extrabold mb-1" style={{ color: "#1A1F2E" }}>
                    {passed ? "Quiz Passed!" : "Keep Practising"}
                  </h2>
                  <p className="text-[14px] mb-3" style={{ color: "#6B7280" }}>
                    {comp.correct} out of {comp.total} correct
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[15px]"
                    style={{
                      backgroundColor: passed ? "#10B981" : "#EF4444",
                      color: "white",
                    }}
                  >
                    {pct}% — {passed ? "PASSED" : "NOT PASSED"}
                  </div>
                  {!passed && (
                    <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>Minimum passing score: 70%</p>
                  )}
                </div>

                {/* Question review */}
                <h3 className="text-[13px] font-bold mb-3" style={{ color: "#1A1F2E" }}>Question Review</h3>
                <div className="space-y-3 mb-6">
                  {quiz.questions.map((q, i) => {
                    const correctOpt = q.options.find(o => o.isCorrect)!;
                    const userOptId = answers[q.id];
                    const isCorrect = userOptId === correctOpt.id;
                    const userOpt = q.options.find(o => o.id === userOptId);
                    return (
                      <div
                        key={q.id}
                        className="rounded-xl p-4 bg-white border"
                        style={{ borderColor: isCorrect ? "#6EE7B7" : "#FECACA" }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {isCorrect
                              ? <CheckCircle size={16} style={{ color: "#10B981" }} />
                              : <XCircle size={16} style={{ color: "#EF4444" }} />
                            }
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-semibold mb-2" style={{ color: "#1A1F2E" }}>
                              {i + 1}. {q.questionText}
                            </p>
                            {!isCorrect && userOpt && (
                              <p className="text-[11px] mb-1" style={{ color: "#DC2626" }}>
                                Your answer: {userOpt.id}. {userOpt.text}
                              </p>
                            )}
                            <p className="text-[11px]" style={{ color: "#059669" }}>
                              Correct: {correctOpt.id}. {correctOpt.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-6">
                  <button
                    onClick={() => { setPhase("quiz"); setQIndex(0); setAnswers({}); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] border transition-all"
                    style={{ borderColor: "#E5E7EB", color: "#6B7280", backgroundColor: "white" }}
                  >
                    <RotateCcw size={13} /> Retake Quiz
                  </button>
                  {hasNextModule ? (
                    <button
                      onClick={handleNextModule}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: TEAL }}
                    >
                      Next Module <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={onBack}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      🎓 Course Complete — Back to Portal
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── PHASE: QUIZ but no quiz available ─── */}
        {phase === "quiz" && !quiz && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No quiz assigned to this module.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Course Detail ─────────────────────────────────────────────────────────────
function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const [page, setPage] = useState(1);
  const [checkedOutcomes, setCheckedOutcomes] = useState<Set<number>>(new Set());
  const [sectionDone, setSectionDone] = useState(false);
  const TOTAL = 12;
  const slides = getSlides(course);

  const docs = [
    { name: `${course.title.slice(0, 22)}.pptx`, type: "PPT", size: "2.4 MB" },
    { name: "Reference Guide.docx",               type: "Word", size: "1.1 MB" },
    { name: "Data Checklist.xlsx",                 type: "Excel", size: "480 KB" },
  ];

  const toggleOutcome = (i: number) =>
    setCheckedOutcomes(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="apex-course-viewer flex" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Main viewer ──────────────────────────────────────────────────── */}
      <div className="apex-course-viewer-main flex-1 flex flex-col overflow-hidden bg-[#F4F6F9]">

        {/* Top bar */}
        <div
          className="h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0"
          style={{ boxShadow: "0 1px 0 #F3F4F6" }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280] hover:text-[#1A1F2E] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Learning Portal
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
            <Lock size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-400 font-medium">Protected content — copying disabled</span>
          </div>
        </div>

        {/* Slide area */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
          <div
            className="relative bg-white rounded-2xl overflow-hidden w-full"
            style={{
              maxWidth: 780,
              aspectRatio: "16 / 9",
              boxShadow: "0 4px 32px rgba(0,0,0,0.11)",
              userSelect: "none",
            }}
          >
            {/* Course-color top bar */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{ height: 3, background: `linear-gradient(90deg, ${course.from}, ${course.to})` }}
            />
            {/* Watermark */}
            <Watermark />
            {/* Slide content */}
            <div className="absolute inset-0 pt-[3px]">
              <SlideView slide={slides[page - 1]} accent={TEAL} />
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div
          className="h-[50px] bg-white border-t border-gray-100 flex items-center justify-center gap-4 shrink-0"
        >
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-25 hover:bg-gray-100"
            style={{ color: "#6B7280" }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Pill dot navigator */}
          <div className="flex items-center gap-1">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="rounded-full transition-all duration-200"
                style={{
                  height: 6,
                  width: page === i + 1 ? 18 : 6,
                  backgroundColor: page === i + 1 ? TEAL : "#D1D5DB",
                }}
              />
            ))}
          </div>

          <span className="text-[12px] font-semibold text-[#6B7280] tabular-nums">
            {page} / {TOTAL}
          </span>

          <button
            onClick={() => setPage(p => Math.min(TOTAL, p + 1))}
            disabled={page === TOTAL}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-25 hover:bg-gray-100"
            style={{ color: "#6B7280" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div
        className="apex-course-viewer-sidebar w-[272px] bg-white border-l border-gray-100 overflow-y-auto shrink-0 flex flex-col"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Course info */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[15px]"
              style={{ background: `linear-gradient(135deg, ${course.from}, ${course.to})` }}
            >
              <span style={{ userSelect: "none" }}>{course.emoji}</span>
            </div>
            <h3 className="text-[13px] font-bold text-[#1A1F2E] leading-snug">{course.title}</h3>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mb-2.5">
            Prepared by <span className="font-semibold text-[#6B7280]">Sarah Lim</span> · 12 Aug 2026
          </p>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "#E8FAF7", color: TEAL }}
            >
              v2 · Current
            </span>
            <div className="flex items-center gap-1 text-[#9CA3AF]">
              <Clock size={10} />
              <span className="text-[11px]">{course.duration}</span>
            </div>
          </div>
        </div>

        {/* Learning outcomes */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] mb-3">
            Learning Outcomes
          </p>
          <div className="space-y-2.5">
            {OUTCOMES.map((o, i) => (
              <button
                key={i}
                onClick={() => toggleOutcome(i)}
                className="flex items-start gap-2.5 w-full text-left group"
              >
                <div
                  className="w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all"
                  style={
                    checkedOutcomes.has(i)
                      ? { backgroundColor: TEAL, borderColor: TEAL }
                      : { backgroundColor: "white", borderColor: "#D1D5DB" }
                  }
                >
                  {checkedOutcomes.has(i) && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-[11.5px] leading-snug transition-colors"
                  style={{ color: checkedOutcomes.has(i) ? "#9CA3AF" : "#374151",
                           textDecoration: checkedOutcomes.has(i) ? "line-through" : "none" }}
                >
                  {o}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Included documents */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] mb-3">
            Included Documents
          </p>
          <div className="space-y-2.5">
            {docs.map(doc => {
              const ds = DOC_STYLE[doc.type] ?? DOC_STYLE.Word;
              return (
                <div key={doc.name} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-[9px] font-bold"
                    style={{ backgroundColor: ds.bg, color: ds.color }}
                  >
                    {ds.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#1A1F2E] truncate">{doc.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{doc.size}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Due chip + progress ring */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}
          >
            <Clock size={10} />
            Due in 9 days
          </span>
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <SidebarRing progress={course.progress} size={56} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[#1A1F2E]">{course.progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#1A1F2E]">Overall Progress</p>
              <p className="text-[11px] text-[#9CA3AF]">
                {course.progress === 0 ? "Not started" : course.progress >= 100 ? "Completed" : "In progress"}
              </p>
            </div>
          </div>
        </div>

        {/* Mark section complete */}
        <div className="p-5 mt-auto">
          <button
            onClick={() => setSectionDone(d => !d)}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: sectionDone ? "#10B981" : "#EF4444" }}
          >
            {sectionDone ? "✓  Section Marked Complete" : "Mark Section Complete"}
          </button>
          {sectionDone && (
            <p className="text-[11px] text-[#9CA3AF] text-center mt-2 leading-snug">
              Move to the next section when ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Progress ring (card) ──────────────────────────────────────────────────────
function ProgressRing({ progress, size = 30 }: { progress: number; size?: number }) {
  const sw = 2.5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
      {progress > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={progress >= 100 ? "#34D399" : TEAL}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const done = course.progress >= 100;
  const active = course.progress > 0 && course.progress < 100;

  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer group w-full"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.10)", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-4px) scale(1.02)";
        el.style.boxShadow = "0 10px 28px rgba(0,0,0,0.18)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "";
        el.style.boxShadow = "0 2px 10px rgba(0,0,0,0.10)";
      }}
    >
      {/* Cover */}
      <div
        className="relative"
        style={{ height: 138, background: `linear-gradient(135deg, ${course.from} 0%, ${course.to} 100%)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl opacity-40 group-hover:opacity-60 select-none transition-opacity duration-200">
            {course.emoji}
          </span>
        </div>
        <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap max-w-[160px]">
          {course.mandatory && (
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-red-600 text-white uppercase tracking-wide">
              Required
            </span>
          )}
          {course.types.slice(0, 2).map(t => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: TYPE_STYLE[t].bg, color: TYPE_STYLE[t].color }}
            >
              {t}
            </span>
          ))}
          {course.types.length > 2 && (
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-white/10 text-white/50">
              +{course.types.length - 2}
            </span>
          )}
        </div>
        {course.assignment && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: course.assignment.mode === "immediate" ? "rgba(220,38,38,0.9)" : "rgba(8,145,178,0.9)" }}>
            <Inbox size={8} className="text-white" />
            <span className="text-[8px] font-bold uppercase tracking-wide text-white">
              {course.assignment.mode === "immediate" ? "Start now" : "Assigned"}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <div className="relative" style={{ width: 30, height: 30 }}>
            <ProgressRing progress={course.progress} size={30} />
            <div className="absolute inset-0 flex items-center justify-center">
              {done ? (
                <CheckCircle size={10} color="#34D399" />
              ) : active ? (
                <span className="text-[7px] font-bold text-white leading-none">{course.progress}%</span>
              ) : null}
            </div>
          </div>
        </div>
        {done && (
          <div className="absolute inset-0 bg-emerald-900/50 flex items-center justify-center">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(16,185,129,0.85)" }}
            >
              <CheckCircle size={11} className="text-white" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wide">Completed</span>
            </div>
          </div>
        )}
        {!done && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={14} className="text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white px-3 py-2.5">
        <p className="text-[12px] font-bold text-[#1A1F2E] leading-snug mb-1.5 line-clamp-2" style={{ minHeight: 32 }}>
          {course.title}
        </p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-[#9CA3AF] shrink-0">
            <Clock size={10} />
            <span className="text-[10px]">{course.duration}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 justify-end">
            {course.categoryIds.slice(0, 2).map(id => {
              const cat = categoryById(id);
              return (
                <span key={id} className="px-1.5 py-0.5 rounded text-[9px] font-bold truncate"
                  style={{ color: cat.color, backgroundColor: cat.bg }}>
                  {cat.name}
                </span>
              );
            })}
            {course.categoryIds.length > 2 && (
              <span className="px-1 py-0.5 rounded text-[9px] font-bold shrink-0"
                style={{ color: "#9CA3AF", backgroundColor: "#F3F4F6" }}>
                +{course.categoryIds.length - 2}
              </span>
            )}
          </div>
        </div>
        {active && (
          <div className="mt-2 w-full bg-gray-100 rounded-full" style={{ height: 3 }}>
            <div
              className="rounded-full transition-all"
              style={{ height: 3, width: `${course.progress}%`, backgroundColor: TEAL }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Cards shown per group before "See all".
const PREVIEW = 4;

// ── Assigned to start immediately ─────────────────────────────────────────────
function StartNowSection({ onSelect }: { onSelect: (c: Course) => void }) {
  const urgent = immediateAssignments();
  if (!urgent.length) return null;

  return (
    <div className="px-6 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={15} style={{ color: "#DC2626" }} />
        <h2 className="text-[14px] font-bold text-[#1A1F2E]">Start now — assigned to you</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
          {urgent.length} to begin
        </span>
      </div>

      <div className="space-y-2.5">
        {urgent.map(c => {
          const a = c.assignment!;
          const left = daysUntil(a.deadline);
          const overdue = left < 0;
          return (
            <div
              key={c.id}
              className="apex-learning-featured flex items-stretch bg-white rounded-xl overflow-hidden border"
              style={{ borderColor: overdue ? "#FCA5A5" : "#FECACA", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
            >
              <div className="w-1 shrink-0" style={{ backgroundColor: overdue ? "#991B1B" : "#DC2626" }} />

              <div className="apex-learning-featured-body flex items-center gap-4 flex-1 px-4 py-3 min-w-0">
                <div
                  className="rounded-lg shrink-0 flex items-center justify-center"
                  style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                >
                  <span className="text-2xl opacity-60 select-none">{c.emoji}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                      <Bell size={8} /> Start immediately
                    </span>
                    {a.mandatory && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                        Mandatory
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ color: categoryById(c.categoryIds[0]).color, backgroundColor: categoryById(c.categoryIds[0]).bg }}>
                      {categoryById(c.categoryIds[0]).name}
                    </span>
                  </div>

                  <p className="text-[13px] font-bold text-[#1A1F2E] truncate">{c.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    Assigned {fmtDate(a.assignedOn)} · {a.daysWithin} days to complete · due {fmtDate(a.deadline)}
                    {c.progress > 0 ? ` · ${c.progress}% done` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right mr-3">
                  <p className="text-[15px] font-extrabold leading-none" style={{ color: overdue ? "#991B1B" : "#DC2626" }}>
                    {overdue ? "Overdue" : `${left}d`}
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: "#9CA3AF" }}>{overdue ? "past due" : "remaining"}</p>
                </div>

                <button
                  onClick={() => onSelect(c)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold text-white shrink-0 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  <Play size={11} fill="currentColor" /> {c.progress > 0 ? "Continue" : "Start now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── One offline session card ──────────────────────────────────────────────────
function OfflineSessionCard({ s, meId }: { s: OfflineSession; meId: string }) {
  const navigate = useNavigate();
  const trainer = staffById(s.trainerId);
  const seats = seatCount(s.id);
  const waiting = waitCount(s.id);
  const full = seats >= s.capacity;
  const mine = myReg(s.id, meId);
  const cat = catStyle(s.topic);
  const isSharing = s.kind === "Sharing Session";
  const left = s.capacity - seats;

  return (
    <button
      onClick={() => navigate(`/register/${s.id}`)}
      className="text-left bg-white rounded-xl overflow-hidden border transition-all hover:-translate-y-0.5"
      style={{ borderColor: "#F0F1F4", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-stretch">
        {/* Date block */}
        <div className="w-[62px] shrink-0 flex flex-col items-center justify-center py-3" style={{ backgroundColor: isSharing ? "#FFFBEB" : "#F0FDFA" }}>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isSharing ? "#B45309" : "#0F766E" }}>
            {fmtDateShort(s.date).split(" ")[1]}
          </span>
          <span className="text-[20px] font-extrabold leading-none mt-0.5" style={{ color: isSharing ? "#92400E" : "#065F46" }}>
            {fmtDateShort(s.date).split(" ")[0]}
          </span>
          <span className="text-[9px] mt-1" style={{ color: "#9CA3AF" }}>{daysUntil(s.date)}d</span>
        </div>

        <div className="flex-1 min-w-0 px-3.5 py-3">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: cat.color, backgroundColor: cat.bg }}>
              {cat.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: "#0F766E", backgroundColor: "#F0FDFA" }}>
              Open to register
            </span>
            {isSharing && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: "#B45309", backgroundColor: "#FEF3C7" }}>
                <Sparkles size={8} /> Sharing
              </span>
            )}
            {s.mandatory && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ color: "#DC2626", backgroundColor: "#FEE2E2" }}>
                Mandatory
              </span>
            )}
          </div>

          <p className="text-[12px] font-bold text-[#1A1F2E] leading-snug line-clamp-2 mb-1.5" style={{ minHeight: 30 }}>
            {s.title}
          </p>

          <div className="flex items-center gap-2.5 mb-2 text-[10px]" style={{ color: "#9CA3AF" }}>
            <span className="flex items-center gap-1"><Clock size={9} /> {s.time.split(" – ")[0]}</span>
            <span className="flex items-center gap-1 truncate"><MapPin size={9} /> {s.venue.split(",")[0]}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ backgroundColor: trainer?.color ?? "#9CA3AF" }}>
                {trainer?.initials}
              </div>
              <span className="text-[10px] truncate" style={{ color: "#6B7280" }}>{trainer?.name}</span>
            </div>

            {mine ? (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold shrink-0"
                style={mine.status === "waitlisted"
                  ? { color: "#92400E", backgroundColor: "#FEF3C7" }
                  : { color: "#065F46", backgroundColor: "#D1FAE5" }}>
                {mine.status === "waitlisted" ? <><Ticket size={9} /> Waitlisted</> : <><CheckCircle size={9} /> Registered</>}
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold shrink-0"
                style={full ? { color: "#B45309", backgroundColor: "#FFFBEB" } : { color: "#1A1F2E", backgroundColor: TEAL }}>
                {full ? <><Ticket size={9} /> Join waitlist</> : <>Register <ChevronRight size={9} /></>}
              </span>
            )}
          </div>

          <div className="mt-2">
            <div className="rounded-full overflow-hidden" style={{ height: 3, backgroundColor: "#F3F4F6" }}>
              <div className="rounded-full" style={{ height: 3, width: `${Math.min(100, (seats / s.capacity) * 100)}%`, backgroundColor: full ? "#DC2626" : TEAL }} />
            </div>
            <p className="text-[9px] mt-1" style={{ color: full ? "#DC2626" : "#9CA3AF" }}>
              {full ? `Full · ${waiting} waiting` : `${left} of ${s.capacity} seats left`}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Offline training open for registration ────────────────────────────────────
function OfflineTrainingSection({ meId, sessions }: { meId: string; sessions: OfflineSession[] }) {
  const navigate = useNavigate();
  if (!sessions.length) return null;

  return (
    <div className="px-6 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: TEAL }} />
          <h2 className="text-[14px] font-bold text-[#1A1F2E]">Offline training — open for registration</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#E8FAF7", color: "#047857" }}>
            {sessions.length} upcoming
          </span>
        </div>
        <button onClick={() => navigate("/calendar")} className="flex items-center gap-0.5 text-[12px] font-semibold hover:opacity-70" style={{ color: TEAL }}>
          Full calendar <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {sessions.slice(0, 3).map(s => <OfflineSessionCard key={s.id} s={s} meId={meId} />)}
      </div>
    </div>
  );
}

// ── Category manager ──────────────────────────────────────────────────────────
function CategoryManager({ onClose }: { onClose: () => void }) {
  useStoreVersion();
  const [selected, setSelected] = useState(CATEGORIES[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newColor, setNewColor] = useState(0);

  const cat = categoryById(selected);
  const labelled = coursesInCategory(selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-[860px] max-h-[88vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Tag size={15} style={{ color: TEAL }} />
              <h2 className="text-[15px] font-extrabold text-[#1A1F2E]">Course categories</h2>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              Create your own labels, rename or recolour them, and tag courses. Learners filter the portal by these.
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1F2E]"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-[280px_1fr] flex-1 overflow-hidden">

          {/* Category list + create */}
          <div className="border-r border-gray-100 overflow-y-auto p-3">
            {CATEGORIES.map(c => {
              const active = c.id === selected;
              const count = coursesInCategory(c.id).length;
              return (
                <button key={c.id} onClick={() => setSelected(c.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 text-left transition-colors"
                  style={{ backgroundColor: active ? c.bg : "transparent", opacity: c.retired ? 0.5 : 1 }}>
                  <span className="text-[14px]">{c.emoji}</span>
                  <span className="text-[12px] font-semibold flex-1 truncate" style={{ color: active ? c.color : "#1A1F2E" }}>
                    {c.name}
                  </span>
                  {c.custom && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ color: c.color, backgroundColor: c.bg }}>
                      custom
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{count}</span>
                </button>
              );
            })}

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>New category</p>
              <div className="flex items-center gap-2 mb-2">
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value.slice(0, 2))}
                  className="w-10 text-center px-1 py-1.5 rounded-lg text-[14px] focus:outline-none"
                  style={{ border: "1px solid #E5E7EB" }} />
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Aircon Specialist"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] focus:outline-none"
                  style={{ border: "1px solid #E5E7EB", color: "#1A1F2E" }} />
              </div>
              <div className="flex items-center gap-1 flex-wrap mb-2">
                {CATEGORY_PALETTE.map((p, i) => (
                  <button key={p.color} onClick={() => setNewColor(i)}
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: p.color, outline: newColor === i ? `2px solid ${p.color}` : "none", outlineOffset: 2 }} />
                ))}
              </div>
              <button
                disabled={!newName.trim()}
                onClick={() => {
                  const id = addCategory(newName, CATEGORY_PALETTE[newColor].color, CATEGORY_PALETTE[newColor].bg, newEmoji);
                  setSelected(id); setNewName("");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white"
                style={{ backgroundColor: newName.trim() ? TEAL : "#D1D5DB" }}>
                <Plus size={11} /> Add category
              </button>
            </div>
          </div>

          {/* Selected category detail */}
          <div className="overflow-y-auto p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px]" style={{ backgroundColor: cat.bg }}>
                {cat.emoji}
              </span>
              <input
                value={cat.name}
                onChange={e => updateCategory(cat.id, { name: e.target.value })}
                className="text-[15px] font-extrabold px-2 py-1 rounded-lg focus:outline-none"
                style={{ color: "#1A1F2E", border: "1px solid transparent", backgroundColor: "#F9FAFB" }}
              />
              <div className="ml-auto flex items-center gap-1.5">
                {CATEGORY_PALETTE.map(p => (
                  <button key={p.color} onClick={() => updateCategory(cat.id, { color: p.color, bg: p.bg })}
                    className="w-5 h-5 rounded-md"
                    style={{ backgroundColor: p.color, outline: cat.color === p.color ? `2px solid ${p.color}` : "none", outlineOffset: 2 }} />
                ))}
                <button
                  onClick={() => { retireCategory(cat.id); setSelected(CATEGORIES[0]?.id ?? ""); }}
                  className="flex items-center gap-1 ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                  style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                  <Trash2 size={10} /> {cat.custom ? "Delete" : cat.retired ? "Restore" : "Hide"}
                </button>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
              Courses labelled ({labelled.length}) — click to add or remove
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COURSES.map(c => {
                const on = c.categoryIds.includes(cat.id);
                const primary = c.categoryIds[0] === cat.id;
                return (
                  <button key={c.id} onClick={() => toggleCourseCategory(c.id, cat.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all"
                    style={{ borderColor: on ? cat.color : "#E5E7EB", backgroundColor: on ? cat.bg : "white" }}>
                    <span className="text-[14px]">{c.emoji}</span>
                    <span className="text-[11px] font-semibold flex-1 truncate" style={{ color: "#1A1F2E" }}>{c.title}</span>
                    {primary && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0" style={{ color: cat.color, backgroundColor: "white" }}>
                        primary
                      </span>
                    )}
                    {on
                      ? <CheckCircle size={12} className="shrink-0" style={{ color: cat.color }} />
                      : <Plus size={12} className="shrink-0" style={{ color: "#D1D5DB" }} />}
                  </button>
                );
              })}
            </div>

            {labelled.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-5 mb-2" style={{ color: "#9CA3AF" }}>
                  Set as primary label
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {labelled.map(c => (
                    <button key={c.id} onClick={() => setPrimaryCategory(c.id, cat.id)}
                      className="px-2 py-1 rounded-full text-[10px] font-semibold border"
                      style={c.categoryIds[0] === cat.id
                        ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.bg }
                        : { borderColor: "#E5E7EB", color: "#6B7280", backgroundColor: "white" }}>
                      {c.emoji} {c.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[#9CA3AF]">
            Default categories can be hidden; custom ones can be deleted. Changes apply to the portal immediately.
          </p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] font-bold text-white" style={{ backgroundColor: TEAL }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Grouped catalogue section ─────────────────────────────────────────────────
function GroupSection({
  label, sub, color, bg, courses, onSelect,
}: {
  label: string; sub: string; color: string; bg: string;
  courses: Course[]; onSelect: (c: Course) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!courses.length) return null;
  const shown = expanded ? courses : courses.slice(0, PREVIEW);

  return (
    <div className="mb-5 px-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold" style={{ color, backgroundColor: bg }}>
            {label}
          </span>
          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{courses.length} · {sub}</span>
        </div>
        {courses.length > PREVIEW && (
          <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-0.5 text-[12px] font-semibold hover:opacity-70" style={{ color: TEAL }}>
            {expanded ? "Show less" : `See all ${courses.length}`}
            <ChevronRight size={13} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {shown.map(c => <CourseCard key={c.id} course={c} onClick={() => onSelect(c)} />)}
      </div>
    </div>
  );
}

// ── Learning Portal — "My Learnings" home ─────────────────────────────────────
type Source = "all" | "assigned" | "open";

export function LearningPortal() {
  const role = useRole();
  useStoreVersion();
  const meId = ROLE_IDENTITY[role] ?? "E001";
  const me = staffById(meId);
  const canManageCategories = can(role, "materials") || can(role, "assign-training");

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [groupBy, setGroupBy] = useState<"status" | "category">("status");
  const [source, setSource] = useState<Source>("all");
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [showCats, setShowCats] = useState(false);

  if (selectedCourse) {
    if (selectedCourse.sopId) {
      return <SopCourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
    }
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  const q = search.toLowerCase().trim();
  const cats = activeCategories();

  const openSessions = SESSIONS
    .filter(s => s.registrationOpen && daysUntil(s.date) >= 0)
    .filter(s => !q || s.title.toLowerCase().includes(q) || s.venue.toLowerCase().includes(q))
    .filter(s => !activeCats.length || activeCats.includes(s.topic))
    .sort((a, b) => a.date.localeCompare(b.date));

  const assignedCourses = COURSES.filter(c => c.assignment);

  const filtered = COURSES.filter(c => {
    if (source === "assigned" && !c.assignment) return false;
    const matchSearch = !q
      || c.title.toLowerCase().includes(q)
      || c.dept.toLowerCase().includes(q)
      || c.categoryIds.some(id => categoryById(id).name.toLowerCase().includes(q));
    if (!matchSearch) return false;
    if (activeCats.length && !c.categoryIds.some(id => activeCats.includes(id))) return false;
    switch (filter) {
      case "Mandatory":   return c.mandatory;
      case "Optional":    return !c.mandatory;
      case "In Progress": return c.progress > 0 && c.progress < 100;
      case "Completed":   return c.progress >= 100;
      default:            return true;
    }
  });

  const startNowCount    = immediateAssignments().length;
  const mandatoryPending = COURSES.filter(c => c.mandatory && c.progress < 100).length;
  const inProgressCount  = COURSES.filter(c => c.progress > 0 && c.progress < 100).length;
  const completedCount   = COURSES.filter(c => c.progress >= 100).length;

  const SOURCES: { id: Source; label: string; count: number; icon: React.ElementType }[] = [
    { id: "all",      label: "All learning",        count: COURSES.length + openSessions.length, icon: LayoutGrid },
    { id: "assigned", label: "Assigned training",   count: assignedCourses.length,               icon: Inbox      },
    { id: "open",     label: "Open for registration", count: openSessions.length,                icon: CalendarDays },
  ];

  const byStatus = STATUS_GROUPS.map(g => ({ key: g, courses: filtered.filter(c => statusGroupOf(c) === g) }));
  const byCategory = cats.map(c => ({ cat: c, courses: filtered.filter(x => x.categoryIds.includes(c.id)) }));

  return (
    <div className="flex flex-col bg-[#F4F6F9]" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Header + toolbar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shrink-0 px-6 pt-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1A1F2E] leading-none">My Learnings</h1>
            <p className="text-[12px] mt-1.5" style={{ color: "#9CA3AF" }}>
              {me?.name ?? "Welcome"} · {me?.position ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "Start now",         value: startNowCount,    color: "#DC2626", bg: "#FEF2F2" },
              { label: "Mandatory pending", value: mandatoryPending, color: "#B45309", bg: "#FFFBEB" },
              { label: "In progress",       value: inProgressCount,  color: "#0891B2", bg: "#ECFEFF" },
              { label: "Completed",         value: completedCount,   color: "#059669", bg: "#ECFDF5" },
              { label: "Open sessions",     value: openSessions.length, color: "#1D4ED8", bg: "#EFF6FF" },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-lg text-center" style={{ backgroundColor: s.bg, minWidth: 88 }}>
                <p className="text-[17px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide mt-1" style={{ color: s.color, opacity: 0.8 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1 — search · source · group by */}
        <div className="flex items-center gap-3 flex-wrap mb-2.5">
          <div className="relative shrink-0" style={{ width: 240 }}>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search courses, categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[13px] focus:outline-none transition-colors"
              style={{ color: "#1A1F2E", backgroundColor: "#F4F6F9", border: "1px solid #E5E7EB" }}
              onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.backgroundColor = "#fff"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.backgroundColor = "#F4F6F9"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Source segment — assigned vs open for registration */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F6F9", border: "1px solid #E5E7EB" }}>
            {SOURCES.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSource(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                style={source === id
                  ? { backgroundColor: "white", color: "#1A1F2E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { backgroundColor: "transparent", color: "#9CA3AF" }}
              >
                <Icon size={11} /> {label}
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={source === id ? { backgroundColor: "#E8FAF7", color: "#047857" } : { backgroundColor: "#EBEDF0", color: "#9CA3AF" }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {source !== "open" && (
            <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F6F9", border: "1px solid #E5E7EB" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color: "#9CA3AF" }}>Group by</span>
              {([
                { id: "status", label: "Status", icon: LayoutGrid },
                { id: "category", label: "Category", icon: Tag },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setGroupBy(id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                  style={groupBy === id
                    ? { backgroundColor: "white", color: "#1A1F2E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                    : { backgroundColor: "transparent", color: "#9CA3AF" }}
                >
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2 — status pills + category labels */}
        <div className="flex items-center gap-2 flex-wrap">
          {source !== "open" && FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
              style={filter === f
                ? { backgroundColor: TEAL, color: "#1A1F2E", borderColor: TEAL }
                : { backgroundColor: "white", color: "#6B7280", borderColor: "#E5E7EB" }}
            >
              {f}
            </button>
          ))}

          {source !== "open" && <span className="w-px h-5 mx-1" style={{ backgroundColor: "#E5E7EB" }} />}

          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#B0B8C8" }}>Categories</span>
          {cats.map(c => {
            const on = activeCats.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setActiveCats(a => on ? a.filter(x => x !== c.id) : [...a, c.id])}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
                style={on
                  ? { backgroundColor: c.bg, color: c.color, borderColor: c.color }
                  : { backgroundColor: "white", color: "#6B7280", borderColor: "#E5E7EB" }}
              >
                <span>{c.emoji}</span> {c.name}
              </button>
            );
          })}
          {activeCats.length > 0 && (
            <button onClick={() => setActiveCats([])} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
              <X size={11} /> Clear
            </button>
          )}
          {canManageCategories && (
            <button
              onClick={() => setShowCats(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border border-dashed transition-colors"
              style={{ color: TEAL, borderColor: "#A7F3D0", backgroundColor: "white" }}
            >
              <Settings2 size={11} /> Manage categories
            </button>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4">

        {source === "open" ? (
          /* ── Open for registration ─────────────────────────────────── */
          <div className="px-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={15} style={{ color: TEAL }} />
              <h2 className="text-[14px] font-bold text-[#1A1F2E]">Open for registration</h2>
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {openSessions.length} session{openSessions.length !== 1 ? "s" : ""} you can sign up for
                {activeCats.length ? ` · ${activeCats.length} category filter${activeCats.length > 1 ? "s" : ""}` : ""}
              </span>
            </div>
            {openSessions.length ? (
              <div className="grid grid-cols-3 gap-3">
                {openSessions.map(s => <OfflineSessionCard key={s.id} s={s} meId={meId} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <CalendarDays size={40} className="mb-3" style={{ color: "#D1D5DB" }} />
                <p className="text-[14px] font-semibold" style={{ color: "#9CA3AF" }}>Nothing open for registration</p>
                <p className="text-[12px] mt-1" style={{ color: "#C4C9D4" }}>Try clearing the category filter</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <StartNowSection onSelect={setSelectedCourse} />

            {source === "all" && <OfflineTrainingSection meId={meId} sessions={openSessions} />}

            <div className="px-6 mb-2 flex items-center gap-2 flex-wrap">
              {source === "assigned" ? <Inbox size={15} style={{ color: "#6B7280" }} /> : <BookIcon size={15} style={{ color: "#6B7280" }} />}
              <h2 className="text-[14px] font-bold text-[#1A1F2E]">
                {source === "assigned" ? "Assigned training" : "Course catalogue"}
              </h2>
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {filtered.length} course{filtered.length !== 1 ? "s" : ""}
                {q ? ` matching "${search.trim()}"` : ""}
                {filter !== "All" ? ` · ${filter}` : ""} · grouped by {groupBy}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BookIcon size={40} className="mb-3" style={{ color: "#D1D5DB" }} />
                <p className="text-[14px] font-semibold" style={{ color: "#9CA3AF" }}>No courses found</p>
                <p className="text-[12px] mt-1" style={{ color: "#C4C9D4" }}>Try a different search, status or category</p>
              </div>
            ) : groupBy === "status" ? (
              byStatus.map(({ key, courses }) => (
                <GroupSection
                  key={key}
                  label={key}
                  sub={STATUS_GROUP_STYLE[key as CourseStatusGroup].note}
                  color={STATUS_GROUP_STYLE[key as CourseStatusGroup].color}
                  bg={STATUS_GROUP_STYLE[key as CourseStatusGroup].bg}
                  courses={courses}
                  onSelect={setSelectedCourse}
                />
              ))
            ) : (
              byCategory.map(({ cat, courses }) => (
                <GroupSection
                  key={cat.id}
                  label={`${cat.emoji} ${cat.name}`}
                  sub={`${courses.filter(c => c.mandatory).length} mandatory · ${courses.filter(c => c.progress >= 100).length} completed`}
                  color={cat.color}
                  bg={cat.bg}
                  courses={courses}
                  onSelect={setSelectedCourse}
                />
              ))
            )}
          </>
        )}
      </div>

      {showCats && <CategoryManager onClose={() => setShowCats(false)} />}
    </div>
  );
}

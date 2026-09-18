import { useState } from "react";
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
} from "lucide-react";
import {
  ALL_MODULES, MODULE_BLOCKS, ALL_QUIZZES, MODULE_QUIZ,
  moduleStatus, quizStatus,
  type Block, type ModuleQuiz, type CourseModule,
} from "../courseStore";

const TEAL = "#00C9A7";

type BadgeType = "PPT" | "PDF" | "Video" | "Word";
type Filter = "All" | "Mandatory" | "Optional" | "In Progress" | "Completed";

interface Course {
  id: string;
  title: string;
  dept: string;
  types: BadgeType[];
  duration: string;
  progress: number;
  mandatory: boolean;
  from: string;
  to: string;
  emoji: string;
  sopId?: string;
}

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

const COURSES: Course[] = [
  { id: "m1", title: "Data Privacy & Compliance", dept: "IT", types: ["PDF", "Video"], duration: "45 min", progress: 100, mandatory: true, from: "#1E293B", to: "#0F172A", emoji: "🔒", sopId: "s3" },
  { id: "m2", title: "Workplace Safety Essentials", dept: "HR", types: ["PPT", "Video"], duration: "60 min", progress: 0, mandatory: true, from: "#7F1D1D", to: "#450A0A", emoji: "⚠️" },
  { id: "m3", title: "Anti-Bribery & Ethics Policy", dept: "Compliance", types: ["PDF"], duration: "30 min", progress: 0, mandatory: true, from: "#4C1D95", to: "#2E1065", emoji: "⚖️" },
  { id: "m4", title: "Emergency Response Protocol", dept: "Operations", types: ["Video", "PPT"], duration: "50 min", progress: 20, mandatory: true, from: "#78350F", to: "#451A03", emoji: "🚨" },
  { id: "m5", title: "Information Security Awareness", dept: "IT", types: ["PDF", "PPT"], duration: "40 min", progress: 0, mandatory: true, from: "#0C4A6E", to: "#082F49", emoji: "🛡️" },
  { id: "c1", title: "AC Installation Manual", dept: "Engineering", types: ["PDF", "Video", "PPT"], duration: "90 min", progress: 60, mandatory: false, from: "#064E3B", to: "#022C22", emoji: "🔧", sopId: "s1" },
  { id: "c2", title: "Customer Handling Techniques", dept: "Sales", types: ["Video"], duration: "35 min", progress: 45, mandatory: false, from: "#831843", to: "#500724", emoji: "🤝", sopId: "s2" },
  { id: "c3", title: "Project Management Basics", dept: "Operations", types: ["PPT", "Word"], duration: "55 min", progress: 80, mandatory: false, from: "#14532D", to: "#052E16", emoji: "📋" },
  { id: "c4", title: "Refrigerant Handling R410A", dept: "Engineering", types: ["PDF", "Video"], duration: "40 min", progress: 30, mandatory: false, from: "#065F46", to: "#022C22", emoji: "❄️" },
  { id: "o1", title: "Advanced Excel for Finance", dept: "Finance", types: ["PPT", "Video"], duration: "120 min", progress: 0, mandatory: false, from: "#166534", to: "#052E16", emoji: "📊" },
  { id: "o2", title: "Presentation & Communication", dept: "HR", types: ["Video", "PPT"], duration: "70 min", progress: 0, mandatory: false, from: "#7C2D12", to: "#431407", emoji: "🎤" },
  { id: "o3", title: "Lean Six Sigma Introduction", dept: "Operations", types: ["PDF", "Word"], duration: "85 min", progress: 0, mandatory: false, from: "#1E1B4B", to: "#0D0B30", emoji: "📐" },
  { id: "o4", title: "Leadership Fundamentals", dept: "HR", types: ["Video"], duration: "45 min", progress: 0, mandatory: false, from: "#134E4A", to: "#042F2E", emoji: "🌟" },
  { id: "d1", title: "HVAC System Overview", dept: "Engineering", types: ["Video", "PDF"], duration: "75 min", progress: 0, mandatory: false, from: "#0F3460", to: "#081D40", emoji: "💨" },
  { id: "d2", title: "Electrical Safety Standards", dept: "Engineering", types: ["PPT"], duration: "55 min", progress: 0, mandatory: false, from: "#1E3A5F", to: "#0A1F3A", emoji: "⚡" },
  { id: "d3", title: "Tools & Equipment Safety", dept: "Engineering", types: ["Video", "PPT"], duration: "30 min", progress: 0, mandatory: false, from: "#292524", to: "#1C1917", emoji: "🛠️" },
];

const FEATURED = COURSES.find(c => c.id === "c1")!;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[#9CA3AF]">
            <Clock size={10} />
            <span className="text-[10px]">{course.duration}</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">{course.dept}</span>
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

// ── Rail ──────────────────────────────────────────────────────────────────────
const PREVIEW = 4;

function Rail({ title, courses, onSelect }: { title: string; courses: Course[]; onSelect: (c: Course) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? courses : courses.slice(0, PREVIEW);
  const hasMore = courses.length > PREVIEW;

  if (courses.length === 0) return null;

  return (
    <div className="mb-6 px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-bold text-[#1A1F2E]">{title}</h2>
        {hasMore && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-0.5 text-[12px] font-semibold hover:opacity-70 transition-opacity"
            style={{ color: TEAL }}
          >
            {expanded ? "Show less" : "See all"}
            <ChevronRight
              size={13}
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {shown.map(c => (
          <CourseCard key={c.id} course={c} onClick={() => onSelect(c)} />
        ))}
      </div>
    </div>
  );
}

// ── Learning Portal ───────────────────────────────────────────────────────────
export function LearningPortal() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  if (selectedCourse) {
    if (selectedCourse.sopId) {
      return <SopCourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
    }
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  const showRails = filter === "All" && !search.trim();

  const filtered = COURSES.filter(c => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q);
    if (!matchSearch) return false;
    switch (filter) {
      case "Mandatory":   return c.mandatory;
      case "Optional":    return !c.mandatory;
      case "In Progress": return c.progress > 0 && c.progress < 100;
      case "Completed":   return c.progress >= 100;
      default:            return true;
    }
  });

  const mandatory  = COURSES.filter(c => c.mandatory);
  const inProgress = COURSES.filter(c => c.progress > 0 && c.progress < 100);
  const optional   = COURSES.filter(c => !c.mandatory && c.progress === 0);
  const byDept     = COURSES.filter(c => c.dept === "Engineering");

  return (
    <div className="flex flex-col bg-[#F4F6F9]" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Page header + search toolbar ────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shrink-0 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1A1F2E] leading-none">Learning Portal</h1>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>
              {inProgress.length} in progress&nbsp;&nbsp;·&nbsp;&nbsp;{mandatory.filter(c => c.progress < 100).length} mandatory pending
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
            {COURSES.length} courses available
          </span>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative shrink-0" style={{ width: 280 }}>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search courses, topics, departments…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[13px] focus:outline-none transition-colors"
              style={{
                color: "#1A1F2E",
                backgroundColor: "#F4F6F9",
                border: "1px solid #E5E7EB",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.backgroundColor = "#fff"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.backgroundColor = "#F4F6F9"; }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(f => (
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
          </div>
        </div>
      </div>

      {/* ── Recommended for you — compact strip ─────────────────────────── */}
      <div
        className="apex-learning-featured mx-6 mt-4 mb-1 rounded-xl bg-white border border-gray-100 flex items-stretch overflow-hidden shrink-0 cursor-pointer"
        style={{ minHeight: 132, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
        onClick={() => setSelectedCourse(FEATURED)}
      >
        {/* Left TEAL accent bar */}
        <div className="w-1 shrink-0" style={{ backgroundColor: TEAL }} />

        <div className="apex-learning-featured-body flex items-center flex-1 gap-5 px-5 py-4">
          {/* Thumbnail */}
          <div
            className="rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center"
            style={{ width: 104, height: 76, background: `linear-gradient(135deg, ${FEATURED.from} 0%, ${FEATURED.to} 100%)` }}
          >
            <span className="text-4xl opacity-40 select-none" style={{ userSelect: "none" }}>{FEATURED.emoji}</span>
            <div className="absolute top-1.5 left-1.5 flex gap-1">
              {FEATURED.types.slice(0, 2).map(t => (
                <span key={t} className="px-1 py-0.5 rounded-sm text-[8px] font-bold uppercase"
                  style={{ backgroundColor: TYPE_STYLE[t].bg, color: TYPE_STYLE[t].color }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Info block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={10} style={{ color: TEAL }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEAL }}>
                Recommended for you
              </span>
            </div>
            <p className="text-[14px] font-bold text-[#1A1F2E] truncate mb-2">{FEATURED.title}</p>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {FEATURED.types.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: TYPE_BADGE_LIGHT[t].bg, color: TYPE_BADGE_LIGHT[t].color }}>
                  {t}
                </span>
              ))}
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "#9CA3AF" }}>
                <Clock size={10} /> {FEATURED.duration}
              </span>
              <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{FEATURED.dept}</span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2.5">
              <div className="flex-1 rounded-full" style={{ height: 5, backgroundColor: "#E5E7EB" }}>
                <div
                  className="rounded-full transition-all"
                  style={{ height: 5, width: `${FEATURED.progress}%`, backgroundColor: TEAL }}
                />
              </div>
              <span className="text-[11px] font-bold shrink-0" style={{ color: TEAL }}>
                {FEATURED.progress}%
              </span>
            </div>
          </div>

          {/* Resume button */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedCourse(FEATURED); }}
            className="apex-learning-featured-action flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold shrink-0 transition-opacity hover:opacity-85"
            style={{ backgroundColor: TEAL, color: "#1A1F2E" }}
          >
            <Play size={11} fill="currentColor" /> Resume
          </button>
        </div>
      </div>

      {/* ── Catalog ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4">
        {showRails ? (
          <>
            <Rail title="My Learning Path"             courses={inProgress} onSelect={setSelectedCourse} />
            <Rail title="Mandatory for You"            courses={mandatory}  onSelect={setSelectedCourse} />
            <Rail title="Optional Courses"             courses={optional}   onSelect={setSelectedCourse} />
            <Rail title="By Department — Engineering"  courses={byDept}     onSelect={setSelectedCourse} />
          </>
        ) : (
          <div className="px-6">
            <p className="text-[12px] mb-5" style={{ color: "#9CA3AF" }}>
              {filtered.length} course{filtered.length !== 1 ? "s" : ""}
              {search.trim() ? ` matching "${search.trim()}"` : ""}
              {filter !== "All" ? ` · ${filter}` : ""}
            </p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {filtered.map(c => (
                  <CourseCard key={c.id} course={c} onClick={() => setSelectedCourse(c)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <BookOpen size={40} className="mb-3" style={{ color: "#D1D5DB" }} />
                <p className="text-[14px] font-semibold" style={{ color: "#9CA3AF" }}>No courses found</p>
                <p className="text-[12px] mt-1" style={{ color: "#C4C9D4" }}>Try a different search term or filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

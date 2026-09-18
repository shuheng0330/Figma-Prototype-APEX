import { useMemo, useState, useRef } from "react";
import {
  X,
  Send,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  FileText,
} from "lucide-react";
import { generateCheckpoints, isActivityOverdue, isCheckpointAvailable } from "../performance/domain";
import { usePerformanceStore, type KpiAssessmentRecord } from "../performance/store";

const BLUE = "#2457A6";
const TEAL = "#0F9F8F";
const AMBER = "#D99000";
const RED = "#D14343";
const GREEN = "#059669";
const TEXT = "#172033";
const MUTED = "#667085";
const BORDER = "#DCE3EC";
const BG = "#F4F6F9";
const PURPLE = "#7C3AED";

// ── Score metadata ────────────────────────────────────────────────────────────

const SCORE_META: Record<
  number,
  { label: string; color: string }
> = {
  5: { label: "Exceptional", color: GREEN },
  4: { label: "Exceeds Expectations", color: TEAL },
  3: { label: "Meets Expectations", color: BLUE },
  2: { label: "Partially Meets Expectations", color: AMBER },
  1: {
    label: "Needs Significant Improvement",
    color: "#E06B3A",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type KpiLevel = "Company" | "Department" | "Individual";
type CheckpointStatus =
  "Reviewed" | "Draft" | "Upcoming" | "Pending Review";
const CHECKPOINT_IDS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
type CheckpointId = (typeof CHECKPOINT_IDS)[number];

interface ScoreDef {
  s5: string;
  s4: string;
  s3: string;
  s2: string;
  s1: string;
}
interface KpiRow {
  id: string;
  level: KpiLevel;
  name: string;
  target: string;
  scoreDef: ScoreDef;
}
interface EvidenceFile {
  name: string;
  size: string;
}
interface CheckpointData {
  status: CheckpointStatus;
  scores: Record<string, number | null>;
  comments: Record<string, string>;
  evidence: Record<string, EvidenceFile | null>;
  overdue?: boolean;
}
interface CheckpointMeta {
  id: CheckpointId;
  label: string;
  date: string;
  deadline: string;
  deadlineIso?: string;
  availableFrom?: string;
}
interface AttitudeRow {
  id: string;
  criterion: string;
  description: string;
  score: number | null;
  comment: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<
  KpiLevel,
  { color: string; bg: string }
> = {
  Company: { color: BLUE, bg: "#EEF3FC" },
  Department: { color: PURPLE, bg: "#F5F3FF" },
  Individual: { color: TEAL, bg: "#ECFDF9" },
};

const CP_STATUS_STYLE: Record<
  CheckpointStatus,
  { color: string; bg: string; label: string }
> = {
  Reviewed: { color: TEAL, bg: "#ECFDF9", label: "Reviewed" },
  Draft: { color: AMBER, bg: "#FEF9EC", label: "Draft" },
  Upcoming: { color: MUTED, bg: "#F2F4F7", label: "Upcoming" },
  "Pending Review": { color: TEAL, bg: "#ECFDF9", label: "Pending Review" },
};

const CHECKPOINTS: CheckpointMeta[] = [
  {
    id: "jan",
    label: "January 2027",
    date: "31 Jan 2027",
    deadline: "5 Feb 2027",
  },
  {
    id: "feb",
    label: "February 2027",
    date: "28 Feb 2027",
    deadline: "5 Mar 2027",
  },
  {
    id: "mar",
    label: "March 2027",
    date: "31 Mar 2027",
    deadline: "5 Apr 2027",
  },
];

const SCORE_KEYS: (keyof ScoreDef)[] = [
  "s5",
  "s4",
  "s3",
  "s2",
  "s1",
];

const KPI_ROWS: KpiRow[] = [
  {
    id: "c1",
    level: "Company",
    name: "Company Revenue Growth",
    target: "≥ 8% YoY",
    scoreDef: {
      s5: "Revenue grows 10% or more above target YoY",
      s4: "Revenue grows 8%–9.9% YoY",
      s3: "Revenue grows 5%–7.9% YoY",
      s2: "Revenue grows 2%–4.9% YoY",
      s1: "Revenue grows 0%–1.9% YoY",
    },
  },
  {
    id: "c2",
    level: "Company",
    name: "Customer Satisfaction Index",
    target: "≥ 85%",
    scoreDef: {
      s5: "CSI score 95% or above",
      s4: "CSI score 90%–94%",
      s3: "CSI score 85%–89%",
      s2: "CSI score 75%–84%",
      s1: "CSI score 60%–74%",
    },
  },
  {
    id: "c3",
    level: "Company",
    name: "Branch Operations Score",
    target: "≥ 90%",
    scoreDef: {
      s5: "Operations score 98% or above",
      s4: "Operations score 93%–97%",
      s3: "Operations score 90%–92%",
      s2: "Operations score 80%–89%",
      s1: "Operations score 70%–79%",
    },
  },
  {
    id: "d1",
    level: "Department",
    name: "Monthly Sales Achievement",
    target: "RM 80,000/month",
    scoreDef: {
      s5: "Achieves 110% or more of monthly sales target",
      s4: "Achieves 100%–109% of monthly sales target",
      s3: "Achieves 90%–99% of monthly sales target",
      s2: "Achieves 75%–89% of monthly sales target",
      s1: "Achieves 50%–74% of monthly sales target",
    },
  },
  {
    id: "d2",
    level: "Department",
    name: "Product Coverage",
    target: "≥ 80% product range",
    scoreDef: {
      s5: "Covers 95% or more of the product range",
      s4: "Covers 90%–94% of the product range",
      s3: "Covers 80%–89% of the product range",
      s2: "Covers 70%–79% of the product range",
      s1: "Covers 50%–69% of the product range",
    },
  },
  {
    id: "i1",
    level: "Individual",
    name: "New Customer Acquisition",
    target: "10 new customers/month",
    scoreDef: {
      s5: "Acquires 13 or more new customers per month",
      s4: "Acquires 11–12 new customers per month",
      s3: "Acquires 10 new customers per month",
      s2: "Acquires 8–9 new customers per month",
      s1: "Acquires 5–7 new customers per month",
    },
  },
  {
    id: "i2",
    level: "Individual",
    name: "Cross-Sell Rate",
    target: "≥ 20%",
    scoreDef: {
      s5: "Cross-sell rate 25% or above",
      s4: "Cross-sell rate 22%–24%",
      s3: "Cross-sell rate 20%–21%",
      s2: "Cross-sell rate 15%–19%",
      s1: "Cross-sell rate 10%–14%",
    },
  },
];

const INIT_CHECKPOINT_STATES: Partial<Record<
  CheckpointId,
  CheckpointData
>> = {
  jan: {
    status: "Reviewed",
    scores: { c1: 4, c2: 3, c3: 4, d1: 3, d2: 4, i1: 3, i2: 2 },
    comments: {
      c1: "Strong start to the year. Company revenue tracking ahead of target.",
      d1: "Achieved RM 73,200 against the RM 80,000 target. Narrowly missed due to the public holiday period.",
      i2: "Cross-sell at 16% for January. Will focus on increasing product pairing conversations in February.",
    },
    evidence: {
      d1: { name: "sales-report-jan-2027.pdf", size: "2.4 MB" },
    },
  },
  feb: {
    status: "Draft", overdue: true,
    scores: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, null]),
    ),
    comments: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, ""]),
    ),
    evidence: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, null]),
    ),
  },
  mar: {
    status: "Upcoming",
    scores: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, null]),
    ),
    comments: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, ""]),
    ),
    evidence: Object.fromEntries(
      KPI_ROWS.map((k) => [k.id, null]),
    ),
  },
};

const INIT_ATTITUDE: AttitudeRow[] = [
  {
    id: "a1",
    criterion: "Integrity & Professionalism",
    description:
      "Demonstrates honesty, ethical conduct and professional standards at all times.",
    score: null,
    comment: "",
  },
  {
    id: "a2",
    criterion: "Customer Focus",
    description:
      "Consistently prioritises customer needs, resolves issues promptly and delivers quality service.",
    score: null,
    comment: "",
  },
  {
    id: "a3",
    criterion: "Sales Initiative & Drive",
    description:
      "Proactively identifies sales opportunities, takes ownership of targets and drives results.",
    score: null,
    comment: "",
  },
  {
    id: "a4",
    criterion: "Teamwork & Collaboration",
    description:
      "Supports colleagues, shares product knowledge and contributes to a positive team environment.",
    score: null,
    comment: "",
  },
  {
    id: "a5",
    criterion: "Product Knowledge",
    description:
      "Demonstrates up-to-date knowledge of products, promotions and services to effectively advise customers.",
    score: null,
    comment: "",
  },
  {
    id: "a6",
    criterion: "Adaptability",
    description:
      "Responds positively to change, learns quickly and adjusts approach when needed.",
    score: null,
    comment: "",
  },
];

// ── Score Selector ────────────────────────────────────────────────────────────

function ScoreSelector({
  value,
  onChange,
  readOnly,
  minScore = 1,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  minScore?: number;
}) {
  const scores = Array.from(
    { length: 6 - minScore },
    (_, i) => i + minScore,
  );
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {scores.map((n) => {
          const sel = value === n;
          const m = SCORE_META[n];
          return (
            <button
              key={n}
              onClick={() => !readOnly && onChange?.(n)}
              title={m.label}
              className="w-7 h-7 rounded text-[12px] font-bold transition-colors"
              style={{
                backgroundColor: sel ? m.color : "#F2F4F7",
                color: sel ? "white" : MUTED,
                cursor: readOnly ? "default" : "pointer",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value !== null &&
        value !== undefined &&
        SCORE_META[value] && (
          <p
            className="text-[10px] mt-1"
            style={{ color: SCORE_META[value].color }}
          >
            {SCORE_META[value].label}
          </p>
        )}
    </div>
  );
}

// ── Scoring Criteria Drawer ───────────────────────────────────────────────────

function ScoringCriteriaDrawer({
  kpi,
  onClose,
}: {
  kpi: KpiRow;
  onClose: () => void;
}) {
  const ls = LEVEL_STYLE[kpi.level];
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-[400px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}` }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: BORDER }}
        >
          <div>
            <h3
              className="text-[14px] font-bold"
              style={{ color: TEXT }}
            >
              KPI-Specific Scoring Criteria
            </h3>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: MUTED }}
            >
              Each KPI may use different achievement thresholds.
              Review these criteria before selecting your
              Self-Assessment Point.
            </p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0">
            <X size={18} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className="mb-4 pb-4 border-b"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[13px] font-bold"
                style={{ color: TEXT }}
              >
                {kpi.name}
              </span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  color: ls.color,
                  backgroundColor: ls.bg,
                }}
              >
                {kpi.level}-Level
              </span>
            </div>
            <p className="text-[12px]" style={{ color: MUTED }}>
              Target: {kpi.target}
            </p>
          </div>
          <div className="space-y-4">
            {SCORE_KEYS.map((key, i) => {
              const score = 5 - i;
              const m = SCORE_META[score];
              return (
                <div key={key} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: m.color }}
                  >
                    {score}
                  </div>
                  <div>
                    <p
                      className="text-[11px] font-semibold"
                      style={{ color: m.color }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: TEXT }}
                    >
                      {kpi.scoreDef[key]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="px-6 py-4 border-t shrink-0"
          style={{ borderColor: BORDER }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Per-KPI Evidence Cell ─────────────────────────────────────────────────────

function EvidenceCell({
  evidence,
  onChange,
  readOnly,
}: {
  evidence: EvidenceFile | null;
  onChange: (f: EvidenceFile | null) => void;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [showRemove, setShowRemove] = useState(false);
  const [showView, setShowView] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) {
      setError(
        "Unsupported format. Please attach a PDF, PNG, JPG or JPEG file.",
      );
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(
        "File exceeds 10 MB. Please attach a smaller file.",
      );
      e.target.value = "";
      return;
    }
    setError("");
    const mb = file.size / (1024 * 1024);
    const kb = file.size / 1024;
    onChange({
      name: file.name,
      size:
        mb >= 1
          ? `${mb.toFixed(1)} MB`
          : `${Math.round(kb)} KB`,
    });
    e.target.value = "";
  }

  return (
    <div>
      {evidence ? (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-md"
          style={{
            backgroundColor: "#F8FAFC",
            border: `1px solid ${BORDER}`,
          }}
        >
          <FileText
            size={13}
            style={{ color: BLUE }}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-medium truncate"
              style={{ color: TEXT }}
            >
              {evidence.name}
            </p>
            <p className="text-[10px]" style={{ color: MUTED }}>
              {evidence.size}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setShowView(true)}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                color: BLUE,
                backgroundColor: "#EEF3FC",
              }}
            >
              View
            </button>
            {!readOnly && (
              <button
                onClick={() => setShowRemove(true)}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  color: RED,
                  backgroundColor: "#FEF3F2",
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : !readOnly ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFile}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: BLUE }}
          >
            <Paperclip size={11} /> Attach Evidence
          </button>
          {error && (
            <p
              className="text-[10px] mt-1 flex items-start gap-1"
              style={{ color: RED }}
            >
              <AlertTriangle
                size={9}
                className="mt-0.5 shrink-0"
              />{" "}
              {error}
            </p>
          )}
        </div>
      ) : null}

      {/* View modal */}
      {showView && evidence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: BORDER }}
            >
              <h3
                className="text-[14px] font-bold"
                style={{ color: TEXT }}
              >
                Attached Evidence
              </h3>
              <button onClick={() => setShowView(false)}>
                <X size={16} style={{ color: MUTED }} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-3">
                <FileText
                  size={28}
                  style={{ color: BLUE }}
                  className="shrink-0"
                />
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: TEXT }}
                  >
                    {evidence.name}
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ color: MUTED }}
                  >
                    {evidence.size}
                  </p>
                </div>
              </div>
              <p
                className="text-[12px] p-3 rounded-md"
                style={{
                  color: MUTED,
                  backgroundColor: "#F8FAFC",
                }}
              >
                File preview is not available in this prototype.
                In the live application, the file would open in
                a viewer here.
              </p>
            </div>
            <div
              className="flex justify-end px-6 py-4 border-t"
              style={{ borderColor: BORDER }}
            >
              <button
                onClick={() => setShowView(false)}
                className="px-4 py-2 rounded-md text-[13px] font-medium border"
                style={{ color: TEXT, borderColor: BORDER }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm */}
      {showRemove && evidence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[380px] overflow-hidden">
            <div className="px-6 py-5 space-y-2">
              <p
                className="text-[14px] font-bold"
                style={{ color: TEXT }}
              >
                Remove evidence?
              </p>
              <p
                className="text-[13px]"
                style={{ color: MUTED }}
              >
                "{evidence.name}" will be removed from this KPI.
              </p>
            </div>
            <div
              className="flex justify-end gap-2 px-6 py-4 border-t"
              style={{ borderColor: BORDER }}
            >
              <button
                onClick={() => setShowRemove(false)}
                className="px-4 py-2 rounded-md text-[13px] border"
                style={{ color: TEXT, borderColor: BORDER }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onChange(null);
                  setShowRemove(false);
                }}
                className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
                style={{ backgroundColor: RED }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Submit Dialog ─────────────────────────────────────────────────────────

function KpiSubmitDialog({
  checkpoint,
  evidenceCount,
  onClose,
  onSubmit,
}: {
  checkpoint: CheckpointMeta;
  evidenceCount: number;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: BORDER }}
        >
          <h2
            className="text-[15px] font-bold"
            style={{ color: TEXT }}
          >
            Submit KPI Self-Assessment
          </h2>
          <button onClick={onClose}>
            <X size={18} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            You are submitting your KPI Self-Assessment for{" "}
            <strong>{checkpoint.label}</strong> to your Superior.
            After submission, you will not be able to edit it
            unless it is returned for revision.
          </p>
          <div
            className="p-3 rounded-md space-y-1.5"
            style={{
              backgroundColor: "#F8FAFC",
              border: `1px solid ${BORDER}`,
            }}
          >
            {[
              ["Review Checkpoint", checkpoint.label],
              ["Checkpoint Date", checkpoint.date],
              ["Submission Deadline", checkpoint.deadline],
              [
                "KPIs Completed",
                `${KPI_ROWS.length} / ${KPI_ROWS.length}`,
              ],
              [
                "Evidence Attached",
                evidenceCount > 0
                  ? `${evidenceCount} file${evidenceCount > 1 ? "s" : ""}`
                  : "None",
              ],
              ["Submitting to", "Sales Manager (Superior)"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[12px]"
              >
                <span style={{ color: MUTED }}>{label}</span>
                <span
                  className="font-semibold"
                  style={{ color: TEXT }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex justify-end gap-2 px-6 py-4 border-t"
          style={{ borderColor: BORDER }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: TEAL }}
          >
            Submit to Superior
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Attitude Submit Dialog ────────────────────────────────────────────────────

function AttitudeSubmitDialog({
  onClose,
  onSubmit,
  periodName,
  deadline,
}: {
  onClose: () => void;
  onSubmit: () => void;
  periodName: string;
  deadline: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: BORDER }}
        >
          <h2
            className="text-[15px] font-bold"
            style={{ color: TEXT }}
          >
            Submit Annual Attitude Self-Assessment
          </h2>
          <button onClick={onClose}>
            <X size={18} style={{ color: MUTED }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px]" style={{ color: TEXT }}>
            Your Annual Attitude Self-Assessment will be
            submitted to your Superior for review. After
            submission, you will not be able to edit it.
          </p>
          <div
            className="p-3 rounded-md space-y-1.5"
            style={{
              backgroundColor: "#F8FAFC",
              border: `1px solid ${BORDER}`,
            }}
          >
            {[
              ["Review Period", periodName],
              ["Evaluation Form", "Sales"],
              [
                "Criteria Completed",
                `${INIT_ATTITUDE.length} / ${INIT_ATTITUDE.length}`,
              ],
              ["Deadline", deadline],
              ["Submitting to", "Sales Manager (Superior)"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[12px]"
              >
                <span style={{ color: MUTED }}>{label}</span>
                <span
                  className="font-semibold"
                  style={{ color: TEXT }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex justify-end gap-2 px-6 py-4 border-t"
          style={{ borderColor: BORDER }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: TEAL }}
          >
            Submit Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MyAssessments() {
  const performanceStore = usePerformanceStore();
  const openPeriod = performanceStore.periods.find(period => {
    if (period.status !== "Open") return false;
    return generateCheckpoints(period, "Monthly").some(checkpoint => isCheckpointAvailable(checkpoint, performanceStore.state.effectiveDate));
  });
  const selectedPeriod = openPeriod ?? performanceStore.periods.find(period => period.id === "2027") ?? performanceStore.periods[0];
  const checkpoints = useMemo<CheckpointMeta[]>(() => {
    if (!selectedPeriod) return CHECKPOINTS;
    return generateCheckpoints(selectedPeriod, "Monthly").slice(0, 12).map((checkpoint, index) => ({
      id: CHECKPOINT_IDS[index],
      label: checkpoint.label,
      date: new Date(`${checkpoint.checkpointDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      deadline: new Date(`${checkpoint.selfDeadline}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      deadlineIso: checkpoint.selfDeadline,
      availableFrom: checkpoint.availableFrom,
    }));
  }, [selectedPeriod]);
  const [tab, setTab] = useState<"kpi" | "attitude">("kpi");
  const [selectedCpId, setSelectedCpId] =
    useState<CheckpointId>("feb");
  const assessmentKey = (checkpointId: CheckpointId) => `${selectedPeriod?.id ?? "2027"}:amir:${checkpointId}`;
  const emptyCheckpointState = (): CheckpointData => ({
    status: "Draft",
    scores: Object.fromEntries(KPI_ROWS.map(kpi => [kpi.id, null])),
    comments: Object.fromEntries(KPI_ROWS.map(kpi => [kpi.id, ""])),
    evidence: Object.fromEntries(KPI_ROWS.map(kpi => [kpi.id, null])),
  });
  const cpStates = Object.fromEntries(CHECKPOINT_IDS.map(checkpointId => {
    const stored = performanceStore.state.kpiAssessments[assessmentKey(checkpointId)];
    return [checkpointId, stored ? {
      status: stored.status,
      scores: stored.selfPoints,
      comments: stored.selfComments,
      evidence: stored.evidence,
      overdue: stored.completedLate,
    } : (INIT_CHECKPOINT_STATES[checkpointId] ?? emptyCheckpointState())];
  })) as Record<CheckpointId, CheckpointData>;
  const attitudeRecord = performanceStore.state.attitudeAssessments[`${selectedPeriod?.id ?? "2027"}:amir`];
  const attitudeRows: AttitudeRow[] = INIT_ATTITUDE.map(row => ({
    ...row,
    score: attitudeRecord?.selfPoints[row.id] ?? null,
    comment: attitudeRecord?.selfComments[row.id] ?? "",
  }));
  const attStatus = attitudeRecord?.status ?? "Draft";
  const [showKpiDialog, setShowKpiDialog] = useState(false);
  const [showAttDialog, setShowAttDialog] = useState(false);
  const [criteriaKpiId, setCriteriaId] = useState<
    string | null
  >(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const currentCp = checkpoints.find(
    (c) => c.id === selectedCpId,
  )!;
  const currentState = cpStates[selectedCpId];
  const isReadOnly =
    currentState.status === "Reviewed" ||
    currentState.status === "Pending Review";
  const checkpointAvailable = !currentCp.availableFrom || performanceStore.state.effectiveDate >= currentCp.availableFrom;
  const isUpcoming = !checkpointAvailable;
  const isEditable = checkpointAvailable && currentState.status === "Draft";
  const currentOverdue = isActivityOverdue(currentCp.deadlineIso ?? currentCp.deadline, undefined, performanceStore.state.effectiveDate) && currentState.status !== "Reviewed";
  const attitudeOverdue = selectedPeriod
    ? isActivityOverdue(selectedPeriod.deadlines.attitudeSelf, undefined, performanceStore.state.effectiveDate) && attStatus !== "Reviewed"
    : false;

  const allKpiScored = KPI_ROWS.every(
    (k) => (currentState.scores[k.id] ?? null) !== null,
  );
  const evidenceCount = Object.values(
    currentState.evidence,
  ).filter(Boolean).length;

  const attAllScored = attitudeRows.every(
    (r) => r.score !== null,
  );

  const criteriaKpi = criteriaKpiId
    ? (KPI_ROWS.find((k) => k.id === criteriaKpiId) ?? null)
    : null;

  // ── Checkpoint state updaters ──
  function setScore(kpiId: string, score: number) {
    const record = getCurrentAssessmentRecord();
    performanceStore.upsertKpiAssessment({ ...record, selfPoints: { ...record.selfPoints, [kpiId]: score } });
  }
  function setComment(kpiId: string, comment: string) {
    const record = getCurrentAssessmentRecord();
    performanceStore.upsertKpiAssessment({ ...record, selfComments: { ...record.selfComments, [kpiId]: comment } });
  }
  function setEvidence(
    kpiId: string,
    file: EvidenceFile | null,
  ) {
    const record = getCurrentAssessmentRecord();
    performanceStore.upsertKpiAssessment({ ...record, evidence: { ...record.evidence, [kpiId]: file } });
  }

  function getCurrentAssessmentRecord(): KpiAssessmentRecord {
    const existing = performanceStore.state.kpiAssessments[assessmentKey(selectedCpId)];
    if (existing) return existing;
    return {
      id: assessmentKey(selectedCpId), periodId: selectedPeriod?.id ?? "2027", employeeId: "amir",
      checkpointId: selectedCpId, checkpointLabel: currentCp.label, status: "Draft",
      selfPoints: currentState.scores, selfComments: currentState.comments, evidence: currentState.evidence,
      superiorPoints: Object.fromEntries(KPI_ROWS.map(kpi => [kpi.id, null])),
      superiorComments: Object.fromEntries(KPI_ROWS.map(kpi => [kpi.id, ""])),
    };
  }

  function updateCpStatus(
    status: CheckpointStatus,
    extra?: Partial<CheckpointData>,
  ) {
    const record = getCurrentAssessmentRecord();
    performanceStore.upsertKpiAssessment({
      ...record,
      status: status === "Upcoming" ? "Draft" : status,
      completedLate: extra?.overdue ?? record.completedLate,
      submittedAt: status === "Pending Review" ? performanceStore.state.effectiveDate : record.submittedAt,
    });
  }

  function handleSaveDraft() {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }

  function handleKpiSubmit() {
    updateCpStatus("Pending Review", { overdue: currentOverdue || currentState.overdue });
    setShowKpiDialog(false);
  }

  function handleAttSubmit() {
    if (attitudeRecord) performanceStore.upsertAttitudeAssessment({
      ...attitudeRecord,
      status: "Pending Review",
      submittedAt: performanceStore.state.effectiveDate,
      completedLate: attitudeOverdue || attitudeRecord.completedLate,
    });
    setShowAttDialog(false);
  }

  const cpStatusStyle = CP_STATUS_STYLE[isUpcoming ? "Upcoming" : currentState.status];

  return (
    <div
      style={{
        backgroundColor: BG,
        minHeight: "calc(100vh - 56px)",
      }}
    >
      <div className="p-6 space-y-5">
        {/* ── Header ── */}
        <div>
          <h1
            className="text-[20px] font-bold"
            style={{ color: TEXT }}
          >
            My Assessments
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: MUTED }}
          >
            Amir Hassan · RS-1042 · {selectedPeriod?.name ?? "Annual KPI Review"}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex gap-1 p-1 rounded-lg w-fit"
          style={{ backgroundColor: "#E9EDF2" }}
        >
          {[
            { key: "kpi", label: "Monthly KPI Assessment" },
            {
              key: "attitude",
              label: "Annual Attitude Self-Assessment",
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setTab(t.key as "kpi" | "attitude")
              }
              className="px-5 py-2 rounded-md text-[13px] font-medium transition-colors"
              style={
                tab === t.key
                  ? {
                      backgroundColor: "white",
                      color: TEXT,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      fontWeight: 600,
                    }
                  : { color: MUTED }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            TAB 1: MONTHLY KPI ASSESSMENT
        ════════════════════════════════════════════════════ */}
        {tab === "kpi" && (
          <>
            {/* Checkpoint selector + compact info */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Checkpoint dropdown */}
                <div className="relative">
                  <select
                    value={selectedCpId}
                    onChange={(e) =>
                      setSelectedCpId(
                        e.target.value as CheckpointId,
                      )
                    }
                    className="appearance-none pl-3 pr-8 py-2 rounded-md text-[13px] font-semibold outline-none bg-white"
                    style={{
                      border: `1px solid ${BORDER}`,
                      color: TEXT,
                    }}
                  >
                    {checkpoints.map((c) => (
                      <option key={c.id} value={c.id} disabled={Boolean(c.availableFrom && performanceStore.state.effectiveDate < c.availableFrom)}>
                        {c.label}{c.availableFrom && performanceStore.state.effectiveDate < c.availableFrom ? " — unavailable" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: MUTED }}
                  />
                </div>
                {/* Compact checkpoint info */}
                <div
                  className="flex items-center gap-3 text-[12px]"
                  style={{ color: MUTED }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      color: cpStatusStyle.color,
                      backgroundColor: cpStatusStyle.bg,
                    }}
                  >
                    {cpStatusStyle.label}
                  </span>
                  <span>Checkpoint: {currentCp.date}</span>
                  <span>Deadline: {currentCp.deadline}</span>
                  {(currentState.overdue || currentOverdue) && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: RED, backgroundColor: "#FEF3F2" }}>Overdue</span>}
                  <span>KPIs: {KPI_ROWS.length}</span>
                </div>
              </div>

              {/* Action buttons */}
              {isEditable && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
                    style={{ color: TEXT, borderColor: BORDER }}
                  >
                    {draftSaved ? "Saved ✓" : "Save Draft"}
                  </button>
                  <button
                    onClick={() =>
                      allKpiScored && setShowKpiDialog(true)
                    }
                    disabled={!allKpiScored}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
                    style={{
                      backgroundColor: allKpiScored
                        ? TEAL
                        : "#9CA3AF",
                    }}
                  >
                    <Send size={13} />
                    Submit Assessment
                  </button>
                </div>
              )}
            </div>

            {/* Submit block reason */}
            {isEditable && !allKpiScored && (
              <p
                className="text-[12px] flex items-center gap-1.5"
                style={{ color: MUTED }}
              >
                <AlertTriangle
                  size={13}
                  style={{ color: AMBER }}
                />
                Complete the Self-Assessment Point for all KPIs
                before submitting.
              </p>
            )}

            {/* Upcoming state */}
            {isUpcoming && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[13px]"
                style={{
                  backgroundColor: "#F2F4F7",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <span style={{ color: MUTED }}>
                  This Review Checkpoint is not yet open for
                  Self-Assessment.
                </span>
              </div>
            )}

            {/* Submitted success banner */}
            {currentState.status === "Pending Review" && (
              <div className="space-y-2">
                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: "#ECFDF9",
                    border: `1px solid #6EE7B7`,
                  }}
                >
                  <CheckCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: TEAL }}
                  />
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: TEAL }}
                    >
                      Your KPI Self-Assessment for{" "}
                      {currentCp.label} has been submitted to
                      your Superior.
                    </p>
                    <p
                      className="text-[12px] mt-0.5"
                      style={{ color: MUTED }}
                    >
                      Self-Assessment Points are now read-only while your Superior completes the review.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {currentState.status === "Reviewed" && (
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#ECFDF9", border: `1px solid #6EE7B7` }}>
                <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: TEAL }}>Your KPI Self-Assessment has been reviewed by your Superior.</p>
                  <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>The submitted Self-Assessment Points remain preserved and read-only.</p>
                </div>
              </div>
            )}

            {/* KPI Table */}
            <div
              className="bg-white rounded-lg overflow-hidden"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: BORDER }}
              >
                <h2
                  className="text-[14px] font-bold"
                  style={{ color: TEXT }}
                >
                  KPI Assessment — {currentCp.label}
                </h2>
                {!isUpcoming && (
                  <p
                    className="text-[12px] mt-0.5"
                    style={{ color: MUTED }}
                  >
                    Select a Self-Assessment Point from 1–5
                    based on the scoring criteria defined for
                    each KPI. Add a supporting comment or
                    evidence where appropriate.
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      {[
                        "KPI Level",
                        "KPI Name",
                        "Target",
                        "Scoring Definition",
                        "Self-Assessment Point",
                        "Comment / Evidence",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                          style={{ color: MUTED }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {KPI_ROWS.map((kpi, i) => {
                      const ls = LEVEL_STYLE[kpi.level];
                      const score =
                        currentState.scores[kpi.id] ?? null;
                      const comment =
                        currentState.comments[kpi.id] ?? "";
                      const evidence =
                        currentState.evidence[kpi.id] ?? null;
                      const isLast = i === KPI_ROWS.length - 1;
                      return (
                        <tr
                          key={kpi.id}
                          style={{
                            borderBottom: isLast
                              ? "none"
                              : `1px solid ${BORDER}`,
                          }}
                        >
                          {/* KPI Level */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                color: ls.color,
                                backgroundColor: ls.bg,
                              }}
                            >
                              {kpi.level}-Level
                            </span>
                          </td>
                          {/* KPI Name */}
                          <td className="px-4 py-4 w-44">
                            <p
                              className="text-[13px] font-medium"
                              style={{ color: TEXT }}
                            >
                              {kpi.name}
                            </p>
                          </td>
                          {/* Target */}
                          <td
                            className="px-4 py-4 w-32 text-[12px] whitespace-nowrap"
                            style={{ color: TEXT }}
                          >
                            {kpi.target}
                          </td>
                          {/* Scoring Definition */}
                          <td className="px-4 py-4 w-36">
                            {!isUpcoming && (
                              <button
                                onClick={() =>
                                  setCriteriaId(kpi.id)
                                }
                                className="text-[11px] font-medium underline-offset-2 hover:underline whitespace-nowrap"
                                style={{ color: BLUE }}
                              >
                                View Scoring Definition
                              </button>
                            )}
                          </td>
                          {/* Self-Assessment Point */}
                          <td
                            className="px-4 py-4"
                            style={{ minWidth: 200 }}
                          >
                            {isUpcoming ? (
                              <span
                                className="text-[12px]"
                                style={{ color: MUTED }}
                              >
                                —
                              </span>
                            ) : isReadOnly ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                                  style={{
                                    backgroundColor:
                                      score !== null
                                        ? SCORE_META[score]
                                            ?.color
                                        : "#9CA3AF",
                                  }}
                                >
                                  {score ?? "—"}
                                </div>
                                {score !== null && (
                                  <span
                                    className="text-[11px]"
                                    style={{
                                      color:
                                        SCORE_META[score]
                                          ?.color,
                                    }}
                                  >
                                    {SCORE_META[score]?.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <ScoreSelector
                                value={score}
                                onChange={(v) =>
                                  setScore(kpi.id, v)
                                }
                              />
                            )}
                          </td>
                          {/* Comment / Evidence */}
                          <td
                            className="px-4 py-4"
                            style={{ width: 400 }}
                          >
                            {isUpcoming ? null : isReadOnly ? (
                              <div className="space-y-2">
                                {comment ? (
                                  <p
                                    className="text-[12px]"
                                    style={{ color: TEXT }}
                                  >
                                    {comment}
                                  </p>
                                ) : (
                                  <p
                                    className="text-[12px]"
                                    style={{ color: MUTED }}
                                  >
                                    No comment
                                  </p>
                                )}
                                {evidence && (
                                  <EvidenceCell
                                    evidence={evidence}
                                    onChange={() => {}}
                                    readOnly
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  value={comment}
                                  onChange={(e) =>
                                    setComment(
                                      kpi.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Add supporting comment…"
                                  rows={2}
                                  className="w-full px-2 py-1.5 rounded text-[12px] outline-none resize-none"
                                  style={{
                                    border: `1px solid ${BORDER}`,
                                    color: TEXT,
                                  }}
                                />
                                <EvidenceCell
                                  evidence={evidence}
                                  onChange={(f) =>
                                    setEvidence(kpi.id, f)
                                  }
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2: ANNUAL ATTITUDE SELF-ASSESSMENT
        ════════════════════════════════════════════════════ */}
        {tab === "attitude" && (
          <>
            {/* Annual info row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div
                className="flex items-center gap-3 flex-wrap text-[12px]"
                style={{ color: MUTED }}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    color: BLUE,
                    backgroundColor: "#EEF3FC",
                  }}
                >
                  Sales Evaluation Form
                </span>
                <span>{selectedPeriod?.name ?? "Annual KPI Review"}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    color: attStatus === "Draft" ? AMBER : TEAL,
                    backgroundColor: attStatus === "Draft"
                      ? "#ECFDF9"
                      : "#FEF9EC",
                  }}
                >
                  {attStatus}
                </span>
                <span>Deadline: {selectedPeriod?.deadlines.attitudeSelf ?? "—"}</span>
                {attitudeOverdue && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: RED, backgroundColor: "#FEF3F2" }}>Overdue</span>}
              </div>
              {attStatus === "Draft" && (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
                    style={{ color: TEXT, borderColor: BORDER }}
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() =>
                      attAllScored && setShowAttDialog(true)
                    }
                    disabled={!attAllScored}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white"
                    style={{
                      backgroundColor: attAllScored
                        ? TEAL
                        : "#9CA3AF",
                    }}
                  >
                    <Send size={13} /> Submit Assessment
                  </button>
                </div>
              )}
            </div>

            {/* Form info note */}
            <p className="text-[12px]" style={{ color: MUTED }}>
              This evaluation format is selected based on your
              current role.
            </p>

            {/* Attitude submit block reason */}
            {attStatus === "Draft" && !attAllScored && (
              <p
                className="text-[12px] flex items-center gap-1.5"
                style={{ color: MUTED }}
              >
                <AlertTriangle
                  size={13}
                  style={{ color: AMBER }}
                />
                Complete the Self-Assessment Point for all
                criteria before submitting.
              </p>
            )}

            {/* Submitted banner */}
            {attStatus === "Pending Review" && (
              <div
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  backgroundColor: "#ECFDF9",
                  border: `1px solid #6EE7B7`,
                }}
              >
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: TEAL }}
                />
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: TEAL }}
                  >
                    Your Annual Attitude Self-Assessment has
                    been submitted to your Superior.
                  </p>
                  <p
                    className="text-[12px] mt-0.5"
                    style={{ color: MUTED }}
                  >
                    Your Superior will review your
                    self-assessment and provide their own
                    evaluation.
                  </p>
                </div>
              </div>
            )}

            {/* Attitude criteria table */}
            <div
              className="bg-white rounded-lg overflow-hidden"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: BORDER }}
              >
                <h2
                  className="text-[14px] font-bold"
                  style={{ color: TEXT }}
                >
                  Sales Attitude Evaluation — Annual
                  Self-Assessment
                </h2>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: MUTED }}
                >
                  Rate yourself honestly on each criterion.
                  Points are reviewed by your Superior.
                </p>
              </div>
              <div>
                {attitudeRows.map((r, i) => (
                  <div
                    key={r.id}
                    className="px-5 py-4"
                    style={{
                      borderBottom:
                        i < attitudeRows.length - 1
                          ? `1px solid ${BORDER}`
                          : "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: TEXT }}
                        >
                          {r.criterion}
                        </p>
                        <p
                          className="text-[12px] mt-0.5"
                          style={{ color: MUTED }}
                        >
                          {r.description}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {attStatus !== "Draft" ? (
                          <div className="text-right">
                            {r.score !== null ? (
                              <>
                                <span
                                  className="text-[16px] font-bold"
                                  style={{
                                    color:
                                      SCORE_META[r.score]
                                        ?.color,
                                  }}
                                >
                                  {r.score}
                                </span>
                                <p
                                  className="text-[11px]"
                                  style={{
                                    color:
                                      SCORE_META[r.score]
                                        ?.color,
                                  }}
                                >
                                  {SCORE_META[r.score]?.label}
                                </p>
                              </>
                            ) : (
                              <span style={{ color: MUTED }}>
                                —
                              </span>
                            )}
                          </div>
                        ) : (
                          <ScoreSelector
                            value={r.score}
                            minScore={1}
                            onChange={(v) => attitudeRecord && performanceStore.upsertAttitudeAssessment({
                              ...attitudeRecord,
                              selfPoints: { ...attitudeRecord.selfPoints, [r.id]: v },
                            })}
                          />
                        )}
                      </div>
                    </div>
                    {attStatus === "Draft" && (
                      <textarea
                        value={r.comment}
                        onChange={(e) => attitudeRecord && performanceStore.upsertAttitudeAssessment({
                          ...attitudeRecord,
                          selfComments: { ...attitudeRecord.selfComments, [r.id]: e.target.value },
                        })}
                        placeholder="Optional comment…"
                        rows={2}
                        className="mt-3 w-full px-3 py-2 rounded-md text-[12px] outline-none resize-none"
                        style={{
                          border: `1px solid ${BORDER}`,
                          color: TEXT,
                        }}
                      />
                    )}
                    {attStatus !== "Draft" && r.comment && (
                      <p
                        className="mt-2 text-[12px]"
                        style={{ color: MUTED }}
                      >
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Scoring Criteria Drawer ── */}
      {criteriaKpi && (
        <ScoringCriteriaDrawer
          kpi={criteriaKpi}
          onClose={() => setCriteriaId(null)}
        />
      )}

      {/* ── Dialogs ── */}
      {showKpiDialog && (
        <KpiSubmitDialog
          checkpoint={currentCp}
          evidenceCount={evidenceCount}
          onClose={() => setShowKpiDialog(false)}
          onSubmit={handleKpiSubmit}
        />
      )}
      {showAttDialog && (
        <AttitudeSubmitDialog
          periodName={selectedPeriod?.name ?? "Annual KPI Review"}
          deadline={selectedPeriod?.deadlines.attitudeSelf ?? "—"}
          onClose={() => setShowAttDialog(false)}
          onSubmit={handleAttSubmit}
        />
      )}
    </div>
  );
}

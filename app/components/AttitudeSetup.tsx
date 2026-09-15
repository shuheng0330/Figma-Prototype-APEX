import { useState, useRef, useEffect } from "react";
import {
  X, ChevronDown, Plus, Pencil, Eye, ArrowUp, ArrowDown,
  Info, Lock, CheckCircle, Save,
} from "lucide-react";
import { PERIOD_OPTIONS } from "./appraisalData";

// ── Palette ───────────────────────────────────────────────────────────────────
const BLUE   = "#2457A6";
const TEAL   = "#0F9F8F";
const AMBER  = "#D99000";
const GREEN  = "#059669";
const PURPLE = "#8B5CF6";
const TEXT   = "#172033";
const MUTED  = "#667085";
const BORDER = "#DCE3EC";
const BG     = "#F4F6F9";

const LIVE_PERIOD = "2027 Annual KPI Review";

// ── Types ─────────────────────────────────────────────────────────────────────
type ConfigStatus    = "Draft" | "Published";
type CriterionStatus = "Active" | "Inactive";
type EvalFormat      = "Manager" | "Sales" | "Others / Non-Sales";
type CriterionType   = "Shared Core Value" | "Manager-Specific Criterion";
type PeriodStatus    = "Upcoming" | "Open" | "Closed";

interface RatingLevel {
  score: number; label: string; description: string;
}
interface Criterion {
  id: string; order: number; name: string; description: string;
  type: CriterionType; required: boolean; status: CriterionStatus;
}
interface RoleRow {
  id: string; department: string; role: string; format: EvalFormat; status: "Active" | "Inactive";
}
interface PeriodConfig {
  configStatus: ConfigStatus; lastUpdated: string;
  ratingScale: RatingLevel[];
  sharedCriteria: Criterion[];
  managerCriteria: Criterion[];
  roleAssignments: RoleRow[];
}

// ── Static period status ──────────────────────────────────────────────────────
const PERIOD_STATUS: Record<string, PeriodStatus> = {
  "2027 Annual KPI Review": "Upcoming",
  "2026 Annual KPI Review": "Open",
  "2025 Annual KPI Review": "Closed",
  "2024 Annual KPI Review": "Closed",
};
const PERIOD_STATUS_STYLE: Record<PeriodStatus, { color: string; bg: string }> = {
  Upcoming: { color: AMBER, bg: "#FEF9EC" },
  Open:     { color: GREEN, bg: "#ECFDF5" },
  Closed:   { color: MUTED, bg: "#F2F4F7" },
};
const CONFIG_STATUS_STYLE: Record<ConfigStatus, { color: string; bg: string }> = {
  Draft:     { color: "#374151", bg: "#F3F4F6" },
  Published: { color: GREEN, bg: "#ECFDF5" },
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const BASE_RATING: RatingLevel[] = [
  { score: 5, label: "Exceptional",            description: "Consistently exceeds all expectations in attitude, behaviour and core values." },
  { score: 4, label: "Exceeding Expectations", description: "Frequently goes beyond expected standards in attitude and professional behaviour." },
  { score: 3, label: "Meets Expectations",     description: "Demonstrates expected attitude and behaviour consistently across the review period." },
  { score: 2, label: "Needs Improvement",      description: "Inconsistently meets attitude and behaviour standards; improvement is required." },
  { score: 1, label: "Unsatisfactory",         description: "Falls below the expected standards in attitude and professional behaviour." },
];

const BASE_SHARED: Criterion[] = [
  { id:"sc1",  order:1,  name:"Respect",                 description:"Treats colleagues, customers and partners with dignity and consideration.",          type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc2",  order:2,  name:"Integrity",               description:"Acts honestly and ethically in all professional interactions.",                      type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc3",  order:3,  name:"Taking Initiative",       description:"Proactively identifies opportunities and takes action without being prompted.",       type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc4",  order:4,  name:"Thoughtfulness",          description:"Considers the impact of decisions and actions on others before acting.",             type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc5",  order:5,  name:"Cooperation",             description:"Works collaboratively with team members and supports shared objectives.",             type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc6",  order:6,  name:"Effective Communication", description:"Communicates clearly, respectfully and constructively across all levels.",           type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc7",  order:7,  name:"Proactive in Learning",   description:"Actively seeks opportunities to grow professionally and expand knowledge.",          type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc8",  order:8,  name:"Willingness to Try",      description:"Embraces new challenges and approaches with an open and adaptable mindset.",        type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc9",  order:9,  name:"Wholeheartedness",        description:"Commits fully to tasks and responsibilities with dedication and care.",              type:"Shared Core Value", required:true, status:"Active" },
  { id:"sc10", order:10, name:"Positivity",              description:"Maintains a constructive and optimistic outlook, even in challenging situations.",   type:"Shared Core Value", required:true, status:"Active" },
];

const BASE_MANAGER: Criterion[] = [
  { id:"mc1", order:1, name:"Strategic Focus",               description:"Aligns team activities with organisational goals and long-term priorities.",              type:"Manager-Specific Criterion", required:true, status:"Active" },
  { id:"mc2", order:2, name:"Management Effectiveness",      description:"Organises, delegates and develops team members to consistently achieve results.",        type:"Manager-Specific Criterion", required:true, status:"Active" },
  { id:"mc3", order:3, name:"Problem Solving and Prevention",description:"Identifies root causes and proactively prevents issues from escalating.",                type:"Manager-Specific Criterion", required:true, status:"Active" },
  { id:"mc4", order:4, name:"Leadership and Empowerment",    description:"Inspires confidence, empowers team members and fosters individual accountability.",      type:"Manager-Specific Criterion", required:true, status:"Active" },
  { id:"mc5", order:5, name:"Creativity and Simplicity",     description:"Generates innovative solutions while keeping processes clear and efficient.",            type:"Manager-Specific Criterion", required:true, status:"Active" },
  { id:"mc6", order:6, name:"Win-Win Mentality",             description:"Pursues outcomes that benefit both the organisation and its key stakeholders.",          type:"Manager-Specific Criterion", required:true, status:"Active" },
];

const BASE_ROLES: RoleRow[] = [
  { id:"r1", department:"Retail Banking", role:"Branch Manager",          format:"Manager",            status:"Active" },
  { id:"r2", department:"Retail Banking", role:"Head of Department",      format:"Manager",            status:"Active" },
  { id:"r3", department:"Retail Sales",   role:"Retail Sales Executive",  format:"Sales",              status:"Active" },
  { id:"r4", department:"Operations",     role:"Customer Service Officer", format:"Others / Non-Sales", status:"Active" },
  { id:"r5", department:"Operations",     role:"Service Centre Admin",    format:"Others / Non-Sales", status:"Active" },
];

function makeConfig(configStatus: ConfigStatus, lastUpdated: string): PeriodConfig {
  return {
    configStatus, lastUpdated,
    ratingScale:     BASE_RATING.map(r => ({ ...r })),
    sharedCriteria:  BASE_SHARED.map(c => ({ ...c })),
    managerCriteria: BASE_MANAGER.map(c => ({ ...c })),
    roleAssignments: BASE_ROLES.map(r => ({ ...r })),
  };
}

const INITIAL_CONFIGS: Record<string, PeriodConfig> = {
  "2027 Annual KPI Review": makeConfig("Draft",     "12 Aug 2026"),
  "2026 Annual KPI Review": makeConfig("Published", "10 Jan 2026"),
  "2025 Annual KPI Review": makeConfig("Published", "8 Jan 2025"),
  "2024 Annual KPI Review": makeConfig("Published", "5 Jan 2024"),
};

const FORMAT_LABELS: EvalFormat[] = ["Manager", "Sales", "Others / Non-Sales"];
const EVAL_FORMATS: EvalFormat[]  = ["Manager", "Sales", "Others / Non-Sales"];

// ── Small shared UI ───────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}>{label}</span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg ${className}`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: `1px solid ${BORDER}` }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, helper, children }: { title: string; helper?: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b flex items-start justify-between gap-4" style={{ borderColor: BORDER }}>
      <div>
        <h2 className="text-[14px] font-bold" style={{ color: TEXT }}>{title}</h2>
        {helper && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{helper}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

// ── Criterion Drawer ──────────────────────────────────────────────────────────
interface DrawerState {
  mode: "view" | "edit" | "create";
  section: "shared" | "manager";
  criterion: Criterion | null;
}
interface CriterionForm {
  name: string; description: string; type: CriterionType;
  required: boolean; order: number; status: CriterionStatus;
}

function CriterionDrawer({
  state, isEditable, onClose, onSave,
}: {
  state: DrawerState;
  isEditable: boolean;
  onClose: () => void;
  onSave: (form: CriterionForm) => void;
}) {
  const isCreate  = state.mode === "create";
  const isReadOnly = state.mode === "view" || !isEditable;

  const defaultType: CriterionType = state.section === "manager" ? "Manager-Specific Criterion" : "Shared Core Value";

  const [form, setForm] = useState<CriterionForm>({
    name:        state.criterion?.name        ?? "",
    description: state.criterion?.description ?? "",
    type:        state.criterion?.type        ?? defaultType,
    required:    state.criterion?.required    ?? true,
    order:       state.criterion?.order       ?? 1,
    status:      state.criterion?.status      ?? "Active",
  });

  const appliesTo = form.type === "Shared Core Value"
    ? "Manager, Sales, Others / Non-Sales"
    : "Manager";

  const title = isCreate ? "Add Criterion" : isReadOnly ? "View Criterion" : "Edit Criterion";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[460px] bg-white flex flex-col"
        style={{ borderLeft: `1px solid ${BORDER}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>{title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              {form.type === "Shared Core Value" ? "Shared across all three evaluation formats" : "Applies to the Manager format only"}
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Criterion Name */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Criterion Name *</label>
            {isReadOnly
              ? <p className="text-[13px] font-medium py-2" style={{ color: TEXT }}>{form.name || "—"}</p>
              : <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Respect"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
            }
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Description</label>
            {isReadOnly
              ? <p className="text-[13px] py-2 leading-relaxed" style={{ color: MUTED }}>{form.description || "—"}</p>
              : <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Describe what this criterion assesses…"
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none resize-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
            }
          </div>

          {/* Criterion Type */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Criterion Type</label>
            {!isCreate || isReadOnly
              ? <Pill label={form.type} color={form.type === "Shared Core Value" ? TEAL : BLUE} bg={form.type === "Shared Core Value" ? "#ECFDF9" : "#EEF3FC"} />
              : (
                <select value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as CriterionType }))}
                  className="w-full px-3 py-2 rounded-md text-[13px] outline-none border"
                  style={{ borderColor: BORDER, color: TEXT }}>
                  <option>Shared Core Value</option>
                  <option>Manager-Specific Criterion</option>
                </select>
              )
            }
          </div>

          {/* Applies To (read-only) */}
          <div className="p-3 rounded-md" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: MUTED }}>Applies To</p>
            <p className="text-[13px] font-medium" style={{ color: TEXT }}>{appliesTo}</p>
          </div>

          {/* Required */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[12px] font-semibold" style={{ color: TEXT }}>Required</p>
              <p className="text-[11px]" style={{ color: MUTED }}>Evaluators must provide a score for this criterion</p>
            </div>
            {isReadOnly
              ? <Pill label={form.required ? "Required" : "Optional"} color={form.required ? BLUE : MUTED} bg={form.required ? "#EEF3FC" : "#F2F4F7"} />
              : (
                <button onClick={() => setForm(f => ({ ...f, required: !f.required }))}
                  className="ml-auto w-10 h-6 rounded-full transition-colors relative shrink-0"
                  style={{ backgroundColor: form.required ? GREEN : "#D1D5DB" }}>
                  <span className="absolute top-0.5 transition-all w-5 h-5 bg-white rounded-full shadow"
                    style={{ left: form.required ? "calc(100% - 22px)" : "2px" }} />
                </button>
              )
            }
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Display Order</label>
            {isReadOnly
              ? <p className="text-[13px] py-2" style={{ color: TEXT }}>{form.order}</p>
              : <input type="number" min={1} value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 rounded-md text-[13px] outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
            }
          </div>

          {/* Status (only for existing criteria) */}
          {!isCreate && (
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>Status</label>
              {isReadOnly
                ? <Pill label={form.status} color={form.status === "Active" ? GREEN : MUTED} bg={form.status === "Active" ? "#ECFDF5" : "#F2F4F7"} />
                : (
                  <div className="flex gap-2">
                    {(["Active", "Inactive"] as CriterionStatus[]).map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                        className="px-3 py-1.5 rounded-md text-[12px] font-semibold border transition-all"
                        style={form.status === s
                          ? { backgroundColor: s === "Active" ? GREEN : "#9CA3AF", color: "white", borderColor: "transparent" }
                          : { color: MUTED, borderColor: BORDER, backgroundColor: "white" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )
              }
              {!isReadOnly && form.status === "Inactive" && (
                <p className="text-[11px] mt-1.5 flex items-start gap-1" style={{ color: AMBER }}>
                  <Info size={11} className="mt-0.5 shrink-0" />
                  Inactive criteria are hidden from evaluation forms but preserved for historical records.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>
            {isReadOnly ? "Close" : "Cancel"}
          </button>
          {!isReadOnly && (
            <button
              onClick={() => { if (form.name.trim()) onSave(form); }}
              className="flex-1 py-2 rounded-md text-[13px] font-semibold text-white"
              style={{ backgroundColor: BLUE }}>
              Save Criterion
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Publish Confirm Dialog ────────────────────────────────────────────────────
function PublishDialog({ period, onClose, onConfirm }: {
  period: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT }}>Publish Configuration</h2>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md"
            style={{ backgroundColor: "#EEF3FC", border: `1px solid #C7D8F5` }}>
            <CheckCircle size={14} style={{ color: BLUE }} className="mt-0.5 shrink-0" />
            <p className="text-[12px]" style={{ color: BLUE }}>
              Publishing this configuration will confirm the Attitude Evaluation setup for{" "}
              <span className="font-semibold">{period}</span>. This includes the Rating Scale,
              Evaluation Formats, Criteria and Role-to-Format Assignments.
            </p>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Once the Review Period opens, this published configuration will be locked and preserved
            for historical consistency. You may edit and republish before the period opens.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-md text-[13px] font-semibold text-white"
            style={{ backgroundColor: GREEN }}>
            Confirm & Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Forms Drawer ──────────────────────────────────────────────────────
function PreviewDrawer({ config, onClose }: { config: PeriodConfig; onClose: () => void }) {
  const [format, setFormat] = useState<EvalFormat>("Manager");
  const [perspective, setPerspective] = useState<"Employee Self-Assessment" | "Superior Evaluation">("Employee Self-Assessment");
  const [scores, setScores] = useState<Record<string, number>>({});

  const sharedActive  = config.sharedCriteria.filter(c => c.status === "Active");
  const managerActive = config.managerCriteria.filter(c => c.status === "Active");
  const criteria = format === "Manager" ? [...sharedActive, ...managerActive] : sharedActive;
  const sections: { label: string; items: Criterion[] }[] = format === "Manager"
    ? [{ label: "Shared Core Values", items: sharedActive }, { label: "Additional Manager Criteria", items: managerActive }]
    : [{ label: "Shared Core Values", items: sharedActive }];

  function ScoreBtn({ cId, val }: { cId: string; val: number }) {
    const sel = scores[cId] === val;
    return (
      <button onClick={() => setScores(prev => ({ ...prev, [cId]: sel ? 0 : val }))}
        className="w-9 h-9 rounded-full text-[12px] font-bold transition-all border"
        style={sel
          ? { backgroundColor: BLUE, color: "white", borderColor: BLUE }
          : { backgroundColor: "white", color: MUTED, borderColor: BORDER }}>
        {val}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 bg-white flex flex-col"
        style={{ width: "min(700px, 92vw)", borderLeft: `1px solid ${BORDER}`, boxShadow: "-4px 0 32px rgba(0,0,0,0.12)" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT }}>Attitude Evaluation Preview</h3>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Preview how the evaluation form appears to assessors. Scores are not saved.
            </p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: MUTED }} /></button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-6 py-3 border-b shrink-0" style={{ borderColor: BORDER, backgroundColor: "#F8FAFC" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Format</p>
            <div className="flex gap-1">
              {FORMAT_LABELS.map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold transition-all"
                  style={format === f
                    ? { backgroundColor: BLUE, color: "white" }
                    : { color: MUTED, backgroundColor: "white", border: `1px solid ${BORDER}` }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="h-8 w-px" style={{ backgroundColor: BORDER }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Perspective</p>
            <div className="flex gap-1">
              {(["Employee Self-Assessment", "Superior Evaluation"] as const).map(p => (
                <button key={p} onClick={() => setPerspective(p)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold transition-all"
                  style={perspective === p
                    ? { backgroundColor: TEAL, color: "white" }
                    : { color: MUTED, backgroundColor: "white", border: `1px solid ${BORDER}` }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rating scale legend */}
        <div className="px-6 py-2.5 border-b shrink-0" style={{ borderColor: BORDER, backgroundColor: "#FAFBFC" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Rating Scale</p>
          <div className="flex gap-3 flex-wrap">
            {config.ratingScale.map(r => (
              <span key={r.score} className="text-[10px]" style={{ color: MUTED }}>
                <span className="font-bold" style={{ color: TEXT }}>{r.score}</span> = {r.label}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-[11px] px-3 py-2 rounded-md" style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
            <span className="font-semibold">{format}</span> format ·{" "}
            {perspective} · {criteria.filter(c => c.status === "Active").length} criteria
          </p>

          {sections.map(sec => (
            <div key={sec.label}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b"
                style={{ color: MUTED, borderColor: BORDER }}>{sec.label}</h4>
              <div className="space-y-4">
                {sec.items.map(c => (
                  <div key={c.id} className="p-4 rounded-lg border" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{c.name}</p>
                        <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: MUTED }}>{c.description}</p>
                      </div>
                      {c.required && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                          style={{ backgroundColor: "#EEF3FC", color: BLUE }}>Required</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px]" style={{ color: MUTED }}>Score:</span>
                      {[1, 2, 3, 4, 5].map(v => <ScoreBtn key={v} cId={c.id} val={v} />)}
                      {scores[c.id] > 0 && (
                        <span className="text-[11px] ml-1 font-semibold" style={{ color: BLUE }}>
                          {config.ratingScale.find(r => r.score === scores[c.id])?.label}
                        </span>
                      )}
                    </div>
                    <textarea rows={2} placeholder={`${perspective === "Employee Self-Assessment" ? "Explain your self-assessment…" : "Provide your evaluation comments…"}`}
                      className="w-full mt-3 px-3 py-2 rounded-md text-[12px] outline-none resize-none"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end px-6 py-4 border-t shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onClose} className="px-5 py-2 rounded-md text-[13px] font-medium border"
            style={{ color: TEXT, borderColor: BORDER }}>Close Preview</button>
        </div>
      </div>
    </>
  );
}

// ── Criteria Table ────────────────────────────────────────────────────────────
function CriteriaTable({
  title, helper, criteria, isEditable, addLabel,
  onView, onEdit, onReorder, onToggleStatus, onAdd,
}: {
  title: string; helper: string; criteria: Criterion[];
  isEditable: boolean; addLabel: string;
  onView: (c: Criterion) => void;
  onEdit: (c: Criterion) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onToggleStatus: (id: string) => void;
  onAdd: () => void;
}) {
  const sorted = [...criteria].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h3 className="text-[13px] font-bold" style={{ color: TEXT }}>{title}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{helper}</p>
        </div>
        {isEditable && (
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border shrink-0 transition-colors hover:bg-blue-50"
            style={{ color: BLUE, borderColor: "#93B4E8" }}>
            <Plus size={12} /> {addLabel}
          </button>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              {["#", "Criterion", "Description", "Required", "Status", "Actions"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: MUTED }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors"
                style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${BORDER}` : "none",
                  opacity: c.status === "Inactive" ? 0.55 : 1 }}>
                <td className="px-3 py-2.5 w-8">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: c.status === "Active" ? BLUE : "#9CA3AF" }}>{c.order}</span>
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-semibold" style={{ color: TEXT }}>{c.name}</p>
                </td>
                <td className="px-3 py-2.5 max-w-xs">
                  <p className="truncate" style={{ color: MUTED }}>{c.description}</p>
                </td>
                <td className="px-3 py-2.5">
                  <Pill label={c.required ? "Required" : "Optional"} color={c.required ? BLUE : MUTED} bg={c.required ? "#EEF3FC" : "#F2F4F7"} />
                </td>
                <td className="px-3 py-2.5">
                  <Pill label={c.status} color={c.status === "Active" ? GREEN : MUTED} bg={c.status === "Active" ? "#ECFDF5" : "#F2F4F7"} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => onView(c)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors hover:bg-gray-50"
                      style={{ color: MUTED, borderColor: BORDER }}>
                      <Eye size={10} /> View
                    </button>
                    {isEditable && (
                      <>
                        <button onClick={() => onEdit(c)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors hover:bg-blue-50"
                          style={{ color: BLUE, borderColor: "#93B4E8" }}>
                          <Pencil size={10} /> Edit
                        </button>
                        <button onClick={() => onReorder(c.id, "up")} disabled={i === 0}
                          className="p-1 rounded border transition-colors disabled:opacity-30"
                          style={{ borderColor: BORDER, color: MUTED }}>
                          <ArrowUp size={10} />
                        </button>
                        <button onClick={() => onReorder(c.id, "down")} disabled={i === sorted.length - 1}
                          className="p-1 rounded border transition-colors disabled:opacity-30"
                          style={{ borderColor: BORDER, color: MUTED }}>
                          <ArrowDown size={10} />
                        </button>
                        <button onClick={() => onToggleStatus(c.id)}
                          className="px-2 py-1 rounded text-[10px] font-medium border transition-colors"
                          style={c.status === "Active"
                            ? { color: AMBER, borderColor: "#F5D98A", backgroundColor: "#FEF9EC" }
                            : { color: GREEN,  borderColor: "#86EFAC", backgroundColor: "#ECFDF5" }}>
                          {c.status === "Active" ? "Set Inactive" : "Set Active"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px]" style={{ color: MUTED }}>
                No criteria yet. {isEditable ? `Click "${addLabel}" to add one.` : ""}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AttitudeSetup() {
  const [configs, setConfigs] = useState<Record<string, PeriodConfig>>(INITIAL_CONFIGS);
  const [period, setPeriod]   = useState(LIVE_PERIOD);
  const [showPeriodDd, setShowPeriodDd] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  // Section state
  const [formatTab, setFormatTab] = useState<EvalFormat>("Manager");

  // Rating scale inline edit
  const [editingRating, setEditingRating] = useState<number | null>(null);
  const [ratingEdit, setRatingEdit] = useState({ label: "", description: "" });

  // Criterion drawer
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  // Dialogs
  const [showPublish, setShowPublish] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!periodRef.current?.contains(e.target as Node)) setShowPeriodDd(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const cfg        = configs[period] ?? configs[LIVE_PERIOD];
  const pStatus    = PERIOD_STATUS[period] ?? "Closed";
  const pStatusSty = PERIOD_STATUS_STYLE[pStatus];
  const cssSty     = CONFIG_STATUS_STYLE[cfg.configStatus];
  const isEditable = pStatus === "Upcoming";

  // ── Mutations ──────────────────────────────────────────────────────────────
  function mutatePeriod(updater: (prev: PeriodConfig) => PeriodConfig) {
    setConfigs(prev => ({ ...prev, [period]: updater(prev[period] ?? prev[LIVE_PERIOD]) }));
  }

  function today() {
    return new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  }

  function showSaved(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 3000);
  }

  function handleSaveDraft() {
    mutatePeriod(p => ({ ...p, lastUpdated: today() }));
    showSaved("Configuration saved as Draft.");
  }

  function handlePublish() {
    mutatePeriod(p => ({ ...p, configStatus: "Published", lastUpdated: today() }));
    setShowPublish(false);
    showSaved("Attitude Evaluation configuration published.");
  }

  // Rating scale
  function startEditRating(r: RatingLevel) {
    setEditingRating(r.score);
    setRatingEdit({ label: r.label, description: r.description });
  }
  function saveRating() {
    mutatePeriod(p => ({
      ...p,
      ratingScale: p.ratingScale.map(r =>
        r.score === editingRating ? { ...r, ...ratingEdit } : r
      ),
    }));
    setEditingRating(null);
  }

  // Criteria helpers
  function reorder(section: "sharedCriteria" | "managerCriteria", id: string, dir: "up" | "down") {
    mutatePeriod(p => {
      const list = [...p[section]].sort((a, b) => a.order - b.order);
      const idx  = list.findIndex(c => c.id === id);
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= list.length) return p;
      const a = list[idx].order, b = list[swap].order;
      list[idx] = { ...list[idx], order: b };
      list[swap] = { ...list[swap], order: a };
      return { ...p, [section]: list };
    });
  }

  function toggleStatus(section: "sharedCriteria" | "managerCriteria", id: string) {
    mutatePeriod(p => ({
      ...p,
      [section]: p[section].map(c =>
        c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c
      ),
    }));
  }

  function saveCriterion(section: "sharedCriteria" | "managerCriteria", form: CriterionForm) {
    if (!drawerState) return;
    mutatePeriod(p => {
      if (drawerState.mode === "create") {
        const maxOrder = Math.max(0, ...p[section].map(c => c.order));
        const newC: Criterion = {
          id: `${section === "sharedCriteria" ? "sc" : "mc"}${Date.now()}`,
          order: maxOrder + 1, name: form.name, description: form.description,
          type: form.type, required: form.required, status: form.status,
        };
        return { ...p, [section]: [...p[section], newC] };
      } else {
        return {
          ...p,
          [section]: p[section].map(c =>
            c.id === drawerState.criterion?.id
              ? { ...c, name: form.name, description: form.description, required: form.required, order: form.order, status: form.status }
              : c
          ),
        };
      }
    });
    setDrawerState(null);
  }

  // Role assignment
  function updateFormat(id: string, format: EvalFormat) {
    mutatePeriod(p => ({
      ...p,
      roleAssignments: p.roleAssignments.map(r => r.id === id ? { ...r, format } : r),
    }));
  }

  const sectionKey = drawerState?.section === "manager" ? "managerCriteria" : "sharedCriteria";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: BG, minHeight: "calc(100vh - 56px)" }}>
      <div className="p-6 space-y-5">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <SectionCard>
          <div className="px-5 py-4">
            {/* Row 1: title + period + actions */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h1 className="text-[20px] font-bold" style={{ color: TEXT }}>Attitude Evaluation Setup</h1>
                <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
                  Configure attitude evaluation forms, criteria and role assignments.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {/* Period selector */}
                <div ref={periodRef} className="relative">
                  <button onClick={() => setShowPeriodDd(o => !o)}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-md text-[13px]"
                    style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Period</span>
                    <span className="font-semibold" style={{ color: BLUE }}>{period.split(" ")[0]}</span>
                    <span style={{ color: MUTED }}>Annual KPI Review</span>
                    <Pill label={pStatus} color={pStatusSty.color} bg={pStatusSty.bg} />
                    <ChevronDown size={13} style={{ color: MUTED }} />
                  </button>
                  {showPeriodDd && (
                    <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg py-1"
                      style={{ minWidth: 260, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: `1px solid ${BORDER}` }}>
                      {PERIOD_OPTIONS.map(p => {
                        const ps = PERIOD_STATUS[p] ?? "Closed";
                        const pss = PERIOD_STATUS_STYLE[ps];
                        return (
                          <button key={p} onClick={() => { setPeriod(p); setShowPeriodDd(false); setEditingRating(null); }}
                            className="w-full text-left px-4 py-2 text-[12px] hover:bg-[#F8FAFC] flex items-center justify-between"
                            style={{ color: period === p ? BLUE : TEXT, fontWeight: period === p ? 600 : 400 }}>
                            {p}
                            <Pill label={ps} color={pss.color} bg={pss.bg} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <button onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
                  style={{ color: TEXT, borderColor: BORDER }}>
                  <Eye size={14} /> Preview Forms
                </button>
                {isEditable && (
                  <>
                    <button onClick={handleSaveDraft}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold border transition-colors hover:bg-blue-50"
                      style={{ color: BLUE, borderColor: "#93B4E8" }}>
                      <Save size={14} /> Save Draft
                    </button>
                    <button onClick={() => setShowPublish(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold text-white"
                      style={{ backgroundColor: GREEN }}>
                      <CheckCircle size={14} /> Publish Configuration
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Status row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
                Configuration:
                <Pill label={cfg.configStatus} color={cssSty.color} bg={cssSty.bg} />
              </div>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
                Review Period:
                <Pill label={pStatus} color={pStatusSty.color} bg={pStatusSty.bg} />
              </div>
              <div className="text-[12px]" style={{ color: MUTED }}>
                Last Updated: <span className="font-medium" style={{ color: TEXT }}>{cfg.lastUpdated}</span>
              </div>
            </div>

            {/* Save confirmation banner */}
            {savedMsg && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-md text-[12px] font-medium"
                style={{ backgroundColor: "#ECFDF5", color: GREEN }}>
                <CheckCircle size={13} className="shrink-0" /> {savedMsg}
              </div>
            )}

            {/* Info / lock banners */}
            {isEditable && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-md text-[12px]"
                style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                <Info size={13} className="mt-0.5 shrink-0" />
                Changes apply to this Annual KPI Review Period only. Once the Review Period opens,
                this configuration becomes read-only.
              </div>
            )}
            {pStatus === "Open" && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-md text-[12px]"
                style={{ backgroundColor: "#F2F4F7", color: MUTED }}>
                <Lock size={13} className="mt-0.5 shrink-0" />
                This configuration is locked because the Annual KPI Review Period has opened.
              </div>
            )}
            {pStatus === "Closed" && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-md text-[12px]"
                style={{ backgroundColor: "#F2F4F7", color: MUTED }}>
                <Lock size={13} className="mt-0.5 shrink-0" />
                This is a historical read-only view of the configuration used for this closed period.
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── RATING SCALE ─────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Rating Scale"
            helper="This rating scale is shared across all Attitude Evaluation formats. Numeric scores are fixed — you may edit labels and descriptions."
          />
          <div className="p-5">
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                    {["Score", "Label", "Description", ...(isEditable ? ["Edit"] : [])].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cfg.ratingScale.map((r, i) => {
                    const isEditingThis = editingRating === r.score;
                    return (
                      <tr key={r.score} className="transition-colors"
                        style={{ borderBottom: i < cfg.ratingScale.length - 1 ? `1px solid ${BORDER}` : "none",
                          backgroundColor: isEditingThis ? "#F0F5FF" : "white" }}>
                        <td className="px-4 py-3 w-16">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                            style={{ backgroundColor: BLUE }}>{r.score}</span>
                        </td>
                        <td className="px-4 py-3 w-48">
                          {isEditingThis
                            ? <input value={ratingEdit.label} onChange={e => setRatingEdit(v => ({ ...v, label: e.target.value }))}
                                className="w-full px-2 py-1 rounded text-[12px] font-semibold outline-none border"
                                style={{ borderColor: BLUE, color: TEXT }} />
                            : <span className="font-semibold" style={{ color: TEXT }}>{r.label}</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {isEditingThis
                            ? <input value={ratingEdit.description} onChange={e => setRatingEdit(v => ({ ...v, description: e.target.value }))}
                                className="w-full px-2 py-1 rounded text-[12px] outline-none border"
                                style={{ borderColor: BLUE, color: TEXT }} />
                            : <span style={{ color: MUTED }}>{r.description}</span>
                          }
                        </td>
                        {isEditable && (
                          <td className="px-4 py-3 w-32">
                            {isEditingThis
                              ? <div className="flex gap-2">
                                  <button onClick={saveRating}
                                    className="px-2.5 py-1 rounded text-[11px] font-bold text-white"
                                    style={{ backgroundColor: GREEN }}>Save</button>
                                  <button onClick={() => setEditingRating(null)}
                                    className="px-2.5 py-1 rounded text-[11px] font-medium border"
                                    style={{ color: TEXT, borderColor: BORDER }}>Cancel</button>
                                </div>
                              : <button onClick={() => startEditRating(r)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium border transition-colors hover:bg-blue-50"
                                  style={{ color: BLUE, borderColor: "#93B4E8" }}>
                                  <Pencil size={10} /> Edit
                                </button>
                            }
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] mt-3 flex items-start gap-1.5" style={{ color: AMBER }}>
              <Info size={11} className="mt-0.5 shrink-0" />
              Attitude Evaluation Score calculation is To Be Confirmed with TBM.
            </p>
          </div>
        </SectionCard>

        {/* ── EVALUATION FORMATS ────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Evaluation Formats"
            helper="Each format specifies which criteria are used when evaluating employees in that group."
          />
          <div className="px-5 pt-4">
            {/* Format Tabs */}
            <div className="flex border-b gap-1" style={{ borderColor: BORDER }}>
              {FORMAT_LABELS.map(tab => (
                <button key={tab} onClick={() => setFormatTab(tab)}
                  className="px-4 py-2 text-[12px] font-semibold transition-all -mb-px border-b-2"
                  style={formatTab === tab
                    ? { color: BLUE, borderColor: BLUE }
                    : { color: MUTED, borderColor: "transparent" }}>
                  {tab}
                  {tab === "Manager" && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: "#EEF3FC", color: BLUE }}>
                      {cfg.sharedCriteria.filter(c => c.status === "Active").length + cfg.managerCriteria.filter(c => c.status === "Active").length}
                    </span>
                  )}
                  {tab !== "Manager" && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: "#F2F4F7", color: MUTED }}>
                      {cfg.sharedCriteria.filter(c => c.status === "Active").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Criteria sections */}
            <div className="py-5 space-y-8">
              <CriteriaTable
                title="Shared Core Values"
                helper="These criteria are shared across all three evaluation formats."
                criteria={cfg.sharedCriteria}
                isEditable={isEditable}
                addLabel="Add Core Value"
                onView={c => setDrawerState({ mode: "view", section: "shared", criterion: c })}
                onEdit={c => setDrawerState({ mode: "edit", section: "shared", criterion: c })}
                onReorder={(id, dir) => reorder("sharedCriteria", id, dir)}
                onToggleStatus={id => toggleStatus("sharedCriteria", id)}
                onAdd={() => setDrawerState({ mode: "create", section: "shared", criterion: null })}
              />

              {formatTab === "Manager" && (
                <CriteriaTable
                  title="Additional Manager Criteria"
                  helper="Additional leadership criteria for employees assigned to the Manager format."
                  criteria={cfg.managerCriteria}
                  isEditable={isEditable}
                  addLabel="Add Manager Criterion"
                  onView={c => setDrawerState({ mode: "view", section: "manager", criterion: c })}
                  onEdit={c => setDrawerState({ mode: "edit", section: "manager", criterion: c })}
                  onReorder={(id, dir) => reorder("managerCriteria", id, dir)}
                  onToggleStatus={id => toggleStatus("managerCriteria", id)}
                  onAdd={() => setDrawerState({ mode: "create", section: "manager", criterion: null })}
                />
              )}

              {(formatTab === "Sales" || formatTab === "Others / Non-Sales") && (
                <div className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                  <p className="text-[12px]" style={{ color: MUTED }}>
                    The <span className="font-semibold" style={{ color: TEXT }}>{formatTab}</span> format uses the 10 Shared Core Values above.
                    No additional criteria apply.
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── ROLE-TO-FORMAT ASSIGNMENT ─────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Role-to-Format Assignment"
            helper="Choose which Attitude Evaluation format each employee role should use."
          />
          <div className="px-5 py-5">
            <div className="flex items-start gap-2 mb-4 p-3 rounded-md text-[12px]"
              style={{ backgroundColor: "#FEF9EC", color: AMBER }}>
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                Sample role mappings for stakeholder validation. Managerial roles use the Manager format
                regardless of department.
              </span>
            </div>

            <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                    {["Department", "Role", "Assigned Format", "Status", ...(isEditable ? ["Action"] : [])].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cfg.roleAssignments.map((row, i) => {
                    const formatColor: Record<EvalFormat, { color: string; bg: string }> = {
                      "Manager":           { color: BLUE,   bg: "#EEF3FC" },
                      "Sales":             { color: TEAL,   bg: "#ECFDF9" },
                      "Others / Non-Sales":{ color: PURPLE, bg: "#F5F3FF" },
                    };
                    const fs = formatColor[row.format];
                    return (
                      <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors"
                        style={{ borderBottom: i < cfg.roleAssignments.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>{row.department}</td>
                        <td className="px-4 py-3" style={{ color: TEXT }}>{row.role}</td>
                        <td className="px-4 py-3">
                          {isEditable
                            ? (
                              <select value={row.format} onChange={e => updateFormat(row.id, e.target.value as EvalFormat)}
                                className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold outline-none border"
                                style={{ borderColor: fs.bg, backgroundColor: fs.bg, color: fs.color }}>
                                {EVAL_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            )
                            : <Pill label={row.format} color={fs.color} bg={fs.bg} />
                          }
                        </td>
                        <td className="px-4 py-3">
                          <Pill label={row.status} color={row.status === "Active" ? GREEN : MUTED} bg={row.status === "Active" ? "#ECFDF5" : "#F2F4F7"} />
                        </td>
                        {isEditable && (
                          <td className="px-4 py-3">
                            <span className="text-[11px]" style={{ color: MUTED }}>—</span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

      </div>

      {/* ── Drawers & Dialogs ──────────────────────────────────────────────── */}
      {drawerState && (
        <CriterionDrawer
          state={drawerState}
          isEditable={isEditable}
          onClose={() => setDrawerState(null)}
          onSave={form => saveCriterion(sectionKey, form)}
        />
      )}
      {showPublish && (
        <PublishDialog period={period} onClose={() => setShowPublish(false)} onConfirm={handlePublish} />
      )}
      {showPreview && (
        <PreviewDrawer config={cfg} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

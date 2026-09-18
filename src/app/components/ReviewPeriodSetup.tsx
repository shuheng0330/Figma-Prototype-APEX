import { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  ArrowLeft, Info, CheckCircle, AlertTriangle, X, Calendar,
  Search, RotateCcw, Eye,
} from "lucide-react";
import { usePerformanceStore } from "../performance/store";
import { validateReviewPeriod, type ReviewPeriod } from "../performance/domain";

const BLUE  = "#2457A6";
const TEAL  = "#0F9F8F";
const AMBER = "#D99000";
const RED   = "#D14343";
const TEXT  = "#172033";
const MUTED = "#667085";
const BORDER= "#DCE3EC";
const BG    = "#F4F6F9";

// ── Types ─────────────────────────────────────────────────────────────────────
type Freq = "Monthly" | "Quarterly" | "Annually";

interface RoleRow {
  id: string; dept: string; role: string;
  sysDefault: Freq; selected: Freq;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function fmt(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${M[parseInt(m)-1]} ${y}`;
}

function addCalDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function eom(year: number, month: number): string {
  return new Date(Date.UTC(year, month + 1, 0)).toISOString().split("T")[0];
}

function getCheckpoints(start: string, end: string, freq: Freq): string[] {
  if (!start || !end || start > end) return [];
  const s = new Date(`${start}T00:00:00Z`), e = new Date(`${end}T00:00:00Z`);
  const pts: string[] = [];
  if (freq === "Annually") {
    pts.push(end);
  } else if (freq === "Quarterly") {
    const qMs = [2, 5, 8, 11];
    for (let y = s.getUTCFullYear(); y <= e.getUTCFullYear(); y++) {
      for (const m of qMs) {
        const d = eom(y, m);
        if (d >= start && d <= end) pts.push(d);
      }
    }
  } else {
    let y = s.getUTCFullYear(), m = s.getUTCMonth();
    for (let i = 0; i < 24; i++) {
      const d = eom(y, m);
      if (d > end) break;
      if (d >= start) pts.push(d);
      m++; if (m > 11) { m = 0; y++; }
    }
  }
  return pts;
}

const CHECKPOINTS_COUNT: Record<Freq, number> = { Monthly: 12, Quarterly: 4, Annually: 1 };

// ── Mock pre-fill for known IDs ───────────────────────────────────────────────
const PREFILL: Record<string, { periodName:string; startDate:string; endDate:string;
  kpiSetupDl:string;
  selfDays:number; selfDayType:string; managerDays:number; managerDayType:string;
  attitudeSelfDl:string; attitudeSuperiorDl:string; managerAppraisalDl:string; hrFinalDl:string;
  companyKpi:number; deptKpi:number; indivKpi:number; kpiPerf:number; attitude:number; consolidationMethod:"final"|"average"; roles:RoleRow[];
}> = {
  "2026": {
    periodName:"2026 Annual KPI Review",
    startDate:"2026-01-01", endDate:"2026-12-31",
    kpiSetupDl:"2026-01-01",
    selfDays:5, selfDayType:"Calendar Days", managerDays:5, managerDayType:"Calendar Days",
    attitudeSelfDl:"2026-12-20", attitudeSuperiorDl:"2026-12-27",
    managerAppraisalDl:"2027-01-10", hrFinalDl:"2027-01-20",
    companyKpi:15, deptKpi:25, indivKpi:60, kpiPerf:50, attitude:50, consolidationMethod:"final",
    roles:[
      { id:"r1", dept:"Retail",          role:"Retail Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r2", dept:"Retail",          role:"Senior Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r3", dept:"Customer Service",role:"Customer Service Officer",        sysDefault:"Quarterly", selected:"Quarterly" },
      { id:"r4", dept:"Customer Service",role:"Senior Customer Service Officer", sysDefault:"Quarterly", selected:"Quarterly" },
      { id:"r5", dept:"Management",      role:"Branch Manager",                  sysDefault:"Annually",  selected:"Annually"  },
      { id:"r6", dept:"Management",      role:"Area Manager",                    sysDefault:"Annually",  selected:"Annually"  },
      { id:"r7", dept:"Engineering",     role:"Service Technician",              sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r8", dept:"Engineering",     role:"Senior Technician",               sysDefault:"Monthly",   selected:"Quarterly" },
    ],
  },
  "2027": {
    periodName:"2027 Annual KPI Review",
    startDate:"2027-01-01", endDate:"2027-12-31",
    kpiSetupDl:"2027-01-01",
    selfDays:5, selfDayType:"Calendar Days", managerDays:5, managerDayType:"Calendar Days",
    attitudeSelfDl:"2027-12-20", attitudeSuperiorDl:"2027-12-27",
    managerAppraisalDl:"2028-01-10", hrFinalDl:"2028-01-20",
    companyKpi:15, deptKpi:25, indivKpi:60, kpiPerf:50, attitude:50, consolidationMethod:"final",
    roles:[
      { id:"r1", dept:"Retail",          role:"Retail Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r2", dept:"Retail",          role:"Senior Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r3", dept:"Customer Service",role:"Customer Service Officer",        sysDefault:"Quarterly", selected:"Quarterly" },
      { id:"r4", dept:"Customer Service",role:"Senior Customer Service Officer", sysDefault:"Quarterly", selected:"Quarterly" },
      { id:"r5", dept:"Management",      role:"Branch Manager",                  sysDefault:"Annually",  selected:"Annually"  },
      { id:"r6", dept:"Management",      role:"Area Manager",                    sysDefault:"Annually",  selected:"Annually"  },
      { id:"r7", dept:"Engineering",     role:"Service Technician",              sysDefault:"Monthly",   selected:"Monthly"   },
      { id:"r8", dept:"Engineering",     role:"Senior Technician",               sysDefault:"Monthly",   selected:"Monthly"   },
    ],
  },
};

const BLANK_ROLES: RoleRow[] = [
  { id:"r1", dept:"Retail",          role:"Retail Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
  { id:"r2", dept:"Retail",          role:"Senior Sales Executive",          sysDefault:"Monthly",   selected:"Monthly"   },
  { id:"r3", dept:"Customer Service",role:"Customer Service Officer",        sysDefault:"Quarterly", selected:"Quarterly" },
  { id:"r4", dept:"Customer Service",role:"Senior Customer Service Officer", sysDefault:"Quarterly", selected:"Quarterly" },
  { id:"r5", dept:"Management",      role:"Branch Manager",                  sysDefault:"Annually",  selected:"Annually"  },
  { id:"r6", dept:"Management",      role:"Area Manager",                    sysDefault:"Annually",  selected:"Annually"  },
  { id:"r7", dept:"Engineering",     role:"Service Technician",              sysDefault:"Monthly",   selected:"Monthly"   },
  { id:"r8", dept:"Engineering",     role:"Senior Technician",               sysDefault:"Monthly",   selected:"Monthly"   },
];

PREFILL["2025"] = {
  ...PREFILL["2026"], periodName:"2025 Annual KPI Review", startDate:"2025-01-01", endDate:"2025-12-31",
  kpiSetupDl:"2025-01-01", attitudeSelfDl:"2025-12-20", attitudeSuperiorDl:"2025-12-27",
  managerAppraisalDl:"2026-01-10", hrFinalDl:"2026-01-20",
};
PREFILL["2028"] = {
  ...PREFILL["2027"], periodName:"2028 Annual KPI Review", startDate:"2028-01-01", endDate:"2028-12-31",
  kpiSetupDl:"2028-01-01", attitudeSelfDl:"2028-12-20", attitudeSuperiorDl:"2028-12-27",
  managerAppraisalDl:"2029-01-10", hrFinalDl:"2029-01-20",
};

// ── Reusable UI pieces ────────────────────────────────────────────────────────
function SectionCard({ n, title, helper, children }: {
  n: number; title: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.08)", border:`1px solid ${BORDER}` }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: BORDER }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: BLUE }}>{n}</div>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: TEXT }}>{title}</h3>
          {helper && <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{helper}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0 pb-6 last:pb-0 border-b last:border-b-0" style={{ borderColor: BORDER }}>
      <h4 className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: MUTED }}>{label}</h4>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT }}>{label}</label>
      {children}
      {hint  && !error && <p className="mt-1 text-[11px]" style={{ color: MUTED }}>{hint}</p>}
      {error && <p className="mt-1 text-[11px] flex items-center gap-1" style={{ color: RED }}><AlertTriangle size={10}/> {error}</p>}
    </div>
  );
}

function DateInput({ value, onChange, readOnly, min, max }: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean; min?: string; max?: string;
}) {
  return (
    <div className="relative">
      <input type="date" value={value} readOnly={readOnly} min={min} max={max}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 pr-9 rounded-md text-[13px] outline-none transition-colors"
        style={{ border:`1px solid ${BORDER}`, color:TEXT, backgroundColor:readOnly?"#F8FAFC":"white" }}
        onFocus={e => { if (!readOnly) e.currentTarget.style.borderColor = BLUE; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />
      <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }}/>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, readOnly }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <input type="text" value={value} readOnly={readOnly} placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      className="w-full px-3 py-2 rounded-md text-[13px] outline-none transition-colors"
      style={{ border:`1px solid ${BORDER}`, color:TEXT, backgroundColor:readOnly?"#F8FAFC":"white" }}
      onFocus={e => { if (!readOnly) e.currentTarget.style.borderColor = BLUE; }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
    />
  );
}

function AllocationRow({ label, value, onChange, readOnly }: {
  label: string; value: number; onChange: (v: number) => void; readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] w-52 shrink-0" style={{ color: TEXT }}>{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <input type="number" min={0} max={100} value={value} readOnly={readOnly}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 px-3 py-1.5 rounded-md text-[13px] text-center outline-none"
          style={{ border:`1px solid ${BORDER}`, color:TEXT, backgroundColor:readOnly?"#F8FAFC":"white" }}
        />
        <span className="text-[13px]" style={{ color: MUTED }}>%</span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(value,100)}%`, backgroundColor: BLUE }}/>
      </div>
    </div>
  );
}

function RuleBuilder({ label, days, setDays, dayType, setDayType, reference, readOnly }: {
  label: string; days: number; setDays: (v: number) => void;
  dayType: string; setDayType: (v: string) => void;
  reference: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-2" style={{ color: TEXT }}>{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <input type="number" min={1} max={90} value={days} readOnly={readOnly}
          onChange={e => setDays(Math.max(1, Number(e.target.value)))}
          className="w-16 px-2 py-1.5 rounded-md text-[13px] text-center outline-none"
          style={{ border:`1px solid ${BORDER}`, color:TEXT }}
        />
        <select value={dayType} disabled={readOnly} onChange={e => setDayType(e.target.value)}
          className="px-2.5 py-1.5 rounded-md text-[13px] outline-none border"
          style={{ borderColor:BORDER, color:TEXT, backgroundColor:readOnly?"#F8FAFC":"white" }}>
          <option>Calendar Days</option>
        </select>
        <span className="text-[13px]" style={{ color: MUTED }}>after</span>
        <span className="px-2.5 py-1 rounded-md text-[12px] font-medium" style={{ backgroundColor:"#EEF3FC", color:BLUE }}>{reference}</span>
      </div>
    </div>
  );
}

// ── Published confirmation overlay ────────────────────────────────────────────
function PublishDialog({ periodName, kpiDeadline, onConfirm, onCancel }: {
  periodName: string; kpiDeadline: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:"rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor:BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color:TEXT }}>Publish Review Period?</h2>
          <button onClick={onCancel}><X size={18} style={{ color:MUTED }}/></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-[13px]" style={{ color:TEXT }}>
            Publishing will make <strong>{periodName}</strong> available to employees.
            Employees will be able to begin submitting their KPI plans.
          </p>
          <div className="p-3 rounded-md text-[12px]" style={{ backgroundColor:"#FEF9EC", color:AMBER }}>
            Review the configuration carefully before publishing.
          </div>
          {kpiDeadline && (
            <p className="text-[12px]" style={{ color:MUTED }}>
              <strong>Next step:</strong> Employees can begin their KPI setup before the KPI Setup deadline ({fmt(kpiDeadline)}).
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor:BORDER }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color:TEXT, borderColor:BORDER }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-[13px] font-semibold text-white" style={{ backgroundColor:BLUE }}>Confirm &amp; Publish</button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule preview modal ────────────────────────────────────────────────────
function SchedulePreviewModal({ rows, onClose }: {
  rows: { role:string; freq:Freq; checkpoint:string; selfDeadline:string; superiorDeadline:string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:"rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor:BORDER }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color:TEXT }}>Generated Schedule Preview</h2>
            <p className="text-[12px] mt-0.5" style={{ color:MUTED }}>Generated from each role's configured review frequency.</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color:MUTED }}/></button>
        </div>
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ backgroundColor:"#F8FAFC", borderBottom:`1px solid ${BORDER}` }}>
                {["Role","Review Frequency","Review Checkpoint / Performance Period","Self-Assessment Deadline","Superior Assessment Deadline"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color:MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${BORDER}` }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color:TEXT }}>{r.role}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color:BLUE, backgroundColor:"#EEF3FC" }}>{r.freq}</span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color:MUTED }}>{fmt(r.checkpoint)}</td>
                  <td className="px-3 py-2.5" style={{ color:MUTED }}>{fmt(r.selfDeadline)}</td>
                  <td className="px-3 py-2.5" style={{ color:MUTED }}>{fmt(r.superiorDeadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[11px] flex items-start gap-1.5" style={{ color:MUTED }}>
            <Info size={12} className="mt-0.5 shrink-0"/>
            Monthly, Quarterly, and Annual checkpoints are generated from the review frequency configured for each role.
          </p>
        </div>
        <div className="px-6 py-4 border-t shrink-0" style={{ borderColor:BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color:TEXT, borderColor:BORDER }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Configuration Preview Modal ───────────────────────────────────────────────
function SummaryModal({ data, onClose }: {
  data: {
    periodName:string; startDate:string; endDate:string;
    roles:RoleRow[]; companyKpi:number; deptKpi:number; indivKpi:number;
    kpiPerf:number; attitude:number; selfDays:number; selfDayType:string;
    managerDays:number; managerDayType:string; kpiSetupDl:string; consolidationMethod:"final"|"average"; warnings:string[];
  };
  onClose: () => void;
}) {
  const { periodName, startDate, endDate, roles, companyKpi, deptKpi, indivKpi,
    kpiPerf, attitude, selfDays, selfDayType, managerDays, managerDayType, kpiSetupDl, consolidationMethod, warnings } = data;

  const freqDist = {
    Monthly:   roles.filter(r => r.selected==="Monthly").length,
    Quarterly: roles.filter(r => r.selected==="Quarterly").length,
    Annually:  roles.filter(r => r.selected==="Annually").length,
  };

  const SummaryRow = ({ label, value }: { label:string; value:string }) => (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor:BORDER }}>
      <span className="text-[12px] w-48 shrink-0" style={{ color:MUTED }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color:TEXT }}>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:"rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[82vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor:BORDER }}>
          <h2 className="text-[15px] font-bold" style={{ color:TEXT }}>Preview Configuration</h2>
          <button onClick={onClose}><X size={18} style={{ color:MUTED }}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <SummaryRow label="Review Period" value={periodName || "—"}/>
          <SummaryRow label="Performance Period" value={startDate && endDate ? `${fmt(startDate)} – ${fmt(endDate)}` : "—"}/>
          <SummaryRow label="KPI Setup Deadline" value={fmt(kpiSetupDl)}/>
          <SummaryRow label="Roles Included" value={`${roles.length} roles`}/>
          <SummaryRow label="Frequency Distribution"
            value={[
              freqDist.Monthly   ? `${freqDist.Monthly} Monthly`   : "",
              freqDist.Quarterly ? `${freqDist.Quarterly} Quarterly` : "",
              freqDist.Annually  ? `${freqDist.Annually} Annually`  : "",
            ].filter(Boolean).join(" · ") || "—"}
          />
          <SummaryRow label="KPI Allocation"
            value={`Company ${companyKpi}% · Dept ${deptKpi}% · Individual ${indivKpi}%`}/>
          <SummaryRow label="Final Score Allocation"
            value={`KPI ${kpiPerf}% · Attitude ${attitude}%`}/>
          <SummaryRow label="Annual KPI Consolidation"
            value={consolidationMethod === "final" ? "Final Checkpoint" : "Average of Checkpoints"}/>
          <SummaryRow label="Self-Assessment Rule"
            value={`${selfDays} ${selfDayType} after Review Checkpoint`}/>
          <SummaryRow label="Superior Assessment Rule"
            value={`${managerDays} ${managerDayType} after Self-Assessment Deadline`}/>
          {warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-md" style={{ backgroundColor:"#FEF9EC" }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color:AMBER }}>Validation Warnings</p>
              {warnings.map((w,i) => (
                <p key={i} className="text-[12px] flex items-start gap-1.5" style={{ color:AMBER }}>
                  <AlertTriangle size={11} className="mt-0.5 shrink-0"/> {w}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t shrink-0" style={{ borderColor:BORDER }}>
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px] font-medium border" style={{ color:TEXT, borderColor:BORDER }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReviewPeriodSetup() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const location  = useLocation();
  const performanceStore = usePerformanceStore();
  const storedPeriod = id ? performanceStore.getPeriod(id) : undefined;

  const isView    = location.pathname.endsWith("/view");
  const mode: "create"|"edit"|"view" = !id ? "create" : isView ? "view" : "edit";
  const periodStatus = !id ? "Draft" : storedPeriod?.status ?? "Closed";
  const readOnly  = mode === "view" || periodStatus === "Open" || periodStatus === "Closed";
  const pre       = id ? PREFILL[id] : undefined;

  // ── Section 1: General Settings ──
  const [periodName, setPeriodName]     = useState(storedPeriod?.name      ?? pre?.periodName ?? "");
  const [startDate, setStartDate]       = useState(storedPeriod?.startDate ?? pre?.startDate  ?? "");
  const [endDate, setEndDate]           = useState(storedPeriod?.endDate   ?? pre?.endDate    ?? "");

  // ── Section 2: Role Frequencies ──
  const [roles, setRoles]               = useState<RoleRow[]>(pre?.roles ?? BLANK_ROLES);
  const [deptFilter, setDeptFilter]     = useState("All");
  const [roleSearch, setRoleSearch]     = useState("");

  // ── Section 3A: KPI Setup Deadlines ──
  const [kpiSetupDl, setKpiSetupDl]           = useState(storedPeriod?.deadlines.kpiSetup ?? pre?.kpiSetupDl ?? "");

  // ── Section 3B: Assessment Relative Rules ──
  const [selfDays, setSelfDays]         = useState(storedPeriod?.deadlines.selfAssessmentDays ?? pre?.selfDays ?? 5);
  const [selfDayType, setSelfDayType]   = useState(pre?.selfDayType    ?? "Calendar Days");
  const [managerDays, setManagerDays]   = useState(storedPeriod?.deadlines.superiorAssessmentDays ?? pre?.managerDays ?? 5);
  const [managerDayType, setMgrDayType] = useState(pre?.managerDayType ?? "Calendar Days");

  // ── Section 3C: Attitude Deadlines ──
  const [attitudeSelfDl, setAttSelf]     = useState(storedPeriod?.deadlines.attitudeSelf ?? pre?.attitudeSelfDl ?? "");
  const [attitudeSuperiorDl, setAttSup]  = useState(storedPeriod?.deadlines.attitudeSuperior ?? pre?.attitudeSuperiorDl ?? "");

  // ── Section 3D: Final Appraisal Deadlines ──
  const [managerAppraisalDl, setMgrAppr] = useState(storedPeriod?.deadlines.superiorAppraisal ?? pre?.managerAppraisalDl ?? "");
  const [hrFinalDl, setHrFinal]          = useState(storedPeriod?.deadlines.hrReview ?? pre?.hrFinalDl ?? "");

  // ── Section 4: Weightage ──
  const [companyKpi, setCompanyKpi] = useState(storedPeriod?.allocations.company ?? pre?.companyKpi ?? 15);
  const [deptKpi, setDeptKpi]       = useState(storedPeriod?.allocations.department ?? pre?.deptKpi ?? 25);
  const [indivKpi, setIndivKpi]     = useState(storedPeriod?.allocations.individual ?? pre?.indivKpi ?? 60);
  const [kpiPerf, setKpiPerf]       = useState(storedPeriod?.allocations.kpi ?? pre?.kpiPerf ?? 50);
  const [attitude, setAttitude]     = useState(storedPeriod?.allocations.attitude ?? pre?.attitude ?? 50);
  const [consolidationMethod, setConsolidationMethod] = useState<"final"|"average">(storedPeriod?.consolidationMethod ?? pre?.consolidationMethod ?? "final");

  // ── UI state ──
  const [showPublish, setShowPublish]           = useState(false);
  const [showSummary, setShowSummary]           = useState(false);
  const [showSchedule, setShowSchedule]         = useState(false);
  const [published, setPublished]               = useState(false);
  const [savedDraft, setSavedDraft]             = useState(false);

  // ── Derived values ──
  const kpiTotal   = companyKpi + deptKpi + indivKpi;
  const finalTotal = kpiPerf + attitude;
  const kpiValid   = kpiTotal === 100;
  const finalValid = finalTotal === 100;
  const depts      = ["All", ...Array.from(new Set(roles.map(r => r.dept)))];

  const visibleRoles = useMemo(() => roles.filter(r => {
    const deptOk = deptFilter === "All" || r.dept === deptFilter;
    const searchOk = roleSearch === "" || r.role.toLowerCase().includes(roleSearch.toLowerCase());
    return deptOk && searchOk;
  }), [roles, deptFilter, roleSearch]);

  const kpiSetupError = kpiSetupDl && startDate && kpiSetupDl > startDate
    ? "KPI Setup Deadline must be on or before the Review Period Start Date."
    : "";

  const attitudeSeqWarning = attitudeSelfDl && attitudeSuperiorDl && attitudeSuperiorDl < attitudeSelfDl
    ? "Superior Evaluation deadline cannot be earlier than Self-Assessment deadline."
    : "";
  const finalSeqWarning = managerAppraisalDl && hrFinalDl && hrFinalDl < managerAppraisalDl
    ? "HR Finalisation deadline cannot be earlier than Superior Recommendation deadline."
    : "";

  const endBeforeStart = startDate && endDate && endDate < startDate;

  // Schedule preview rows for every generated checkpoint per role
  const scheduleRows = useMemo(() => {
    if (!startDate || !endDate) return [];
    return roles.flatMap(r => getCheckpoints(startDate, endDate, r.selected).map(checkpoint => {
      const selfDeadline = addCalDays(checkpoint, selfDays);
      return { role: r.role, freq: r.selected, checkpoint, selfDeadline, superiorDeadline: addCalDays(selfDeadline, managerDays) };
    }));
  }, [roles, startDate, endDate, selfDays, managerDays]);

  // One shared validator drives both UI messages and publication.
  const warnings = validateReviewPeriod(buildPeriod(periodStatus === "Upcoming" ? "Upcoming" : "Draft"))
    .map(error => error.message);

  function updateRoleFreq(id: string, freq: Freq) {
    setRoles(rs => rs.map(r => r.id === id ? { ...r, selected: freq } : r));
  }
  function resetRoleFreq(id: string) {
    setRoles(rs => rs.map(r => r.id === id ? { ...r, selected: r.sysDefault } : r));
  }

  function buildPeriod(status: "Draft" | "Upcoming"): ReviewPeriod {
    const periodId = id ?? periodName.match(/\d{4}/)?.[0] ?? `period-${Date.now()}`;
    return {
      id: periodId,
      name: periodName,
      configuredStatus: status,
      startDate,
      endDate,
      lastUpdated: performanceStore.state.effectiveDate,
      deadlines: {
        kpiSetup: kpiSetupDl,
        selfAssessmentDays: selfDays,
        superiorAssessmentDays: managerDays,
        attitudeSelf: attitudeSelfDl,
        attitudeSuperior: attitudeSuperiorDl,
        superiorAppraisal: managerAppraisalDl,
        hrReview: hrFinalDl,
      },
      allocations: { company: companyKpi, department: deptKpi, individual: indivKpi, kpi: kpiPerf, attitude },
      consolidationMethod,
      roleFrequencies: Object.fromEntries(roles.map(role => [role.id, role.selected])),
    };
  }

  function handleSaveDraft() {
    const result = performanceStore.upsertPeriod(buildPeriod(periodStatus === "Upcoming" ? "Upcoming" : "Draft"));
    if (!result.ok) return;
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2500);
  }
  function handlePublish() {
    const period = buildPeriod("Upcoming");
    if (validateReviewPeriod(period).length) return;
    performanceStore.upsertPeriod(period);
    setPublished(true);
    setShowPublish(false);
  }

  // Title / badge for different modes
  const pageTitle = mode === "create" ? "Create Review Period"
    : mode === "edit" ? `Edit: ${periodName || "Review Period"}`
    : periodName || "Review Period";

  const modeBadge = published
    ? { label:"Published", color:TEAL, bg:"#ECFDF9" }
    : { label: mode === "create" ? "New Draft" : periodStatus, color: periodStatus === "Upcoming" ? AMBER : periodStatus === "Open" ? TEAL : periodStatus === "Closed" ? "#374151" : MUTED, bg: periodStatus === "Upcoming" ? "#FEF9EC" : periodStatus === "Open" ? "#ECFDF9" : "#F2F4F7" };

  return (
    <div className="p-6 space-y-5" style={{ backgroundColor:BG, minHeight:"calc(100vh - 56px)" }}>

      {/* ── Page Header ── */}
      <div>
        <button onClick={() => navigate("/performance/review-periods")}
          className="flex items-center gap-1.5 text-[12px] mb-4 transition-colors hover:text-[#1A1F2E]" style={{ color:MUTED }}>
          <ArrowLeft size={13}/> Back to Review Periods
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[20px] font-bold" style={{ color:TEXT }}>{pageTitle}</h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ color:modeBadge.color, backgroundColor:modeBadge.bg }}>{modeBadge.label}</span>
            </div>
            <p className="text-[13px]" style={{ color:MUTED }}>
              {readOnly
                ? "This review period is read-only. Its saved configuration is shown below."
                : "Configure all settings before publishing. You can save a draft at any time."}
            </p>
          </div>
          <div className="apex-page-actions flex items-center gap-2 shrink-0">
            <button onClick={() => setShowSummary(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-blue-50"
              style={{ color:BLUE, borderColor:BLUE }}>
              <Eye size={13}/> Preview Configuration
            </button>
            {!readOnly && (
              <>
              <button onClick={handleSaveDraft}
                disabled={warnings.length > 0}
                className="px-3 py-2 rounded-md text-[13px] font-medium border transition-colors hover:bg-gray-50"
                style={{ color:warnings.length ? "#9CA3AF" : BLUE, borderColor:warnings.length ? BORDER : BLUE, cursor:warnings.length ? "not-allowed" : "pointer" }}>
                {savedDraft ? "Saved ✓" : periodStatus === "Upcoming" ? "Save Changes" : "Save Draft"}
              </button>
              {periodStatus === "Draft" && <button
                onClick={() => { if (warnings.length === 0) setShowPublish(true); }}
                disabled={warnings.length > 0 || published}
                className="px-3 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity"
                style={{ backgroundColor: warnings.length > 0 || published ? "#9CA3AF" : BLUE }}
                title={warnings.length > 0 ? warnings[0] : undefined}>
                {published ? "Published ✓" : "Publish Review Period"}
              </button>}
              </>
            )}
          </div>
        </div>
      </div>

      {published && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor:"#ECFDF9", border:`1px solid ${TEAL}` }}>
          <CheckCircle size={16} style={{ color:TEAL }}/>
          <p className="text-[13px] font-medium" style={{ color:TEAL }}>
            Review period published. Eligible staff can now begin submitting their KPI plans.
          </p>
        </div>
      )}

      {(periodStatus === "Open" || periodStatus === "Closed") && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor:"#FEF9EC", border:"1px solid #F5D98A" }}>
          <AlertTriangle size={16} style={{ color:AMBER }} className="mt-0.5 shrink-0"/>
          <div>
            <p className="text-[12px] font-bold" style={{ color:AMBER }}>Review Period closure rules · TBC</p>
            <p className="text-[12px] mt-0.5" style={{ color:TEXT }}>
              The trigger, prerequisites, force-close behaviour, and reopening rules require stakeholder confirmation. No closure logic is assumed by this prototype.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Basic Information ── */}
      <SectionCard n={1} title="Basic Information" helper="Define the name and timeline for this review period.">
        <div className="grid grid-cols-3 gap-5">
          <Field label="Review Period Name">
            <TextInput value={periodName} onChange={setPeriodName} readOnly={readOnly} placeholder="e.g. 2027 Annual KPI Review"/>
          </Field>
          <Field label="Start Date"
            error={endBeforeStart ? "Start Date must be before End Date." : undefined}>
            <DateInput value={startDate} onChange={setStartDate} readOnly={readOnly}/>
          </Field>
          <Field label="End Date"
            error={endBeforeStart ? "End Date cannot be earlier than Start Date." : undefined}>
            <DateInput value={endDate} onChange={setEndDate} readOnly={readOnly} min={startDate || undefined}/>
          </Field>
        </div>
      </SectionCard>

      {/* ── Section 2: Role-Based Review Frequency ── */}
      <SectionCard n={2} title="Role-Based Review Frequency"
        helper="Override the system-default assessment frequency for specific roles in this period only. Changes are stored as a snapshot and won't be affected by future system-default updates.">
        {/* Filters */}
        {!readOnly && (
          <div className="flex gap-3 mb-4">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-[13px] outline-none"
              style={{ borderColor:BORDER, color:TEXT }}>
              {depts.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
            </select>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 flex-1" style={{ borderColor:BORDER }}>
              <Search size={12} style={{ color:MUTED }}/>
              <input type="text" placeholder="Search roles…" value={roleSearch} onChange={e => setRoleSearch(e.target.value)}
                className="flex-1 text-[13px] outline-none bg-transparent" style={{ color:TEXT }}/>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ backgroundColor:"#F8FAFC", borderBottom:`1px solid ${BORDER}` }}>
                {["Department / Role","System Default","Frequency for This Period","No. of Checkpoints","Configuration Status","Action"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color:MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRoles.map((r, i) => {
                const overridden = r.selected !== r.sysDefault;
                return (
                  <tr key={r.id} style={{ borderBottom: i < visibleRoles.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color:TEXT }}>{r.role}</p>
                      <p className="text-[11px]" style={{ color:MUTED }}>{r.dept}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px]" style={{ color:MUTED }}>{r.sysDefault}</span>
                    </td>
                    <td className="px-4 py-3">
                      {readOnly ? (
                        <span className="text-[12px] font-medium" style={{ color:TEXT }}>{r.selected}</span>
                      ) : (
                        <select value={r.selected} onChange={e => updateRoleFreq(r.id, e.target.value as Freq)}
                          className="px-2.5 py-1.5 border rounded-md text-[12px] outline-none"
                          style={{ borderColor:BORDER, color:TEXT }}>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Annually">Annually</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color:TEXT }}>
                      {CHECKPOINTS_COUNT[r.selected]}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={overridden
                          ? { color:AMBER, backgroundColor:"#FEF9EC" }
                          : { color:TEAL,  backgroundColor:"#ECFDF9" }}>
                        {overridden ? "Overridden" : "Using Default"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {overridden && !readOnly && (
                        <button onClick={() => resetRoleFreq(r.id)}
                          className="flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
                          style={{ color:MUTED }}>
                          <RotateCcw size={11}/> Reset
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] flex items-start gap-1.5 p-2.5 rounded-md"
          style={{ color:AMBER, backgroundColor:"#FEF9EC" }}>
          <Info size={12} className="mt-0.5 shrink-0"/>
          Example system defaults — source to be confirmed with TBM before the first live review period.
        </p>
      </SectionCard>

      {/* ── Section 3: Deadline Settings ── */}
      <SectionCard n={3} title="Deadline Settings"
        helper="Configure the deadlines for KPI setup, assessments, and appraisal activities.">

        <SubSection label="A — KPI Setup">
          <div className="grid grid-cols-2 gap-5">
            <Field label="KPI Setup Deadline" error={kpiSetupError || undefined}
              hint="Company- and Department-Level KPIs must be published, and Individual-Level KPIs must be Superior-approved, by this date. Late completion is allowed but marked Overdue.">
              <DateInput value={kpiSetupDl} onChange={setKpiSetupDl} readOnly={readOnly} max={startDate || undefined}/>
            </Field>
          </div>
        </SubSection>

        {/* 3B: Assessment Relative Rules */}
        <SubSection label="B — KPI Assessment Deadline Rules">
          <p className="text-[12px] mb-4" style={{ color:MUTED }}>
            Deadlines are calculated automatically from each Role's review checkpoint date.
            Review checkpoints are derived as: Monthly = end of each calendar month · Quarterly = end of each quarter · Annually = the review period End Date. Calendar Days are used throughout.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <RuleBuilder
              label="KPI Self-Assessment Deadline Rule"
              days={selfDays} setDays={setSelfDays}
              dayType={selfDayType} setDayType={setSelfDayType}
              reference="Review Checkpoint"
              readOnly={readOnly}
            />
            <RuleBuilder
              label="KPI Superior Assessment Deadline Rule"
              days={managerDays} setDays={setManagerDays}
              dayType={managerDayType} setDayType={setMgrDayType}
              reference="Self-Assessment Deadline"
              readOnly={readOnly}
            />
          </div>
          <p className="mt-3 text-[11px] flex items-center gap-1.5" style={{ color:MUTED }}>
            <Info size={12}/> This prototype uses Calendar Days only. Working-day and public-holiday calculations are outside the project scope.
          </p>
          <button
            onClick={() => setShowSchedule(true)}
            className="mt-4 flex items-center gap-1.5 px-3 py-2 border rounded-md text-[12px] font-medium transition-colors hover:bg-blue-50"
            style={{ color:BLUE, borderColor:"#93B4E8" }}>
            <Eye size={13}/> Preview Generated Schedule
          </button>
        </SubSection>

        {/* 3C: Attitude Deadlines */}
        <SubSection label="C — Attitude Evaluation Deadlines">
          {attitudeSeqWarning && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-md text-[12px]" style={{ backgroundColor:"#FEF9EC", color:AMBER }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0"/> {attitudeSeqWarning}
            </div>
          )}
          <div className="grid grid-cols-2 gap-5">
            <Field label="Attitude Self-Assessment Deadline">
              <DateInput value={attitudeSelfDl} onChange={setAttSelf} readOnly={readOnly}/>
            </Field>
            <Field label="Superior Attitude Evaluation Deadline"
              error={attitudeSeqWarning || undefined}>
              <DateInput value={attitudeSuperiorDl} onChange={setAttSup} readOnly={readOnly} min={attitudeSelfDl || undefined}/>
            </Field>
          </div>
        </SubSection>

        {/* 3D: Final Appraisal Deadlines */}
        <SubSection label="D — Final Appraisal Deadlines">
          <p className="text-[12px] mb-4" style={{ color:MUTED }}>
            These deadlines may fall after the performance period End Date.
          </p>
          {finalSeqWarning && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-md text-[12px]" style={{ backgroundColor:"#FEF9EC", color:AMBER }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0"/> {finalSeqWarning}
            </div>
          )}
          <div className="grid grid-cols-2 gap-5">
            <Field label="Superior Appraisal Recommendation Deadline">
              <DateInput value={managerAppraisalDl} onChange={setMgrAppr} readOnly={readOnly}/>
            </Field>
            <Field label="HR Review and Finalisation Deadline"
              error={finalSeqWarning || undefined}>
              <DateInput value={hrFinalDl} onChange={setHrFinal} readOnly={readOnly} min={managerAppraisalDl || undefined}/>
            </Field>
          </div>
        </SubSection>
      </SectionCard>

      {/* ── Section 4: Scoring & Weightage Configuration ── */}
      <SectionCard n={4} title="Scoring & Weightage Configuration"
        helper="Set the percentage contribution of each component. Each group must total 100%.">
        <div className="mb-6 pb-6 border-b" style={{ borderColor:BORDER }}>
          <p className="text-[12px] font-semibold mb-1" style={{ color:TEXT }}>Annual KPI Score Consolidation Method</p>
          <p className="text-[11px] mb-3" style={{ color:MUTED }}>Determines how Monthly or Quarterly Superior Assessment results are consolidated into the annual KPI result.</p>
          <div className="flex gap-3">
            {[
              { value:"final", label:"Final Checkpoint (Default)" },
              { value:"average", label:"Average of Checkpoints" },
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] font-medium cursor-pointer"
                style={{ borderColor: consolidationMethod === option.value ? BLUE : BORDER, color: consolidationMethod === option.value ? BLUE : TEXT, backgroundColor: consolidationMethod === option.value ? "#EEF3FC" : "white" }}>
                <input type="radio" name="consolidation-method" value={option.value} checked={consolidationMethod === option.value}
                  disabled={readOnly} onChange={() => setConsolidationMethod(option.value as "final"|"average")}/>
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-0">
          {/* KPI allocation */}
          <div>
            <p className="text-[12px] font-semibold mb-3" style={{ color:TEXT }}>KPI-Level Allocation</p>
            <div className="space-y-4">
              <AllocationRow label="Company-Level KPI"  value={companyKpi} onChange={setCompanyKpi} readOnly={readOnly}/>
              <AllocationRow label="Department-Level KPI" value={deptKpi}  onChange={setDeptKpi}    readOnly={readOnly}/>
              <AllocationRow label="Individual-Level KPI" value={indivKpi} onChange={setIndivKpi}   readOnly={readOnly}/>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor:BORDER }}>
              <span className="text-[12px] font-bold" style={{ color:TEXT }}>Total</span>
              <span className="text-[13px] font-bold" style={{ color: kpiValid ? TEAL : RED }}>
                {kpiTotal}% {kpiValid ? "✓" : "— must equal 100%"}
              </span>
            </div>
          </div>

          {/* Final score allocation */}
          <div>
            <p className="text-[12px] font-semibold mb-3" style={{ color:TEXT }}>Final Appraisal Score Allocation</p>
            <div className="space-y-4">
              <AllocationRow label="KPI Performance"      value={kpiPerf}  onChange={setKpiPerf}  readOnly={readOnly}/>
              <AllocationRow label="Attitude Evaluation"  value={attitude} onChange={setAttitude} readOnly={readOnly}/>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t" style={{ borderColor:BORDER }}>
              <span className="text-[12px] font-bold" style={{ color:TEXT }}>Total</span>
              <span className="text-[13px] font-bold" style={{ color: finalValid ? TEAL : RED }}>
                {finalTotal}% {finalValid ? "✓" : "— must equal 100%"}
              </span>
            </div>
            <p className="mt-3 text-[11px] flex items-start gap-1.5 p-2.5 rounded-md" style={{ color:MUTED, backgroundColor:"#F8FAFC" }}>
              <Info size={12} className="mt-0.5 shrink-0"/>
              Default allocation is 50% KPI Performance and 50% Attitude Evaluation. Total must equal 100%.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Modals ── */}
      {showPublish && (
        <PublishDialog
          periodName={periodName} kpiDeadline={kpiSetupDl}
          onConfirm={handlePublish} onCancel={() => setShowPublish(false)}
        />
      )}
      {showSchedule && (
        <SchedulePreviewModal rows={scheduleRows} onClose={() => setShowSchedule(false)}/>
      )}
      {showSummary && (
        <SummaryModal
          data={{ periodName, startDate, endDate, roles, companyKpi, deptKpi, indivKpi, kpiPerf, attitude, selfDays, selfDayType, managerDays, managerDayType, kpiSetupDl, consolidationMethod, warnings }}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

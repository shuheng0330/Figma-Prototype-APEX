import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Calendar, Award, Clock, AlertCircle, Globe, CheckCircle,
  BookOpen, BarChart3, Mail, Phone, Briefcase, User,
  Plus, X, Lock, Eye, Target, Flag, TrendingUp,
} from "lucide-react";

import { useRole } from "../access";
import {
  ROLE_IDENTITY, IDPS, PATH_TEMPLATES, GOAL_STATE_STYLE,
  staffById, courseById, completedSessionsFor, pendingSessionsFor, COURSES,
  useStoreVersion, fmtDate as fmtStoreDate,
} from "../trainingStore";

const TEAL   = "#00C9A7";
const GREEN  = "#059669";
const AMBER  = "#D97706";
const RED    = "#DC2626";
const BLUE   = "#3B82F6";
const PURPLE = "#7C3AED";
const MUTED  = "#9CA3AF";
const TEXT   = "#1A1F2E";
const BORDER = "#E5E7EB";
const BG     = "#F4F6F9";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status    = "Completed" | "In Progress" | "Overdue";
type TrType    = "Mandatory" | "Technical" | "Optional" | "External";
type Source    = "E-Learning" | "Physical" | "Hybrid" | "External";
type SortKey   = "date" | "title" | "source" | "score" | "status";
type Tab       = "general" | "training" | "plan" | "skills";
type CertStatus = "Valid" | "Expiring Soon" | "Expired";
type StepStatus = "completed" | "current" | "locked";

interface TrainingRecord {
  id: number; date: string; title: string;
  type: TrType; source: Source; score: number | null;
  status: Status; hours: number;
}
interface Certificate {
  name: string; body: string; issued: string; expires: string; status: CertStatus;
}
interface PathStep {
  step: number; title: string; duration: string; status: StepStatus;
  completedDate?: string; progress?: number;
}
interface DevGoal {
  title: string; targetDate: string; competency: string; progress: number; color: string;
}



// ── Live record helpers ───────────────────────────────────────────────────────
/** The signed-in employee for the current role. */
function useMe() {
  const role = useRole();
  useStoreVersion();
  const id = ROLE_IDENTITY[role] ?? "E001";
  return { id, role, staff: staffById(id) };
}

/**
 * A calendar session becomes a training record only when the participant both
 * registered AND had attendance recorded. Registered-but-unconfirmed sessions
 * stay "In Progress" so they never inflate the completion count.
 */
function useTrainingRecords(staffId: string): TrainingRecord[] {
  useStoreVersion();
  const confirmed: TrainingRecord[] = completedSessionsFor(staffId).map((x, i) => ({
    id: 1000 + i,
    date: x.session.date,
    title: x.session.title,
    type: x.session.mandatory ? "Mandatory" : x.session.kind === "Sharing Session" ? "Optional" : "Technical",
    source: x.session.kind === "Hybrid" ? "Hybrid" : "Physical",
    score: x.reg.quizScore ?? null,
    status: "Completed",
    hours: 4,
  }));
  const awaiting: TrainingRecord[] = pendingSessionsFor(staffId).map((x, i) => ({
    id: 2000 + i,
    date: x.session.date,
    title: x.session.title,
    type: x.session.mandatory ? "Mandatory" : "Optional",
    source: x.session.kind === "Hybrid" ? "Hybrid" : "Physical",
    score: null,
    status: "In Progress",
    hours: 4,
  }));
  // E-learning rows come from the courses the learner has actually opened.
  // A course that has never been started produces no record at all.
  const today = new Date().toISOString().slice(0, 10);
  const elearning: TrainingRecord[] = COURSES
    .filter(c => c.progress > 0 || (c.mandatory && c.deadline && c.deadline < today))
    .map((c, i) => {
      const done = c.progress >= 100;
      const overdue = !done && Boolean(c.deadline && c.deadline < today);
      return {
        id: 3000 + i,
        date: c.deadline ?? today,
        title: c.title,
        type: (c.mandatory ? "Mandatory" : c.kpi === "Product Training" ? "Technical" : "Optional") as TrType,
        source: (c.delivery === "Hybrid" ? "Hybrid" : "E-Learning") as Source,
        score: null,
        status: (done ? "Completed" : overdue ? "Overdue" : "In Progress") as Status,
        hours: Math.max(1, Math.round(parseInt(c.duration, 10) / 60) || 1),
      };
    });

  return [...confirmed, ...awaiting, ...elearning].sort((a, b) => b.date.localeCompare(a.date));
}

const CERTIFICATES: Certificate[] = [
  { name:"HVAC Installation & Servicing — Level 2", body:"CIDB Malaysia",      issued:"20 Apr 2026", expires:"20 Apr 2028", status:"Valid"         },
  { name:"ISO 9001:2015 Internal Auditor",           body:"BSI Group",          issued:"30 Jun 2026", expires:"15 Sep 2026", status:"Expiring Soon" },
  { name:"Electrical Safety Competency",             body:"ST (Malaysia)",      issued:"10 Jan 2025", expires:"10 Jan 2027", status:"Valid"         },
  { name:"First Aid & CPR Level 1",                  body:"St. John Ambulance", issued:"05 Mar 2024", expires:"05 Mar 2026", status:"Expired"       },
];




const COMPETENCY_OPTIONS = [
  "Customer Service","Technical Skills","Leadership","Communication",
  "Problem Solving","Safety Compliance","Quality Management",
  "Digital Literacy","Project Management","Team Collaboration",
];

const TYPE_STYLE: Record<TrType, { bg:string; color:string }> = {
  Mandatory: { bg:"#FEE2E2", color:"#DC2626" },
  Technical: { bg:"#DBEAFE", color:"#1D4ED8" },
  Optional:  { bg:"#EDE9FE", color:"#6D28D9" },
  External:  { bg:"#CCFBF1", color:"#0D9488" },
};
const STATUS_STYLE: Record<Status, { bg:string; color:string }> = {
  Completed:     { bg:"#ECFDF5", color:GREEN  },
  "In Progress": { bg:"#FEF3C7", color:AMBER  },
  Overdue:       { bg:"#FEE2E2", color:RED    },
};
const CERT_STYLE: Record<CertStatus, { bg:string; color:string }> = {
  "Valid":          { bg:"#ECFDF5", color:GREEN },
  "Expiring Soon":  { bg:"#FEF3C7", color:AMBER },
  "Expired":        { bg:"#FEE2E2", color:RED   },
};

// ── Date Picker ───────────────────────────────────────────────────────────────
const TODAY_ISO = new Date().toISOString().slice(0, 10);
const DOW_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getCalDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  const days: Array<{date:Date;current:boolean}> = [];
  for (let i = first.getDay(); i > 0; i--) {
    const d = new Date(first); d.setDate(d.getDate()-i); days.push({date:d,current:false});
  }
  for (let i = 1; i <= last.getDate(); i++) days.push({date:new Date(year,month,i),current:true});
  let nx = 1;
  while (days.length < 42) days.push({date:new Date(year,month+1,nx++),current:false});
  return days;
}

function DatePicker({
  value, onChange, placeholder="Select date", align="left",
}: {
  value:string; onChange:(iso:string)=>void; placeholder?:string; align?:"left"|"right";
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    if (value) return new Date(value+"T00:00:00");
    const d = new Date(); d.setDate(1); return d;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    function h(e:MouseEvent){ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const days = useMemo(()=>getCalDays(view.getFullYear(),view.getMonth()),[view]);

  const select=(d:Date)=>{ onChange(toISO(d)); setOpen(false); };

  const display = value
    ? new Date(value+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})
    : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={()=>{ if(value) setView(new Date(value+"T00:00:00")); setOpen(o=>!o); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] focus:outline-none hover:border-gray-300 transition-colors bg-white whitespace-nowrap"
        style={{ color: value ? TEXT : MUTED }}
      >
        <Calendar size={12} style={{ color: value ? TEAL : MUTED }} />
        {display || placeholder}
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 bg-white rounded-xl overflow-hidden"
          style={{ boxShadow:"0 8px 32px rgba(0,0,0,0.15)", minWidth:268, [align==="right"?"right":"left"]:0 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button type="button" onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()-1,1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={13} className="text-[#6B7280]"/>
            </button>
            <span className="text-[13px] font-bold text-[#1A1F2E]">
              {view.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}
            </span>
            <button type="button" onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()+1,1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={13} className="text-[#6B7280]"/>
            </button>
          </div>
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DOW_SHORT.map(d=><div key={d} className="text-center text-[10px] font-bold pb-1" style={{color:MUTED}}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {days.map(({date,current},i)=>{
              const iso=toISO(date);
              const sel=iso===value;
              const today=iso===TODAY_ISO;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={()=>current&&select(date)}
                  className="h-8 w-full flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor:sel?TEAL:"transparent",
                    color:sel?"white":!current?"#D1D5DB":today?TEAL:"#374151",
                    fontWeight:today&&!sel?700:undefined,
                    cursor:current?"pointer":"default",
                  }}
                  onMouseEnter={e=>{ if(current&&!sel)(e.currentTarget as HTMLButtonElement).style.backgroundColor="#F0FDF9"; }}
                  onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLButtonElement).style.backgroundColor="transparent"; }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y,m,d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

// ── Small UI components ───────────────────────────────────────────────────────
function TypeChip({ type }: { type: TrType }) {
  const s = TYPE_STYLE[type];
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ backgroundColor:s.bg, color:s.color }}>{type}</span>;
}
function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor:s.bg, color:s.color }}>{status}</span>;
}
function SortIcon({ active, dir }: { active:boolean; dir:"asc"|"desc" }) {
  if (!active) return <ChevronsUpDown size={12} className="shrink-0 opacity-25" />;
  return dir==="asc" ? <ChevronUp size={12} className="shrink-0" style={{ color:TEAL }} /> : <ChevronDown size={12} className="shrink-0" style={{ color:TEAL }} />;
}

function StatTile({ icon:Icon, value, label, sub, iconBg, iconColor }: {
  icon:React.ElementType; value:string; label:string; sub?:string; iconBg:string; iconColor:string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 flex items-start gap-3" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:iconBg }}>
        <Icon size={16} style={{ color:iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-extrabold leading-none mb-0.5" style={{ color:TEXT }}>{value}</p>
        <p className="text-[11px] font-semibold leading-snug" style={{ color:"#6B7280" }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color:MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

function ProgressRing({ progress, size=88 }: { progress:number; size?:number }) {
  const r     = (size - 14) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (Math.min(progress,100) / 100) * circ;
  const cx    = size / 2;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5E7EB" strokeWidth={7} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={TEAL} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition:"stroke-dasharray 0.4s ease" }}
      />
      <text x={cx} y={cx-4} textAnchor="middle" fontSize={17} fontWeight="800" fill={TEXT}>{progress}%</text>
      <text x={cx} y={cx+11} textAnchor="middle" fontSize={9} fill={MUTED}>progress</text>
    </svg>
  );
}

// ── Log External Training Modal ───────────────────────────────────────────────
function LogExternalTrainingModal({ onClose }: { onClose:()=>void }) {
  const [date, setDate]                 = useState("");
  const [time, setTime]                 = useState("");
  const [topic, setTopic]               = useState("");
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [compQuery, setCompQuery]       = useState("");
  const [compOpen, setCompOpen]         = useState(false);
  const [attempted, setAttempted]       = useState(false);
  const [saved, setSaved]               = useState(false);

  const filtered = COMPETENCY_OPTIONS.filter(
    c => c.toLowerCase().includes(compQuery.toLowerCase()) && !competencies.includes(c)
  );
  const addComp = (c: string) => { setCompetencies(p => [...p, c]); setCompQuery(""); setCompOpen(false); };
  const errors = {
    date:       attempted && !date,
    time:       attempted && !time,
    topic:      attempted && !topic.trim(),
    competency: attempted && competencies.length === 0,
  };
  const handleSave = () => {
    setAttempted(true);
    if (!date || !time || !topic.trim() || competencies.length === 0) return;
    setSaved(true);
    setTimeout(onClose, 1400);
  };
  const fld = (err:boolean): React.CSSProperties => ({
    border:`1.5px solid ${err ? RED : BORDER}`,
    backgroundColor: err ? "#FFF7F7" : "white",
  });

  if (saved) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-[420px] flex flex-col items-center py-14 gap-3" style={{ boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor:"#ECFDF5" }}>
          <CheckCircle size={22} style={{ color:GREEN }} />
        </div>
        <p className="text-[15px] font-bold mt-1" style={{ color:TEXT }}>Record saved</p>
        <p className="text-[12px]" style={{ color:MUTED }}>Your external training has been logged.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl w-[480px] max-w-full flex flex-col" style={{ boxShadow:"0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color:TEXT }}>Log External Training</h2>
            <p className="text-[12px] mt-0.5" style={{ color:MUTED }}>Record training completed outside the organization.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0 mt-0.5">
            <X size={14} style={{ color:MUTED }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color:"#374151" }}>Date <span style={{ color:RED }}>*</span></label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[13px] focus:outline-none transition-colors" style={{ ...fld(errors.date), color:TEXT }} />
              {errors.date && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color:"#374151" }}>Time <span style={{ color:RED }}>*</span></label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[13px] focus:outline-none transition-colors" style={{ ...fld(errors.time), color:TEXT }} />
              {errors.time && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color:"#374151" }}>Topic <span style={{ color:RED }}>*</span></label>
            <input type="text" placeholder="e.g. Fire Safety Refresher" value={topic} onChange={e=>setTopic(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[13px] focus:outline-none transition-colors placeholder-[#C4C9D4]" style={{ ...fld(errors.topic), color:TEXT }} />
            {errors.topic && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color:"#374151" }}>Competency <span style={{ color:RED }}>*</span></label>
            <div className="relative">
              <div className="w-full px-2.5 py-2 rounded-lg flex flex-wrap items-center gap-1.5 cursor-text transition-colors" style={{ ...fld(errors.competency), minHeight:44 }} onClick={()=>setCompOpen(true)}>
                {competencies.map(c=>(
                  <span key={c} className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ backgroundColor:"#E8FAF7", color:TEAL }}>
                    {c}
                    <button type="button" onClick={e=>{e.stopPropagation();setCompetencies(p=>p.filter(x=>x!==c));}} className="hover:opacity-60 transition-opacity"><X size={10}/></button>
                  </span>
                ))}
                <input type="text" placeholder={competencies.length===0?"Search or select a competency…":""} value={compQuery} onChange={e=>{setCompQuery(e.target.value);setCompOpen(true);}} onFocus={()=>setCompOpen(true)} className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-[12px] placeholder-[#C4C9D4] py-0.5" style={{ color:TEXT }} />
              </div>
              {compOpen&&(<>
                <div className="fixed inset-0 z-10" onClick={()=>{setCompOpen(false);setCompQuery("");}}/>
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg z-20 overflow-hidden" style={{ boxShadow:"0 8px 24px rgba(0,0,0,0.12)",maxHeight:176,overflowY:"auto" }}>
                  {filtered.length>0 ? filtered.map(c=>(
                    <button key={c} type="button" onClick={()=>addComp(c)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors" style={{ color:TEXT }}>{c}</button>
                  )) : <p className="px-3 py-2.5 text-[12px]" style={{ color:MUTED }}>{COMPETENCY_OPTIONS.every(c=>competencies.includes(c))?"All selected":"No matches"}</p>}
                </div>
              </>)}
            </div>
            {errors.competency && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10}/> Please select at least one competency.</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold rounded-lg border transition-colors hover:bg-gray-50" style={{ color:"#6B7280", borderColor:BORDER }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-colors" style={{ backgroundColor:"#10B981" }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.backgroundColor="#059669"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.backgroundColor="#10B981"}>
            Save record
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Training History Tab ──────────────────────────────────────────────────────
function TrainingHistoryTab() {
  const me = useMe();
  const RECORDS = useTrainingRecords(me.id);
  const pendingCount = pendingSessionsFor(me.id).length;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [source, setSource]     = useState("All");
  const [q, setQ]               = useState("");
  const [sortKey, setSortKey]   = useState<SortKey>("date");
  const [sortDir, setSortDir]   = useState<"asc"|"desc">("desc");
  const [showModal, setShowModal] = useState(false);

  const totalCompleted      = RECORDS.filter(r=>r.status==="Completed").length;
  const hoursLogged         = RECORDS.filter(r=>r.status==="Completed").reduce((s,r)=>s+r.hours,0);
  const mandatoryOutstanding= RECORDS.filter(r=>r.type==="Mandatory"&&r.status!=="Completed").length;
  const activeCerts         = CERTIFICATES.filter(c=>c.status!=="Expired").length;

  const toggleSort = (key: SortKey) => {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const rows = useMemo(()=>{
    let data = RECORDS;
    if (dateFrom) data = data.filter(r=>r.date>=dateFrom);
    if (dateTo)   data = data.filter(r=>r.date<=dateTo);
    if (source!=="All") data = data.filter(r=>r.source===source);
    if (q.trim()) data = data.filter(r=>r.title.toLowerCase().includes(q.toLowerCase()));
    return [...data].sort((a,b)=>{
      let cmp=0;
      if (sortKey==="date")   cmp=a.date.localeCompare(b.date);
      if (sortKey==="title")  cmp=a.title.localeCompare(b.title);
      if (sortKey==="source") cmp=a.source.localeCompare(b.source);
      if (sortKey==="score")  cmp=(a.score??-1)-(b.score??-1);
      if (sortKey==="status") cmp=a.status.localeCompare(b.status);
      return sortDir==="asc"?cmp:-cmp;
    });
  },[dateFrom,dateTo,source,q,sortKey,sortDir]);

  const inCls = "bg-transparent border-none focus:outline-none text-[12px] placeholder-[#9CA3AF]" ;
  const thCls = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-[#1A1F2E] transition-colors" ;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold" style={{ color:TEXT }}>Training History</h2>
          <p className="text-[11px] mt-0.5" style={{ color:MUTED }}>All completed and in-progress trainings</p>
        </div>
        <button onClick={()=>setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white transition-colors"
          style={{ backgroundColor:TEAL }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.backgroundColor="#00B396"}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.backgroundColor=TEAL}>
          <Plus size={13}/> Log External Training
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px]" style={{ boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <span style={{ color:MUTED }} className="whitespace-nowrap text-[12px]">From</span>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Start date" />
          <span style={{ color:"#C4C9D4" }}>–</span>
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="End date" align="right" />
          {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} className="ml-1 text-[11px] transition-colors hover:text-red-500" style={{ color:MUTED }}>✕</button>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <select value={source} onChange={e=>setSource(e.target.value)} className="px-3 py-2 text-[12px] focus:outline-none bg-transparent appearance-none pr-7 cursor-pointer" style={{ color:TEXT, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center" }}>
            {["All","E-Learning","Physical","Hybrid","External"].map(s=><option key={s} value={s}>{s==="All"?"All Sources":s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg flex-1" style={{ boxShadow:"0 1px 3px rgba(0,0,0,0.05)", minWidth:200 }}>
          <Search size={13} style={{ color:MUTED }} className="shrink-0"/>
          <input type="text" placeholder="Search training title…" value={q} onChange={e=>setQ(e.target.value)} className="flex-1 bg-transparent border-none focus:outline-none text-[12px] placeholder-[#9CA3AF]" style={{ color:TEXT }}/>
          {q&&<button onClick={()=>setQ("")} className="text-[11px] transition-colors hover:text-red-500" style={{ color:MUTED }}>✕</button>}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile icon={CheckCircle} value={String(totalCompleted)} label="Completed Courses" sub="All time" iconBg="#ECFDF5" iconColor={GREEN}/>
        <StatTile icon={Clock} value={`${hoursLogged}h`} label="Training Hours" sub="From completed" iconBg="#EFF6FF" iconColor={BLUE}/>
        <StatTile icon={AlertCircle} value={String(mandatoryOutstanding)} label="Mandatory Outstanding" sub="Requires attention" iconBg="#FEF2F2" iconColor={RED}/>
        <StatTile icon={Award} value={String(activeCerts)} label="Certificates" sub="Active & valid" iconBg="#FDF4FF" iconColor={PURPLE}/>
      </div>

      {/* Attendance rule — registration alone is not a record */}
      {pendingCount > 0 && (
        <div className="rounded-lg px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor:"#FFFBEB" }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color:AMBER }}/>
          <p className="text-[11px] leading-relaxed" style={{ color:"#92400E" }}>
            <b>{pendingCount}</b> registered session{pendingCount===1?"":"s"} not yet counted as completed — a
            session only enters your record once the trainer records your attendance on the day.
          </p>
        </div>
      )}

      {/* Training records table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-bold" style={{ color:TEXT }}>Completed Training</span>
          <span className="text-[11px]" style={{ color:MUTED }}>{rows.length} of {RECORDS.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor:"#FAFAFA" }}>
                <th className={thCls} style={{ color:MUTED }} onClick={()=>toggleSort("date")}><span className="flex items-center gap-1">Completion Date<SortIcon active={sortKey==="date"} dir={sortDir}/></span></th>
                <th className={thCls} style={{ color:MUTED }} onClick={()=>toggleSort("title")}><span className="flex items-center gap-1">Training Title<SortIcon active={sortKey==="title"} dir={sortDir}/></span></th>
                <th className={`${thCls} cursor-default`} style={{ color:MUTED }}>Type</th>
                <th className={thCls} style={{ color:MUTED }} onClick={()=>toggleSort("source")}><span className="flex items-center gap-1">Source<SortIcon active={sortKey==="source"} dir={sortDir}/></span></th>
                <th className={thCls} style={{ color:MUTED }} onClick={()=>toggleSort("score")}><span className="flex items-center gap-1">Score<SortIcon active={sortKey==="score"} dir={sortDir}/></span></th>
                <th className={thCls} style={{ color:MUTED }} onClick={()=>toggleSort("status")}><span className="flex items-center gap-1">Status<SortIcon active={sortKey==="status"} dir={sortDir}/></span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length===0 ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <BookOpen size={32} className="mx-auto mb-2" style={{ color:"#D1D5DB" }}/>
                  <p className="text-[13px]" style={{ color:MUTED }}>No records match your filters</p>
                </td></tr>
              ) : rows.map((r,i)=>(
                <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors" style={{ backgroundColor:i%2===0?"white":"#FDFEFE" }}>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color:"#6B7280" }}>{fmtDate(r.date)}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color:TEXT }}>{r.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color:MUTED }}>{r.hours}h</p>
                  </td>
                  <td className="px-4 py-3"><TypeChip type={r.type}/></td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color:"#6B7280" }}>{r.source}</td>
                  <td className="px-4 py-3">
                    {r.score!==null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold" style={{ color:r.score>=85?GREEN:r.score>=70?AMBER:RED }}>{r.score}%</span>
                        <div className="w-14 bg-gray-100 rounded-full" style={{ height:4 }}>
                          <div className="rounded-full" style={{ height:4, width:`${r.score}%`, backgroundColor:r.score>=85?"#10B981":r.score>=70?"#F59E0B":"#EF4444" }}/>
                        </div>
                      </div>
                    ) : <span className="text-[12px]" style={{ color:"#C4C9D4" }}>—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusChip status={r.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificates panel */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-bold" style={{ color:TEXT }}>Certificates</span>
          <span className="text-[11px]" style={{ color:MUTED }}>{CERTIFICATES.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor:"#FAFAFA" }}>
                {["Certificate Name","Issued Date","Expiry Date","Status",""].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color:MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CERTIFICATES.map((c,i)=>{
                const s = CERT_STYLE[c.status];
                return (
                  <tr key={c.name} className="hover:bg-[#FAFAFA] transition-colors" style={{ backgroundColor:i%2===0?"white":"#FDFEFE" }}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold" style={{ color:TEXT }}>{c.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color:MUTED }}>{c.body}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color:"#6B7280" }}>{c.issued}</td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: c.status==="Expired"?RED:c.status==="Expiring Soon"?AMBER:"#6B7280", fontWeight: c.status!=="Valid"?600:400 }}>{c.expires}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ backgroundColor:s.bg, color:s.color }}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color:MUTED }}
                        title="View certificate">
                        <Eye size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <LogExternalTrainingModal onClose={()=>setShowModal(false)}/>}
    </div>
  );
}

// ── Learning Plan Tab ─────────────────────────────────────────────────────────
function LearningPlanTab() {
  const me = useMe();
  const storeIdp = IDPS.find(i => i.staffId === me.id);
  const goals = storeIdp?.goals ?? [];
  const template = storeIdp?.pathTemplateId
    ? PATH_TEMPLATES.find(t => t.id === storeIdp.pathTemplateId)
    : undefined;
  const hrOwner = storeIdp ? staffById(storeIdp.hrOwnerId) : undefined;
  const superior = storeIdp ? staffById(storeIdp.superiorId) : undefined;
  const goalsCompleted = goals.filter(g => g.progress >= 100).length;
  const idpProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
    : 0;
  /** Path steps, with status derived from the learner progress on each course. */
  const PATH: PathStep[] = (template?.steps ?? []).map((st, i) => {
    const c = courseById(st.courseId);
    const done = (c?.progress ?? 0) >= 100;
    const active = (c?.progress ?? 0) > 0 && !done;
    return {
      step: i + 1,
      title: c?.title ?? st.courseId,
      duration: c?.duration ?? "—",
      status: done ? "completed" : active ? "current" : "locked",
      progress: active ? c?.progress : undefined,
    };
  });
  return (
    <div className="space-y-5">

      {/* 1 ── IDP Summary card */}
      <div className="bg-white rounded-xl p-5" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={15} style={{ color:TEAL }}/>
              <h2 className="text-[14px] font-bold" style={{ color:TEXT }}>Individual Development Plan (IDP)</h2>
            </div>
            <p className="text-[11px]" style={{ color:MUTED }}>Active development plan for the current review cycle.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor:"#E8FAF7", color:TEAL }}>Active</span>
        </div>

        <div className="flex items-stretch gap-6">
          {/* Left: details grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label:"Plan Owners",  val:`HR ${hrOwner?.name ?? "—"} + ${superior?.name ?? "Superior"}` },
              { label:"Plan Period",  val:storeIdp?.period ?? "—" },
              { label:"Joint Review", val:storeIdp ? fmtStoreDate(storeIdp.reviewDate) : "—" },
              { label:"Goals",        val:`${goalsCompleted} of ${goals.length} achieved` },
            ].map(({ label, val })=>(
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-0.5" style={{ color:MUTED }}>{label}</p>
                <p className="text-[13px] font-semibold" style={{ color:TEXT }}>{val}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-1.5" style={{ color:MUTED }}>Overall Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full" style={{ height:8 }}>
                  <div className="rounded-full" style={{ height:8, width:`${idpProgress}%`, backgroundColor:TEAL, transition:"width 0.4s ease" }}/>
                </div>
                <span className="text-[12px] font-bold shrink-0" style={{ color:TEAL }}>{idpProgress}%</span>
              </div>
            </div>
          </div>

          {/* Right: ring */}
          <div className="flex flex-col items-center justify-center px-4">
            <ProgressRing progress={idpProgress} size={96}/>
            <p className="text-[10px] mt-2 text-center" style={{ color:MUTED }}>
              {goalsCompleted}/{goals.length} goals met
            </p>
          </div>
        </div>
      </div>

      {/* 2 ── Assigned Learning Path */}
      <div className="bg-white rounded-xl p-5" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} style={{ color:BLUE }}/>
          <h2 className="text-[14px] font-bold" style={{ color:TEXT }}>Assigned Learning Path</h2>
        </div>
        <p className="text-[11px] mb-5" style={{ color:MUTED }}>
          {template ? `${template.name} · assigned by HR / superior` : "No path assigned yet"} · {PATH.filter(s=>s.status==="completed").length} of {PATH.length} modules completed
        </p>

        <div className="flex gap-5">
          {/* Step column */}
          <div className="flex flex-col items-center pt-1">
            {PATH.map((step, idx)=>{
              const isLast = idx===PATH.length-1;
              const nextStep = PATH[idx+1];
              const lineColor = step.status==="completed" && nextStep && nextStep.status!=="locked" ? TEAL : step.status==="completed" ? TEAL : "#E5E7EB";

              return (
                <div key={step.step} className="flex flex-col items-center">
                  {/* Circle */}
                  {step.status==="completed" ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor:"#ECFDF5", border:`2px solid ${GREEN}` }}>
                      <CheckCircle size={16} style={{ color:GREEN }}/>
                    </div>
                  ) : step.status==="current" ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold" style={{ backgroundColor:TEAL, color:"white", boxShadow:`0 0 0 4px #E8FAF7` }}>
                      {step.step}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor:"#F3F4F6", border:`2px solid #E5E7EB` }}>
                      <Lock size={13} style={{ color:MUTED }}/>
                    </div>
                  )}
                  {/* Connector */}
                  {!isLast && (
                    <div className="w-0.5 flex-1" style={{ height:40, backgroundColor:lineColor, minHeight:40, marginTop:2, marginBottom:2 }}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* Content column */}
          <div className="flex-1 space-y-0">
            {PATH.map((step,idx)=>{
              const isLast = idx===PATH.length-1;
              return (
                <div key={step.step} className={`flex flex-col justify-center ${isLast?"":"mb-0"}`} style={{ minHeight:64 }}>
                  <div className={`rounded-lg px-4 py-3 transition-all ${step.status==="current"?"border-2":"border"}`}
                    style={{
                      borderColor: step.status==="current" ? TEAL : step.status==="completed" ? "#D1FAE5" : BORDER,
                      backgroundColor: step.status==="current" ? "#F0FDFB" : step.status==="completed" ? "#FAFAFA" : "#FAFAFA",
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug" style={{ color:step.status==="locked"?MUTED:TEXT }}>{step.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[11px]" style={{ color:MUTED }}>{step.duration}</span>
                          {step.status==="completed" && step.completedDate && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color:GREEN }}>
                              <CheckCircle size={9}/> Completed {step.completedDate}
                            </span>
                          )}
                          {step.status==="current" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor:"#E8FAF7", color:TEAL }}>In Progress</span>
                          )}
                          {step.status==="locked" && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color:MUTED }}>
                              <Lock size={9}/> Requires prior module
                            </span>
                          )}
                        </div>
                      </div>
                      {step.status==="current" && typeof step.progress==="number" && (
                        <div className="shrink-0 text-right" style={{ minWidth:64 }}>
                          <p className="text-[11px] font-bold" style={{ color:TEAL }}>{step.progress}%</p>
                          <div className="w-16 bg-gray-200 rounded-full mt-1" style={{ height:4 }}>
                            <div className="rounded-full" style={{ height:4, width:`${step.progress}%`, backgroundColor:TEAL }}/>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLast && <div style={{ height:8 }}/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 ── Development Goals */}
      <div className="bg-white rounded-xl p-5" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Flag size={15} style={{ color:PURPLE }}/>
          <h2 className="text-[14px] font-bold" style={{ color:TEXT }}>Development Goals</h2>
        </div>
        <p className="text-[11px] mb-3" style={{ color:MUTED }}>Set jointly by HR and your superior — a goal becomes active once both approve.</p>
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4" style={{ backgroundColor:"#F9FAFB" }}>
          <Lock size={11} className="mt-0.5 shrink-0" style={{ color:MUTED }}/>
          <p className="text-[10px] leading-relaxed" style={{ color:MUTED }}>
            View only here. HR ({hrOwner?.name ?? "—"}) and {superior?.name ?? "your superior"} manage these
            goals from the Development Plans screen.
          </p>
        </div>

        <div className="space-y-3">
          {goals.map(g=>{
            const state = g.progress>=100 ? "Achieved" : (g.hrApproved && g.superiorApproved ? "Agreed" : "Proposed");
            const st = GOAL_STATE_STYLE[state as keyof typeof GOAL_STATE_STYLE];
            return (
            <div key={g.id} className="rounded-lg px-4 py-3.5 border" style={{ borderColor:BORDER, backgroundColor:g.progress===100?"#F0FDF9":"white" }}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[13px] font-semibold" style={{ color:TEXT }}>{g.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ color:st.color, backgroundColor:st.bg }}>{state}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color:MUTED }}>
                      <Calendar size={10}/> Target: {fmtStoreDate(g.targetDate)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor:`${g.color}18`, color:g.color }}>{g.competency}</span>
                    <span className="text-[10px]" style={{ color:MUTED }}>Proposed by {staffById(g.proposedBy)?.name ?? "—"}</span>
                  </div>
                </div>
                <span className="text-[14px] font-bold shrink-0" style={{ color: g.progress===100?GREEN:g.color }}>{g.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full mb-2.5" style={{ height:5 }}>
                <div className="rounded-full transition-all" style={{ height:5, width:`${g.progress}%`, backgroundColor:g.progress===100?GREEN:g.color }}/>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                  style={g.hrApproved ? { color:"#0891B2", backgroundColor:"#ECFEFF" } : { color:"#9CA3AF", backgroundColor:"#F9FAFB" }}>
                  HR {g.hrApproved ? "approved" : "pending"}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                  style={g.superiorApproved ? { color:"#1D4ED8", backgroundColor:"#EFF6FF" } : { color:"#9CA3AF", backgroundColor:"#F9FAFB" }}>
                  Superior {g.superiorApproved ? "approved" : "pending"}
                </span>
                {g.linkedCourseIds.length>0 && (
                  <span className="text-[10px] ml-auto" style={{ color:MUTED }}>
                    Linked: {g.linkedCourseIds.map(id=>courseById(id)?.title).filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── General Information Tab ───────────────────────────────────────────────────
function GeneralInfoTab() {
  const Section = ({ title, rows }: { title:string; rows:{ label:string; value:string }[] }) => (
    <div className="bg-white rounded-lg p-5 mb-4" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-4" style={{ color:MUTED }}>{title}</p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
        {rows.map(f=>(
          <div key={f.label}>
            <p className="text-[10px] mb-0.5" style={{ color:MUTED }}>{f.label}</p>
            <p className="text-[13px] font-semibold" style={{ color:TEXT }}>{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <Section title="Personal Details" rows={[
        { label:"Full Name",      value:"Ahmad Samsudin" },
        { label:"Employee ID",    value:"ENG-2024-0042"  },
        { label:"Date of Birth",  value:"14 Feb 1992"    },
        { label:"Nationality",    value:"Malaysian"      },
        { label:"Gender",         value:"Male"           },
        { label:"Marital Status", value:"Married"        },
      ]}/>
      <Section title="Work Information" rows={[
        { label:"Department",    value:"Engineering"          },
        { label:"Position",      value:"Senior Technician"    },
        { label:"Employment",    value:"Full-time, Permanent" },
        { label:"Manager",       value:"Lee Jian Wei"         },
        { label:"Work Location", value:"HQ — Level 3"         },
        { label:"Start Date",    value:"15 Mar 2022"          },
      ]}/>
      <Section title="Contact Details" rows={[
        { label:"Email",             value:"ahmad.samsudin@company.com"          },
        { label:"Phone",             value:"+60 12-345 6789"                     },
        { label:"Office Ext",        value:"3421"                                },
        { label:"Emergency Contact", value:"Nur Samsudin · +60 11-987 6543"      },
      ]}/>
    </div>
  );
}

// ── Skills Tab ────────────────────────────────────────────────────────────────
function SkillsTab() {
  const categories = [
    { label:"Technical Skills", skills:[
      { name:"HVAC Installation",     level:90 },
      { name:"Refrigerant Handling",  level:80 },
      { name:"Electrical Wiring",     level:70 },
      { name:"Piping & Connections",  level:85 },
    ]},
    { label:"Compliance & Safety", skills:[
      { name:"ISO 9001 Quality",      level:75 },
      { name:"Fire Safety Protocols", level:95 },
      { name:"Workplace HSE",         level:88 },
    ]},
    { label:"Soft Skills", skills:[
      { name:"Customer Communication",level:78 },
      { name:"Report Writing",        level:65 },
      { name:"Team Collaboration",    level:82 },
    ]},
  ];
  return (
    <div className="space-y-4">
      {categories.map(cat=>(
        <div key={cat.label} className="bg-white rounded-lg p-5" style={{ boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-4" style={{ color:MUTED }}>{cat.label}</p>
          <div className="space-y-3.5">
            {cat.skills.map(s=>(
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color:TEXT }}>{s.name}</span>
                  <span className="text-[11px] font-bold" style={{ color:TEAL }}>{s.level}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full" style={{ height:6 }}>
                  <div className="rounded-full transition-all" style={{ height:6, width:`${s.level}%`, backgroundColor:TEAL }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Profile Left Panel ────────────────────────────────────────────────────────
function ProfilePanel() {
  const me = useMe();
  const RECORDS = useTrainingRecords(me.id);
  const idp = IDPS.find(i => i.staffId === me.id);
  const idpProgress = idp && idp.goals.length
    ? Math.round(idp.goals.reduce((a, g) => a + g.progress, 0) / idp.goals.length)
    : 0;
  const completed = RECORDS.filter(r=>r.status==="Completed");
  const completionRate = Math.round((completed.length/RECORDS.length)*100);
  const hoursLogged = completed.reduce((s,r)=>s+r.hours,0);

  return (
    <div className="apex-profile-panel w-[248px] shrink-0 bg-white border-r border-gray-100 overflow-y-auto flex flex-col">
      {/* Avatar */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-100 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[18px] font-extrabold mx-auto mb-3" style={{ backgroundColor:me.staff?.color ?? TEAL }}>{me.staff?.initials ?? "AS"}</div>
        <p className="text-[14px] font-bold leading-tight" style={{ color:TEXT }}>{me.staff?.name ?? "Ahmad Samsudin"}</p>
        <p className="text-[12px] mt-0.5" style={{ color:MUTED }}>{me.staff?.position ?? "Senior Technician"}</p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor:"#E8FAF7", color:TEAL }}>{me.staff?.dept ?? "Engineering"}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-[#6B7280]">Full-time</span>
        </div>
      </div>

      {/* Employee details */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color:MUTED }}>Employee Details</p>
        {([
          { icon:User,      label:"Employee ID", val:"ENG-2024-0042"   },
          { icon:Briefcase, label:"Manager",     val:"Lee Jian Wei"    },
          { icon:Mail,      label:"Email",       val:"ahmad@company.com"},
          { icon:Phone,     label:"Phone",       val:"+60 12-345 6789" },
        ] as { icon:React.ElementType; label:string; val:string }[]).map(({ icon:Icon, label, val })=>(
          <div key={label} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
            <Icon size={13} style={{ color:MUTED }} className="mt-0.5 shrink-0"/>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wide" style={{ color:MUTED }}>{label}</p>
              <p className="text-[12px] font-medium truncate" style={{ color:TEXT }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Training summary */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color:MUTED }}>Training Summary</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { val:String(completed.length), label:"Completed" },
            { val:`${hoursLogged}h`,         label:"Hours"     },
            { val:"3",                        label:"Certified" },
            { val:"2",                        label:"Overdue"   },
          ].map(({ val, label })=>(
            <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor:BG }}>
              <p className="text-[16px] font-extrabold" style={{ color:TEXT }}>{val}</p>
              <p className="text-[10px]" style={{ color:MUTED }}>{label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px]" style={{ color:"#6B7280" }}>Completion rate</span>
            <span className="text-[11px] font-bold" style={{ color:TEAL }}>{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full" style={{ height:5 }}>
            <div className="rounded-full" style={{ height:5, width:`${completionRate}%`, backgroundColor:TEAL }}/>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color:MUTED }}>Activity</p>
        {([
          { icon:BookOpen,  color:BLUE,   bg:"#EFF6FF", label:"Last trained", val:"15 Aug 2026" },
          { icon:Award,     color:GREEN,  bg:"#ECFDF5", label:"Latest cert",  val:"ISO 9001"   },
          { icon:TrendingUp,color:TEAL,   bg:"#E8FAF7", label:"IDP progress", val:`${idpProgress}%`    },
        ] as { icon:React.ElementType; color:string; bg:string; label:string; val:string }[]).map(({ icon:Icon, color, bg, label, val })=>(
          <div key={label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:bg }}>
              <Icon size={13} style={{ color }}/>
            </div>
            <div>
              <p className="text-[10px]" style={{ color:MUTED }}>{label}</p>
              <p className="text-[12px] font-semibold" style={{ color:TEXT }}>{val}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const TABS: { id:Tab; label:string }[] = [
  { id:"general",  label:"General Information" },
  { id:"training", label:"Training History"    },
  { id:"plan",     label:"Learning Plan"       },
  { id:"skills",   label:"Skills"              },
];

export function MyProfile() {
  const [tab, setTab] = useState<Tab>("training");

  return (
    <div className="apex-profile-page flex" style={{ height:"calc(100vh - 56px)" }}>
      <ProfilePanel/>

      <div className="apex-profile-content flex-1 flex flex-col overflow-hidden" style={{ backgroundColor:BG }}>
        {/* Tab bar */}
        <div className="apex-mobile-tabs bg-white border-b border-gray-100 px-6 flex items-end gap-0.5 shrink-0">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="px-4 py-3.5 text-[13px] font-semibold border-b-2 transition-all"
              style={ tab===t.id ? { borderColor:TEAL, color:TEAL } : { borderColor:"transparent", color:MUTED } }
              onMouseEnter={e=>{ if(tab!==t.id)(e.currentTarget as HTMLButtonElement).style.color=TEXT; }}
              onMouseLeave={e=>{ if(tab!==t.id)(e.currentTarget as HTMLButtonElement).style.color=MUTED; }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab==="general"  && <GeneralInfoTab/>}
          {tab==="training" && <TrainingHistoryTab/>}
          {tab==="plan"     && <LearningPlanTab/>}
          {tab==="skills"   && <SkillsTab/>}
        </div>
      </div>
    </div>
  );
}

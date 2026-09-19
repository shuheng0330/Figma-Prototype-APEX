import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, MapPin, Clock,
  CheckCircle, CalendarDays, LayoutList, LayoutGrid, Calendar, Plus, X,
  Printer, FileSpreadsheet, FileText, SlidersHorizontal, Trash2,
  Repeat, Sparkles, ClipboardCheck, Save, Copy,
} from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useRole, can } from "../access";
import {
  SESSIONS as STORE_SESSIONS, TEMPLATES, ROLE_IDENTITY, STAFF as STORE_STAFF,
  staffById, seatCount, addTemplate, removeTemplate, markTemplateUsed,
  useStoreVersion,
  type SessionTemplate, type SessionKind, type Topic,
} from "../trainingStore";

const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "list";
type SessionType = "physical" | "hybrid" | "online" | "sharing";

interface Session {
  id: string; title: string; date: string; time: string;
  venue: string; trainer: string; type: SessionType;
  mandatory: boolean; booked: number; capacity: number;
  /** Set when the event lives in the shared store (registration page handles it). */
  storeBacked?: boolean;
  /** Set when generated from a recurring template. */
  templateId?: string;
  description?: string;
  selfRegistration?: boolean;
  requireForm?: boolean;
  targetAudience?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_CLR = {
  physical: { solid: "#3B82F6", light: "#EFF6FF", label: "Physical" },
  hybrid:   { solid: "#8B5CF6", light: "#F5F3FF", label: "Hybrid"   },
  online:   { solid: "#F59E0B", light: "#FFFBEB", label: "Online"   },
  // Staff-led knowledge sharing is its own training category.
  sharing:  { solid: "#D97706", light: "#FFFBEB", label: "Staff Sharing" },
};

const TRAINERS: Record<string, { initials: string; color: string }> = {
  "James Tan":      { initials: "JT", color: "#3B82F6" },
  "Sarah Lim":      { initials: "SL", color: TEAL      },
  "Priya Nair":     { initials: "PN", color: "#F59E0B" },
  "Karim Abdullah": { initials: "KA", color: "#8B5CF6" },
  "Wei Ling":       { initials: "WL", color: "#EC4899" },
};

// Volunteer trainers from the shared store also need an avatar in the calendar.
STORE_STAFF.filter(st => st.isTrainer).forEach(st => {
  TRAINERS[st.name] ??= { initials: st.initials, color: st.color };
});

const TRAINER_NAMES = Object.keys(TRAINERS);

const TARGET_ROLES = [
  "All Staff",
  "Branch Manager",
  "Head of Department",
  "Retail Sales Executive",
  "Customer Service Officer",
  "Service Centre Admin",
  "Technician",
  "Sales Representative",
];

const HQ_BRANCHES = [
  "HQ — Kuala Lumpur",
  "Branch — Petaling Jaya",
  "Branch — Subang Jaya",
  "Branch — Shah Alam",
  "Branch — Klang",
  "Branch — Kajang",
  "Branch — Puchong",
  "Branch — Cheras",
  "Branch — Ampang",
  "Branch — Penang",
  "Branch — Johor Bahru",
  "Branch — Kota Kinabalu",
  "Branch — Kuching",
  "Branch — Ipoh",
  "Branch — Seremban",
];

interface Trainee {
  icNo: string; name: string; gender: string; race: string; specify?: string;
  qualification: string; designation: string; branch: string; distance: number;
}

const MOCK_TRAINEES: Trainee[] = [
  { icNo: "900115014567", name: "Ahmad Bin Yusof",           gender: "Male",   race: "Malay",   qualification: "Degree",  designation: "Retail Sales Executive", branch: "HQ — Kuala Lumpur",       distance: 12 },
  { icNo: "881203075890", name: "Tan Wei Ming",              gender: "Male",   race: "Chinese", qualification: "Diploma", designation: "Customer Service Officer", branch: "Branch — Petaling Jaya",  distance: 8  },
  { icNo: "950723076123", name: "Priya A/P Subramaniam",     gender: "Female", race: "Indian",  qualification: "Degree",  designation: "Service Centre Admin",     branch: "Branch — Subang Jaya",    distance: 15 },
  { icNo: "920514014890", name: "Nurul Ain Binti Razali",    gender: "Female", race: "Malay",   qualification: "SPM",     designation: "Retail Sales Executive",   branch: "Branch — Shah Alam",      distance: 22 },
  { icNo: "871108075456", name: "Lim Chee Keong",            gender: "Male",   race: "Chinese", qualification: "Master",  designation: "Head of Department",        branch: "HQ — Kuala Lumpur",       distance: 5  },
  { icNo: "930624044321", name: "Siti Norzahra Binti Hassan", gender: "Female", race: "Malay",  qualification: "Diploma", designation: "Customer Service Officer", branch: "Branch — Kajang",          distance: 28 },
  { icNo: "960301076789", name: "Kevin Chang Chun Wei",      gender: "Male",   race: "Chinese", qualification: "Degree",  designation: "Retail Sales Executive",   branch: "Branch — Puchong",        distance: 18 },
  { icNo: "910922014234", name: "Rajendran A/L Krishnan",    gender: "Male",   race: "Indian",  qualification: "Diploma", designation: "Service Centre Admin",     branch: "Branch — Cheras",         distance: 10 },
  { icNo: "940703012567", name: "Mohd Faizal Bin Ismail",    gender: "Male",   race: "Malay",   qualification: "Degree",  designation: "Branch Manager",           branch: "Branch — Ampang",         distance: 35 },
  { icNo: "970615076890", name: "Tan Hui Ying",              gender: "Female", race: "Chinese", qualification: "SPM",     designation: "Customer Service Officer", branch: "Branch — Klang",          distance: 20 },
  { icNo: "980220016543", name: "Amirul Haqim Bin Zulkifli", gender: "Male",   race: "Malay",   qualification: "Diploma", designation: "Retail Sales Executive",   branch: "Branch — Seremban",       distance: 44 },
  { icNo: "850930012678", name: "Wong Sook Yee",             gender: "Female", race: "Other",   specify: "Iban",          qualification: "Degree",  designation: "Head of Department", branch: "Branch — Kuching", distance: 0  },
];

const SESSIONS_SEED: Session[] = [
  { id: "S00", title: "End-of-Month Refresher",          date: "2026-08-31", time: "10:00 – 11:30", venue: "Training Room A, HQ",        trainer: "Sarah Lim",      type: "hybrid",   mandatory: false, booked: 5,  capacity: 20, description: "A recap session covering key topics from the month including safety updates, service protocols, and any procedural changes. Suitable for all staff as a knowledge refresh." },
  { id: "S01", title: "AC Installation Fundamentals",    date: "2026-08-04", time: "09:00 – 11:00", venue: "Training Room A, HQ",        trainer: "James Tan",      type: "physical", mandatory: true,  booked: 15, capacity: 20, description: "Covers the end-to-end process of residential and light-commercial AC installation, including unit mounting, piping, electrical connections, and commissioning procedures per manufacturer specifications." },
  { id: "S02", title: "Safety Procedures Refresher",     date: "2026-08-04", time: "14:00 – 16:00", venue: "Meeting Room 3, Level 5",     trainer: "Sarah Lim",      type: "hybrid",   mandatory: false, booked: 8,  capacity: 15, description: "Refreshes staff on workplace safety procedures including PPE requirements, chemical handling guidelines, emergency response protocols, and incident reporting." },
  { id: "S03", title: "Customer Service Excellence",     date: "2026-08-07", time: "10:00 – 12:00", venue: "Conference Hall B",           trainer: "Priya Nair",     type: "physical", mandatory: false, booked: 20, capacity: 20, description: "Develops front-line communication skills using the CARE framework — Courteous, Attentive, Responsive, Empathetic. Includes role-play scenarios for handling difficult customers and escalation procedures." },
  { id: "S04", title: "R32 Refrigerant Safety",          date: "2026-08-11", time: "09:00 – 12:00", venue: "Technical Lab, Level 2",      trainer: "Karim Abdullah", type: "physical", mandatory: true,  booked: 12, capacity: 18, description: "Mandatory certification for all field technicians handling R32 refrigerant. Topics include flammability properties, safe handling, leak detection, emergency procedures, and regulatory compliance under DOSH guidelines." },
  { id: "S05", title: "Digital Tools Workshop",          date: "2026-08-11", time: "14:00 – 16:30", venue: "IT Training Room",            trainer: "Wei Ling",       type: "hybrid",   mandatory: false, booked: 9,  capacity: 12, description: "Hands-on training on the company's digital tools including the service management system, job scheduling app, and digital invoicing platform. Bring your work device." },
  { id: "S06", title: "Leadership Essentials",           date: "2026-08-13", time: "09:30 – 12:30", venue: "Executive Boardroom",         trainer: "Sarah Lim",      type: "hybrid",   mandatory: false, booked: 7,  capacity: 10, description: "Designed for team leads and senior technicians stepping into supervisory roles. Covers delegation, performance feedback, conflict resolution, and leading daily briefings effectively." },
  { id: "S07", title: "Piping & Pressure Testing",       date: "2026-08-18", time: "08:00 – 11:00", venue: "Workshop Floor, Bay 3",       trainer: "James Tan",      type: "physical", mandatory: true,  booked: 14, capacity: 16, description: "Practical workshop on refrigerant piping installation, flare joints, and pressure testing procedures. Participants will perform hands-on pressure tests under supervision. Safety boots and gloves required." },
  { id: "S08", title: "Data Privacy Awareness",          date: "2026-08-18", time: "13:00 – 14:30", venue: "Online (Zoom)",               trainer: "Wei Ling",       type: "hybrid",   mandatory: false, booked: 22, capacity: 25, description: "Covers the Personal Data Protection Act 2010 obligations, data classification framework, and staff responsibilities when handling customer personal data. A Zoom link will be sent upon registration." },
  { id: "S09", title: "Electrical Wiring Certification", date: "2026-08-20", time: "09:00 – 17:00", venue: "Technical Lab, Level 2",      trainer: "Karim Abdullah", type: "physical", mandatory: true,  booked: 10, capacity: 10, description: "Full-day certification programme covering AC electrical wiring standards, cable sizing, isolator installation, and safety earth connections. Participants who pass the assessment receive a company certification." },
  { id: "S10", title: "AC Service Best Practices",       date: "2026-08-25", time: "10:00 – 12:00", venue: "Training Room A, HQ",         trainer: "James Tan",      type: "physical", mandatory: false, booked: 6,  capacity: 20, description: "Reviews best practices for preventive maintenance, filter cleaning, coil inspection, and gas top-up procedures. Recommended for all service technicians to ensure consistent service quality." },
  { id: "S11", title: "Team Communication Skills",       date: "2026-08-25", time: "14:00 – 16:00", venue: "Conference Hall B",           trainer: "Priya Nair",     type: "hybrid",   mandatory: false, booked: 11, capacity: 15, description: "Interactive session on effective workplace communication, active listening, and giving constructive feedback. Includes group exercises and peer discussion scenarios." },
  { id: "S12", title: "Advanced Troubleshooting",        date: "2026-08-27", time: "09:00 – 13:00", venue: "Technical Lab, Level 2",      trainer: "Karim Abdullah", type: "physical", mandatory: false, booked: 8,  capacity: 12, description: "In-depth half-day session on diagnosing complex AC faults including inverter board failures, refrigerant circuit issues, and error code interpretation. Targeted at experienced technicians seeking to sharpen diagnostic skills." },
  { id: "S13", title: "Q4 Safety Induction",             date: "2026-09-03", time: "09:00 – 11:00", venue: "Conference Hall A",           trainer: "Sarah Lim",      type: "physical", mandatory: true,  booked: 3,  capacity: 30, description: "Mandatory safety induction for all new hires and staff who have not completed induction in the current year. Covers fire safety, first aid basics, site hazard awareness, and emergency evacuation procedures." },
  { id: "S14", title: "Customer Onboarding Masterclass", date: "2026-09-08", time: "10:00 – 13:00", venue: "Training Room B",             trainer: "Priya Nair",     type: "hybrid",   mandatory: false, booked: 7,  capacity: 15, description: "Three-hour deep-dive into the full customer onboarding journey from first contact to handover sign-off. Includes walkthroughs of the onboarding checklist, warranty registration, and post-installation follow-up calls." },
];

// Events owned by the shared store — these route to the full registration page.
const STORE_SEED: Session[] = STORE_SESSIONS.map(s => ({
  id: s.id,
  title: s.title,
  date: s.date,
  time: s.time,
  venue: s.venue,
  trainer: staffById(s.trainerId)?.name ?? "TBC",
  type: s.kind === "Sharing Session" ? "sharing" : s.kind === "Hybrid" ? "hybrid" : "physical",
  mandatory: s.mandatory,
  booked: seatCount(s.id),
  capacity: s.capacity,
  description: s.description,
  selfRegistration: s.registrationOpen,
  requireForm: true,
  storeBacked: true,
  templateId: s.templateId,
}));

const ALL_SEED: Session[] = [...STORE_SEED, ...SESSIONS_SEED].sort((a, b) => a.date.localeCompare(b.date));

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtFull(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: Array<{ date: Date; current: boolean }> = [];
  for (let i = first.getDay(); i > 0; i--) {
    const d = new Date(first); d.setDate(d.getDate() - i);
    days.push({ date: d, current: false });
  }
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), current: true });
  let nx = 1;
  while (days.length < 42) days.push({ date: new Date(year, month + 1, nx++), current: false });
  return days;
}

function getWeekMonday(d: Date) {
  const r = new Date(d);
  const dow = r.getDay();
  r.setDate(r.getDate() - (dow === 0 ? 6 : dow - 1));
  return r;
}

const TODAY = toISO(new Date());

// ── Date Picker ───────────────────────────────────────────────────────────────
const DOW_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({
  value, onChange, placeholder = "Select date", className = "",
}: {
  value: string; onChange: (iso: string) => void; placeholder?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    if (value) return new Date(value + "T00:00:00");
    const d = new Date(); d.setDate(1); return d;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const days = useMemo(() => getCalendarDays(view.getFullYear(), view.getMonth()), [view]);

  const select = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (value) setView(new Date(value + "T00:00:00"));
          setOpen(o => !o);
        }}
        className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-left focus:outline-none focus:border-[#00C9A7] transition-colors hover:border-gray-300 bg-white"
      >
        <CalendarDays size={14} className="shrink-0" style={{ color: value ? TEAL : "#9CA3AF" }} />
        <span style={{ color: value ? "#1A1F2E" : "#9CA3AF" }}>{displayValue || placeholder}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 bg-white rounded-xl overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)", minWidth: 280, left: 0 }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={14} className="text-[#6B7280]" />
            </button>
            <span className="text-[13px] font-bold text-[#1A1F2E]">
              {view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={14} className="text-[#6B7280]" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DOW_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-[#9CA3AF] pb-1">{d}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {days.map(({ date, current }, i) => {
              const iso = toISO(date);
              const isSelected = iso === value;
              const isToday = iso === TODAY;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => current && select(date)}
                  className="h-8 w-full flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    backgroundColor: isSelected ? TEAL : "transparent",
                    color: isSelected ? "white" : !current ? "#D1D5DB" : isToday ? TEAL : "#374151",
                    fontWeight: isToday && !isSelected ? 700 : undefined,
                    cursor: current ? "pointer" : "default",
                  }}
                  onMouseEnter={e => {
                    if (current && !isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F0FDF9";
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
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

// ── Create Training Session Modal ─────────────────────────────────────────────
function CreateSessionModal({ onClose, onSave, prefill }: {
  onClose: () => void;
  onSave: (s: Session, saveAs?: { name: string; fromTemplateId?: string }) => void;
  /** Set when the form was opened from a saved template — date and time stay blank. */
  prefill?: SessionTemplate;
}) {
  const kindToType = (k: SessionKind): SessionType =>
    k === "Sharing Session" ? "sharing" : k === "Hybrid" ? "hybrid" : "physical";

  const [title, setTitle]           = useState(prefill?.name ?? "");
  const [description, setDesc]      = useState(prefill?.description ?? "");
  const [type, setType]             = useState<SessionType>(prefill ? kindToType(prefill.kind) : "physical");
  const [date, setDate]             = useState("");
  const [timeFrom, setTimeFrom]     = useState(prefill?.time?.split(" – ")[0] ?? "");
  const [timeTo, setTimeTo]         = useState(prefill?.time?.split(" – ")[1] ?? "");
  const [venue, setVenue]           = useState(prefill?.venue ?? "");
  const [trainer, setTrainer]       = useState(prefill?.trainerName ?? "");
  const [capacity, setCapacity]     = useState(prefill?.capacity ?? 20);
  const [mandatory, setMandatory]   = useState(prefill?.mandatory ?? false);
  const [audience, setAudience]     = useState<string[]>(prefill?.targetAudience ?? []);
  const [selfReg, setSelfReg]       = useState(prefill?.selfRegistration ?? true);
  const [requireForm, setRequireForm] = useState(prefill?.requireForm ?? false);

  // Save-as-template — the setup is kept for the next time this training runs.
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const toggleAudience = (role: string) => {
    if (role === "All Staff") {
      setAudience(prev => prev.includes("All Staff") ? [] : ["All Staff"]);
    } else {
      setAudience(prev => {
        const base = prev.filter(r => r !== "All Staff");
        return base.includes(role) ? base.filter(r => r !== role) : [...base, role];
      });
    }
  };

  const canSubmit = title.trim() && date && timeFrom && timeTo && trainer.trim() &&
    (type === "online" || venue.trim());

  const handleSave = () => {
    if (!canSubmit) return;
    onSave({
      id: `S${Date.now()}`,
      title: title.trim(),
      date,
      time: `${timeFrom} – ${timeTo}`,
      venue: venue.trim() || (type === "online" ? "Online" : ""),
      trainer: trainer.trim(),
      type,
      mandatory,
      booked: 0,
      capacity: Math.max(1, capacity),
      description: description.trim() || undefined,
      selfRegistration: selfReg,
      requireForm,
      targetAudience: audience.length ? audience : undefined,
      templateId: prefill?.id,
    },
    saveTemplate ? { name: (templateName.trim() || title.trim()), fromTemplateId: prefill?.id } : undefined);
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7] transition-colors";
  const sectionLabel = (text: string) => (
    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">{text}</p>
  );
  const fieldLabel = (text: string, required = false) => (
    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-[580px] max-h-[92vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A1F2E]">Create Training Session</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Physical, hybrid, online, or a staff-led sharing session</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-6">

          {/* Opened from a saved template */}
          {prefill && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ backgroundColor: "#F0FDFA" }}>
              <Copy size={14} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
              <p className="text-[12px] leading-relaxed" style={{ color: "#065F46" }}>
                Using template <b>{prefill.name}</b> — details carried over from the last run
                ({prefill.uses} time{prefill.uses === 1 ? "" : "s"} so far). Set the new date and time below;
                everything else can still be edited.
              </p>
            </div>
          )}

          {/* ── Session Details ── */}
          <div>
            {sectionLabel("Session Details")}
            <div className="space-y-3">

              {/* Title */}
              <div>
                {fieldLabel("Session Title", true)}
                <input
                  type="text"
                  placeholder="e.g. AC Installation Fundamentals"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                {fieldLabel("Description")}
                <textarea
                  rows={2}
                  placeholder="Brief overview of objectives and content…"
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Type pills */}
              <div>
                {fieldLabel("Session Type", true)}
                <div className="flex gap-2">
                  {(["physical", "hybrid", "online", "sharing"] as SessionType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold border-2 transition-all"
                      style={type === t
                        ? { borderColor: TYPE_CLR[t].solid, backgroundColor: TYPE_CLR[t].light, color: TYPE_CLR[t].solid }
                        : { borderColor: "#E5E7EB", color: "#9CA3AF" }}
                    >
                      {TYPE_CLR[t].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Schedule & Location ── */}
          <div>
            {sectionLabel("Schedule & Location")}
            <div className="space-y-3">

              {/* Date */}
              <div>
                {fieldLabel("Date", true)}
                <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
              </div>

              {/* Start / End time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  {fieldLabel("Start Time", true)}
                  <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  {fieldLabel("End Time", true)}
                  <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Venue */}
              <div>
                {fieldLabel(type === "online" ? "Venue / Meeting Link" : "Venue", type !== "online")}
                <input
                  type="text"
                  placeholder={type === "online"
                    ? "e.g. Zoom — link will be shared via email"
                    : "e.g. Training Room A, HQ"}
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Capacity & Trainer ── */}
          <div>
            {sectionLabel("Capacity & Trainer")}
            <div className="grid grid-cols-2 gap-3">

              {/* Trainer — typed in by hand, may be an external facilitator */}
              <div>
                {fieldLabel("Trainer / Facilitator", true)}
                <input
                  type="text"
                  list="apex-trainer-suggestions"
                  placeholder="e.g. Sarah Lim, or an external facilitator"
                  value={trainer}
                  onChange={e => setTrainer(e.target.value)}
                  className={inputCls}
                />
                <datalist id="apex-trainer-suggestions">
                  {TRAINER_NAMES.map(t => <option key={t} value={t} />)}
                </datalist>
                <p className="text-[11px] text-[#C4C9D4] mt-1">
                  Type any name — internal staff are suggested as you type.
                </p>
              </div>

              {/* Capacity */}
              <div>
                {fieldLabel("Capacity")}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCapacity(c => Math.max(1, c - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:border-gray-300 font-bold transition-colors"
                  >−</button>
                  <input
                    type="number" min={1} value={capacity}
                    onChange={e => setCapacity(parseInt(e.target.value) || 1)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-[13px] text-center font-semibold text-[#1A1F2E] focus:outline-none focus:border-[#00C9A7] transition-colors"
                  />
                  <button
                    onClick={() => setCapacity(c => c + 1)}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-[#6B7280] hover:border-gray-300 font-bold transition-colors"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Mandatory toggle pill */}
            <div className="mt-3">
              <button
                onClick={() => setMandatory(m => !m)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all"
                style={mandatory
                  ? { borderColor: "#DC2626", backgroundColor: "#FEF2F2", color: "#DC2626" }
                  : { borderColor: "#E5E7EB", color: "#9CA3AF" }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: mandatory ? "#DC2626" : "#D1D5DB" }}
                >
                  {mandatory && <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />}
                </span>
                Mark as mandatory attendance
              </button>
            </div>
          </div>

          {/* ── Target Audience ── */}
          <div>
            {sectionLabel("Target Audience")}
            <div className="flex flex-wrap gap-2">
              {TARGET_ROLES.map(role => {
                const active = audience.includes(role) ||
                  (audience.includes("All Staff") && role !== "All Staff");
                return (
                  <button
                    key={role}
                    onClick={() => toggleAudience(role)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all"
                    style={active
                      ? { borderColor: TEAL, backgroundColor: "#ECFDF5", color: "#059669" }
                      : { borderColor: "#E5E7EB", color: "#6B7280" }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
            {audience.length === 0 && (
              <p className="text-[11px] text-[#C4C9D4] mt-2">
                No selection — session open to all roles by default
              </p>
            )}
          </div>

          {/* ── Registration Settings ── */}
          <div>
            {sectionLabel("Registration Settings")}
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ backgroundColor: "#F9FAFB" }}>

              {/* Self-registration */}
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => setSelfReg(s => !s)}
                  className="relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5"
                  style={{ backgroundColor: selfReg ? TEAL : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150"
                    style={{ left: selfReg ? 22 : 2 }}
                  />
                </button>
                <div>
                  <p className="text-[12px] font-semibold text-[#1A1F2E]">Open for staff self-registration</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Staff can register from the Learning Portal or Training Calendar
                  </p>
                </div>
              </div>

              {/* Require registration form */}
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => setRequireForm(r => !r)}
                  className="relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5"
                  style={{ backgroundColor: requireForm ? TEAL : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150"
                    style={{ left: requireForm ? 22 : 2 }}
                  />
                </button>
                <div>
                  <p className="text-[12px] font-semibold text-[#1A1F2E]">Require trainee registration form</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Staff fill in IC, Name, Gender, Race, Qualification, Designation, HQ/Branch &amp; Distance at registration — enables HR training report
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Save as reusable template ── */}
          <div>
            {sectionLabel("Reuse This Setup")}
            <div className="rounded-xl border overflow-hidden"
              style={{ borderColor: saveTemplate ? TEAL : "#F3F4F6", backgroundColor: saveTemplate ? "#F0FDFA" : "#F9FAFB" }}>
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => setSaveTemplate(v => !v)}
                  className="relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5"
                  style={{ backgroundColor: saveTemplate ? TEAL : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150"
                    style={{ left: saveTemplate ? 22 : 2 }}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#1A1F2E]">Save as a reusable template</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    Keeps the title, type, venue, trainer, capacity and registration settings. Next time this
                    training runs, pick the template and just set a new date and time.
                  </p>

                  {saveTemplate && (
                    <div className="mt-3">
                      {fieldLabel("Template name")}
                      <input
                        type="text"
                        placeholder={title.trim() || "e.g. New Hire Safety Induction"}
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        className={inputCls}
                      />
                      <p className="text-[11px] text-[#C4C9D4] mt-1">
                        Leave blank to use the session title. The date and time are not saved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#6B7280] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-all"
            style={{ backgroundColor: canSubmit ? TEAL : "#D1D5DB", cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            {saveTemplate ? "Create & Save Template" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Register for Training Modal ───────────────────────────────────────────────
function RegisterModal({
  session, onClose, onConfirm,
}: {
  session: Session;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const prefillName = localStorage.getItem("userName") || "";

  const [icNo, setIcNo]           = useState("");
  const [name, setName]           = useState(prefillName);
  const [gender, setGender]       = useState("");
  const [race, setRace]           = useState("");
  const [specify, setSpecify]     = useState("");
  const [qual, setQual]           = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch]       = useState("");
  const [distance, setDistance]   = useState("");
  const [submitted, setSubmitted] = useState(false);

  const needSpecify = race === "Other";

  const isValid =
    icNo.trim() &&
    name.trim() &&
    gender &&
    race &&
    (!needSpecify || specify.trim()) &&
    qual &&
    designation.trim() &&
    branch &&
    distance !== "";

  function handleConfirm() {
    setSubmitted(true);
    if (!isValid) return;
    onConfirm();
  }

  const inputCls = (err: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-[13px] text-[#1A1F2E] focus:outline-none transition-colors ${
      err ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#00C9A7]"
    }`;

  const selectCls = (err: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-[13px] text-[#1A1F2E] focus:outline-none transition-colors bg-white appearance-none ${
      err ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#00C9A7]"
    }`;

  const label = (text: string, required = true) => (
    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const errMsg = (show: boolean) =>
    show ? <p className="text-[11px] text-red-500 mt-1">This field is required</p> : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="bg-white rounded-2xl w-[520px] max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2 className="text-[16px] font-bold text-[#1A1F2E]">Register for Training</h2>
            <p className="text-[13px] font-semibold text-[#374151] mt-1.5">{session.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                <CalendarDays size={11} className="shrink-0" />
                {fmtFull(session.date)} · {session.time}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                <MapPin size={11} className="shrink-0" />
                {session.venue}
              </span>
            </div>
            {session.description && (
              <p className="text-[12px] text-[#374151] leading-relaxed mt-3 pt-3 border-t border-gray-100">
                {session.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* IC No. */}
          <div>
            {label("IC No.")}
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 900101011234"
              value={icNo}
              onChange={e => setIcNo(e.target.value.replace(/\D/g, ""))}
              className={inputCls(submitted && !icNo.trim())}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">Enter without the &apos;-&apos; symbol</p>
            {errMsg(submitted && !icNo.trim())}
          </div>

          {/* Name */}
          <div>
            {label("Name")}
            <input
              type="text"
              placeholder="Full name as per IC"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls(submitted && !name.trim())}
            />
            {errMsg(submitted && !name.trim())}
          </div>

          {/* Gender + Race row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {label("Gender")}
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className={selectCls(submitted && !gender)}
              >
                <option value="">Select...</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              {errMsg(submitted && !gender)}
            </div>
            <div>
              {label("Race")}
              <select
                value={race}
                onChange={e => { setRace(e.target.value); setSpecify(""); }}
                className={selectCls(submitted && !race)}
              >
                <option value="">Select...</option>
                <option>Malay</option>
                <option>Chinese</option>
                <option>Indian</option>
                <option>Other</option>
              </select>
              {errMsg(submitted && !race)}
            </div>
          </div>

          {/* Specify — conditional */}
          {needSpecify && (
            <div>
              {label("Specify Race")}
              <input
                type="text"
                placeholder="Please specify your race"
                value={specify}
                onChange={e => setSpecify(e.target.value)}
                className={inputCls(submitted && !specify.trim())}
              />
              {errMsg(submitted && !specify.trim())}
            </div>
          )}

          {/* Academic Qualification */}
          <div>
            {label("Academic Qualification")}
            <select
              value={qual}
              onChange={e => setQual(e.target.value)}
              className={selectCls(submitted && !qual)}
            >
              <option value="">Select...</option>
              <option>SPM</option>
              <option>Diploma</option>
              <option>Degree</option>
              <option>Master</option>
              <option>PhD</option>
              <option>Other</option>
            </select>
            {errMsg(submitted && !qual)}
          </div>

          {/* Trainee Designation */}
          <div>
            {label("Trainee Designation")}
            <input
              type="text"
              placeholder="e.g. Retail Sales Executive"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              className={inputCls(submitted && !designation.trim())}
            />
            {errMsg(submitted && !designation.trim())}
          </div>

          {/* HQ / Branch */}
          <div>
            {label("HQ / Branch")}
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className={selectCls(submitted && !branch)}
            >
              <option value="">Select branch...</option>
              {HQ_BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
            {errMsg(submitted && !branch)}
          </div>

          {/* Distance to Training */}
          <div>
            {label("Distance to Training")}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="0"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className={`flex-1 border rounded-lg px-3 py-2 text-[13px] text-[#1A1F2E] focus:outline-none transition-colors ${
                  submitted && distance === "" ? "border-red-400" : "border-gray-200 focus:border-[#00C9A7]"
                }`}
              />
              <span className="text-[13px] text-[#6B7280] font-medium shrink-0">km</span>
            </div>
            {errMsg(submitted && distance === "")}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#6B7280] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            Confirm Registration
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report column definitions ─────────────────────────────────────────────────
type ColKey = "icNo" | "name" | "gender" | "race" | "specify" | "qualification" | "designation" | "branch" | "distance";

const COL_DEFS: { key: ColKey; label: string }[] = [
  { key: "icNo",          label: "IC No."         },
  { key: "name",          label: "Name"           },
  { key: "gender",        label: "Gender"         },
  { key: "race",          label: "Race"           },
  { key: "specify",       label: "Specify"        },
  { key: "qualification", label: "Academic Qual." },
  { key: "designation",   label: "Designation"    },
  { key: "branch",        label: "HQ / Branch"    },
  { key: "distance",      label: "Dist. (km)"     },
];

function traineeCell(t: Trainee, key: ColKey): string {
  if (key === "icNo")          return t.icNo;
  if (key === "name")          return t.name;
  if (key === "gender")        return t.gender;
  if (key === "race")          return t.race;
  if (key === "specify")       return t.specify || "—";
  if (key === "qualification") return t.qualification;
  if (key === "designation")   return t.designation;
  if (key === "branch")        return t.branch;
  if (key === "distance")      return String(t.distance);
  return "";
}

// ── Training Report Overlay ───────────────────────────────────────────────────
function TrainingReportOverlay({ session, onClose }: { session: Session; onClose: () => void }) {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const [activeCols, setActiveCols] = useState<Set<ColKey>>(new Set(COL_DEFS.map(c => c.key)));
  const [showConfig, setShowConfig] = useState(false);

  const visibleCols = COL_DEFS.filter(c => activeCols.has(c.key));

  const toggleCol = (key: ColKey) =>
    setActiveCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const thCls = "border border-gray-400 px-2 py-1.5 text-left font-bold text-white bg-[#1A1F2E] whitespace-nowrap";
  const tdCls = (alt: boolean) =>
    `border border-gray-300 px-2 py-1.5 align-top ${alt ? "bg-gray-50" : "bg-white"}`;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #training-report-doc, #training-report-doc * { visibility: visible !important; }
          #training-report-doc {
            position: fixed !important;
            top: 0; left: 0; right: 0;
            background: white !important;
            box-shadow: none !important;
            padding: 32px 40px !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>

      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[60] bg-[#F4F6F9] flex flex-col overflow-hidden">

        {/* Top bar — hidden when printing */}
        <div className="apex-calendar-toolbar bg-white border-b border-gray-100 px-6 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-[#6B7280]" />
            </button>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1F2E]">Training Report</h2>
              <p className="text-[11px] text-[#9CA3AF]">{session.title} · {fmtShort(session.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Column configurator */}
            <div className="relative">
              <button
                onClick={() => setShowConfig(c => !c)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors"
                style={showConfig
                  ? { borderColor: TEAL, color: TEAL, backgroundColor: "#ECFDF5" }
                  : { borderColor: "#E5E7EB", color: "#6B7280" }}
              >
                <SlidersHorizontal size={13} />
                Columns
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: activeCols.size === COL_DEFS.length ? "#F3F4F6" : "#ECFDF5", color: activeCols.size === COL_DEFS.length ? "#9CA3AF" : "#059669" }}
                >
                  {activeCols.size}/{COL_DEFS.length}
                </span>
              </button>

              {showConfig && (
                <div
                  className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200 z-20 overflow-hidden"
                  style={{ width: 210, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                >
                  <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Visible Columns</p>
                  </div>
                  <div className="py-1.5">
                    {COL_DEFS.map(col => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <span
                          className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            borderColor: activeCols.has(col.key) ? TEAL : "#D1D5DB",
                            backgroundColor: activeCols.has(col.key) ? TEAL : "white",
                          }}
                          onClick={() => toggleCol(col.key)}
                        >
                          {activeCols.has(col.key) && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[12px] text-[#374151]" onClick={() => toggleCol(col.key)}>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => setActiveCols(new Set(COL_DEFS.map(c => c.key)))}
                      className="flex-1 py-1 rounded-lg text-[10px] font-bold text-[#6B7280] border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveCols(new Set())}
                      className="flex-1 py-1 rounded-lg text-[10px] font-bold text-[#6B7280] border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowConfig(false); window.print(); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              <Printer size={13} /> Print
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-[#6B7280] hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet size={13} /> Export to Excel
            </button>
          </div>
        </div>

        {/* Scrollable document area */}
        <div className="flex-1 overflow-y-auto py-8 px-6 flex justify-center">
          {/* A4 document */}
          <div
            id="training-report-doc"
            className="bg-white"
            style={{
              width: 794,
              minHeight: 1123,
              padding: "48px 52px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            {/* ── Document header ── */}
            <div className="flex items-start justify-between pb-5 mb-6" style={{ borderBottom: "2px solid #1A1F2E" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1F2E", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>
                  TRAINING ATTENDANCE REPORT
                </div>
                <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4, fontFamily: "sans-serif" }}>
                  Generated: {today}
                </div>
              </div>
              <div />
            </div>

            {/* ── Session details ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 24, fontFamily: "sans-serif" }}>
              <tbody>
                {[
                  ["Training Title",   session.title],
                  ["Date",             fmtFull(session.date)],
                  ["Time",             session.time],
                  ["Venue",            session.venue],
                  ["Trainer / Facilitator", session.trainer],
                  ["Total Trainees",   String(MOCK_TRAINEES.length)],
                ].map(([lbl, val], i) => (
                  <tr key={i}>
                    <td style={{ padding: "4px 12px 4px 0", fontWeight: 700, color: "#374151", width: 180, verticalAlign: "top", whiteSpace: "nowrap" }}>
                      {lbl}
                    </td>
                    <td style={{ padding: "4px 0", color: "#1A1F2E" }}>: {val}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Trainee table ── */}
            {visibleCols.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#9CA3AF", fontSize: 12, fontFamily: "sans-serif" }}>
                No columns selected — use the Columns button to show data.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "sans-serif", tableLayout: "auto" }}>
                <thead>
                  <tr>
                    <th className={thCls} style={{ fontSize: 10, width: 28, textAlign: "center" }}>No.</th>
                    {visibleCols.map(col => (
                      <th key={col.key} className={thCls} style={{ fontSize: 10 }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRAINEES.map((t, i) => {
                    const alt = i % 2 === 1;
                    return (
                      <tr key={i}>
                        <td className={tdCls(alt)} style={{ fontSize: 10, textAlign: "center" }}>{i + 1}</td>
                        {visibleCols.map(col => (
                          <td
                            key={col.key}
                            className={tdCls(alt)}
                            style={{
                              fontSize: 10,
                              textAlign: col.key === "distance" ? "center" : "left",
                              color: col.key === "specify" && !t.specify ? "#9CA3AF" : "#1A1F2E",
                            }}
                          >
                            {traineeCell(t, col.key)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── Signature block ── */}
            <div style={{ marginTop: 48, borderTop: "1px solid #D1D5DB", paddingTop: 20, display: "flex", gap: 0, fontFamily: "sans-serif" }}>
              {["Prepared By", "Verified By", "Approved By"].map((role, i) => (
                <div key={i} style={{ flex: 1, paddingRight: i < 2 ? 32 : 0 }}>
                  <div style={{ height: 48, borderBottom: "1px solid #374151", marginBottom: 6 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{role}</div>
                  <div style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>Name &amp; Signature / Date</div>
                </div>
              ))}
            </div>

            {/* ── Footer note ── */}
            <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #E5E7EB", fontSize: 9, color: "#9CA3AF", fontFamily: "sans-serif" }}>
              This is a computer-generated document. · Confidential
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Session card (right panel) ────────────────────────────────────────────────
function SessionCard({
  session, booked, waitlisted, localBooked, onRegister, onWaitlist, onCancel, onReport, canReport, onDelete, canDelete,
}: {
  session: Session; booked: Set<string>; waitlisted: Set<string>;
  localBooked: Record<string, number>;
  onRegister: (session: Session) => void; onWaitlist: (id: string) => void; onCancel: (id: string) => void;
  onReport: (session: Session) => void; canReport: boolean;
  onDelete: (id: string) => void; canDelete: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const s = session;
  const clr = TYPE_CLR[s.type];
  const trainer = TRAINERS[s.trainer];
  const currentBooked = localBooked[s.id] ?? s.booked;
  const isFull      = currentBooked >= s.capacity;
  const isBooked    = booked.has(s.id);
  const isWaiting   = waitlisted.has(s.id);
  const spotsLeft   = s.capacity - currentBooked;
  const fillPct     = Math.min((currentBooked / s.capacity) * 100, 100);
  const barColor    = fillPct >= 100 ? "#EF4444" : fillPct >= 80 ? "#F59E0B" : "#10B981";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: clr.solid }} />
        <div className="flex-1 p-4">
          <div className="flex items-start gap-2 mb-3">
            <p className="text-[13px] font-bold text-[#1A1F2E] flex-1 leading-snug">{s.title}</p>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: clr.solid }}>
                {clr.label}
              </span>
              {s.mandatory && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626]">Required</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <Clock size={11} className="shrink-0" /> {s.time}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <MapPin size={11} className="shrink-0" /> {s.venue}
            </div>
            {trainer && (
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: trainer.color }}
                >
                  {trainer.initials}
                </div>
                <span className="text-[11px] text-[#6B7280]">{s.trainer}</span>
              </div>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#6B7280]">
                {currentBooked} / {s.capacity} booked · {isFull ? "0" : spotsLeft} spots left
              </span>
              <span className="text-[10px] font-bold" style={{ color: barColor }}>
                {Math.round(fillPct)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full" style={{ height: 5 }}>
              <div className="rounded-full transition-all duration-300" style={{ width: `${fillPct}%`, height: 5, backgroundColor: barColor }} />
            </div>
          </div>

          {isBooked ? (
            <button
              onClick={() => onCancel(s.id)}
              className="w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border-2 transition-colors hover:bg-[#ECFDF5]"
              style={{ color: "#059669", borderColor: "#059669" }}
            >
              <CheckCircle size={12} /> Booked — Cancel
            </button>
          ) : isFull ? (
            <button
              onClick={() => !isWaiting && onWaitlist(s.id)}
              className="w-full py-2 rounded-lg text-[11px] font-semibold text-white transition-colors"
              style={{ backgroundColor: isWaiting ? "#6B7280" : "#9CA3AF", cursor: isWaiting ? "default" : "pointer" }}
            >
              {isWaiting ? "On Waitlist" : "Full — Join Waitlist"}
            </button>
          ) : (
            <button
              onClick={() => onRegister(s)}
              className="w-full py-2 rounded-lg text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Register
            </button>
          )}

          {/* Generate Report — trainer / admin / HR only */}
          {canReport && (
            <button
              onClick={() => onReport(s)}
              className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 border border-dashed border-gray-300 text-[#6B7280] hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors"
            >
              <FileText size={11} /> Generate Report
            </button>
          )}

          {/* Delete session — non-staff only */}
          {canDelete && (
            confirmDelete ? (
              <div className="mt-2 rounded-lg p-2.5 flex items-center justify-between gap-2" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                <span className="text-[10px] font-semibold text-[#DC2626]">Delete this session?</span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onDelete(s.id)}
                    className="px-2.5 py-1 rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold text-[#6B7280] bg-white border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 border border-dashed border-gray-200 text-[#9CA3AF] hover:border-red-300 hover:text-[#DC2626] transition-colors"
              >
                <Trash2 size={11} /> Delete Session
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sessions panel (right sidebar) ────────────────────────────────────────────
function SessionsPanel({
  sessions, selectedDate, booked, waitlisted, localBooked, onRegister, onWaitlist, onCancel, onReport, canReport, onDelete, canDelete,
}: {
  sessions: Session[]; selectedDate: string; booked: Set<string>; waitlisted: Set<string>;
  localBooked: Record<string, number>;
  onRegister: (session: Session) => void; onWaitlist: (id: string) => void; onCancel: (id: string) => void;
  onReport: (session: Session) => void; canReport: boolean;
  onDelete: (id: string) => void; canDelete: boolean;
}) {
  return (
    <aside className="apex-calendar-sessions w-[304px] shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 shrink-0">
        <p className="text-[13px] font-bold text-[#1A1F2E] truncate">{fmtFull(selectedDate)}</p>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
          {sessions.length === 0 ? "No sessions scheduled" : `${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-12">
            <CalendarDays size={36} className="mb-3" style={{ color: "#E5E7EB" }} />
            <p className="text-[13px] font-semibold text-[#9CA3AF]">No sessions today</p>
            <p className="text-[11px] text-[#C4C9D4] mt-1">Select another date to browse sessions</p>
          </div>
        ) : (
          sessions.map(s => (
            <SessionCard key={s.id} session={s} booked={booked} waitlisted={waitlisted} localBooked={localBooked} onRegister={onRegister} onWaitlist={onWaitlist} onCancel={onCancel} onReport={onReport} canReport={canReport} onDelete={onDelete} canDelete={canDelete} />
          ))
        )}
      </div>
    </aside>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthView({
  year, month, sessions, selectedDate, onSelectDate,
}: {
  year: number; month: number; sessions: Session[]; selectedDate: string; onSelectDate: (d: string) => void;
}) {
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DOW.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map(({ date, current }) => {
          const iso = toISO(date);
          const daySessions = sessions.filter(s => s.date === iso);
          const isToday    = iso === TODAY;
          const isSelected = iso === selectedDate;

          return (
            <div
              key={iso}
              onClick={() => onSelectDate(iso)}
              className="border-r border-b border-gray-50 p-2 cursor-pointer transition-colors"
              style={{
                minHeight: 100,
                backgroundColor: isSelected ? "#E8FAF7" : undefined,
                opacity: current ? 1 : 0.35,
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isSelected ? "#E8FAF7" : ""; }}
            >
              <div className="mb-1.5">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold"
                  style={isToday
                    ? { backgroundColor: TEAL, color: "white" }
                    : isSelected
                    ? { color: TEAL }
                    : { color: "#374151" }}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="space-y-0.5">
                {daySessions.slice(0, 2).map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 px-1.5 py-[2px] rounded text-white overflow-hidden"
                    style={{ backgroundColor: TYPE_CLR[s.type].solid, fontSize: 9 }}
                  >
                    {s.mandatory && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0" />
                    )}
                    <span className="truncate font-semibold">{s.title}</span>
                  </div>
                ))}
                {daySessions.length > 2 && (
                  <p className="text-[9px] text-[#9CA3AF] pl-1">+{daySessions.length - 2} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────
function WeekView({
  anchorDate, sessions, selectedDate, onSelectDate,
}: {
  anchorDate: Date; sessions: Session[]; selectedDate: string; onSelectDate: (d: string) => void;
}) {
  const monday = getWeekMonday(anchorDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d;
  });

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {weekDays.map(day => {
          const iso = toISO(day);
          const daySessions = sessions.filter(s => s.date === iso);
          const isToday    = iso === TODAY;
          const isSelected = iso === selectedDate;

          return (
            <div key={iso} className="flex flex-col" style={{ minHeight: 320 }}>
              <div
                onClick={() => onSelectDate(iso)}
                className="text-center py-3 border-b border-gray-100 cursor-pointer shrink-0"
                style={{ backgroundColor: isSelected ? "#E8FAF7" : undefined }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isSelected ? TEAL : "#9CA3AF" }}>
                  {day.toLocaleDateString("en", { weekday: "short" })}
                </p>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-[14px] font-extrabold"
                  style={isToday
                    ? { backgroundColor: TEAL, color: "white" }
                    : isSelected
                    ? { color: TEAL }
                    : { color: "#1A1F2E" }}
                >
                  {day.getDate()}
                </div>
              </div>

              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                {daySessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => onSelectDate(iso)}
                    className="rounded-lg p-2 cursor-pointer"
                    style={{
                      backgroundColor: TYPE_CLR[s.type].light,
                      borderLeft: `3px solid ${TYPE_CLR[s.type].solid}`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {s.mandatory && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      <p
                        className="text-[10px] font-bold leading-tight truncate"
                        style={{ color: TYPE_CLR[s.type].solid }}
                      >
                        {s.title}
                      </p>
                    </div>
                    <p className="text-[9px] text-[#9CA3AF]">{s.time}</p>
                  </div>
                ))}
                {daySessions.length === 0 && (
                  <div className="h-full flex items-start justify-center pt-6">
                    <span style={{ color: "#E5E7EB", fontSize: 20 }}>–</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({
  sessions, selectedDate, onSelectDate,
}: {
  sessions: Session[]; selectedDate: string; onSelectDate: (d: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  return (
    <div className="space-y-5">
      {grouped.map(([date, daySessions]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-2.5">
            <span
              className="text-[12px] font-bold px-2 py-0.5 rounded-full"
              style={date === TODAY ? { backgroundColor: TEAL, color: "white" } : { color: "#6B7280" }}
            >
              {fmtShort(date)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-2">
            {daySessions.map(s => {
              const clr = TYPE_CLR[s.type];
              const isFull = s.booked >= s.capacity;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectDate(date)}
                  className="bg-white rounded-xl flex items-stretch overflow-hidden cursor-pointer transition-shadow hover:shadow-md border border-gray-100"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="w-1 shrink-0" style={{ backgroundColor: clr.solid }} />
                  <div className="flex flex-1 items-center gap-4 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-[13px] font-bold text-[#1A1F2E]">{s.title}</p>
                        {s.mandatory && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full shrink-0">Required</span>}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: clr.solid }}>{clr.label}</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] truncate">{s.time} · {s.venue} · {s.trainer}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold" style={{ color: isFull ? "#EF4444" : "#059669" }}>
                        {isFull ? "Full" : `${s.capacity - s.booked} left`}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">{s.booked} / {s.capacity}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// ── Saved session templates ───────────────────────────────────────────────────
function TemplatesModal({ onClose, onUse }: {
  onClose: () => void;
  onUse: (t: SessionTemplate) => void;
}) {
  useStoreVersion();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-[720px] max-h-[86vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Repeat size={15} style={{ color: TEAL }} />
              <h2 className="text-[15px] font-extrabold text-[#1A1F2E]">Saved session templates</h2>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              Setups saved while creating a session. Pick one to run the same training again on a new date.
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1F2E]"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2.5">
          {TEMPLATES.map(t => (
            <div key={t.id} className="rounded-xl border border-gray-200 px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[13px] font-bold text-[#1A1F2E]">{t.name}</p>
                    {t.kind === "Sharing Session" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                        <Sparkles size={8} /> Staff sharing
                      </span>
                    )}
                    {t.mandatory && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-[#DC2626]">Required</span>
                    )}
                    {t.requireForm && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                        HRDC form
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    {t.kind} · {t.time} · {t.venue} · cap {t.capacity}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Trainer: <b>{t.trainerName}</b>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">
                    Saved by {staffById(t.createdBy)?.name ?? "—"} on {fmtShort(t.createdOn)} ·
                    used {t.uses} time{t.uses === 1 ? "" : "s"}{t.lastUsed ? ` · last ${fmtShort(t.lastUsed)}` : ""}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => onUse(t)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: TEAL }}
                  >
                    <Copy size={11} /> Use template
                  </button>
                  {confirmId === t.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { removeTemplate(t.id); setConfirmId(null); }}
                        className="px-2 py-1 rounded text-[10px] font-bold text-white" style={{ backgroundColor: "#DC2626" }}>
                        Delete
                      </button>
                      <button onClick={() => setConfirmId(null)}
                        className="px-2 py-1 rounded text-[10px] font-semibold text-[#6B7280] border border-gray-200">
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(t.id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#9CA3AF] hover:text-[#DC2626] transition-colors">
                      <Trash2 size={10} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!TEMPLATES.length && (
            <div className="py-10 text-center">
              <Repeat size={26} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-[13px] font-semibold text-[#9CA3AF]">No templates saved yet</p>
              <p className="text-[11px] text-[#C4C9D4] mt-1">
                Tick "Save as a reusable template" when creating a session.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-[#9CA3AF]">
            Date and time are never saved — you set them each time the training runs.
          </p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-[#6B7280]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrainingCalendar() {
  const navigate    = useNavigate();
  const userRole    = useRole();
  useStoreVersion();
  const canCreate   = can(userRole, "session-setup");
  const canReport   = can(userRole, "attendance");
  const canDelete   = can(userRole, "session-setup");
  const myId        = ROLE_IDENTITY[userRole] ?? "E013";

  const [viewMode, setViewMode]         = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate]     = useState(new Date(2026, 7, 1)); // Aug 2026
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [userBooked, setUserBooked]     = useState<Set<string>>(new Set());
  const [userWaiting, setUserWaiting]   = useState<Set<string>>(new Set());
  const [sessions, setSessions]         = useState<Session[]>(ALL_SEED);
  const [localBooked, setLocalBooked]   = useState<Record<string, number>>(
    Object.fromEntries(ALL_SEED.map(s => [s.id, s.booked]))
  );
  const [showTemplates, setShowTemplates] = useState(false);
  const [templatePrefill, setTemplatePrefill] = useState<SessionTemplate | undefined>();
  const [toast, setToast] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [registerSession, setRegisterSession] = useState<Session | null>(null);
  const [reportSession, setReportSession]       = useState<Session | null>(null);

  const daysSessions = useMemo(
    () => sessions.filter(s => s.date === selectedDate),
    [sessions, selectedDate]
  );

  // ── Nav label ───────────────────────────────────────────────────────────────
  const navLabel = useMemo(() => {
    if (viewMode === "month") return fmtMonthYear(anchorDate);
    if (viewMode === "week") {
      const mon = getWeekMonday(anchorDate);
      const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
      return `${mon.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return "All Sessions";
  }, [viewMode, anchorDate]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navPrev = () => {
    if (viewMode === "month") setAnchorDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (viewMode === "week") setAnchorDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  };
  const navNext = () => {
    if (viewMode === "month") setAnchorDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (viewMode === "week") setAnchorDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  };

  const selectDate = (iso: string) => {
    setSelectedDate(iso);
    setAnchorDate(new Date(iso + "T00:00:00"));
  };

  // ── Booking ─────────────────────────────────────────────────────────────────
  const bookSession = (id: string) => {
    setUserBooked(b => new Set([...b, id]));
    setLocalBooked(lb => ({ ...lb, [id]: lb[id] + 1 }));
  };
  const joinWaitlist = (id: string) => setUserWaiting(w => new Set([...w, id]));
  const cancelBooking = (id: string) => {
    setUserBooked(b => { const n = new Set(b); n.delete(id); return n; });
    setLocalBooked(lb => ({ ...lb, [id]: Math.max(0, lb[id] - 1) }));
  };

  // ── Delete session ───────────────────────────────────────────────────────────
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setLocalBooked(lb => { const n = { ...lb }; delete n[id]; return n; });
    setUserBooked(b => { const n = new Set(b); n.delete(id); return n; });
    setUserWaiting(w => { const n = new Set(w); n.delete(id); return n; });
  };

  // ── Add session (optionally keeping the setup as a template) ────────────────
  const handleAddSession = (s: Session, saveAs?: { name: string; fromTemplateId?: string }) => {
    setSessions(prev => [...prev, s].sort((a, b) => a.date.localeCompare(b.date)));
    setLocalBooked(lb => ({ ...lb, [s.id]: 0 }));

    if (saveAs) {
      addTemplate({
        name: saveAs.name,
        topic: (templatePrefill?.topic ?? "Product Knowledge") as Topic,
        kind: s.type === "sharing" ? "Sharing Session" : s.type === "hybrid" ? "Hybrid" : "Physical",
        time: s.time,
        venue: s.venue,
        trainerName: s.trainer,
        capacity: s.capacity,
        mandatory: s.mandatory,
        description: s.description,
        targetAudience: s.targetAudience,
        selfRegistration: s.selfRegistration ?? true,
        requireForm: s.requireForm ?? false,
        createdBy: myId,
      });
      setToast(`Template "${saveAs.name}" saved — reuse it for the next run.`);
      window.setTimeout(() => setToast(""), 3500);
    }

    // Reusing a template records the run against it.
    if (s.templateId) markTemplateUsed(s.templateId, s.date);

    setShowScheduleModal(false);
    setTemplatePrefill(undefined);
    selectDate(s.date);
  };

  // ── Register click — open form if required, else book immediately ────────────
  const handleRegisterClick = (session: Session) => {
    if (session.storeBacked) {
      // Full registration flow (capacity, waitlist, HRDC details) has its own page.
      navigate(`/register/${session.id}`);
    } else if (session.requireForm === false) {
      bookSession(session.id);
    } else {
      setRegisterSession(session);
    }
  };

  // ── Reuse a saved template — the form opens prefilled, minus date and time ──
  const useTemplate = (t: SessionTemplate) => {
    setTemplatePrefill(t);
    setShowTemplates(false);
    setShowScheduleModal(true);
  };

  return (
    <div className="apex-calendar-page flex flex-col" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0 flex items-center justify-between">
        {/* Date navigator */}
        <div className="apex-calendar-navigator flex items-center gap-1">
          {viewMode !== "list" && (
            <button
              onClick={navPrev}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-gray-50 hover:text-[#1A1F2E] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <span className="text-[15px] font-extrabold text-[#1A1F2E] px-2 min-w-[200px]">{navLabel}</span>
          {viewMode !== "list" && (
            <button
              onClick={navNext}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-gray-50 hover:text-[#1A1F2E] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          )}
          {viewMode !== "list" && (
            <button
              onClick={() => selectDate(TODAY)}
              className="ml-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-[#6B7280] hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Right: Schedule button + legend + view toggle */}
        <div className="apex-calendar-tools flex items-center gap-4">
          {toast && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}>
              <Save size={12} /> {toast}
            </span>
          )}
          {/* New Session button — trainer / admin only */}
          {canCreate && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              <Plus size={12} /> New Session
            </button>
          )}

          {/* Recurring templates — trainer / HR / admin */}
          {canCreate && (
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-[#6B7280] hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors"
            >
              <Repeat size={12} /> Templates
            </button>
          )}

          {/* Record attendance */}
          {canReport && (
            <Link
              to="/attendance"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-[#6B7280] hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors"
            >
              <ClipboardCheck size={12} /> Attendance
            </Link>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] font-semibold text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" /> Physical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" /> Hybrid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" /> Staff Sharing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Mandatory
            </span>
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden" style={{ backgroundColor: "#F9FAFB" }}>
            {([
              { id: "month", icon: Calendar,    label: "Month" },
              { id: "week",  icon: LayoutGrid,  label: "Week"  },
              { id: "list",  icon: LayoutList,  label: "List"  },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={viewMode === id
                  ? { backgroundColor: "white", color: TEAL, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: "#9CA3AF" }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="apex-calendar-body flex flex-1 overflow-hidden">

        {/* Calendar area */}
        <div className="apex-calendar-main flex-1 overflow-y-auto p-5 bg-[#F4F6F9]">
          {viewMode === "month" && (
            <MonthView
              year={anchorDate.getFullYear()} month={anchorDate.getMonth()}
              sessions={sessions} selectedDate={selectedDate} onSelectDate={selectDate}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              anchorDate={anchorDate} sessions={sessions}
              selectedDate={selectedDate} onSelectDate={selectDate}
            />
          )}
          {viewMode === "list" && (
            <ListView
              sessions={sessions} selectedDate={selectedDate} onSelectDate={selectDate}
            />
          )}
        </div>

        {/* Right panel */}
        <SessionsPanel
          sessions={daysSessions} selectedDate={selectedDate}
          booked={userBooked} waitlisted={userWaiting} localBooked={localBooked}
          onRegister={handleRegisterClick} onWaitlist={joinWaitlist} onCancel={cancelBooking}
          onReport={setReportSession} canReport={canReport}
          onDelete={deleteSession} canDelete={canDelete}
        />
      </div>

      {/* ── Schedule Session Modal ───────────────────────────────────────────── */}
      {showTemplates && (
        <TemplatesModal onClose={() => setShowTemplates(false)} onUse={useTemplate} />
      )}

      {showScheduleModal && (
        <CreateSessionModal
          onClose={() => { setShowScheduleModal(false); setTemplatePrefill(undefined); }}
          onSave={handleAddSession}
          prefill={templatePrefill}
        />
      )}

      {/* ── Training Report Overlay ─────────────────────────────────────────── */}
      {reportSession && (
        <TrainingReportOverlay
          session={reportSession}
          onClose={() => setReportSession(null)}
        />
      )}

      {/* ── Register for Training Modal ──────────────────────────────────────── */}
      {registerSession && (
        <RegisterModal
          session={registerSession}
          onClose={() => setRegisterSession(null)}
          onConfirm={() => {
            bookSession(registerSession.id);
            setRegisterSession(null);
          }}
        />
      )}
    </div>
  );
}

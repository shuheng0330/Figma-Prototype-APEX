// ── Training data store ───────────────────────────────────────────────────────
// Mutable prototype store shared by the portal, calendar, registration,
// attendance, trainer dashboard, learning paths, IDP and KPI screens.
// A tiny pub/sub keeps every mounted screen in sync (register on one page →
// attendance on another → the record appears in My Profile).

import { useEffect, useState } from "react";

// ── Taxonomy ──────────────────────────────────────────────────────────────────
/** Course subject grouping — the portal can group the catalogue by this. */
export type Topic =
  | "Sales" | "Repairs & Service" | "Product Knowledge"
  | "Safety & Compliance" | "Leadership" | "Digital Skills";

export const TOPICS: Topic[] = [
  "Sales", "Repairs & Service", "Product Knowledge",
  "Safety & Compliance", "Leadership", "Digital Skills",
];

/**
 * Course categories are editable at runtime — HR, trainers and Super Admin can
 * add, rename, recolour or retire them from the Learning Portal. The six
 * defaults below seed the list; their ids match the original topic names so
 * calendar sessions keep working unchanged.
 */
export interface Category {
  id: string; name: string; color: string; bg: string; emoji: string;
  /** Defaults ship with the product; custom ones were created by a user. */
  custom: boolean;
  retired?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: "Sales",               name: "Sales",               color: "#B45309", bg: "#FFFBEB", emoji: "💼", custom: false },
  { id: "Repairs & Service",   name: "Repairs & Service",   color: "#1D4ED8", bg: "#EFF6FF", emoji: "🔧", custom: false },
  { id: "Product Knowledge",   name: "Product Knowledge",   color: "#7C3AED", bg: "#F3E8FF", emoji: "📦", custom: false },
  { id: "Safety & Compliance", name: "Safety & Compliance", color: "#DC2626", bg: "#FEF2F2", emoji: "⚠️", custom: false },
  { id: "Leadership",          name: "Leadership",          color: "#0F766E", bg: "#F0FDFA", emoji: "🌟", custom: false },
  { id: "Digital Skills",      name: "Digital Skills",      color: "#0891B2", bg: "#ECFEFF", emoji: "💻", custom: false },
  { id: "cat-hrdc",            name: "HRDC Claimable",      color: "#9333EA", bg: "#FAF5FF", emoji: "🧾", custom: true  },
  { id: "cat-newhire",         name: "New Hire",            color: "#EA580C", bg: "#FFF7ED", emoji: "🌱", custom: true  },
];

/** Palette offered when creating a category. */
export const CATEGORY_PALETTE = [
  { color: "#B45309", bg: "#FFFBEB" }, { color: "#1D4ED8", bg: "#EFF6FF" },
  { color: "#7C3AED", bg: "#F3E8FF" }, { color: "#DC2626", bg: "#FEF2F2" },
  { color: "#0F766E", bg: "#F0FDFA" }, { color: "#0891B2", bg: "#ECFEFF" },
  { color: "#9333EA", bg: "#FAF5FF" }, { color: "#EA580C", bg: "#FFF7ED" },
  { color: "#059669", bg: "#ECFDF5" }, { color: "#475569", bg: "#F8FAFC" },
];

const FALLBACK_CATEGORY: Category = {
  id: "uncategorised", name: "Uncategorised", color: "#6B7280", bg: "#F3F4F6", emoji: "🏷️", custom: false,
};

export function categoryById(id: string): Category {
  return CATEGORIES.find(c => c.id === id) ?? FALLBACK_CATEGORY;
}

/** Style lookup used by every chip in the app. */
export function catStyle(id: string) { return categoryById(id); }

export function activeCategories() { return CATEGORIES.filter(c => !c.retired); }

/** KPI split required by performance management. */
export type KpiCategory = "Product Training" | "Skill-Based Training";

export const KPI_STYLE: Record<KpiCategory, { color: string; bg: string }> = {
  "Product Training":     { color: "#7C3AED", bg: "#F3E8FF" },
  "Skill-Based Training": { color: "#0891B2", bg: "#ECFEFF" },
};

export type Delivery = "E-Learning" | "Physical" | "Hybrid" | "Sharing Session";

/** Material formats shown as badges on a course card. */
export type DocType = "PPT" | "PDF" | "Video" | "Word";

export type CourseStatusGroup = "Mandatory" | "In Progress" | "Optional" | "Completed";

/**
 * How a material reaches the learner:
 *  - "portal"    — it appears in My Learnings to be taken any time before the deadline.
 *  - "immediate" — the learner is notified to begin straight away; the completion
 *                  window runs from the assignment date, not from when they start.
 */
export type AssignmentMode = "portal" | "immediate";

export interface CourseAssignment {
  mode: AssignmentMode;
  assignedOn: string;
  deadline: string;
  /** Days allowed once started (portal) or from the assignment date (immediate). */
  daysWithin: number;
  mandatory: boolean;
  audience: string;
  assignedBy: string;
}

export const ASSIGNMENT_MODE_META: Record<AssignmentMode, { label: string; short: string; color: string; bg: string; blurb: string }> = {
  portal:    { label: "Add to Learning Portal", short: "Portal",    color: "#0891B2", bg: "#ECFEFF", blurb: "Appears in My Learnings — staff start whenever they like before the deadline." },
  immediate: { label: "Start immediately",      short: "Start now", color: "#DC2626", bg: "#FEF2F2", blurb: "Staff are notified to begin now; the clock starts on the assignment date." },
};

// ── People ────────────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string; name: string; initials: string; color: string;
  dept: string; position: string;
  /** Employee id of this person's superior — the manager half of IDP ownership. */
  superiorId: string | null;
  isTrainer: boolean;          // granted by Super Admin
  trainerSince?: string;
}

export const STAFF: StaffMember[] = [
  { id: "E001", name: "Ahmad Samsudin",   initials: "AS", color: "#00C9A7", dept: "Engineering", position: "Senior Technician",       superiorId: "E010", isTrainer: true,  trainerSince: "12 Feb 2026" },
  { id: "E002", name: "Nurul Ain Razali", initials: "NA", color: "#6366F1", dept: "Engineering", position: "Technician",              superiorId: "E010", isTrainer: false },
  { id: "E003", name: "Tan Wei Ming",     initials: "TW", color: "#F59E0B", dept: "Sales",       position: "Retail Sales Executive",  superiorId: "E011", isTrainer: true,  trainerSince: "03 Mar 2026" },
  { id: "E004", name: "Priya Subramaniam",initials: "PS", color: "#EC4899", dept: "Service",     position: "Service Centre Admin",    superiorId: "E012", isTrainer: false },
  { id: "E005", name: "Mohd Faizal Ismail",initials:"MF", color: "#8B5CF6", dept: "Service",     position: "Branch Manager",          superiorId: "E012", isTrainer: true,  trainerSince: "21 Jan 2026" },
  { id: "E006", name: "Tan Hui Ying",     initials: "TH", color: "#14B8A6", dept: "Sales",       position: "Customer Service Officer",superiorId: "E011", isTrainer: false },
  { id: "E007", name: "Rajendran Krishnan",initials:"RK", color: "#0EA5E9", dept: "Engineering", position: "Technician",              superiorId: "E010", isTrainer: false },
  { id: "E008", name: "Siti Norzahra",    initials: "SN", color: "#A855F7", dept: "Service",     position: "Customer Service Officer",superiorId: "E012", isTrainer: false },
  { id: "E009", name: "Kevin Chang",      initials: "KC", color: "#F97316", dept: "Sales",       position: "Retail Sales Executive",  superiorId: "E011", isTrainer: false },
  { id: "E010", name: "Lim Chee Keong",   initials: "LC", color: "#3B82F6", dept: "Engineering", position: "Head of Engineering",     superiorId: null,   isTrainer: true,  trainerSince: "05 Jan 2026" },
  { id: "E011", name: "Sarah Lim",        initials: "SL", color: "#059669", dept: "Sales",       position: "Head of Sales",           superiorId: null,   isTrainer: true,  trainerSince: "05 Jan 2026" },
  { id: "E012", name: "Karim Abdullah",   initials: "KA", color: "#DC2626", dept: "Service",     position: "Head of Service",         superiorId: null,   isTrainer: true,  trainerSince: "05 Jan 2026" },
  { id: "E013", name: "Wong Sook Yee",    initials: "WS", color: "#64748B", dept: "HR",          position: "HR Manager",              superiorId: null,   isTrainer: false },
  { id: "E014", name: "Amirul Zulkifli",  initials: "AZ", color: "#0D9488", dept: "Engineering", position: "Junior Technician",       superiorId: "E010", isTrainer: false },
];

export function staffById(id: string) { return STAFF.find(s => s.id === id); }
export function staffByName(name: string) { return STAFF.find(s => s.name === name); }
export function teamOf(superiorId: string) { return STAFF.filter(s => s.superiorId === superiorId); }

/** The signed-in demo user for each role, so every screen has a believable "me". */
export const ROLE_IDENTITY: Record<string, string> = {
  staff:   "E001",
  trainer: "E003",
  manager: "E010",
  hr:      "E013",
  admin:   "E013",
};

// ── Departments ───────────────────────────────────────────────────────────────
/** Headcount decides assignment style: templates for big departments, manual for small. */
export const LARGE_DEPT_THRESHOLD = 25;

export interface Department { name: string; headcount: number; head: string; }

export const DEPARTMENTS: Department[] = [
  { name: "Engineering", headcount: 64, head: "Lim Chee Keong" },
  { name: "Sales",       headcount: 48, head: "Sarah Lim"      },
  { name: "Service",     headcount: 31, head: "Karim Abdullah" },
  { name: "Finance",     headcount: 12, head: "Derek Lee"      },
  { name: "HR",          headcount: 8,  head: "Wong Sook Yee"  },
  { name: "IT",          headcount: 6,  head: "Alice Morgan"   },
];

export const isLargeDept = (d: Department) => d.headcount >= LARGE_DEPT_THRESHOLD;

// ── Courses ───────────────────────────────────────────────────────────────────
export interface PortalCourse {
  id: string; title: string; dept: string;
  topic: Topic; kpi: KpiCategory; delivery: Delivery; types: DocType[];
  /** Editable labels — the first entry is the primary category shown on the card. */
  categoryIds: string[];
  duration: string; progress: number; mandatory: boolean;
  from: string; to: string; emoji: string;
  /** Staff id of the material owner — trainers may only edit/assign their own. */
  ownerId: string;
  deadline?: string;
  sopId?: string;
  /** Set when the material has been assigned out from the Assign Training screen. */
  assignment?: CourseAssignment;
  /** Set for staff-led sharing sessions so the trainer is recorded on both sides. */
  sharingBy?: string;
}

export const COURSES: PortalCourse[] = [
  { id: "m1", title: "Data Privacy & Compliance",        dept: "IT",          topic: "Safety & Compliance", kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PDF", "Video"], categoryIds: ["Safety & Compliance", "cat-hrdc"], duration: "45 min", progress: 100, mandatory: true,  from: "#1E293B", to: "#0F172A", emoji: "🔒", ownerId: "E013", deadline: "2026-10-31", sopId: "s3" },
  { id: "m2", title: "Workplace Safety Essentials",      dept: "HR",          topic: "Safety & Compliance", kpi: "Skill-Based Training",  delivery: "Hybrid", types: ["PPT", "Video"], categoryIds: ["Safety & Compliance", "cat-newhire", "cat-hrdc"],     duration: "60 min", progress: 0,   mandatory: true,  from: "#7F1D1D", to: "#450A0A", emoji: "⚠️", ownerId: "E013", deadline: "2026-10-15" },
  { id: "m3", title: "Anti-Bribery & Ethics Policy",     dept: "Compliance",  topic: "Safety & Compliance", kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PDF"], categoryIds: ["Safety & Compliance", "cat-newhire"], duration: "30 min", progress: 0,   mandatory: true,  from: "#4C1D95", to: "#2E1065", emoji: "⚖️", ownerId: "E013", deadline: "2026-09-30",
    assignment: { mode: "immediate", assignedOn: "2026-09-15", deadline: "2026-09-30", daysWithin: 7, mandatory: true, audience: "All staff", assignedBy: "E013" } },
  { id: "m4", title: "Emergency Response Protocol",      dept: "Operations",  topic: "Safety & Compliance", kpi: "Skill-Based Training",  delivery: "Hybrid", types: ["Video", "PPT"], categoryIds: ["Safety & Compliance"],     duration: "50 min", progress: 20,  mandatory: true,  from: "#78350F", to: "#451A03", emoji: "🚨", ownerId: "E012", deadline: "2026-11-20" },
  { id: "m5", title: "Information Security Awareness",   dept: "IT",          topic: "Digital Skills",      kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PDF", "PPT"], categoryIds: ["Digital Skills"], duration: "40 min", progress: 0,   mandatory: true,  from: "#0C4A6E", to: "#082F49", emoji: "🛡️", ownerId: "E013", deadline: "2026-12-05" },
  { id: "c1", title: "AC Installation Manual",           dept: "Engineering", topic: "Repairs & Service",   kpi: "Product Training",      delivery: "E-Learning", types: ["PDF", "Video", "PPT"], categoryIds: ["Repairs & Service", "cat-hrdc"], duration: "90 min", progress: 60,  mandatory: false, from: "#064E3B", to: "#022C22", emoji: "🔧", ownerId: "E010", sopId: "s1" },
  { id: "c2", title: "Customer Handling Techniques",     dept: "Sales",       topic: "Sales",               kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["Video"], categoryIds: ["Sales"], duration: "35 min", progress: 45,  mandatory: false, from: "#831843", to: "#500724", emoji: "🤝", ownerId: "E011", sopId: "s2" },
  { id: "c3", title: "Project Management Basics",        dept: "Operations",  topic: "Leadership",          kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PPT", "Word"], categoryIds: ["Leadership"], duration: "55 min", progress: 80,  mandatory: false, from: "#14532D", to: "#052E16", emoji: "📋", ownerId: "E013" },
  { id: "c4", title: "Refrigerant Handling R410A",       dept: "Engineering", topic: "Product Knowledge",   kpi: "Product Training",      delivery: "Hybrid", types: ["PDF", "Video"], categoryIds: ["Product Knowledge"],     duration: "40 min", progress: 30,  mandatory: false, from: "#065F46", to: "#022C22", emoji: "❄️", ownerId: "E010" },
  { id: "o1", title: "Advanced Excel for Finance",       dept: "Finance",     topic: "Digital Skills",      kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PPT", "Video"], categoryIds: ["Digital Skills", "cat-hrdc"], duration: "120 min",progress: 0,   mandatory: false, from: "#166534", to: "#052E16", emoji: "📊", ownerId: "E013" },
  { id: "o2", title: "Presentation & Communication",     dept: "HR",          topic: "Leadership",          kpi: "Skill-Based Training",  delivery: "Physical", types: ["Video", "PPT"], categoryIds: ["Leadership"],   duration: "70 min", progress: 0,   mandatory: false, from: "#7C2D12", to: "#431407", emoji: "🎤", ownerId: "E013" },
  { id: "o3", title: "Lean Six Sigma Introduction",      dept: "Operations",  topic: "Leadership",          kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["PDF", "Word"], categoryIds: ["Leadership"], duration: "85 min", progress: 0,   mandatory: false, from: "#1E1B4B", to: "#0D0B30", emoji: "📐", ownerId: "E013" },
  { id: "o4", title: "Leadership Fundamentals",          dept: "HR",          topic: "Leadership",          kpi: "Skill-Based Training",  delivery: "E-Learning", types: ["Video"], categoryIds: ["Leadership"], duration: "45 min", progress: 0,   mandatory: false, from: "#134E4A", to: "#042F2E", emoji: "🌟", ownerId: "E013" },
  { id: "d1", title: "Inverter Series 2026 — Product Deep Dive", dept: "Engineering", topic: "Product Knowledge", kpi: "Product Training", delivery: "E-Learning", types: ["Video", "PDF"], categoryIds: ["Product Knowledge", "cat-newhire"], duration: "75 min", progress: 0, mandatory: false, from: "#0F3460", to: "#081D40", emoji: "💨", ownerId: "E010" },
  { id: "d2", title: "Electrical Safety Standards",      dept: "Engineering", topic: "Safety & Compliance", kpi: "Skill-Based Training",  delivery: "Physical", types: ["PPT"], categoryIds: ["Safety & Compliance"],   duration: "55 min", progress: 100, mandatory: false, from: "#1E3A5F", to: "#0A1F3A", emoji: "⚡", ownerId: "E012" },
  { id: "d3", title: "Tools & Equipment Handling",       dept: "Engineering", topic: "Repairs & Service",   kpi: "Product Training",      delivery: "E-Learning", types: ["Video", "PPT"], categoryIds: ["Repairs & Service"], duration: "30 min", progress: 100, mandatory: false, from: "#292524", to: "#1C1917", emoji: "🛠️", ownerId: "E010" },
  { id: "s1x",title: "Closing the Sale — My Playbook",   dept: "Sales",       topic: "Sales",               kpi: "Skill-Based Training",  delivery: "Sharing Session", types: ["Video", "PPT"], categoryIds: ["Sales"], duration: "60 min", progress: 0, mandatory: false, from: "#9A3412", to: "#431407", emoji: "🎯", ownerId: "E003", sharingBy: "E003" },
  { id: "s2x",title: "Field Repair Shortcuts I Learned", dept: "Engineering", topic: "Repairs & Service",   kpi: "Product Training",      delivery: "Sharing Session", types: ["Video"], categoryIds: ["Repairs & Service"], duration: "45 min", progress: 25, mandatory: false, from: "#155E75", to: "#083344", emoji: "💡", ownerId: "E001", sharingBy: "E001" },
];

/** Who created the source SOP — trainers may only modify their own. */
export function sopOwner(sopId: string): string | undefined {
  return COURSES.find(c => c.sopId === sopId)?.ownerId;
}

export function coursesOwnedBy(staffId: string) { return COURSES.filter(c => c.ownerId === staffId); }

export function statusGroupOf(c: PortalCourse): CourseStatusGroup {
  if (c.progress >= 100) return "Completed";
  if (c.progress > 0)    return "In Progress";
  return c.mandatory ? "Mandatory" : "Optional";
}

export const STATUS_GROUPS: CourseStatusGroup[] = ["Mandatory", "In Progress", "Optional", "Completed"];

export const STATUS_GROUP_STYLE: Record<CourseStatusGroup, { color: string; bg: string; note: string }> = {
  "Mandatory":   { color: "#DC2626", bg: "#FEF2F2", note: "Required — not started yet" },
  "In Progress": { color: "#D97706", bg: "#FFFBEB", note: "Pick up where you left off" },
  "Optional":    { color: "#6B7280", bg: "#F3F4F6", note: "Take these any time" },
  "Completed":   { color: "#059669", bg: "#ECFDF5", note: "Finished and recorded" },
};

// ── Offline sessions (calendar events) ────────────────────────────────────────
export type SessionKind = "Physical" | "Hybrid" | "Sharing Session";

export interface OfflineSession {
  id: string; title: string; date: string; time: string; venue: string;
  /** Staff id of whoever runs it — a volunteer trainer or a sharing-session host. */
  trainerId: string;
  kind: SessionKind; topic: Topic; kpi: KpiCategory;
  capacity: number; mandatory: boolean;
  registrationOpen: boolean;
  /** Set when the event was created from a saved template. */
  templateId?: string;
  hrdcClaimable?: boolean;
  description: string;
}

export const SESSIONS: OfflineSession[] = [
  { id: "EV01", title: "R32 Refrigerant Safety Certification", date: "2026-09-24", time: "09:00 – 12:00", venue: "Technical Lab, Level 2",  trainerId: "E012", kind: "Physical",        topic: "Safety & Compliance", kpi: "Skill-Based Training", capacity: 18, mandatory: true,  registrationOpen: true,  hrdcClaimable: true,  description: "Mandatory certification for field technicians handling R32. Flammability, leak detection, DOSH compliance." },
  { id: "EV02", title: "Inverter Series 2026 Product Launch",  date: "2026-09-29", time: "10:00 – 13:00", venue: "Conference Hall B",       trainerId: "E010", kind: "Physical",        topic: "Product Knowledge",   kpi: "Product Training",     capacity: 40, mandatory: false, registrationOpen: true,  hrdcClaimable: true,  description: "Walkthrough of the 2026 inverter line — specs, selling points, installation differences and warranty terms." },
  { id: "EV03", title: "Closing the Sale — Staff Sharing",     date: "2026-10-02", time: "14:00 – 15:00", venue: "Training Room A, HQ",     trainerId: "E003", kind: "Sharing Session", topic: "Sales",               kpi: "Skill-Based Training", capacity: 25, mandatory: false, registrationOpen: true,  description: "Tan Wei Ming shares the objection-handling script behind three consecutive quarters of quota." },
  { id: "EV04", title: "Customer Service Excellence",          date: "2026-10-07", time: "10:00 – 12:00", venue: "Conference Hall B",       trainerId: "E011", kind: "Hybrid",          topic: "Sales",               kpi: "Skill-Based Training", capacity: 20, mandatory: false, registrationOpen: true,  hrdcClaimable: true,  description: "CARE framework role-play — courteous, attentive, responsive, empathetic. Includes escalation drills." },
  { id: "EV05", title: "Field Repair Shortcuts — Staff Sharing",date:"2026-10-14", time: "16:00 – 16:45", venue: "Workshop Floor, Bay 3",   trainerId: "E001", kind: "Sharing Session", topic: "Repairs & Service",   kpi: "Product Training",     capacity: 15, mandatory: false, registrationOpen: true,  description: "Ahmad Samsudin walks through the diagnostic shortcuts he uses on inverter board faults." },
  { id: "EV06", title: "Electrical Wiring Certification",      date: "2026-10-21", time: "09:00 – 17:00", venue: "Technical Lab, Level 2",  trainerId: "E012", kind: "Physical",        topic: "Safety & Compliance", kpi: "Skill-Based Training", capacity: 10, mandatory: true,  registrationOpen: true,  hrdcClaimable: true,  description: "Full-day certification — cable sizing, isolator installation, safety earth. Assessment at the end." },
  { id: "EV07", title: "Phone Etiquette — Staff Sharing",      date: "2026-09-26", time: "16:00 – 17:00", venue: "Training Room B",         trainerId: "E006", kind: "Sharing Session", topic: "Sales",             kpi: "Skill-Based Training", capacity: 25, mandatory: false, registrationOpen: true,  description: "Tan Hui Ying shares the call-handling habits behind her repeat-job rate, including opening lines and follow-up timing." },
  { id: "EV08", title: "Warranty Claims — Staff Sharing",      date: "2026-10-09", time: "11:00 – 12:00", venue: "Service Centre, Level 1", trainerId: "E004", kind: "Sharing Session", topic: "Product Knowledge", kpi: "Product Training",     capacity: 20, mandatory: false, registrationOpen: true,  description: "Priya Subramaniam walks through the documentation shortcuts that cut warranty claim turnaround in half." },
  { id: "EV09", title: "Morning Briefing Practice — Sharing",  date: "2026-10-23", time: "08:30 – 09:15", venue: "Branch — Ampang",         trainerId: "E005", kind: "Sharing Session", topic: "Leadership",        kpi: "Skill-Based Training", capacity: 15, mandatory: false, registrationOpen: true,  description: "Mohd Faizal runs a live briefing and breaks down how he keeps it under fifteen minutes." },
  { id: "EV00", title: "Q3 Safety Induction",                  date: "2026-09-03", time: "09:00 – 11:00", venue: "Conference Hall A",       trainerId: "E012", kind: "Physical",        topic: "Safety & Compliance", kpi: "Skill-Based Training", capacity: 30, mandatory: true,  registrationOpen: false, hrdcClaimable: true,  description: "Completed induction covering fire safety, first aid basics and evacuation procedure." },
];

// ── Recurring templates ───────────────────────────────────────────────────────
/**
 * A reusable session setup saved by HR (or whoever schedules) at the moment they
 * create a session. Everything except the date and time is carried over, so the
 * same training can be run again later without re-entering the details.
 */
export interface SessionTemplate {
  id: string; name: string; topic: Topic; kind: SessionKind;
  /** Default time — overridden each time the template is used. */
  time: string;
  venue: string;
  /** Trainer/facilitator name, entered by hand — may be external. */
  trainerName: string;
  capacity: number;
  mandatory: boolean;
  description?: string;
  targetAudience?: string[];
  selfRegistration: boolean;
  requireForm: boolean;
  /** Staff id of whoever saved it. */
  createdBy: string;
  createdOn: string;
  lastUsed?: string;
  uses: number;
}

export const TEMPLATES: SessionTemplate[] = [
  { id: "T01", name: "New Hire Safety Induction",      topic: "Safety & Compliance", kind: "Physical",        time: "09:00 – 11:00", venue: "Conference Hall A",      trainerName: "Karim Abdullah", capacity: 30, mandatory: true,  selfRegistration: true,  requireForm: true,  createdBy: "E013", createdOn: "2026-01-12", lastUsed: "2026-09-03", uses: 9,  description: "Fire safety, first aid basics, site hazard awareness and evacuation procedure for new joiners." },
  { id: "T02", name: "Monthly Product Update",         topic: "Product Knowledge",   kind: "Hybrid",          time: "14:00 – 15:30", venue: "Conference Hall B",      trainerName: "Lim Chee Keong", capacity: 40, mandatory: false, selfRegistration: true,  requireForm: false, createdBy: "E013", createdOn: "2026-02-02", lastUsed: "2026-08-28", uses: 8,  description: "Specs, selling points and installation differences for the latest product line." },
  { id: "T03", name: "Staff Sharing Slot",             topic: "Sales",               kind: "Sharing Session", time: "16:00 – 17:00", venue: "Training Room A, HQ",    trainerName: "Tan Wei Ming",   capacity: 25, mandatory: false, selfRegistration: true,  requireForm: false, createdBy: "E013", createdOn: "2026-03-06", lastUsed: "2026-09-05", uses: 14, description: "Open slot for a staff member to share practical experience with colleagues." },
  { id: "T04", name: "Technician Refresher",           topic: "Repairs & Service",   kind: "Physical",        time: "09:00 – 13:00", venue: "Technical Lab, Level 2", trainerName: "Karim Abdullah", capacity: 18, mandatory: true,  selfRegistration: true,  requireForm: true,  createdBy: "E013", createdOn: "2026-01-20", lastUsed: "2026-07-15", uses: 3,  description: "Hands-on refresher on diagnostics, safe handling and current service standards." },
];

// ── Registration / waitlist / attendance ──────────────────────────────────────
export type RegStatus = "registered" | "waitlisted" | "cancelled";

export interface Registration {
  sessionId: string; staffId: string; status: RegStatus; registeredOn: string;
  /** Attendance is recorded against the event, never assumed from registration. */
  attended: boolean;
  attendanceMethod?: "manual" | "batch";
  recordedBy?: string;
  quizScore?: number | null;
}

/** Seeded registrations — includes a full session and a waitlist to show the flow. */
export const REGISTRATIONS: Registration[] = [
  { sessionId: "EV00", staffId: "E001", status: "registered", registeredOn: "2026-08-20", attended: true,  attendanceMethod: "batch",  recordedBy: "E013", quizScore: 88 },
  { sessionId: "EV00", staffId: "E002", status: "registered", registeredOn: "2026-08-20", attended: true,  attendanceMethod: "batch",  recordedBy: "E013", quizScore: 74 },
  { sessionId: "EV00", staffId: "E007", status: "registered", registeredOn: "2026-08-21", attended: false, quizScore: null },
  { sessionId: "EV00", staffId: "E014", status: "registered", registeredOn: "2026-08-22", attended: true,  attendanceMethod: "batch",  recordedBy: "E013", quizScore: 91 },
  { sessionId: "EV01", staffId: "E002", status: "registered", registeredOn: "2026-09-08", attended: false },
  { sessionId: "EV01", staffId: "E007", status: "registered", registeredOn: "2026-09-09", attended: false },
  { sessionId: "EV03", staffId: "E006", status: "registered", registeredOn: "2026-09-10", attended: false },
  { sessionId: "EV03", staffId: "E009", status: "registered", registeredOn: "2026-09-10", attended: false },
  { sessionId: "EV06", staffId: "E002", status: "registered", registeredOn: "2026-09-11", attended: false },
  { sessionId: "EV06", staffId: "E007", status: "registered", registeredOn: "2026-09-11", attended: false },
  { sessionId: "EV06", staffId: "E014", status: "registered", registeredOn: "2026-09-12", attended: false },
  { sessionId: "EV06", staffId: "E004", status: "registered", registeredOn: "2026-09-12", attended: false },
  { sessionId: "EV06", staffId: "E008", status: "registered", registeredOn: "2026-09-12", attended: false },
  { sessionId: "EV06", staffId: "E003", status: "registered", registeredOn: "2026-09-13", attended: false },
  { sessionId: "EV06", staffId: "E006", status: "registered", registeredOn: "2026-09-13", attended: false },
  { sessionId: "EV06", staffId: "E009", status: "registered", registeredOn: "2026-09-13", attended: false },
  { sessionId: "EV06", staffId: "E005", status: "registered", registeredOn: "2026-09-14", attended: false },
  { sessionId: "EV06", staffId: "E010", status: "registered", registeredOn: "2026-09-14", attended: false },
  { sessionId: "EV06", staffId: "E011", status: "waitlisted", registeredOn: "2026-09-15", attended: false },
  { sessionId: "EV07", staffId: "E004", status: "registered", registeredOn: "2026-09-16", attended: false },
  { sessionId: "EV07", staffId: "E008", status: "registered", registeredOn: "2026-09-16", attended: false },
  { sessionId: "EV07", staffId: "E009", status: "registered", registeredOn: "2026-09-16", attended: false },
  { sessionId: "EV07", staffId: "E003", status: "registered", registeredOn: "2026-09-17", attended: false },
  { sessionId: "EV08", staffId: "E002", status: "registered", registeredOn: "2026-09-16", attended: false },
  { sessionId: "EV08", staffId: "E008", status: "registered", registeredOn: "2026-09-17", attended: false },
  { sessionId: "EV09", staffId: "E006", status: "registered", registeredOn: "2026-09-17", attended: false },
];

// Past sharing/physical sessions that already produced records + quiz scores,
// used by the trainer dashboard to measure effectiveness.
export interface PastSessionResult {
  sessionId: string; title: string; date: string; trainerId: string;
  kind: SessionKind; topic: Topic; headcount: number; registered: number;
  avgQuizScore: number; rating: number;
}

export const PAST_RESULTS: PastSessionResult[] = [
  { sessionId: "P01", title: "Closing the Sale — Staff Sharing",   date: "2026-08-14", trainerId: "E003", kind: "Sharing Session", topic: "Sales",             headcount: 22, registered: 25, avgQuizScore: 86, rating: 4.6 },
  { sessionId: "P02", title: "Upselling Service Packages",         date: "2026-07-17", trainerId: "E003", kind: "Sharing Session", topic: "Sales",             headcount: 18, registered: 20, avgQuizScore: 79, rating: 4.3 },
  { sessionId: "P03", title: "Handling Price Objections",          date: "2026-06-19", trainerId: "E003", kind: "Physical",        topic: "Sales",             headcount: 24, registered: 24, avgQuizScore: 91, rating: 4.8 },
  { sessionId: "P04", title: "Customer Handover Walkthrough",      date: "2026-05-22", trainerId: "E003", kind: "Sharing Session", topic: "Sales",             headcount: 15, registered: 18, avgQuizScore: 72, rating: 4.0 },
  { sessionId: "P05", title: "Field Repair Shortcuts — Sharing",   date: "2026-08-07", trainerId: "E001", kind: "Sharing Session", topic: "Repairs & Service", headcount: 14, registered: 15, avgQuizScore: 88, rating: 4.7 },
  { sessionId: "P06", title: "Inverter Board Fault Diagnosis",     date: "2026-06-26", trainerId: "E001", kind: "Physical",        topic: "Repairs & Service", headcount: 12, registered: 12, avgQuizScore: 83, rating: 4.5 },
  { sessionId: "P07", title: "R32 Safety Certification",           date: "2026-07-10", trainerId: "E012", kind: "Physical",        topic: "Safety & Compliance", headcount: 17, registered: 18, avgQuizScore: 90, rating: 4.6 },
  { sessionId: "P08", title: "AC Installation Fundamentals",       date: "2026-08-04", trainerId: "E010", kind: "Physical",        topic: "Repairs & Service", headcount: 15, registered: 20, avgQuizScore: 81, rating: 4.2 },
  // Sharing sessions led by staff who are not formal trainers — any staff may present.
  { sessionId: "P09", title: "Handling Difficult Customers — Sharing", date: "2026-08-21", trainerId: "E006", kind: "Sharing Session", topic: "Sales",             headcount: 19, registered: 21, avgQuizScore: 84, rating: 4.4 },
  { sessionId: "P10", title: "Preventive Maintenance Tips — Sharing",  date: "2026-07-31", trainerId: "E005", kind: "Sharing Session", topic: "Repairs & Service", headcount: 16, registered: 18, avgQuizScore: 87, rating: 4.5 },
  { sessionId: "P11", title: "Reading Wiring Diagrams — Sharing",      date: "2026-06-12", trainerId: "E002", kind: "Sharing Session", topic: "Repairs & Service", headcount: 11, registered: 12, avgQuizScore: 78, rating: 4.1 },
  { sessionId: "P12", title: "Branch Handover Checklist — Sharing",    date: "2026-09-04", trainerId: "E005", kind: "Sharing Session", topic: "Product Knowledge", headcount: 13, registered: 15, avgQuizScore: 80, rating: 4.3 },
  { sessionId: "P13", title: "Inverter Fault Codes — Quick Reference",  date: "2026-06-05", trainerId: "E001", kind: "Sharing Session", topic: "Repairs & Service",   headcount: 12, registered: 14, avgQuizScore: 82, rating: 4.4 },
  { sessionId: "P14", title: "Safe R32 Handling in the Field",          date: "2026-04-17", trainerId: "E001", kind: "Sharing Session", topic: "Safety & Compliance", headcount: 17, registered: 18, avgQuizScore: 90, rating: 4.8 },
  { sessionId: "P15", title: "Running a Smooth Morning Briefing",       date: "2026-05-15", trainerId: "E005", kind: "Sharing Session", topic: "Leadership",          headcount: 10, registered: 12, avgQuizScore: 76, rating: 4.2 },
  { sessionId: "P16", title: "Phone Etiquette That Wins Repeat Jobs",   date: "2026-06-26", trainerId: "E006", kind: "Sharing Session", topic: "Sales",               headcount: 21, registered: 23, avgQuizScore: 88, rating: 4.6 },
  { sessionId: "P17", title: "Handling Escalations Calmly",             date: "2026-04-30", trainerId: "E006", kind: "Sharing Session", topic: "Sales",               headcount: 15, registered: 17, avgQuizScore: 81, rating: 4.2 },
  { sessionId: "P18", title: "Torque Settings Cheat Sheet",             date: "2026-05-08", trainerId: "E002", kind: "Sharing Session", topic: "Repairs & Service",   headcount: 9,  registered: 11, avgQuizScore: 85, rating: 4.5 },
  { sessionId: "P19", title: "Installation Mistakes I Made",            date: "2026-03-20", trainerId: "E002", kind: "Sharing Session", topic: "Repairs & Service",   headcount: 13, registered: 14, avgQuizScore: 83, rating: 4.6 },
  { sessionId: "P20", title: "Demo Techniques for Showroom Walk-ins",   date: "2026-07-03", trainerId: "E009", kind: "Sharing Session", topic: "Sales",               headcount: 14, registered: 16, avgQuizScore: 79, rating: 4.1 },
  { sessionId: "P21", title: "Following Up Quotations",                 date: "2026-05-29", trainerId: "E009", kind: "Sharing Session", topic: "Sales",               headcount: 12, registered: 13, avgQuizScore: 77, rating: 4.0 },
  { sessionId: "P22", title: "Faster Warranty Claim Processing",        date: "2026-08-28", trainerId: "E004", kind: "Sharing Session", topic: "Product Knowledge",   headcount: 11, registered: 12, avgQuizScore: 86, rating: 4.5 },
  { sessionId: "P23", title: "Scheduling Jobs Without Double-Booking",  date: "2026-06-19", trainerId: "E004", kind: "Sharing Session", topic: "Digital Skills",      headcount: 9,  registered: 10, avgQuizScore: 82, rating: 4.3 },
  { sessionId: "P24", title: "Reading Buying Signals",                  date: "2026-09-11", trainerId: "E003", kind: "Sharing Session", topic: "Sales",               headcount: 20, registered: 22, avgQuizScore: 89, rating: 4.7 },
];

/** Every staff-led sharing session that has already run. */
export function sharingResults() {
  return PAST_RESULTS.filter(r => r.kind === "Sharing Session");
}

/** Sharing sessions still to come, taken from the calendar. */
export function upcomingSharing() {
  return SESSIONS
    .filter(s => s.kind === "Sharing Session" && daysUntil(s.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface SharingRow {
  staffId: string; sessions: number; involved: number; registered: number;
  avgQuiz: number; avgRating: number; lastShared: string;
}

/** Per-presenter roll-up: how many sharings, and how many staff they reached. */
export function sharingLeaderboard(staffIds?: string[]): SharingRow[] {
  const rows = new Map<string, SharingRow>();
  sharingResults()
    .filter(r => !staffIds || staffIds.includes(r.trainerId))
    .forEach(r => {
      const cur = rows.get(r.trainerId) ?? {
        staffId: r.trainerId, sessions: 0, involved: 0, registered: 0,
        avgQuiz: 0, avgRating: 0, lastShared: r.date,
      };
      cur.sessions += 1;
      cur.involved += r.headcount;
      cur.registered += r.registered;
      cur.avgQuiz += r.avgQuizScore;
      cur.avgRating += r.rating;
      if (r.date > cur.lastShared) cur.lastShared = r.date;
      rows.set(r.trainerId, cur);
    });
  return [...rows.values()]
    .map(r => ({
      ...r,
      avgQuiz: Math.round(r.avgQuiz / r.sessions),
      avgRating: +(r.avgRating / r.sessions).toFixed(1),
    }))
    .sort((a, b) => b.sessions - a.sessions || b.involved - a.involved);
}

// ── Learning paths ────────────────────────────────────────────────────────────
export interface PathStepDef { order: number; courseId: string; mandatory: boolean; }

export interface PathTemplate {
  id: string; name: string; targetRole: string; dept: string;
  kpi: KpiCategory; durationWeeks: number;
  steps: PathStepDef[];
  assignedTo: string[];       // department names using this template
  /** Templates are for large headcount departments; small teams get manual picks. */
  createdBy: string; updatedOn: string;
}

export const PATH_TEMPLATES: PathTemplate[] = [
  {
    id: "LP01", name: "Technician — Year 1", targetRole: "Technician", dept: "Engineering",
    kpi: "Product Training", durationWeeks: 12, createdBy: "E013", updatedOn: "2026-08-30",
    steps: [
      { order: 1, courseId: "m2",  mandatory: true  },
      { order: 2, courseId: "c1",  mandatory: true  },
      { order: 3, courseId: "c4",  mandatory: true  },
      { order: 4, courseId: "d1",  mandatory: false },
      { order: 5, courseId: "d3",  mandatory: false },
    ],
    assignedTo: ["Engineering"],
  },
  {
    id: "LP02", name: "Retail Sales Executive — Onboarding", targetRole: "Retail Sales Executive", dept: "Sales",
    kpi: "Skill-Based Training", durationWeeks: 8, createdBy: "E013", updatedOn: "2026-09-02",
    steps: [
      { order: 1, courseId: "m1",  mandatory: true  },
      { order: 2, courseId: "c2",  mandatory: true  },
      { order: 3, courseId: "s1x", mandatory: false },
      { order: 4, courseId: "o2",  mandatory: false },
    ],
    assignedTo: ["Sales"],
  },
  {
    id: "LP03", name: "Service Team — Compliance Core", targetRole: "Customer Service Officer", dept: "Service",
    kpi: "Skill-Based Training", durationWeeks: 6, createdBy: "E013", updatedOn: "2026-08-18",
    steps: [
      { order: 1, courseId: "m1", mandatory: true  },
      { order: 2, courseId: "m3", mandatory: true  },
      { order: 3, courseId: "m4", mandatory: true  },
    ],
    assignedTo: ["Service"],
  },
  {
    id: "LP04", name: "Supervisor Track", targetRole: "Branch Manager", dept: "All",
    kpi: "Skill-Based Training", durationWeeks: 16, createdBy: "E013", updatedOn: "2026-07-28",
    steps: [
      { order: 1, courseId: "o4", mandatory: true  },
      { order: 2, courseId: "c3", mandatory: true  },
      { order: 3, courseId: "o3", mandatory: false },
      { order: 4, courseId: "o2", mandatory: false },
    ],
    assignedTo: [],
  },
];

// ── IDP — jointly owned by HR and the superior ────────────────────────────────
export type GoalState = "Proposed" | "Agreed" | "Achieved";

export interface DevelopmentGoal {
  id: string; title: string; competency: string; targetDate: string;
  progress: number; state: GoalState;
  proposedBy: string;        // staff id — HR, superior, or the employee
  hrApproved: boolean;
  superiorApproved: boolean;
  linkedCourseIds: string[];
  color: string;
}

export interface Idp {
  staffId: string; period: string; reviewDate: string;
  hrOwnerId: string; superiorId: string;
  pathTemplateId?: string;
  goals: DevelopmentGoal[];
}

export const IDPS: Idp[] = [
  {
    staffId: "E001", period: "Jan 2026 — Dec 2026", reviewDate: "2026-10-15",
    hrOwnerId: "E013", superiorId: "E010", pathTemplateId: "LP01",
    goals: [
      { id: "G1", title: "Complete Advanced HVAC Certification", competency: "Technical Skills",  targetDate: "2026-12-31", progress: 75,  state: "Agreed",   proposedBy: "E010", hrApproved: true,  superiorApproved: true,  linkedCourseIds: ["c1", "c4"], color: "#00C9A7" },
      { id: "G2", title: "Lead 2 installations as senior tech",  competency: "Leadership",        targetDate: "2026-10-31", progress: 100, state: "Achieved", proposedBy: "E010", hrApproved: true,  superiorApproved: true,  linkedCourseIds: ["c3"],       color: "#059669" },
      { id: "G3", title: "Run one staff sharing session",        competency: "Communication",     targetDate: "2026-11-30", progress: 40,  state: "Agreed",   proposedBy: "E013", hrApproved: true,  superiorApproved: true,  linkedCourseIds: ["s2x"],      color: "#3B82F6" },
      { id: "G4", title: "Full safety compliance refresh",       competency: "Safety Compliance", targetDate: "2026-08-31", progress: 40,  state: "Proposed", proposedBy: "E001", hrApproved: false, superiorApproved: true,  linkedCourseIds: ["m2", "m4"], color: "#D97706" },
    ],
  },
  {
    staffId: "E002", period: "Jan 2026 — Dec 2026", reviewDate: "2026-10-20",
    hrOwnerId: "E013", superiorId: "E010", pathTemplateId: "LP01",
    goals: [
      { id: "G5", title: "Pass R32 handling certification",      competency: "Safety Compliance", targetDate: "2026-11-15", progress: 30, state: "Agreed",   proposedBy: "E013", hrApproved: true,  superiorApproved: true,  linkedCourseIds: ["m2"],  color: "#DC2626" },
      { id: "G6", title: "Reach 90% on product knowledge quiz",  competency: "Technical Skills",  targetDate: "2026-12-15", progress: 55, state: "Proposed", proposedBy: "E010", hrApproved: false, superiorApproved: true,  linkedCourseIds: ["d1"],  color: "#7C3AED" },
    ],
  },
  {
    staffId: "E003", period: "Jan 2026 — Dec 2026", reviewDate: "2026-11-05",
    hrOwnerId: "E013", superiorId: "E011", pathTemplateId: "LP02",
    goals: [
      { id: "G7", title: "Mentor two junior sales executives",   competency: "Leadership",     targetDate: "2026-12-31", progress: 60, state: "Agreed", proposedBy: "E011", hrApproved: true, superiorApproved: true, linkedCourseIds: ["o4"],  color: "#0891B2" },
      { id: "G8", title: "Deliver 4 sharing sessions this year",  competency: "Communication",  targetDate: "2026-12-31", progress: 75, state: "Agreed", proposedBy: "E011", hrApproved: true, superiorApproved: true, linkedCourseIds: ["s1x"], color: "#F59E0B" },
    ],
  },
  {
    staffId: "E014", period: "Jan 2026 — Dec 2026", reviewDate: "2026-12-01",
    hrOwnerId: "E013", superiorId: "E010", pathTemplateId: "LP01",
    goals: [
      { id: "G9", title: "Complete Technician Year 1 path",      competency: "Technical Skills", targetDate: "2026-12-31", progress: 20, state: "Agreed",   proposedBy: "E013", hrApproved: true,  superiorApproved: true,  linkedCourseIds: ["c1"], color: "#00C9A7" },
      { id: "G10",title: "Shadow 10 site installations",         competency: "Technical Skills", targetDate: "2026-11-30", progress: 10, state: "Proposed", proposedBy: "E010", hrApproved: false, superiorApproved: false, linkedCourseIds: [],     color: "#6B7280" },
    ],
  },
];

export const COMPETENCIES = [
  "Customer Service", "Technical Skills", "Leadership", "Communication",
  "Problem Solving", "Safety Compliance", "Quality Management",
  "Digital Literacy", "Project Management", "Team Collaboration",
];

export const GOAL_STATE_STYLE: Record<GoalState, { color: string; bg: string }> = {
  "Proposed": { color: "#D97706", bg: "#FFFBEB" },
  "Agreed":   { color: "#1D4ED8", bg: "#EFF6FF" },
  "Achieved": { color: "#059669", bg: "#ECFDF5" },
};

// ── Derived helpers ───────────────────────────────────────────────────────────
export function regsFor(sessionId: string) {
  return REGISTRATIONS.filter(r => r.sessionId === sessionId && r.status !== "cancelled");
}
export function seatCount(sessionId: string) {
  return REGISTRATIONS.filter(r => r.sessionId === sessionId && r.status === "registered").length;
}
export function waitCount(sessionId: string) {
  return REGISTRATIONS.filter(r => r.sessionId === sessionId && r.status === "waitlisted").length;
}
export function isFull(s: OfflineSession) { return seatCount(s.id) >= s.capacity; }
export function myReg(sessionId: string, staffId: string) {
  return REGISTRATIONS.find(r => r.sessionId === sessionId && r.staffId === staffId && r.status !== "cancelled");
}
export function sessionById(id: string) { return SESSIONS.find(s => s.id === id); }
export function courseById(id: string) { return COURSES.find(c => c.id === id); }

/** Attendance-confirmed sessions only — this is what reaches a staff profile. */
export function completedSessionsFor(staffId: string) {
  return REGISTRATIONS
    .filter(r => r.staffId === staffId && r.status === "registered" && r.attended)
    .map(r => ({ reg: r, session: sessionById(r.sessionId) }))
    .filter((x): x is { reg: Registration; session: OfflineSession } => Boolean(x.session));
}

/** Registered but attendance not yet recorded — shown as pending, never as complete. */
export function pendingSessionsFor(staffId: string) {
  return REGISTRATIONS
    .filter(r => r.staffId === staffId && r.status !== "cancelled" && !r.attended)
    .map(r => ({ reg: r, session: sessionById(r.sessionId) }))
    .filter((x): x is { reg: Registration; session: OfflineSession } => Boolean(x.session));
}

export interface TrainerStats {
  sessions: number; headcount: number; avgQuiz: number; avgRating: number;
  showRate: number; sharingSessions: number;
}

export function trainerStats(trainerId: string): TrainerStats {
  const rows = PAST_RESULTS.filter(r => r.trainerId === trainerId);
  if (!rows.length) return { sessions: 0, headcount: 0, avgQuiz: 0, avgRating: 0, showRate: 0, sharingSessions: 0 };
  const headcount = rows.reduce((a, r) => a + r.headcount, 0);
  const registered = rows.reduce((a, r) => a + r.registered, 0);
  return {
    sessions: rows.length,
    headcount,
    avgQuiz: Math.round(rows.reduce((a, r) => a + r.avgQuizScore, 0) / rows.length),
    avgRating: +(rows.reduce((a, r) => a + r.rating, 0) / rows.length).toFixed(1),
    showRate: Math.round((headcount / registered) * 100),
    sharingSessions: rows.filter(r => r.kind === "Sharing Session").length,
  };
}

export interface KpiBreakdown {
  product: { done: number; target: number; hours: number };
  skill:   { done: number; target: number; hours: number };
  score: number;
}

/** Training completions that feed the performance KPI, split by category. */
export function kpiFor(staffId: string): KpiBreakdown {
  const done = completedSessionsFor(staffId);
  const courseDone = COURSES.filter(c => c.progress >= 100);
  const product = done.filter(d => d.session.kpi === "Product Training").length
    + courseDone.filter(c => c.kpi === "Product Training").length;
  const skill = done.filter(d => d.session.kpi === "Skill-Based Training").length
    + courseDone.filter(c => c.kpi === "Skill-Based Training").length;
  const pTarget = 4, sTarget = 6;
  const score = Math.round(
    ((Math.min(product, pTarget) / pTarget) * 0.4 + (Math.min(skill, sTarget) / sTarget) * 0.6) * 100
  );
  return {
    product: { done: product, target: pTarget, hours: product * 3 },
    skill:   { done: skill,   target: sTarget, hours: skill * 2 },
    score,
  };
}

// ── Mutations + subscription ──────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach(l => l()); }

export function useStoreVersion() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump(v => v + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Registers a staff member, auto-waitlisting when the session is full. */
export function register(sessionId: string, staffId: string): RegStatus {
  const s = sessionById(sessionId);
  if (!s) return "cancelled";
  const existing = REGISTRATIONS.find(r => r.sessionId === sessionId && r.staffId === staffId);
  const status: RegStatus = seatCount(sessionId) >= s.capacity ? "waitlisted" : "registered";
  if (existing) {
    existing.status = status;
    existing.registeredOn = todayISO();
  } else {
    REGISTRATIONS.push({ sessionId, staffId, status, registeredOn: todayISO(), attended: false });
  }
  emit();
  return status;
}

/** Cancelling frees a seat — the first waitlisted person is promoted. */
export function cancelRegistration(sessionId: string, staffId: string) {
  const r = REGISTRATIONS.find(x => x.sessionId === sessionId && x.staffId === staffId && x.status !== "cancelled");
  if (!r) return;
  const wasSeated = r.status === "registered";
  r.status = "cancelled";
  if (wasSeated) {
    const next = REGISTRATIONS.find(x => x.sessionId === sessionId && x.status === "waitlisted");
    if (next) next.status = "registered";
  }
  emit();
}

export function setAttendance(
  sessionId: string, staffId: string, attended: boolean,
  method: "manual" | "batch", recordedBy: string, quizScore?: number | null,
) {
  const r = REGISTRATIONS.find(x => x.sessionId === sessionId && x.staffId === staffId && x.status !== "cancelled");
  if (!r) return;
  r.attended = attended;
  r.attendanceMethod = attended ? method : undefined;
  r.recordedBy = attended ? recordedBy : undefined;
  if (quizScore !== undefined) r.quizScore = quizScore;
  emit();
}

export function addSession(s: OfflineSession) { SESSIONS.push(s); emit(); }

/** Saves the current session setup so the same training can be run again later. */
export function addTemplate(t: Omit<SessionTemplate, "id" | "createdOn" | "uses">) {
  const id = `T${Date.now().toString(36).slice(-5).toUpperCase()}`;
  TEMPLATES.push({ ...t, id, createdOn: todayISO(), uses: 0 });
  emit();
  return id;
}

export function removeTemplate(id: string) {
  const i = TEMPLATES.findIndex(t => t.id === id);
  if (i >= 0) { TEMPLATES.splice(i, 1); emit(); }
}

/** Called when a template is reused for a new date. */
export function markTemplateUsed(id: string, date: string) {
  const t = TEMPLATES.find(x => x.id === id);
  if (t) { t.uses += 1; t.lastUsed = date; emit(); }
}

/** Records an assignment against a material so the portal can react to it. */
export function assignCourse(courseId: string, a: Omit<CourseAssignment, "assignedOn">) {
  const c = courseById(courseId);
  if (!c) return;
  c.assignment = { ...a, assignedOn: todayISO() };
  c.mandatory = a.mandatory || c.mandatory;
  c.deadline = a.deadline;
  emit();
}

/** Materials the learner has been told to start right away. */
export function immediateAssignments() {
  return COURSES.filter(c => c.assignment?.mode === "immediate" && c.progress < 100);
}

export function addGoal(staffId: string, goal: DevelopmentGoal) {
  const idp = IDPS.find(i => i.staffId === staffId);
  if (idp) { idp.goals.push(goal); emit(); }
}

export function updateGoal(staffId: string, goalId: string, patch: Partial<DevelopmentGoal>) {
  const idp = IDPS.find(i => i.staffId === staffId);
  const g = idp?.goals.find(x => x.id === goalId);
  if (g) { Object.assign(g, patch); emit(); }
}

export function setIdpPath(staffId: string, templateId: string | undefined) {
  const idp = IDPS.find(i => i.staffId === staffId);
  if (idp) { idp.pathTemplateId = templateId; emit(); }
}

export function assignTemplateToDept(templateId: string, dept: string) {
  const t = PATH_TEMPLATES.find(x => x.id === templateId);
  if (!t) return;
  t.assignedTo = t.assignedTo.includes(dept)
    ? t.assignedTo.filter(d => d !== dept)
    : [...t.assignedTo, dept];
  t.updatedOn = todayISO();
  emit();
}

// ── Category management ───────────────────────────────────────────────────────
export function addCategory(name: string, color: string, bg: string, emoji: string) {
  const id = `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-4)}`;
  CATEGORIES.push({ id, name: name.trim(), color, bg, emoji: emoji || "🏷️", custom: true });
  emit();
  return id;
}

export function updateCategory(id: string, patch: Partial<Omit<Category, "id">>) {
  const c = CATEGORIES.find(x => x.id === id);
  if (c) { Object.assign(c, patch); emit(); }
}

/** Retiring keeps history intact; the label simply stops being offered. */
export function retireCategory(id: string) {
  const c = CATEGORIES.find(x => x.id === id);
  if (!c) return;
  if (c.custom) {
    const i = CATEGORIES.indexOf(c);
    CATEGORIES.splice(i, 1);
    COURSES.forEach(course => {
      course.categoryIds = course.categoryIds.filter(x => x !== id);
    });
  } else {
    c.retired = !c.retired;
  }
  emit();
}

/** Adds or removes a label on one course. The primary category cannot be emptied. */
export function toggleCourseCategory(courseId: string, categoryId: string) {
  const c = courseById(courseId);
  if (!c) return;
  const has = c.categoryIds.includes(categoryId);
  if (has && c.categoryIds.length === 1) return;
  c.categoryIds = has
    ? c.categoryIds.filter(x => x !== categoryId)
    : [...c.categoryIds, categoryId];
  emit();
}

export function setPrimaryCategory(courseId: string, categoryId: string) {
  const c = courseById(courseId);
  if (!c) return;
  c.categoryIds = [categoryId, ...c.categoryIds.filter(x => x !== categoryId)];
  emit();
}

export function coursesInCategory(categoryId: string) {
  return COURSES.filter(c => c.categoryIds.includes(categoryId));
}

export function grantTrainer(staffId: string, on: boolean) {
  const s = staffById(staffId);
  if (!s) return;
  s.isTrainer = on;
  s.trainerSince = on ? todayISO() : undefined;
  emit();
}

// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtDateShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export function daysUntil(iso: string) {
  const MS = 86400000;
  return Math.round((new Date(iso + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime()) / MS);
}

// ── Training feature access layer ─────────────────────────────────────────────
// Which role may use which TRAINING feature, and over whom. The signed-in role
// itself comes from ../auth (the single source of truth for sessions); this
// module only maps that role onto the training feature matrix.
// Imported by ApexSidebar (nav filtering), every role-aware page, and the
// Role Access matrix screen (/access) where Super Admin confirms the setup.

import { useEffect, useState } from "react";
import { getCurrentAccount, type OrganisationalRole } from "./auth";

export type Role = "admin" | "hr" | "manager" | "trainer" | "staff";

/** How much data a role may act on for a given feature. */
export type Scope = "none" | "own" | "team" | "all";

export type Feature =
  | "portal"            // My Learnings (default home)
  | "calendar"          // Training calendar
  | "register"          // Register for offline sessions
  | "profile"           // Own training history / records
  | "sharing-session"   // Propose & run a staff sharing session
  | "trainer-dashboard" // Volunteer trainer effectiveness dashboard
  | "materials"         // Upload / edit training materials
  | "assign-training"   // Assign materials to staff
  | "attendance"        // Record attendance (incl. HRDC batch upload)
  | "session-setup"     // Create calendar events, capacity, templates
  | "learning-paths"    // Role-based learning path templates
  | "idp"               // Individual Development Plans
  | "training-kpi"      // Training → KPI contribution
  | "scoreboard"        // Org training scoreboard
  | "users"             // User management / grant trainer permission
  | "access";           // Role access matrix

export const ROLES: Role[] = ["admin", "hr", "manager", "trainer", "staff"];

export const ROLE_META: Record<Role, { label: string; short: string; color: string; bg: string; desc: string }> = {
  admin:   { label: "Super Admin",        short: "SA", color: "#7C3AED", bg: "#F3E8FF", desc: "Full system control. Grants the trainer permission." },
  hr:      { label: "HR",                 short: "HR", color: "#0891B2", bg: "#ECFEFF", desc: "Company-wide training, learning paths, IDP and KPI owner." },
  manager: { label: "Manager / Superior", short: "MG", color: "#3B82F6", bg: "#EFF6FF", desc: "Owns team development — sets IDP and learning paths with HR." },
  trainer: { label: "Volunteer Trainer",  short: "VT", color: "#00C9A7", bg: "#E8FAF7", desc: "Staff who run sessions. Limited to materials they created." },
  staff:   { label: "Staff",              short: "ST", color: "#6B7280", bg: "#F3F4F6", desc: "Learner. Takes courses and registers for sessions." },
};

export const FEATURE_META: Record<Feature, { label: string; group: string; note: string }> = {
  "portal":            { label: "My Learnings portal",         group: "Learning",       note: "Default landing page for every role." },
  "calendar":          { label: "Training calendar",           group: "Learning",       note: "Browse sessions; registration opens from here." },
  "register":          { label: "Session registration",        group: "Learning",       note: "Capacity-checked, waitlisted when full." },
  "profile":           { label: "My training record",          group: "Learning",       note: "Only registered + attendance-confirmed sessions appear." },
  "sharing-session":   { label: "Staff sharing sessions",      group: "Learning",       note: "Any staff may present; the sharing board is visible company-wide." },
  "trainer-dashboard": { label: "Trainer dashboard",           group: "Training ops",   note: "Headcount and average quiz score per session." },
  "materials":         { label: "Create / edit materials",     group: "Training ops",   note: "Trainers are limited to materials they created." },
  "assign-training":   { label: "Assign training",             group: "Training ops",   note: "Trainers may assign only their own materials." },
  "attendance":        { label: "Record attendance",           group: "Training ops",   note: "Per event. Batch upload uses the HRDC template." },
  "session-setup":     { label: "Schedule sessions",           group: "Training ops",   note: "Capacity, waitlist and recurring templates." },
  "learning-paths":    { label: "Learning paths",              group: "Development",    note: "Templates for large departments, manual for small teams." },
  "idp":               { label: "Individual Development Plan", group: "Development",    note: "Jointly set by HR and the staff member's superior." },
  "training-kpi":      { label: "Training KPI contribution",   group: "Development",    note: "Splits Product vs Skill-Based training." },
  "scoreboard":        { label: "Training scoreboard",         group: "Reporting",      note: "Org-wide completion reporting." },
  "users":             { label: "User management",             group: "Administration", note: "Super Admin grants the trainer permission." },
  "access":            { label: "Role access matrix",          group: "Administration", note: "This screen." },
};

// ── The matrix ────────────────────────────────────────────────────────────────
// Read as: ACCESS[feature][role] = how much of that feature the role may act on.
export const ACCESS: Record<Feature, Record<Role, Scope>> = {
  "portal":            { admin: "own",  hr: "own",  manager: "own",  trainer: "own",  staff: "own"  },
  "calendar":          { admin: "all",  hr: "all",  manager: "all",  trainer: "all",  staff: "all"  },
  "register":          { admin: "own",  hr: "own",  manager: "own",  trainer: "own",  staff: "own"  },
  "profile":           { admin: "own",  hr: "all",  manager: "team", trainer: "own",  staff: "own"  },
  // Recognition works only if everyone can see who is sharing — viewing is company-wide.
  "sharing-session":   { admin: "all",  hr: "all",  manager: "all",  trainer: "all",  staff: "all"  },
  "trainer-dashboard": { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "none" },
  "materials":         { admin: "all",  hr: "all",  manager: "none", trainer: "own",  staff: "none" },
  "assign-training":   { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "none" },
  "attendance":        { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "none" },
  "session-setup":     { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "none" },
  "learning-paths":    { admin: "all",  hr: "all",  manager: "team", trainer: "none", staff: "none" },
  "idp":               { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "own"  },
  "training-kpi":      { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "own"  },
  "scoreboard":        { admin: "all",  hr: "all",  manager: "team", trainer: "own",  staff: "none" },
  "users":             { admin: "all",  hr: "all",  manager: "none", trainer: "none", staff: "none" },
  "access":            { admin: "all",  hr: "all",  manager: "none", trainer: "none", staff: "none" },
};

/** Roles that may see a feature but never change it. */
export const READ_ONLY: Partial<Record<Feature, Role[]>> = {
  "idp":          ["staff", "trainer"],
  "training-kpi": ["staff", "trainer", "manager"],
};

export function scopeOf(role: Role, feature: Feature): Scope {
  return ACCESS[feature]?.[role] ?? "none";
}
export function can(role: Role, feature: Feature): boolean {
  return scopeOf(role, feature) !== "none";
}
export function canEdit(role: Role, feature: Feature): boolean {
  return can(role, feature) && !(READ_ONLY[feature] ?? []).includes(role);
}

export const SCOPE_LABEL: Record<Scope, string> = {
  none: "No access",
  own:  "Own records",
  team: "Team / department",
  all:  "Company-wide",
};

export const SCOPE_STYLE: Record<Scope, { color: string; bg: string }> = {
  none: { color: "#C4C9D4", bg: "#F9FAFB" },
  own:  { color: "#6B7280", bg: "#F3F4F6" },
  team: { color: "#1D4ED8", bg: "#EFF6FF" },
  all:  { color: "#059669", bg: "#ECFDF5" },
};

// ── Session helpers ───────────────────────────────────────────────────────────
// auth.ts owns the session. Its organisational roles map onto the training
// roles used by the matrix above.
const ROLE_FROM_AUTH: Record<OrganisationalRole, Role> = {
  super_admin: "admin",
  hr:          "hr",
  manager_hod: "manager",
  trainer:     "trainer",
  employee:    "staff",
};

/** The organisational role each training role signs in as. */
export const ROLE_TO_AUTH: Record<Role, OrganisationalRole> = {
  admin:   "super_admin",
  hr:      "hr",
  manager: "manager_hod",
  trainer: "trainer",
  staff:   "employee",
};

export function currentRole(): Role {
  if (typeof window === "undefined") return "staff";
  const account = getCurrentAccount();
  return account ? ROLE_FROM_AUTH[account.role] : "staff";
}

export function currentUserName(): string {
  if (typeof window === "undefined") return "Ahmad Samsudin";
  const n = localStorage.getItem("userName");
  if (!n) return "Ahmad Samsudin";
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Re-renders when the role changes (login, or the header role switcher). */
export function useRole(): Role {
  const [role, setRole] = useState<Role>(currentRole);
  useEffect(() => {
    const h = () => setRole(currentRole());
    window.addEventListener("userRoleChange", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("userRoleChange", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return role;
}

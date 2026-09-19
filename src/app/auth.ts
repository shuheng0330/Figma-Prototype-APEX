export type OrganisationalRole = "employee" | "manager_hod" | "trainer" | "hr" | "super_admin";

export interface PrototypeAccount {
  name: string;
  email: string;
  password: string;
  role: OrganisationalRole;
  roleLabel: string;
  landingPath: string;
}

export const SAMPLE_ACCOUNTS: PrototypeAccount[] = [
  { name: "Employee A", email: "employee@apex.test", password: "demo1234", role: "employee", roleLabel: "Employee", landingPath: "/performance/my-kpi-plan" },
  { name: "Manager A", email: "manager@apex.test", password: "demo1234", role: "manager_hod", roleLabel: "Manager / HOD", landingPath: "/dashboard" },
  { name: "Trainer A", email: "trainer@apex.test", password: "demo1234", role: "trainer", roleLabel: "Trainer", landingPath: "/upload" },
  { name: "HR A", email: "hr@apex.test", password: "demo1234", role: "hr", roleLabel: "HR", landingPath: "/performance/hr-appraisals" },
  { name: "Super Admin", email: "admin@apex.test", password: "demo1234", role: "super_admin", roleLabel: "Super Admin", landingPath: "/performance/review-periods" },
];

// Training routes every role may reach for its own record.
const SELF_TRAINING_PATHS = [
  "/portal", "/calendar", "/profile", "/register",
  "/sharing-sessions", "/idp", "/training-kpi",
];

// Training routes for roles that run sessions.
const TRAINING_OPS_PATHS = ["/trainer-dashboard", "/attendance"];

const EMPLOYEE_PATHS = [
  "/performance", "/performance/my-kpi-plan", "/performance/my-assessments",
  ...SELF_TRAINING_PATHS,
];

const MANAGER_PATHS = [
  ...EMPLOYEE_PATHS, "/dashboard", "/staff-profile",
  "/performance/department-kpis", "/performance/team-reviews", "/performance/final-appraisals",
  ...TRAINING_OPS_PATHS, "/learning-paths",
];

const HR_PATHS = [
  ...EMPLOYEE_PATHS, "/org-eval", "/dashboard", "/staff-profile", "/performance/hr-appraisals",
  ...TRAINING_OPS_PATHS, "/learning-paths", "/access",
];

const SUPER_ADMIN_PATHS = [
  "/upload", "/review", "/quiz-review", "/assign-training", "/training-score",
  "/performance/review-periods", "/performance/company-kpis",
  "/performance/attitude-setup", "/org-eval", "/dashboard", "/staff-profile",
  "/users",
  ...SELF_TRAINING_PATHS, ...TRAINING_OPS_PATHS, "/learning-paths", "/access",
];

const TRAINER_PATHS = [
  "/upload", "/review", "/quiz-review", "/assign-training", "/training-score",
  ...SELF_TRAINING_PATHS, ...TRAINING_OPS_PATHS,
];

export const ROLE_PATHS: Record<OrganisationalRole, string[]> = {
  employee: EMPLOYEE_PATHS,
  manager_hod: MANAGER_PATHS,
  trainer: TRAINER_PATHS,
  hr: HR_PATHS,
  super_admin: SUPER_ADMIN_PATHS,
};

export function getCurrentAccount(): PrototypeAccount | null {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") as OrganisationalRole | null;
  if (!email || !role) return null;
  return SAMPLE_ACCOUNTS.find(account => account.email === email && account.role === role) ?? null;
}

export function pathIsAllowed(role: OrganisationalRole, pathname: string): boolean {
  const capabilityRoutes: Array<[string, PerformanceCapability]> = [
    ["/performance/my-kpi-plan", "own-performance"],
    ["/performance/my-assessments", "own-performance"],
    ["/performance/department-kpis", "department-kpis"],
    ["/performance/team-reviews", "team-reviews"],
    ["/performance/final-appraisals", "team-appraisals"],
    ["/performance/hr-appraisals", "hr-appraisals"],
    ["/performance/review-periods", "review-period-admin"],
    ["/performance/company-kpis", "company-kpi-admin"],
    ["/performance/attitude-setup", "attitude-admin"],
    ["/org-eval", "organisation-performance"],
    ["/users", "user-admin"],
  ];
  const matched = capabilityRoutes.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (matched) return hasCapability(role, matched[1]);

  if (pathname === "/performance") return hasCapability(role, "own-performance");
  if (pathname === "/dashboard") return hasCapability(role, "team-performance") || hasCapability(role, "organisation-performance");
  if (pathname.startsWith("/staff-profile/")) return hasCapability(role, "team-performance") || hasCapability(role, "organisation-performance") || hasCapability(role, "hr-appraisals");

  const allowed = ROLE_PATHS[role];
  if (allowed.includes(pathname)) return true;
  const dynamicParents = [
    "/staff-profile", "/register",
    "/performance/review-periods",
    "/performance/final-appraisals",
    "/performance/hr-appraisals",
  ];
  return dynamicParents.some(parent => allowed.includes(parent) && pathname.startsWith(`${parent}/`));
}

export function signIn(account: PrototypeAccount) {
  localStorage.setItem("userRole", account.role);
  localStorage.setItem("userName", account.name);
  localStorage.setItem("userEmail", account.email);
}

export function signOut() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("appraisalRole");
}
import { hasCapability, type PerformanceCapability } from "./performance/domain";

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

const EMPLOYEE_PATHS = [
  "/performance", "/performance/my-kpi-plan", "/performance/my-assessments",
  "/portal", "/calendar", "/profile",
];

const MANAGER_PATHS = [
  ...EMPLOYEE_PATHS, "/dashboard", "/staff-profile",
  "/performance/department-kpis", "/performance/team-reviews", "/performance/final-appraisals",
];

const HR_PATHS = [
  ...EMPLOYEE_PATHS, "/org-eval", "/staff-profile", "/performance/hr-appraisals",
];

const SUPER_ADMIN_PATHS = [
  "/upload", "/review", "/quiz-review", "/assign-training", "/training-score",
  "/performance/review-periods", "/performance/company-kpis",
  "/performance/attitude-setup", "/org-eval", "/staff-profile",
  "/users",
];

const TRAINER_PATHS = [
  "/upload", "/review", "/quiz-review", "/assign-training", "/training-score",
  "/portal", "/calendar", "/profile",
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
  const allowed = ROLE_PATHS[role];
  if (allowed.includes(pathname)) return true;
  const dynamicParents = [
    "/staff-profile",
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

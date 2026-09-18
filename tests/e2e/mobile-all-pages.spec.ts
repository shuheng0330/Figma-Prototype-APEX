import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

type RouteCase = {
  label: string;
  path: string;
  account: { role: string; name: string; email: string };
};

const employee = { role: "employee", name: "Employee A", email: "employee@apex.test" };
const manager = { role: "manager_hod", name: "Manager A", email: "manager@apex.test" };
const trainer = { role: "trainer", name: "Trainer A", email: "trainer@apex.test" };
const hr = { role: "hr", name: "HR A", email: "hr@apex.test" };
const admin = { role: "super_admin", name: "Super Admin", email: "admin@apex.test" };

const routes: RouteCase[] = [
  { label: "employee-performance", path: "/performance", account: employee },
  { label: "employee-kpi-plan", path: "/performance/my-kpi-plan", account: employee },
  { label: "employee-assessments", path: "/performance/my-assessments", account: employee },
  { label: "learning-portal", path: "/portal", account: employee },
  { label: "training-calendar", path: "/calendar", account: employee },
  { label: "my-profile", path: "/profile", account: employee },
  { label: "department-kpis", path: "/performance/department-kpis", account: manager },
  { label: "team-reviews", path: "/performance/team-reviews", account: manager },
  { label: "team-performance", path: "/dashboard", account: manager },
  { label: "team-appraisals", path: "/performance/final-appraisals", account: manager },
  { label: "final-appraisal", path: "/performance/final-appraisals/amir?period=2027%20Annual%20KPI%20Review", account: manager },
  { label: "hr-queue", path: "/performance/hr-appraisals", account: hr },
  { label: "hr-appraisal", path: "/performance/hr-appraisals/nurul?period=2027%20Annual%20KPI%20Review", account: hr },
  { label: "organisation-performance", path: "/org-eval", account: admin },
  { label: "user-management", path: "/users", account: admin },
  { label: "review-periods", path: "/performance/review-periods", account: admin },
  { label: "review-period-create", path: "/performance/review-periods/new", account: admin },
  { label: "review-period-edit", path: "/performance/review-periods/2027/edit", account: admin },
  { label: "review-period-view", path: "/performance/review-periods/2027/view", account: admin },
  { label: "company-kpis", path: "/performance/company-kpis", account: admin },
  { label: "attitude-setup", path: "/performance/attitude-setup", account: admin },
  { label: "upload-sop", path: "/upload", account: trainer },
  { label: "review-materials", path: "/review", account: trainer },
  { label: "review-quizzes", path: "/quiz-review", account: trainer },
  { label: "assign-training", path: "/assign-training", account: trainer },
  { label: "training-scoreboard", path: "/training-score", account: trainer },
];

async function useAccount(page: Page, account: RouteCase["account"]) {
  await page.addInitScript(value => {
    localStorage.setItem("userRole", value.role);
    localStorage.setItem("userName", value.name);
    localStorage.setItem("userEmail", value.email);
  }, account);
}

for (const route of routes) {
  test(`${route.label} has a contained mobile layout`, async ({ page }) => {
    await useAccount(page, route.account);
    await page.goto(route.path);
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect.poll(() => page.evaluate(() => {
      const main = document.querySelector("main");
      return main ? Math.round(main.getBoundingClientRect().width) : 0;
    })).toBe(390);
    if (process.env.MOBILE_AUDIT_SCREENSHOTS) {
      const outputDir = resolve("output/mobile-audit");
      mkdirSync(outputDir, { recursive: true });
      await page.screenshot({ path: resolve(outputDir, `${route.label}.png`) });
    }
  });
}

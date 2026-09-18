import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

async function signInAs(page: import("@playwright/test").Page, role: string, name: string, email: string) {
  await page.addInitScript(({ role, name, email }) => {
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
  }, { role, name, email });
}

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))).toEqual({ pageWidth: 390, viewportWidth: 390 });
}

test("admin review periods fit a phone and use off-canvas navigation", async ({ page }) => {
  await signInAs(page, "super_admin", "Super Admin", "admin@apex.test");
  await page.goto("/performance/review-periods");

  await expect(page.getByRole("heading", { name: "Review Periods", exact: true })).toBeVisible();
  await expectNoPageOverflow(page);

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { name: "Company KPIs" })).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).first().click();
  const navigation = page.locator("#apex-navigation");
  await expect.poll(async () => (await navigation.boundingBox())?.x).toBeLessThan(-100);
});

test("manager review drawer becomes a full-width mobile panel", async ({ page }) => {
  await signInAs(page, "manager_hod", "Manager A", "manager@apex.test");
  await page.goto("/performance/team-reviews");
  await page.evaluate(() => {
    const key = "apex-performance-store-v7";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    state.employeeKpiPlansByPeriod["2027 Annual KPI Review"] = [{
      id: "mobile-review-kpi",
      employeeId: "amir",
      level: "Individual",
      perspective: "Customer",
      kra: "Growth",
      name: "Customer Acquisition",
      target: "10 customers",
      weightage: 100,
      status: "Pending Approval",
      version: 1,
      scoreDef: { s5: "5", s4: "4", s3: "3", s2: "2", s1: "1" },
    }];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Team Review Workspace", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review", exact: true }).click();

  const drawer = page.locator(".fixed.right-0");
  await expect(drawer).toBeVisible();
  await expect.poll(async () => (await drawer.boundingBox())?.width).toBe(390);
  await expectNoPageOverflow(page);
});

test("employee assessment workspace remains usable at phone width", async ({ page }) => {
  await signInAs(page, "employee", "Employee A", "employee@apex.test");
  await page.goto("/performance/my-assessments");

  await expect(page.getByRole("heading", { name: "My Assessments" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expectNoPageOverflow(page);
});

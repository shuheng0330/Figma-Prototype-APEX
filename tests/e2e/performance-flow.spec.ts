import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const accounts = {
  employee: { role: "employee", name: "Employee A", email: "employee@apex.test" },
  manager: { role: "manager_hod", name: "Manager A", email: "manager@apex.test" },
  hr: { role: "hr", name: "HR A", email: "hr@apex.test" },
  admin: { role: "super_admin", name: "Super Admin", email: "admin@apex.test" },
  trainer: { role: "trainer", name: "Trainer A", email: "trainer@apex.test" },
} as const;

async function useAccount(page: Page, account: (typeof accounts)[keyof typeof accounts]) {
  await page.addInitScript((value) => {
    localStorage.setItem("userRole", value.role);
    localStorage.setItem("userName", value.name);
    localStorage.setItem("userEmail", value.email);
  }, account);
}

async function switchAccount(page: Page, account: (typeof accounts)[keyof typeof accounts]) {
  await page.evaluate((value) => {
    localStorage.setItem("userRole", value.role);
    localStorage.setItem("userName", value.name);
    localStorage.setItem("userEmail", value.email);
  }, account);
}

async function seed2028Prerequisites(page: Page) {
  await page.evaluate(() => {
    const key = "apex-performance-store-v7";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    const period = state.reviewPeriods.find((item: any) => item.id === "2028");
    period.configuredStatus = "Open";
    state.effectiveDate = "2028-02-01";
    const scoreDef = { s5:"5", s4:"4", s3:"3", s2:"2", s1:"1" };
    state.companyKpisByPeriod[period.name] = [{ id:"company-2028", perspective:"Financial", kra:"Growth", name:"2028 Company Growth", target:"10%", weightage:15, status:"Published", version:1, scoreDef }];
    state.departmentKpisByPeriod[period.name] = [{ id:"department-2028", departmentId:"retail-sales", perspective:"Customer", kra:"Sales", name:"2028 Retail Sales", target:"25%", weightage:25, status:"Published", version:1, scoreDef }];
    state.employeeKpiPlansByPeriod[period.name] = [{ id:"individual-2028", employeeId:"amir", level:"Individual", perspective:"Customer", kra:"Growth", name:"2028 Customer Acquisition", target:"10 customers", weightage:60, status:"Approved", version:1, scoreDef }];
    state.attitudeSnapshotsByPeriod["2028"] = { sharedCriteria:[{id:"respect",name:"Respect",description:"Treats others respectfully.",status:"Active"}], salesCriteria:[{id:"sales-drive",name:"Sales Drive",description:"Pursues sales opportunities.",status:"Active"}], managerCriteria:[], nonSalesCriteria:[] };
    localStorage.setItem(key, JSON.stringify(state));
  });
}

test("review periods expose the demo clock and confirmed TBC gaps", async ({ page }) => {
  await useAccount(page, accounts.admin);
  await page.goto("/performance/review-periods");
  await expect(page.getByRole("heading", { name: "Review Periods", exact: true })).toBeVisible();
  await expect(page.getByText("Prototype Simulation Date")).toBeVisible();
  await expect(page.getByText("Review Period closure")).toBeVisible();
  await expect(page.getByText("Open-period KPI revision")).toBeVisible();
  await expect(page.getByText("Working Day deadlines")).toHaveCount(0);
});

test("January 2028 assessment uses the confirmed plan and persists through Superior review", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate((account) => {
    localStorage.setItem("userRole", account.role);
    localStorage.setItem("userName", account.name);
    localStorage.setItem("userEmail", account.email);
  }, accounts.employee);
  await page.goto("/performance/my-assessments");
  await seed2028Prerequisites(page);
  await page.reload();

  const assessmentRows = page.locator("table tbody tr");
  await expect(assessmentRows).toHaveCount(3);
  for (const row of await assessmentRows.all()) {
    await row.getByTitle("Meets Expectations", { exact: true }).click();
  }
  await page.getByRole("button", { name: "Submit Assessment" }).click();
  await page.locator(".fixed.inset-0").getByRole("button", { name: "Submit to Superior" }).click();
  await expect(page.getByText("Your KPI Self-Assessment for January 2028 has been submitted", { exact: false })).toBeVisible();

  await page.evaluate((account) => {
    localStorage.setItem("userRole", account.role);
    localStorage.setItem("userName", account.name);
    localStorage.setItem("userEmail", account.email);
  }, accounts.manager);
  await page.goto("/performance/team-reviews");
  const januaryRow = page.getByRole("row").filter({ hasText: "January 2028" });
  await expect(januaryRow).toContainText("Pending Review");
  await januaryRow.getByRole("button", { name: "Review" }).click();

  const drawer = page.locator(".fixed.right-0");
  for (const button of await drawer.getByTitle("Meets Expectations", { exact: true }).all()) await button.click();
  await drawer.getByRole("button", { name: "Submit Review" }).click();
  await page.getByRole("button", { name: "Complete Review" }).click();
  await expect(januaryRow).toContainText("Reviewed");

  await page.evaluate((account) => {
    localStorage.setItem("userRole", account.role);
    localStorage.setItem("userName", account.name);
    localStorage.setItem("userEmail", account.email);
  }, accounts.employee);
  await page.goto("/performance/my-assessments");
  await expect(page.getByText("Reviewed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Your KPI Self-Assessment has been reviewed", { exact: false })).toBeVisible();
});

test("future checkpoints are unavailable and assessments use Point terminology", async ({ page }) => {
  await useAccount(page, accounts.employee);
  await page.goto("/performance/my-assessments");
  await seed2028Prerequisites(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "My Assessments" })).toBeVisible();
  await expect(page.getByText("Self-Assessment Point", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("2028 Annual KPI Review", { exact: false }).first()).toBeVisible();
  await expect(page.locator('select option[value="jan"]')).not.toBeDisabled();
  await expect(page.locator('select option[value="feb"]')).toBeDisabled();
});

test("dashboard defaults to latest period with results, not the newer empty period", async ({ page }) => {
  await useAccount(page, accounts.admin);
  await page.goto("/org-eval");
  await expect(page.getByRole("heading", { name: "Organisation Performance", exact: true })).toBeVisible();
  await expect(page.getByText("2027 Annual KPI Review", { exact: false }).first()).toBeVisible();
});

test("role guards use the same capability rules as navigation", async ({ page }) => {
  await useAccount(page, accounts.hr);
  await page.goto("/performance/team-reviews");
  await expect(page).toHaveURL(/\/performance\/hr-appraisals$/);
  await expect(page.getByRole("heading", { name: "HR Appraisal Review" })).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await useAccount(page, accounts.manager);
  await page.goto("/performance/team-reviews");
  await expect(page.getByRole("heading", { name: "Team Review Workspace", exact: true })).toBeVisible();
});

test("appraisal status and approval method remain separate", async ({ page }) => {
  await useAccount(page, accounts.hr);
  await page.goto("/performance/hr-appraisals/nurul?period=2027%20Annual%20KPI%20Review");
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Final Appraisal Score", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("HR Remarks", { exact: false })).toHaveCount(0);
});

test("appraisal submission, HR approval, and Reset Demo Data share one persisted record", async ({ page }) => {
  await page.goto("/login");
  await switchAccount(page, accounts.admin);
  await page.goto("/performance/review-periods");
  await seed2028Prerequisites(page);
  await page.reload();
  await page.getByRole("button", { name: "Prepare Employee for Appraisal" }).click();
  await expect(page.getByText("Remaining prerequisites prepared", { exact:false })).toBeVisible();
  await switchAccount(page, accounts.manager);
  await page.goto("/performance/final-appraisals/amir?period=2028%20Annual%20KPI%20Review");
  await page.getByRole("button", { name: "Promotion", exact: true }).click();
  await page.locator("textarea").first().fill("Amir consistently delivered strong results and is ready for broader responsibilities.");
  await page.getByRole("button", { name: "Submit to HR", exact: true }).click();
  await page.locator(".fixed.inset-0").getByRole("button", { name: "Submit to HR", exact: true }).click();
  await expect(page.getByText("Pending Review", { exact: true }).first()).toBeVisible();

  await switchAccount(page, accounts.hr);
  await page.goto("/performance/hr-appraisals");
  const amirRow = page.getByRole("row").filter({ hasText: "Amir Hassan" });
  await expect(amirRow).toContainText("Pending Review");
  await amirRow.getByRole("button", { name: "Review Appraisal" }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.locator(".fixed.inset-0").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();

  await switchAccount(page, accounts.manager);
  await page.goto("/performance/final-appraisals/amir?period=2028%20Annual%20KPI%20Review");
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();

  await switchAccount(page, accounts.employee);
  await page.goto("/performance");
  await expect(page.locator("select").first()).toHaveValue("2028 Annual KPI Review");
  await expect(page.getByText("2028 Company Growth", { exact:true })).toBeVisible();
  await expect(page.getByText("Sales Form", { exact:true }).first()).toBeVisible();

  await switchAccount(page, accounts.manager);
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name:/Period 2028 Annual KPI Review/ })).toBeVisible();
  await expect(page.getByText("Amir Hassan", { exact:true }).first()).toBeVisible();

  await switchAccount(page, accounts.admin);
  await page.goto("/org-eval");
  await expect(page.getByRole("button", { name:/Period 2028 Annual KPI Review/ })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name:"Export PDF" }).click();
  const download = await downloadPromise;
  const outputDir = resolve("output/pdf");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = resolve(outputDir, "organisation-performance-summary-2028.pdf");
  await download.saveAs(outputPath);
  expect(download.suggestedFilename()).toBe("organisation-performance-summary-2028.pdf");
  expect(statSync(outputPath).size).toBeGreaterThan(20_000);

  page.once("dialog", dialog => dialog.accept());
  await page.goto("/performance/review-periods");
  await page.getByRole("button", { name: "Reset Demo Data" }).click();

  await switchAccount(page, accounts.hr);
  await page.goto("/performance/hr-appraisals");
  await expect(page.getByRole("row").filter({ hasText: "Amir Hassan" })).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: "Nurul Aina" })).toContainText("Pending Review");
});

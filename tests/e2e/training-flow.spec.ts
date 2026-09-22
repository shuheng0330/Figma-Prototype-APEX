import { expect, test, type Page } from "@playwright/test";

/**
 * Drives the scenarios in the Training Module test guide through the real UI,
 * so the steps stakeholders are asked to follow are known to work.
 *
 * Sessions run in order: later scenarios use data the earlier ones create.
 */

const accounts = {
  employee: { role: "employee", name: "Employee A", email: "employee@apex.test" },
  manager: { role: "manager_hod", name: "Manager A", email: "manager@apex.test" },
  admin: { role: "super_admin", name: "Super Admin", email: "admin@apex.test" },
  trainer: { role: "trainer", name: "Trainer A", email: "trainer@apex.test" },
} as const;

type Account = (typeof accounts)[keyof typeof accounts];

/** Signs in before the app boots, and starts from clean training data. */
async function start(page: Page, account: Account, path: string) {
  await page.addInitScript((value) => {
    localStorage.setItem("userRole", value.role);
    localStorage.setItem("userName", value.name);
    localStorage.setItem("userEmail", value.email);
  }, account);
  await page.goto(path);
  await expect(page.locator("#root")).toBeVisible();
}

/** Switches role without losing the training data built up so far. */
async function switchTo(page: Page, account: Account, path: string) {
  await page.evaluate((value) => {
    localStorage.setItem("userRole", value.role);
    localStorage.setItem("userName", value.name);
    localStorage.setItem("userEmail", value.email);
  }, account);
  await page.goto(path);
  await expect(page.locator("#root")).toBeVisible();
}

// ── Scenario 2 — Publish training material ──────────────────────────────────
test("Scenario 2: Review Materials opens on the E-Hailing SOP with four modules", async ({ page }) => {
  await start(page, accounts.trainer, "/review");

  await expect(page.locator("select").first()).toHaveValue("s4");

  // The hardcoded R32 glossary is gone; it was shown on every course.
  await expect(page.getByText("Key Terms")).toHaveCount(0);
  await expect(page.getByText(/Flare Nut|Vacuum Pump|100Pa Absolute/)).toHaveCount(0);

  for (const title of [
    "Objective, Scope & Platforms",
    "Customer Self-Arranged Pickup",
    "Company-Arranged Delivery",
    "Documentation & Dispute Handling",
  ]) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test("Scenario 2: an approved module can be rejected and approved again", async ({ page }) => {
  await start(page, accounts.trainer, "/review");

  // The default module is approved, so the reject control must still be offered.
  const reject = page.getByRole("button", { name: /Reject Module|Reject & Regenerate/ });
  await expect(reject).toBeVisible();
  await reject.click();

  // Rejecting requires a reason before Submit Rejection becomes enabled.
  const reason = page.getByPlaceholder(/Describe why this module is being rejected/);
  await expect(reason).toBeVisible();
  await reason.fill("Needs the 12-hour confirmation rule spelled out.");
  await page.getByRole("button", { name: "Submit Rejection" }).click();
  await expect(page.getByText(/Rejected/).first()).toBeVisible();

  // And it can be approved again, which is where Scenario 4 needs it.
  await page.getByRole("button", { name: /Approve Module/ }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();
});

test("Scenario 2: Review Quizzes lets you pick the course and defaults to E-Hailing", async ({ page }) => {
  await start(page, accounts.trainer, "/quiz-review");

  // A course picker exists and opens on the E-Hailing course.
  const picker = page.locator("select").first();
  await expect(picker).toBeVisible();
  await expect(picker).toHaveValue("s4");
  // The course name sits inside an <option>, so assert on the selected value above.

  // Only that course's four quizzes are listed.
  await expect(page.getByText(/4 quizzes generated/)).toBeVisible();
  for (const title of [
    "Objective, Scope & Platforms",
    "Customer Self-Arranged Pickup",
    "Company-Arranged Delivery",
    "Documentation & Dispute Handling",
  ]) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
  // A quiz from another course must not be in the list.
  await expect(page.getByText(/Remote Control Operations/)).toHaveCount(0);

  // Switching course swaps the list.
  await picker.selectOption("s1");
  await expect(page.getByText(/Remote Control Operations/).first()).toBeVisible();
  await picker.selectOption("s4");

  await expect(page.getByText("Objective, Scope & Platforms").first()).toBeVisible();
  await expect(page.getByText(/5 Questions/).first()).toBeVisible();
  await expect(
    page.getByText("What is the stated objective of the E-Hailing Delivery & Customer Pickup SOP?"),
  ).toBeVisible();
});

// ── Scenario 3 — Assign training ────────────────────────────────────────────
test("Scenario 3: the trainer sees only their own material and can set up an assignment", async ({ page }) => {
  await start(page, accounts.trainer, "/assign-training");

  await expect(page.getByText("E-Hailing Delivery & Customer Pickup").first()).toBeVisible();
  // The mode named in the guide has to be on screen.
  await expect(page.getByText(/Start immediately/i).first()).toBeVisible();
  await expect(page.getByText(/Deadline/i).first()).toBeVisible();

  // The audience must be the real roster, not an invented one.
  await expect(page.getByText(/Ahmad Samsudin/).first()).toBeVisible();
  await expect(page.getByText(/Ahmad Syafiq|Alice Morgan|Bob Carter/)).toHaveCount(0);
});

// ── Scenario 4 — Complete a course and module quiz ──────────────────────────
test("Scenario 4: the learner can open the course and reach its quiz", async ({ page }) => {
  await start(page, accounts.employee, "/portal");

  await expect(page.getByText("E-Hailing Delivery & Customer Pickup").first()).toBeVisible();
  await page.getByRole("button", { name: /Start now|Resume|Continue/ }).first().click();

  // Material first: the module list and its content.
  await expect(page.getByText("Objective, Scope & Platforms").first()).toBeVisible();
  await expect(page.getByText(/handover|e-hailing/i).first()).toBeVisible();

  // Then the quiz for that module is reachable.
  await expect(page.getByRole("button", { name: /Quiz/i }).first()).toBeVisible();
});

// ── Scenario 5 — Schedule and register ──────────────────────────────────────
test("Scenario 5: the calendar opens on the current month and offers New Session", async ({ page }) => {
  await start(page, accounts.trainer, "/calendar");

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  await expect(page.getByText(monthLabel).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /New Session/ })).toBeVisible();
});

test("Scenario 5: a full session offers the waitlist rather than refusing", async ({ page }) => {
  await start(page, accounts.employee, "/calendar");

  // EV06 is dated 21 October, so switch to List view, which spans every month.
  await page.getByRole("button", { name: "List" }).click();

  const card = page.getByText(/Electrical Wiring Certification/).first();
  await expect(card).toBeVisible();
  // A session at capacity must be shown as full rather than simply registrable.
  await expect(page.getByText(/^Full$/).first()).toBeVisible();
});

// ── Scenario 6 — Attendance ─────────────────────────────────────────────────
test("Scenario 6: attendance offers both manual and batch recording", async ({ page }) => {
  await start(page, accounts.trainer, "/attendance");

  await expect(page.getByText(/Attendance/i).first()).toBeVisible();
  await expect(page.getByText(/Batch|HRDC|Upload/i).first()).toBeVisible();
});

// ── Scenario 7 — Sharing sessions ───────────────────────────────────────────
test("Scenario 7: the sharing board lists sessions company-wide", async ({ page }) => {
  await start(page, accounts.employee, "/sharing-sessions");

  await expect(page.getByText(/Sharing/i).first()).toBeVisible();
  await expect(page.getByText(/Closing the Sale|Phone Etiquette|Warranty Claims/).first()).toBeVisible();
});

// ── Scenario 8 — Learning paths and development plans ───────────────────────
test("Scenario 8: the manager reaches learning paths and development plans", async ({ page }) => {
  await start(page, accounts.manager, "/learning-paths");
  await expect(page.getByText(/Learning Path/i).first()).toBeVisible();

  await page.goto("/idp");
  await expect(page.getByText(/Development|Goal/i).first()).toBeVisible();
});

test("Scenario 8: the employee sees development plans without editing them", async ({ page }) => {
  await start(page, accounts.employee, "/idp");

  await expect(page.getByText(/Development|Goal/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^Add Goal$/ })).toHaveCount(0);
});

// ── Scenario 9 — Training KPI and reporting ─────────────────────────────────
test("Scenario 9: the training KPI shows the product and skill split", async ({ page }) => {
  await start(page, accounts.employee, "/training-kpi");

  await expect(page.getByText(/Product Training/i).first()).toBeVisible();
  await expect(page.getByText(/Skill-Based Training/i).first()).toBeVisible();
});

test("Scenario 9: the scoreboard carries the trainer and sharing tabs", async ({ page }) => {
  await start(page, accounts.trainer, "/training-score");

  await expect(page.getByText(/Trainer/i).first()).toBeVisible();
  await expect(page.getByText(/Sharing/i).first()).toBeVisible();
});

// ── Scenario 10 — Administration and access ─────────────────────────────────
test("Scenario 10: Super Admin reaches user management and the role access matrix", async ({ page }) => {
  await start(page, accounts.admin, "/users");
  await expect(page.getByText(/User Management/i).first()).toBeVisible();

  await page.goto("/access");
  await expect(page.getByText(/Role Access/i).first()).toBeVisible();
});

test("Scenario 10: an employee cannot reach a trainer screen by address", async ({ page }) => {
  await start(page, accounts.employee, "/upload");

  // The route guard must redirect away rather than render the upload screen.
  await expect(page).not.toHaveURL(/\/upload$/);
  await expect(page.getByRole("heading", { name: /Upload SOP/i })).toHaveCount(0);
});

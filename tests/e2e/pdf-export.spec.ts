import { expect, test } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

test("exports the formatted 2027 organisation report", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("userRole", "super_admin");
    localStorage.setItem("userName", "Super Admin");
    localStorage.setItem("userEmail", "admin@apex.test");
  });
  await page.goto("/org-eval");
  await expect(page.getByText("2027 Annual KPI Review", { exact: false }).first()).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click();
  const download = await downloadPromise;
  const outputDir = resolve("output/pdf");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = resolve(outputDir, "organisation-performance-summary-2027.pdf");
  await download.saveAs(outputPath);
  expect(download.suggestedFilename()).toBe("organisation-performance-summary-2027.pdf");
  expect(statSync(outputPath).size).toBeGreaterThan(20_000);
});

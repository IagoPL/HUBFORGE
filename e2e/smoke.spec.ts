import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("smoke", () => {
  test("landing renders brand and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Build together without losing context",
    );
    await expect(page.getByRole("link", { name: /Enter demo workspace/i })).toBeVisible();
  });

  test("demo workspace overview is reachable", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Aurora Launch" })).toBeVisible();
  });

  test("landing has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
});

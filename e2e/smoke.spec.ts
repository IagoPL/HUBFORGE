import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("smoke", () => {
  test("landing renders brand and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Build together without losing context",
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /Sign in|Iniciar sesión/i })
        .first(),
    ).toBeVisible();
  });

  test("login offers GitHub OAuth CTA", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in|Iniciar sesión/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with GitHub|Continuar con GitHub/i }),
    ).toBeVisible();
  });

  test("language switcher is available on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("group", { name: /Language|Idioma/i })).toBeVisible();
    await page.getByRole("button", { name: /Spanish|Español/i }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Construid juntos sin perder el contexto",
    );
  });

  test("landing has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });

  test("privacy and terms pages render", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unauthenticated /app redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });

  test("live workspace overview when E2E_LIVE=1", async ({ page }) => {
    test.skip(
      process.env.E2E_LIVE !== "1",
      "Set E2E_LIVE=1 with an authenticated session to run live workspace checks.",
    );
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { level: 1, name: /Briefing/i }),
    ).toBeVisible();
  });
});

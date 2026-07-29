import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("smoke", () => {
  test("landing renders brand and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Build together without losing context",
    );
    await expect(
      page.getByRole("link", { name: /Open workspace|Abrir espacio/i }).first(),
    ).toBeVisible();
  });

  test("app requires sign in", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /Sign in|Iniciar sesión/i }),
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
});

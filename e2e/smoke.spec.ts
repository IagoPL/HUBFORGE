import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("smoke", () => {
  test("landing renders brand and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /holding your project|frenando vuestro proyecto/i,
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /Connect GitHub|Conectar GitHub/i })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /Open demonstration|Abrir demostración/i })
        .first(),
    ).toBeVisible();
  });

  test("login offers GitHub OAuth CTA", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in|Iniciar sesión/i }),
    ).toBeVisible();
    const github = page.getByRole("button", {
      name: /Continue with GitHub|Continuar con GitHub/i,
    });
    await expect(github).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).not.toMatch(
      /NEXT_PUBLIC_SUPABASE|Supabase Auth|proxy de Next\.js|anon key/i,
    );
    if (!(await github.isEnabled())) {
      await expect(
        page
          .getByRole("status")
          .or(
            page.getByText(
              /Sign in is temporarily unavailable|El inicio de sesión no está disponible temporalmente/i,
            ),
          ),
      ).toBeVisible();
    }
  });

  test("language switcher is available on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("group", { name: /Language|Idioma/i })).toBeVisible();
    await page.getByRole("button", { name: /Spanish|Español/i }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "frenando vuestro proyecto",
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

  test("demo mode is navigable without auth", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText(/Demonstration mode|Modo demostración/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Connect my repository|Conectar mi repositorio/i }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: /App/i })
      .getByRole("link", { name: /Attention|Atención/i })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Attention|Atención/i,
    );
    await page.goto("/demo/dependencies");
    await expect(
      page.getByText(/Character turnaround asset|blocks|bloque/i).first(),
    ).toBeVisible();
  });

  test("demo has no serious accessibility violations", async ({ page }) => {
    await page.goto("/demo");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });

  test("chat route soft-retires to briefing", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/app/chat");
    await expect(page).toHaveURL(/\/login/);
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
    await page.goto("/app/chat");
    await expect(page).toHaveURL(/\/app(\?notice=chat-retired)?$/);
  });
});

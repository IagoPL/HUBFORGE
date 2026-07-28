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

  test("can create organization and project in demo mode", async ({ page }) => {
    await page.goto("/app/organizations");
    await page
      .getByLabel(/Organization name|Nombre de la organización/i)
      .fill("Forge Studio");
    await page
      .getByRole("button", { name: /Create organization|Crear organización/i })
      .click();
    await expect(page.getByText("Forge Studio").first()).toBeVisible();

    await page.goto("/app/projects");
    await page.getByLabel(/Project name|Nombre del proyecto/i).fill("Alpha Board");
    await page.getByLabel(/Description|Descripción/i).fill("First real project");
    await page.getByRole("button", { name: /Create project|Crear proyecto/i }).click();
    await expect(page.getByRole("heading", { name: "Alpha Board" })).toBeVisible();
  });

  test("can invite a member and create a task in demo mode", async ({ page }) => {
    await page.goto("/app/team");
    await page.getByLabel(/Email|Correo/i).fill("casey@example.com");
    await page
      .getByLabel(/Functional role|Rol funcional/i)
      .first()
      .fill("QA Engineer");
    await page.getByRole("button", { name: /Invite member|Invitar miembro/i }).click();
    await expect(page.getByText("casey@example.com")).toBeVisible();

    await page.goto("/app/tasks");
    await page.getByLabel(/^Title$|^Título$/i).fill("Write acceptance checks");
    await page.getByRole("button", { name: /Create task|Crear tarea/i }).click();
    await expect(page.getByText("Write acceptance checks").first()).toBeVisible();
  });
});

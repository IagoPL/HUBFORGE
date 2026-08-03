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
    // Surface title lives in the shell title block; project context is a crumb.
    await expect(page.getByRole("heading", { name: /Briefing|Resumen/i })).toBeVisible();
    await expect(page.getByText("Aurora Launch").first()).toBeVisible();
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
    await expect(page.getByText("Alpha Board").first()).toBeVisible();
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
    // The create form sits inside a collapsed details panel.
    await page.locator("details summary").filter({ hasText: /Create task|Crear tarea/i }).click();
    await page.getByLabel(/^Title$|^Título$/i).fill("Write acceptance checks");
    await page.getByRole("button", { name: /Create task|Crear tarea/i }).click();
    await expect(page.getByText("Write acceptance checks").first()).toBeVisible();
  });

  test("can add availability and mark a notification as read", async ({ page }) => {
    await page.goto("/app/calendar");
    const note = page.getByLabel(/Note|Nota/i);
    await note.fill("Deep work block");
    await expect(note).toHaveValue("Deep work block");
    await page
      .getByRole("button", {
        name: /Add availability window|Añadir ventana de disponibilidad/i,
      })
      .click();
    await expect(page.getByText("Deep work block")).toBeVisible();

    await page.goto("/app");
    await expect(
      page.getByRole("heading", {
        name: /Latest notifications|Últimas notificaciones/i,
      }),
    ).toBeVisible();
    const markRead = page
      .getByRole("button", { name: /Mark as read|Marcar como leída/i })
      .first();
    if (await markRead.isVisible()) {
      await markRead.click();
    }
  });

  test("can link a GitHub repository in demo mode", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.goto("/app/github");
    // Panel title moved into the shell; assert the surface and the form.
    await expect(page.getByRole("heading", { name: /^GitHub$/i })).toBeVisible();
    const repoInput = page.getByLabel(/Repository|Repositorio/i);
    await expect(repoInput).toBeVisible();
    await repoInput.fill("IagoPL/HUBFORGE");
    await page
      .getByRole("button", { name: /Link repository|Vincular repositorio/i })
      .click();
    await expect(page.getByRole("link", { name: "IagoPL/HUBFORGE" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/Wire GitHub App webhooks/i)).toBeVisible();
  });

  test("can send a chat message in demo mode", async ({ page }) => {
    await page.goto("/app/chat");
    await expect(page.getByRole("heading", { name: /^Chat$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /#general/i })).toBeVisible();
    await page
      .getByLabel(/Write a message|Escribe un mensaje/i)
      .fill("Hello from demo chat");
    await page.getByRole("button", { name: /^Send$|^Enviar$/i }).click();
    await expect(page.getByText("Hello from demo chat")).toBeVisible();
  });
});

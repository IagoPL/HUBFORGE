import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GitHubSignInControl } from "@/features/authentication/github-sign-in-button";
import { LoginScreen } from "@/features/authentication/login-screen";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";

function renderLogin(
  options: {
    locale?: "en" | "es";
    configured?: boolean;
    showError?: boolean;
  } = {},
) {
  const locale = options.locale ?? "en";
  const copy = locale === "es" ? es.login : en.login;
  return render(
    <LoginScreen
      copy={copy}
      configured={options.configured ?? true}
      showError={options.showError ?? false}
      next="/app"
      action={() => undefined}
    />,
  );
}

const leakPatterns = [
  /NEXT_PUBLIC_SUPABASE/i,
  /SUPABASE_SERVICE_ROLE/i,
  /Supabase Auth/i,
  /Supabase aún/i,
  /proxy de Next\.js/i,
  /Next\.js proxy/i,
  /anon key/i,
  /publishable key/i,
  /publishable\/anon/i,
  /\.env\.local/i,
];

function assertNoTechnicalLeaks(container: HTMLElement) {
  const text = container.textContent ?? "";
  for (const pattern of leakPatterns) {
    expect(text).not.toMatch(pattern);
  }
}

describe("LoginScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("enables the GitHub button when auth is ready", () => {
    renderLogin({ configured: true, locale: "en" });
    expect(screen.getByRole("button", { name: en.login.continueGithub })).toBeEnabled();
    expect(screen.getByRole("heading", { name: en.login.title })).toBeVisible();
    expect(screen.getByText(en.login.body)).toBeVisible();
    expect(screen.queryByText(en.login.unavailable)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    assertNoTechnicalLeaks(document.body);
  });

  it("disables the GitHub button and shows a human message when auth is not ready", () => {
    renderLogin({ configured: false, locale: "es" });
    expect(screen.getByRole("button", { name: es.login.continueGithub })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(es.login.unavailable);
    expect(screen.queryByText(es.login.body)).not.toBeInTheDocument();
    assertNoTechnicalLeaks(document.body);
  });

  it("never surfaces configuration internals in production copy", () => {
    renderLogin({ configured: false, locale: "en" });
    expect(screen.getByText(en.login.unavailable)).toBeVisible();
    assertNoTechnicalLeaks(document.body);
  });

  it("renders Spanish login copy", () => {
    renderLogin({ configured: true, locale: "es" });
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    expect(
      screen.getByText("Continúa con GitHub para acceder a HubForge."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Continuar con GitHub" })).toBeEnabled();
  });

  it("renders English login copy", () => {
    renderLogin({ configured: true, locale: "en" });
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByText("Continue with GitHub to access HubForge.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
  });

  it("shows a human error without implementation details", () => {
    renderLogin({ configured: true, showError: true, locale: "en" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(en.login.error);
    assertNoTechnicalLeaks(document.body);
  });
});

describe("GitHubSignInControl loading state", () => {
  afterEach(() => {
    cleanup();
  });

  it("prevents a second submit and keeps the control size stable", () => {
    render(
      <form>
        <GitHubSignInControl
          idleLabel={en.login.continueGithub}
          pendingLabel={en.login.connectingGithub}
          pending
        />
      </form>,
    );
    const button = screen.getByRole("button", { name: en.login.connectingGithub });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Connecting to GitHub…");
  });
});

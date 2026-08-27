import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";

const forbidden = [
  "NEXT_PUBLIC_SUPABASE",
  "SUPABASE_SERVICE_ROLE",
  "Supabase Auth",
  "Supabase aún",
  "proxy de Next.js",
  "Next.js proxy",
  "anon key",
  "publishable key",
  "publishable/anon",
  ".env.local",
];

function collectLoginCopy() {
  return [...Object.values(en.login), ...Object.values(es.login)].join("\n");
}

describe("public login copy", () => {
  it("does not mention Auth implementation details", () => {
    const text = collectLoginCopy();
    for (const token of forbidden) {
      expect(text).not.toContain(token);
    }
  });

  it("keeps the requested Spanish and English phrasing", () => {
    expect(es.login.title).toBe("Iniciar sesión");
    expect(es.login.body).toBe("Continúa con GitHub para acceder a HubForge.");
    expect(es.login.continueGithub).toBe("Continuar con GitHub");
    expect(es.login.connectingGithub).toBe("Conectando con GitHub…");
    expect(es.login.unavailable).toContain("no está disponible temporalmente");
    expect(es.login.error).toContain("No hemos podido iniciar sesión con GitHub");

    expect(en.login.title).toBe("Sign in");
    expect(en.login.body).toBe("Continue with GitHub to access HubForge.");
    expect(en.login.continueGithub).toBe("Continue with GitHub");
    expect(en.login.connectingGithub).toBe("Connecting to GitHub…");
    expect(en.login.unavailable).toContain("temporarily unavailable");
    expect(en.login.error).toContain("couldn't sign you in with GitHub");
  });
});

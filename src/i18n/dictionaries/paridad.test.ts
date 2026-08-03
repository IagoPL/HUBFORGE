import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n parity", () => {
  it("keeps the same key tree in en and es", () => {
    expect(keyPaths(es).sort()).toEqual(keyPaths(en).sort());
  });

  it("uses Work/Capacity/Briefing positioning words", () => {
    expect(en.nav.overview).toBe("Briefing");
    expect(es.nav.overview).toBe("Briefing");
    expect(en.nav.work).toBe("Work");
    expect(es.nav.work).toBe("Trabajo");
    expect(en.nav.capacity).toBe("Capacity");
    expect(es.nav.capacity).toBe("Capacidad");
    expect(en.operations.factCompletedOne.toLowerCase()).toContain("completed");
    expect(es.operations.factCompletedOne.toLowerCase()).toContain("complet");
  });
});

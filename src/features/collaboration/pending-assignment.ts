/**
 * Pending GitHub assignment notes — never invent usernames or assign stand-ins.
 * Iago assigns manually once the person joins the repository.
 */

export const PENDING_ASSIGNMENT_MARKER = "**Asignación pendiente:**";

export function hasPendingAssignmentNote(body: string): boolean {
  return body.includes(PENDING_ASSIGNMENT_MARKER);
}

export function buildPendingAssignmentNote(input: {
  personName: string;
  functionalRole?: string | null;
  needsToStartBeforeJoin?: boolean;
}): string {
  const name = input.personName.trim();
  const lines = [
    `${PENDING_ASSIGNMENT_MARKER} asignar manualmente a \`${name}\` cuando se incorpore al repositorio de GitHub.`,
  ];
  if (input.functionalRole?.trim()) {
    lines.push(`**Rol previsto:** \`${input.functionalRole.trim()}\`.`);
  }
  if (input.needsToStartBeforeJoin) {
    lines.push("**Responsable temporal:** sin definir.");
  }
  return lines.join("\n");
}

/** Appends the note once; never duplicates. */
export function appendPendingAssignmentIfNeeded(
  body: string,
  input: {
    personName: string;
    functionalRole?: string | null;
    needsToStartBeforeJoin?: boolean;
  },
): string {
  if (!input.personName.trim()) return body;
  if (hasPendingAssignmentNote(body)) return body;
  const note = buildPendingAssignmentNote(input);
  const trimmed = body.trim();
  return trimmed ? `${trimmed}\n\n${note}` : note;
}

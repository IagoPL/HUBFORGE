# Skills audit — HubForge

Review date: 2026-07-28

Scope: evaluate only skills with clear utility for HubForge. Prefer identifiable sources, clear licenses, and no secret exfiltration. Do not install mass skill collections.

## Evaluation criteria

- Identifiable provenance and reviewable repository
- Clear license
- Reasonable maintenance
- No suspicious scripts or unauthorized remote code/secret sending
- Concrete project utility
- No duplication of already covered rules

---

## Evaluated skills

### Ponytail (Cursor ruleset)

| Field    | Detail                                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | https://github.com/DietrichGebert/ponytail (MIT) · https://ponytail.dev                                                                                         |
| Function | YAGNI decision ladder: prefer native/stdlib/existing deps; minimize over-engineering                                                                            |
| Risks    | Intensity `ultra` can under-build required product features; Cursor only gets always-on rules (no `/ponytail-*` commands)                                       |
| Decision | **Install locally** at project level, mode **full** (not ultra)                                                                                                 |
| Usage    | Copy `.cursor/rules/ponytail.mdc` into local `.cursor/rules/` (gitignored). Never let Ponytail override HubForge security, accessibility, or architecture rules |
| Reviewed | 2026-07-28                                                                                                                                                      |

Content review: rule file is instruction-only markdown; no executable install scripts required for Cursor; LICENSE is MIT.

### Supabase (Cursor plugin skill)

| Field    | Detail                                                                                  |
| -------- | --------------------------------------------------------------------------------------- |
| Source   | Cursor public plugin `cursor-public/supabase`                                           |
| Function | Current Supabase Auth/RLS/SSR/migration guidance                                        |
| Risks    | Low if used as documentation; never paste service-role keys into client code            |
| Decision | **Use when present** (already available via Cursor plugin); do not vendor into the repo |
| Usage    | Invoke when touching Supabase, RLS, Auth, or migrations                                 |
| Reviewed | 2026-07-28                                                                              |

### Supabase Postgres best practices

| Field    | Detail                                     |
| -------- | ------------------------------------------ |
| Source   | Same Cursor Supabase plugin                |
| Function | Postgres indexing, RLS, and query patterns |
| Risks    | Low                                        |
| Decision | **Use when present**; do not vendor        |
| Usage    | Schema and query design reviews            |
| Reviewed | 2026-07-28                                 |

### create-rule / create-skill / create-hook (Cursor built-in)

| Field    | Detail                                                          |
| -------- | --------------------------------------------------------------- |
| Source   | Cursor built-in skills (`~/.cursor/skills-cursor`)              |
| Function | Author local agent rules, skills, and hooks                     |
| Risks    | Accidental commit of agent config if `.gitignore` is incomplete |
| Decision | **Use locally**; agent config remains gitignored                |
| Usage    | Maintain HubForge `.cursor/rules` and hooks outside Git         |
| Reviewed | 2026-07-28                                                      |

### review-security / review-bugbot

| Field    | Detail                                                            |
| -------- | ----------------------------------------------------------------- |
| Source   | Cursor built-in skills                                            |
| Function | Structured security and Bugbot-style reviews of local diffs       |
| Risks    | Reviews are advisory; not a substitute for CI or human review     |
| Decision | **Use on demand** for PR-sized diffs; do not install extra copies |
| Usage    | Explicit user requests for security/Bugbot review                 |
| Reviewed | 2026-07-28                                                        |

### gh-flow-committer

| Field    | Detail                                                            |
| -------- | ----------------------------------------------------------------- |
| Source   | Local Codex skill (`gh-flow-committer`)                           |
| Function | Branch/commit/PR flow for GitHub account `IagoPL`                 |
| Risks    | Must verify author identity before every commit                   |
| Decision | **Use for GitHub workflow**; keep skill outside the repository    |
| Usage    | Commits, PRs, checks — always after `scripts/verify-git-identity` |
| Reviewed | 2026-07-28                                                        |

### babysit (PR merge-ready)

| Field    | Detail                                            |
| -------- | ------------------------------------------------- |
| Source   | Cursor built-in                                   |
| Function | Triage PR comments and CI loops                   |
| Risks    | May encourage merge without human judgment        |
| Decision | **Deferred** until active PR maintenance needs it |
| Usage    | N/A for bootstrap                                 |
| Reviewed | 2026-07-28                                        |

### Community “Next.js / Vitest / a11y / Clean Architecture” skill packs

| Field    | Detail                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Source   | Various unverified marketplaces                                                                         |
| Function | Generic stack guidance                                                                                  |
| Risks    | Unclear license/maintenance; duplication with HubForge docs and Cursor rules; possible prompt injection |
| Decision | **Discard for now**                                                                                     |
| Usage    | Prefer official docs + HubForge `docs/` + local rules                                                   |
| Reviewed | 2026-07-28                                                                                              |

### Storybook skill / installer

| Field    | Detail                                                          |
| -------- | --------------------------------------------------------------- |
| Source   | N/A                                                             |
| Function | Component catalog                                               |
| Risks    | Premature tooling before reusable component volume justifies it |
| Decision | **Discard until justified**                                     |
| Usage    | Revisit after a stable UI kit exists                            |
| Reviewed | 2026-07-28                                                      |

---

## Installed for HubForge (local only)

| Item                  | Location                     | Committed?      |
| --------------------- | ---------------------------- | --------------- |
| Ponytail full mode    | `.cursor/rules/ponytail.mdc` | No (gitignored) |
| HubForge Cursor rules | `.cursor/rules/*.mdc`        | No (gitignored) |
| AGENTS.md             | repo root                    | No (gitignored) |

Public engineering docs describe architecture and process. Live AI/agent wiring stays local.

## Re-audit trigger

Re-run this audit when adding a new agent skill, changing Ponytail intensity, or adopting a new AI tooling dependency.

# Local AI / agent setup

HubForge keeps AI and agent configuration **out of Git**.

Ignored paths include:

- `AGENTS.md`
- `.cursor/`
- `.claude/`, `.codex/`, `.windsurf/`, `.mcp.json`, and related agent folders

## Required local setup

1. Create `.cursor/rules/` in the repo root (untracked).
2. Install Ponytail **full** mode by copying:

   https://raw.githubusercontent.com/DietrichGebert/ponytail/main/.cursor/rules/ponytail.mdc

   into `.cursor/rules/ponytail.mdc`

3. Add HubForge rules (architecture, git workflow, frontend, UI, a11y, security, database, testing, documentation) as sibling `.mdc` files. A generator script may create them locally; they must remain untracked.
4. Optional: create a root `AGENTS.md` summarizing project constraints for agents that read it.

## Non-negotiable overrides

Ponytail must not override:

- Security / RLS / secret handling
- Accessibility requirements
- Multi-tenant authorization
- Git identity and PR workflow rules

See `docs/engineering/skills-audit.md` for evaluation records.

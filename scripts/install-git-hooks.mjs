#!/usr/bin/env node
/**
 * Installs a local pre-commit hook that verifies Git identity.
 * Does not touch global Git config.
 */

import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".git", "hooks");
const hookPath = join(hooksDir, "pre-commit");

if (!existsSync(join(root, ".git"))) {
  console.log("Skipping git hook install: .git not found.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# HubForge local pre-commit — identity gate
node "$(dirname "$0")/../../scripts/verify-git-identity.mjs" || exit 1
`;

writeFileSync(hookPath, hook, { encoding: "utf8" });

try {
  chmodSync(hookPath, 0o755);
} catch {
  // Windows may ignore executable bit; Git for Windows still runs the hook.
}

console.log("Installed local pre-commit hook at .git/hooks/pre-commit");

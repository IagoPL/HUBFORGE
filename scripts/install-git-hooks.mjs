#!/usr/bin/env node
/**
 * Installs versioned local Git hooks for identity and commit-message gates.
 * Does not touch global Git config.
 */

import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".git", "hooks");

if (!existsSync(join(root, ".git"))) {
  console.log("Skipping git hook install: .git not found.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const preCommit = `#!/bin/sh
# HubForge local pre-commit — identity gate
node "$(dirname "$0")/../../scripts/verify-git-identity.mjs" || exit 1
`;

const commitMsg = `#!/bin/sh
# HubForge local commit-msg — reject AI attribution trailers
node "$(dirname "$0")/../../scripts/verify-git-identity.mjs" "$1" || exit 1
`;

function writeHook(name, contents) {
  const hookPath = join(hooksDir, name);
  writeFileSync(hookPath, contents, { encoding: "utf8" });
  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // Windows may ignore executable bit; Git for Windows still runs the hook.
  }
}

writeHook("pre-commit", preCommit);
writeHook("commit-msg", commitMsg);

console.log(
  "Installed local Git hooks at .git/hooks/pre-commit and .git/hooks/commit-msg",
);

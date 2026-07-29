#!/usr/bin/env node
/**
 * Verifies local Git author identity before commits.
 * Expected author must match IagoPL's verified GitHub identity for this bootstrap.
 * Also rejects AI co-authorship / Generated-by trailers when a commit message file is provided.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXPECTED_NAME = "Iago Prieto Lamas";
const EXPECTED_EMAIL = "50492345+IagoPL@users.noreply.github.com";
const EXPECTED_GH_USER = "IagoPL";

const FORBIDDEN_MESSAGE_PATTERNS = [
  /co-authored-by:\s*cursor(\s+agent)?\b/i,
  /co-authored-by:\s*cursoragent\b/i,
  /co-authored-by:\s*claude\b/i,
  /co-authored-by:\s*openai\b/i,
  /co-authored-by:\s*copilot\b/i,
  /^generated-by:\s*/im,
];

function readLocal(key) {
  try {
    return execSync(`git config --local --get ${key}`, {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function readGhLogin() {
  try {
    return execSync("gh api user --jq .login", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function readRemote() {
  try {
    return execSync("git remote get-url origin", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function assertCommitMessage(messagePath) {
  if (!messagePath) return;
  let message = "";
  try {
    message = readFileSync(messagePath, "utf8");
  } catch {
    return;
  }
  for (const pattern of FORBIDDEN_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      console.error("Git identity verification failed:");
      console.error(
        "  - Commit message contains a forbidden AI attribution trailer (Co-authored-by / Generated-by).",
      );
      process.exit(1);
    }
  }
}

const name = readLocal("user.name");
const email = readLocal("user.email");
const login = readGhLogin();
const remote = readRemote();
const messagePath = process.argv[2];

const errors = [];

if (name !== EXPECTED_NAME) {
  errors.push(`user.name is "${name || "(unset)"}", expected "${EXPECTED_NAME}"`);
}
if (email !== EXPECTED_EMAIL) {
  errors.push(`user.email is "${email || "(unset)"}", expected "${EXPECTED_EMAIL}"`);
}
if (login && login !== EXPECTED_GH_USER) {
  errors.push(`gh auth login is "${login}", expected "${EXPECTED_GH_USER}"`);
}
if (remote && !/github\.com[:/]IagoPL\/HubForge(\.git)?$/i.test(remote)) {
  errors.push(`origin remote "${remote}" is not IagoPL/HubForge`);
}

if (errors.length > 0) {
  console.error("Git identity verification failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error("\nFix with:");
  console.error(`  git config --local user.name "${EXPECTED_NAME}"`);
  console.error(`  git config --local user.email "${EXPECTED_EMAIL}"`);
  process.exit(1);
}

assertCommitMessage(messagePath);

console.log(`Git identity OK: ${name} <${email}> (gh: ${login || "n/a"})`);

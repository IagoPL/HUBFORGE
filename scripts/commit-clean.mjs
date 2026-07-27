#!/usr/bin/env node
/**
 * Creates a commit with verified IagoPL identity and without IDE co-author trailers.
 * Usage: node scripts/commit-clean.mjs "title" "body"
 */

import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const name = "Iago Prieto Lamas";
const email = "50492345+IagoPL@users.noreply.github.com";
const [title, body = ""] = process.argv.slice(2);

if (!title) {
  console.error('Usage: node scripts/commit-clean.mjs "title" "optional body"');
  process.exit(1);
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

execFileSync("node", ["scripts/verify-git-identity.mjs"], { stdio: "inherit" });

const localName = git(["config", "--local", "--get", "user.name"]);
const localEmail = git(["config", "--local", "--get", "user.email"]);
if (localName !== name || localEmail !== email) {
  console.error("Local git identity mismatch.");
  process.exit(1);
}

const status = git(["diff", "--cached", "--name-only"]);
if (!status) {
  console.error("Nothing staged.");
  process.exit(1);
}

const tree = git(["write-tree"]);
let parentArgs = [];
try {
  const parent = git(["rev-parse", "HEAD"]);
  parentArgs = ["-p", parent];
} catch {
  // root commit
}

const msgPath = join(".git", "COMMIT_MSG_TMP");
const message = body ? `${title}\n\n${body}\n` : `${title}\n`;
writeFileSync(msgPath, message, "utf8");

const result = spawnSync("git", ["commit-tree", tree, ...parentArgs, "-F", msgPath], {
  encoding: "utf8",
  env: {
    ...process.env,
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
  },
});

unlinkSync(msgPath);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const commit = result.stdout.trim();
if (!/^[0-9a-f]{40}$/i.test(commit)) {
  console.error("Unexpected commit-tree output:", commit);
  process.exit(1);
}

git(["reset", "--soft", commit]);
const finalBody = git(["log", "-1", "--format=%B"]);
if (/Co-authored-by:/i.test(finalBody)) {
  console.error("Co-authored-by trailer present; aborting.");
  process.exit(1);
}

console.log(commit);
console.log(finalBody);

# Branch protection (manual guide)

If CLI/API lacks permission to apply protection rules, configure in GitHub:

**Settings → Branches → Add classic branch protection rule** for `main`:

1. Require a pull request before merging
2. Require approvals: at least 1 (when collaborators exist)
3. Dismiss stale approvals when new commits are pushed
4. Require status checks to pass:
   - `Quality`
   - `E2E smoke`
5. Require branches to be up to date before merging
6. Restrict force pushes
7. Restrict deletions
8. Do not allow bypassing the above settings for administrators when possible

## Repository merge settings

Preferred:

- Allow squash merging
- Disable merge commits (optional but recommended)
- Automatically delete head branches

Already attempted via `gh repo edit` during bootstrap when permissions allowed.

# Branch protection

Applied on `main` via GitHub API during HubForge bootstrap follow-up (2026-07-28):

- Require pull request before merging
- Required status checks (strict): `Quality`, `E2E smoke`
- Dismiss stale reviews
- Required approving review count: `0` (solo maintainer; raise when collaborators join)
- Enforce for administrators
- Linear history required
- Conversation resolution required
- Force pushes blocked
- Branch deletions blocked

## Merge settings

- Squash merge enabled
- Merge commits disabled
- Rebase merge disabled
- Delete head branches on merge enabled

## Manual fallback

If API access is unavailable, configure in:

**Settings → Branches → Branch protection rule** for `main`, then **Settings → General → Pull Requests**.

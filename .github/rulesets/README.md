# Repository rulesets

These JSON files document the branch rulesets used by this repository.

## Applying Profiles

```sh
gh api --method POST repos/t128n/pele-x/rulesets --input .github/rulesets/protect-main.json
```

## Files

| File                         | Status   | Purpose                                                                                                  |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `protect-main.json`          | Applied  | Requires pull requests, linear history, a passing `check`, and blocks force pushes and deletion of main. |
| `conventional-commits.json`  | Optional | Native commit message pattern for Conventional Commits.                                                  |
| `conventional-branches.json` | Optional | Native branch name pattern for `<type>/<slug>` branch names.                                             |

`protect-main.json` allows squash merges only, so the pull request title becomes the commit message on `main`.

## Why the metadata rulesets are optional

GitHub gates the native `commit_message_pattern` and `branch_name_pattern` rules behind GitHub Enterprise Cloud. On a personal Free repository, the API returns:

```text
422 Validation Failed: Invalid rule 'commit_message_pattern'
```

The repository therefore enforces equivalent checks in CI:

- `scripts/check-pr-policy.mjs` validates the pull request title and the head branch name.
- `.github/workflows/ci.yml` runs that script on `pull_request` events, including title edits.
- The existing `check` status is required by `protect-main.json`, so a failed policy check blocks the merge.

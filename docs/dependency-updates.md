# Dependency updates

Renovate tracks the npm release of [`pele`](https://www.npmjs.com/package/pele) and opens one grouped pull request for each new version. The pull request updates every `pele` declaration in the workspace, refreshes `bun.lock`, and adds a patch changeset for all three packages so the existing changesets flow can ship the update.

The workflow lives in `.github/workflows/renovate.yml`. It checks for new releases every hour and can also be started from **Actions -> Renovate -> Run workflow**. The first run creates a Dependency Dashboard issue, where you can see pending updates and trigger a run.

## One-time setup

Create a fine-grained personal access token with access to `t128n/pele-x` and these permissions:

- **Contents:** Read and write
- **Pull requests:** Read and write
- **Issues:** Read and write (for the dependency dashboard)
- **Metadata:** Read-only (added automatically)

If Renovate logs a permission error while reading CI status, also add **Checks:** Read-only.

Add the token as the `RENOVATE_TOKEN` repository secret under **Settings -> Secrets and variables -> Actions**. Treat it as sensitive: it can push branches and open pull requests in this repository. Fine-grained tokens expire, so rotate the secret before the expiry date.

Do not use the default `GITHUB_TOKEN` for Renovate. Pull requests created with `GITHUB_TOKEN` do not start CI, so the update would not be validated before merging.

If you prefer a classic token, the `repo` scope is enough for the current configuration. Add `workflow` only if you later enable the `github-actions` manager.

### Pull request identity

Renovate authenticates with `RENOVATE_TOKEN`, so its pull requests and commits are authored by the token owner. A self-hosted Renovate Action cannot use the `renovate[bot]` identity: that bot belongs to Mend's hosted app, which does not run `postUpgradeTasks`.

The built-in `GITHUB_TOKEN` would make the author `github-actions[bot]`, but GitHub does not start workflows for events caused by `GITHUB_TOKEN`. Renovate pull requests would get no CI run, so native auto-merge could not wait for the `check` status.

For a bot identity while keeping the self-hosted setup, create a GitHub App with **Contents**, **Pull requests** and **Issues** read/write plus **Checks** read-only, install it on this repository, and store its ID and private key as `RENOVATE_APP_ID` and `RENOVATE_APP_PRIVATE_KEY`. Mint an installation token with `actions/create-github-app-token` and pass it to both the Renovate Action and `changesets/action` in `release.yml`. Pull requests and commits then appear as `<app-name>[bot]`.

## What a Pele update looks like

- A `renovate/pele-*` branch with a commit that updates `package.json` files and `bun.lock`. The workflow sets `RENOVATE_BINARY_SOURCE=install` so Renovate can fetch Bun inside its container and refresh the lockfile.
- A `.changeset/pele.md` file that requests a patch release for `mdast-pele`, `astro-pele`, and `starlight-pele`.
- A pull request labeled `dependencies` (create the label once if you want it applied).
- The normal CI workflow runs `bun run check` because the pull request is created with the token, not `GITHUB_TOKEN`.

The changeset requests a patch bump for all three packages. If a Pele major release needs a different bump, edit `.changeset/pele.md` in the pull request.

## Automerge

Patch and minor Pele updates enable GitHub's native auto-merge once the required `check` status passes. Majors still need a human, and merges are squashed to match the existing history.

The repository needs two settings, both one-time:

1. **Settings -> General -> Pull requests -> Allow auto-merge** must be enabled.
2. A branch ruleset on `main` must require the `check` status, without requiring branches to be up to date. Without a required check, GitHub may merge before CI starts.

The **Version packages** workflow also uses `RENOVATE_TOKEN` for `changesets/action`, so its release pull request starts CI and can satisfy the same required check.

After merging:

1. The **Version packages** workflow opens or updates its release pull request from the changeset.
2. Merge the release pull request.
3. Run the **Publish packages** workflow to publish with OIDC.

## Scope and tuning

`enabledManagers` and the `!pele` rule keep the bot focused on Pele. Remove the `!pele` rule to let Renovate manage the rest of the workspace. If you also enable the `github-actions` manager, give the token the `workflow` scope and remove the `enabledManagers` restriction.

The changeset is written by `scripts/changeset-pele.mjs` through Renovate's `postUpgradeTasks`. That only works with self-hosted Renovate, as configured here. The Mend-hosted Renovate app blocks post-upgrade commands, so it would open the dependency pull request without the changeset.

To pause the bot, disable the workflow or remove the secret. To tune the cadence, edit the `cron` schedule in `.github/workflows/renovate.yml`.

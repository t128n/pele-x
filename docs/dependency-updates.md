# Dependency updates

A GitHub Actions workflow tracks the npm release of [`pele`](https://www.npmjs.com/package/pele) and opens one pull request for each new version. The pull request updates the exact `pele` pins in the root and `packages/mdast`, refreshes `bun.lock`, and adds a patch changeset for all three packages so the existing changesets flow can ship the update.

The workflow lives in `.github/workflows/update-pele.yml`. It checks npm every hour and can also be started from **Actions -> Update Pele -> Run workflow**.

## What a Pele update looks like

1. `npm view pele version` is compared with `devDependencies.pele` in the root `package.json`. The run stops when npm is not newer.
2. The root and `packages/mdast` pins are updated, `bun install` refreshes `bun.lock`, and `scripts/changeset-pele.mjs` writes `.changeset/pele.md`.
3. The change is committed to a `pele/<version>` branch. The pull request is opened by `github-actions[bot]`.
4. The workflow dispatches `ci.yml` on that branch and waits for `bun run check` to pass. A pull request created with `GITHUB_TOKEN` does not start CI automatically, so the dispatch is explicit.
5. Patch and minor updates are squash-merged. Major updates are left open for a human, because the changeset and release may need a different bump.
6. The merge uses `GITHUB_TOKEN`, whose push event does not start other workflows. The workflow therefore dispatches `release.yml` and `pages.yml` explicitly after merging.

If CI fails, the workflow leaves the pull request open and comments on it.

The changeset requests a patch bump for all three packages. If a Pele major release needs a different bump, edit `.changeset/pele.md` in the pull request before merging it.

After a Pele update lands:

1. The dispatched **Version packages** workflow opens or updates its release pull request from the changeset. The `version` script runs `changeset version` and then `bun install`, so the pull request also refreshes `bun.lock` with the new workspace versions.
2. Merge the release pull request.
3. Run the **Publish packages** workflow to publish with OIDC.

## Publishing workspace packages

The packages depend on each other with `workspace:*`. Changesets leaves that protocol in place, and `npm publish` uploads it verbatim, which makes the published packages uninstallable. `bun run release` therefore uses `scripts/publish.ts` instead of `changeset publish`:

1. `changeset publish-plan` lists the unpublished packages and orders them by dependency.
2. `bun pm pack` packs each package; Bun replaces every `workspace:*` range with the workspace package version.
3. `npm publish <tarball>` uploads the packed tarball, keeping OIDC trusted publishing and provenance.
4. The script creates the `name@version` git tag for each published package.

`bun run verify:pack` packs every publishable package and fails when a packed manifest still contains a `workspace:` range, when a packed version differs from the workspace version, or when an internal dependency version does not match the workspace package. It runs as part of `bun run check`, so CI and the publish workflow catch a stale `bun.lock` or a regression before anything reaches npm.

## Repository settings

The workflow only uses the built-in `GITHUB_TOKEN`; no personal access token is required. These settings matter:

- **Settings -> Actions -> General -> Workflow permissions -> Allow GitHub Actions to create and approve pull requests** must be enabled. The **Version packages** workflow uses it to open the release pull request.
- **Settings -> General -> Pull requests -> Allow auto-merge** is enabled for manual use, but the updater does not depend on GitHub's native auto-merge. It waits for the dispatched CI run and merges the pull request itself.

No required status check is configured. If you add branch protection later, make sure the **Version packages** pull request can satisfy it; that pull request is created with `GITHUB_TOKEN` and does not start CI automatically.

## Scope and tuning

The workflow only tracks `pele`. To pause it, disable `.github/workflows/update-pele.yml` or remove its schedule. To change the cadence, edit the `cron` expression.

The former Renovate setup is gone: `renovate.json`, `.github/workflows/renovate.yml`, the `RENOVATE_TOKEN` secret, and the Dependency Dashboard issues are no longer needed. The `scripts/changeset-pele.mjs` helper and its test are still used.

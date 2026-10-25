# Releasing packages

Three packages are published from this repository:

- `mdast-pele`
- `astro-pele`
- `starlight-pele`

The private apps (`pele-x-docs`, `pele-x-example-astro-basic`) are never published.

## How it works

| Workflow                        | Trigger                                                      | What it does                                                                     |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `.github/workflows/release.yml` | Push to `main` touching packages, changesets or the lockfile | Opens or updates a **Version Packages** PR with the next versions and changelogs |
| `.github/workflows/publish.yml` | Manual (`workflow_dispatch`)                                 | Runs the full check, builds, publishes unpublished versions and pushes tags      |

Publishing is deliberately manual for the first releases. Merging a Version Packages PR does not publish by itself.

## One-time npm setup

The package names are currently unclaimed. You need publish access to them.

### Option A: npm token (needed for the very first publish)

1. Create a granular access token on npm with **Read and write** access for the three packages. If the packages do not exist yet, use a token that can create public packages.
2. Store it as a GitHub secret:

   ```sh
   gh secret set NPM_TOKEN --repo t128n/pele-x
   ```

3. Run the publish workflow with token auth:

   ```sh
   gh workflow run publish.yml --repo t128n/pele-x -f auth=token
   ```

### Option B: trusted publishing (recommended after the first publish)

Trusted publishing uses GitHub OIDC instead of a long-lived token. Configure it once per package:

1. Open the package settings on npmjs.com.
2. Add a **Trusted Publisher** → **GitHub Actions** with:
   - Repository: `t128n/pele-x`
   - Workflow: `publish.yml`
   - Environment: `npm`
3. Run the workflow with the default auth mode:

   ```sh
   gh workflow run publish.yml --repo t128n/pele-x
   ```

No `NPM_TOKEN` secret is needed for this mode. Provenance is enabled either way.

## First release

The packages start at `0.1.0`. With no changesets, the publish workflow publishes those versions directly.

1. Confirm the names are still available: `npm view mdast-pele version`.
2. Add the `NPM_TOKEN` secret and run the token publish above.
3. Confirm the packages:

   ```sh
   npm view mdast-pele version
   npm view astro-pele version
   npm view starlight-pele version
   ```

4. Configure trusted publishing for each package and use the default auth mode from then on.

## Regular release

1. Record the change with a changeset:

   ```sh
   bun run changeset
   ```

   Pick the affected packages and the bump (`patch`, `minor` or `major`). Commit the generated `.changeset/*.md` file.

2. Push to `main`. The **Version packages** workflow opens or updates a Version Packages PR.

3. Review the PR, then merge it.

4. Publish:

   ```sh
   gh workflow run publish.yml --repo t128n/pele-x
   ```

5. The workflow runs `bun run check`, builds every package, publishes the new versions with provenance, and pushes the release tags.

## Versioning

- `0.x` releases use `patch` for fixes and `minor` for features.
- Bootstrapping the three packages together keeps `astro-pele` and `starlight-pele` aligned with `mdast-pele`.
- `changeset publish` publishes in dependency order.
- `privatePackages` is disabled for versioning, so the docs and example apps are skipped.

## Verifying a release

```sh
npm view mdast-pele version dist.tarball
npm view astro-pele version dist.tarball
npm view starlight-pele version dist.tarball
```

The npm package page shows an **Attestations** / provenance section when `NPM_CONFIG_PROVENANCE=true` and `id-token: write` are in effect.

## If something goes wrong

- A failed publish leaves the packages unpublished; rerun the workflow.
- npm allows unpublishing for 72 hours. After that, deprecate the version and publish a patch instead.
- Never force-push a release tag. Tag the next version.

## Making it fully automatic later

When you trust the flow, add a `push` trigger to `publish.yml` for the version commit, or move the publish step into `release.yml` with the `npm` environment protected by required reviewers. Keeping publish manual is the safest default.

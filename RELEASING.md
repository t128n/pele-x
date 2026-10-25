# Releasing packages

Three packages are published from this repository:

- `mdast-pele`
- `astro-pele`
- `starlight-pele`

The private apps (`pele-x-docs`, `pele-x-example-astro-basic`) are never published.

Publishing uses **npm trusted publishing with OIDC**. There is no `NPM_TOKEN` secret in the normal flow.

## Current state

- `mdast-pele@0.1.0`, `astro-pele@0.1.0` and `starlight-pele@0.1.0` are published.
- Trusted publishers are configured for all three packages with `publish.yml`, repository `t128n/pele-x`, environment `npm`.
- The first publish through OIDC must happen within **2 days** of configuring trust (by 2026-10-27), or the configuration expires. Cut a patch changeset and run `publish.yml` to validate it.
- The `0.1.0` versions were published locally before trust was configured. Provenance is not available because the repository is private.

## How it works

| Workflow                        | Trigger                                                      | What it does                                                                                          |
| ------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `.github/workflows/release.yml` | Push to `main` touching packages, changesets or the lockfile | Opens or updates a **Version Packages** PR with the next versions and changelogs                      |
| `.github/workflows/publish.yml` | Manual (`workflow_dispatch`)                                 | Runs the full check, builds, publishes unpublished versions with OIDC authentication, and pushes tags |

`publish.yml` runs in the `npm` GitHub environment. The trusted publisher on npm must name:

- Repository: `t128n/pele-x`
- Workflow: `publish.yml`
- Environment: `npm`

Publishing stays manual so a merged version PR never publishes by itself.

## One-time bootstrap (completed for 0.1.0)

npm requires a package to exist before you can configure a trusted publisher for it. The first `0.1.0` publish was therefore done locally with an npm login. This is the only token/session-based step and it is already complete; keep it as a reference for a fresh registry.

```sh
npm install --global npm@latest
npm login
bun run check
bun run release
git push --tags
```

This publishes `mdast-pele`, `astro-pele` and `starlight-pele` at `0.1.0`.

## Configure trusted publishing

All three packages are already configured. This is the command set used; it requires npm CLI 11.15 or later, 2FA on the npm account, and write access to the packages.

```sh
npm trust github mdast-pele --file publish.yml --repo t128n/pele-x --env npm --allow-publish
npm trust github astro-pele --file publish.yml --repo t128n/pele-x --env npm --allow-publish
npm trust github starlight-pele --file publish.yml --repo t128n/pele-x --env npm --allow-publish
```

Verify:

```sh
npm trust list mdast-pele
npm trust list astro-pele
npm trust list starlight-pele
```

A new trusted publisher configuration must complete its first successful publish within **2 days**, or it expires. Cut a patch changeset and run the publish workflow soon after configuring it, otherwise `changeset publish` has nothing new to publish and cannot validate the configuration:

```sh
bun run changeset      # patch bump for the packages you want to validate
git add .changeset && git commit -m "chore: add changeset" && git push
# merge the Version Packages PR, then:
gh workflow run publish.yml --repo t128n/pele-x
```

If you prefer the website, open each package on npmjs.com → **Settings** → **Trusted Publisher** → **GitHub Actions** and enter the same repository, workflow filename and `npm` environment. Allow direct publishing with `npm publish`.

## Publish a release

1. Record the change with a changeset:

   ```sh
   bun run changeset
   ```

   Pick the affected packages and the bump (`patch`, `minor` or `major`), then commit the generated `.changeset/*.md` file.

2. Push to `main`. The **Version packages** workflow opens or updates a Version Packages PR.

3. Review and merge the PR.

4. Run the trusted publish:

   ```sh
   gh workflow run publish.yml --repo t128n/pele-x
   ```

   The workflow upgrades npm, runs `bun run check`, builds, publishes with OIDC, and pushes tags. No secret is read.

## Provenance caveat

Trusted publishing works from a private repository, but npm **does not generate provenance attestations for private source repositories**. If you want the provenance badge and attestations on npm, make the repository public. Publishing itself works either way.

## Security after setup

Once all three trusted publishers are verified, restrict token publishing:

1. Open each package on npmjs.com → **Settings** → **Publishing access**.
2. Select **Require two-factor authentication and disallow tokens**.
3. Save.

Trusted publishers keep working; long-lived tokens stop working.

If you previously created an `NPM_TOKEN` secret for this repository, delete it:

```sh
gh secret delete NPM_TOKEN --repo t128n/pele-x
```

## Versioning

- `0.x` releases use `patch` for fixes and `minor` for features.
- Keep `astro-pele` and `starlight-pele` aligned with `mdast-pele`.
- `changeset publish` publishes in dependency order.
- The private docs and example apps are excluded from versioning.

## Verifying a release

```sh
npm view mdast-pele version dist.tarball
npm view astro-pele version dist.tarball
npm view starlight-pele version dist.tarball
```

For a public repository, the npm package page shows provenance/attestations when published through OIDC.

## Troubleshooting

- `ENEEDAUTH`: the trusted publisher configuration does not match the repository, workflow filename or environment. All fields are case-sensitive.
- `publish.yml` must remain in `.github/workflows/` and keep that exact filename.
- The workflow must keep `id-token: write`.
- If a trusted publisher configuration expired, revoke and recreate it, then publish within 2 days.
- If you rename the environment, update every trusted publisher configuration.

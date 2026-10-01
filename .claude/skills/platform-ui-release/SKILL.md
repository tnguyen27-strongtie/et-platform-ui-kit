---
name: platform-ui-release
description: Release workflow for the @platform/ui kit - choosing the semver bump, writing the CHANGELOG entry, running the full verification, building the tarball with npm pack and checking its contents before apps install it. Use it whenever the user asks to release, publish, pack, cut a version, bump the version, "ship this to the apps", prepare release notes for the kit, or produce a .tgz of @platform/ui, even if they only mention one of those steps, because a pack without a version bump or changelog silently gives apps a stale or undocumented build.
---

# Releasing @platform/ui

Apps install the kit as a tarball (or from an internal registry), and an app tells tarballs apart **by version**. Packing new code under an old version number means apps can keep the old build without any error. That, plus an undocumented change reaching several apps at once, is why every release follows the same steps.

## 1. Find what changed since the last release

```bash
# commits since the last version bump (-G matches the changed "version" line; -S would not)
git log --oneline "$(git log -1 --format=%H -G'"version":' -- package.json)"..HEAD
git diff --stat HEAD~<n>          # or against the last release commit/tag
```

Read `CHANGELOG.md`: an `[Unreleased]` section may already list the changes (the component workflow adds entries there). Check it against the log and fill gaps.

## 2. Choose the version

Semantic versioning, applied from the point of view of an app upgrading:

| Change | Bump | Examples |
| --- | --- | --- |
| Removed or renamed export or prop, changed prop type or default, changed callback value, behavior an app relied on | **major** (while < 1.0: minor, and say "breaking" loudly) | `onChange` now returns `number \| null`; `HelpPopover` removed |
| New component, prop, variant, token, export | **minor** | `GridView labels`, new `StatBadge` |
| Bug fix, docs, internal refactor, test-only change, visual fix within the design | **patch** | ImageViewer zoom fix |

Visible design changes (font, colors, spacing) are at least minor even when the API is unchanged; apps may need to review screens. If unsure between two levels, pick the higher one and explain why.

## 3. Update version and changelog

- `package.json` → `"version"`.
- `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)): turn `[Unreleased]` into `## [x.y.z] - YYYY-MM-DD` (today's date), grouped under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Write for app developers: what they can now do, what they must change, what looks different. Put breaking changes first, with the migration (old code → new code). End with "No API changes." when that is true.
- Docs mention the version in install examples (`platform-ui-x.y.z.tgz` in `README.md` and `docs/getting-started.md`); update them.

## 4. Verify

```bash
npm ci
npm run check       # lint, typecheck, unit tests, build
npm run test:e2e    # full Playwright suite
git status          # tokens.generated.css must not change after the build
```

Do not release on a failing or skipped check. If e2e cannot run (no browser available), stop and tell the user rather than packing anyway.

## 5. Pack and inspect

```bash
npm pack --pack-destination <dir>      # runs the build again through prepack
scripts/verify-pack.sh <dir>/platform-ui-x.y.z.tgz   # required files present, nothing repo-only packed
```

The tarball must contain `package.json`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `docs/*.md`, `dist/index.js`, `dist/index.d.ts`, `dist/theme/theme.css`, `dist/theme/fonts.css`, `dist/theme/tokens.generated.css` and `dist/tokens/tokens.js`. It must not contain `src/showcase`, tests, `public/`, or any font files: fonts (`@fontsource-variable/inter`, `@fontsource/stix-two-math`) are dependencies resolved at the app's build time. `scripts/verify-pack.sh` checks all of this; CI runs it on every push and keeps the tarball as an artifact.

For larger changes, smoke-test the tarball in a throwaway Vite app outside the repo: install the `.tgz` with the peer dependencies, import `@platform/ui/theme.css`, render a `Button` inside `PlatformThemeProvider`, `vite build`, and check the output contains the Inter and STIX Two Math `.woff2` files. This catches packaging mistakes the repo's own tests cannot see. When the release adds Tailwind classes the kit did not use before (container queries, new utilities), also grep the built CSS for them: apps only get them because `theme.css` scans the kit's `dist/` (`@source "../"`).

## 6. Commit and hand over

- Commit `package.json`, `CHANGELOG.md` and docs together: `chore(release): x.y.z`.
- Releases are made on `main`. If the work is on a branch, merge it first (fast-forward or merge commit, not squash, so the tag stays on `main`'s history).
- Tag it: `git tag vX.Y.Z`. Ask before pushing the tag: `git push origin vX.Y.Z` starts `.github/workflows/release.yml`, which runs the full CI (checks, Chromium and WebKit e2e), fails if the tag does not match `package.json`, and creates a GitHub Release with the `[X.Y.Z]` CHANGELOG section as notes and the CI-built tarball attached. Versions with a `-` (`0.6.0-rc.1`) become pre-releases.
- If the release job fails after the tag is pushed, fix the cause, then delete and re-push the tag (`git push origin :vX.Y.Z`, `git tag -f vX.Y.Z`, `git push origin vX.Y.Z`) with the user's go-ahead.
- Report to the user: the version and why that bump, the changelog entry, the verification results, the tarball path (or the GitHub Release link), and what apps must do to upgrade (`npm install ./platform-ui-x.y.z.tgz`, plus any migration steps).

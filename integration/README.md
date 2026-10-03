# Release integration check

The kit's own tests show that each component works in a test page. This folder shows that a **release** works inside apps: it installs the packed tarball into a proof-of-concept app and into copies of the real apps, then type-checks, builds, tests and drives them. Run it for every release, after the version bump and changelog and before pushing the tag (see [CONTRIBUTING.md](../CONTRIBUTING.md#releasing)).

Nothing here is part of the package; `files` in the kit's `package.json` leaves it out of the tarball.

## Commands

From the kit's folder:

| Command | What it does |
| --- | --- |
| `integration/check-release.sh [tgz]` | The whole check: packs the kit when no tarball is given, runs `scripts/verify-pack.sh`, the PoC check and the app check for every app in `apps.txt`, then prints a summary |
| `integration/check-poc.sh <tgz> [playwright args]` | PoC only: clean install of the tarball, `npm ls`, strict typecheck (including the kit's `.d.ts` files), export coverage, production build, fonts in the build, Playwright journeys. `--project desktop` runs Chromium only |
| `integration/check-app.sh <app dir> <tgz>` | One real app: copies it to a temporary folder (the app is never changed), installs it, installs the release, then runs the app's own `typecheck`, `lint`, `test` and `build` scripts when it has them |
| `BASELINE=1 integration/check-app.sh …` | Also runs those scripts with the kit version the app already uses, first. A step that fails in both runs is the app's own problem, not the release's |
| `KEEP=1 integration/check-app.sh …` | Keeps the temporary copy and prints its path, for debugging |

An app that does not install even with the kit version it already uses is reported as **NOT CHECKED** (exit code 2), not as a failure of the release. Fix the app (for example a lockfile, or an `overrides` entry for a peer conflict), then run the check again; until then the release is untested in that app.

Exit codes:

| Script | 0 | 1 | 2 | 64 |
| --- | --- | --- | --- | --- |
| `check-release.sh` | Nothing failed with the release. **Also 0 when real apps were NOT CHECKED or missing**: read the summary before tagging | Something failed | | Wrong arguments |
| `check-poc.sh` | Passed | A step failed | | Wrong arguments |
| `check-app.sh` | Passed | A step failed with the release | NOT CHECKED: the app does not install even with its current kit version | Wrong arguments |

The scripts run with macOS's built-in bash 3.2; no newer bash is needed.

Playwright needs its browsers once: `cd integration/poc-app && npx playwright install chromium webkit`.

Everything takes several minutes (one clean install per app). A failure prints `-- FAILED: <step>` with the tool's output above it.

## The PoC app

`poc-app/` is a small calculator app ("Connection Calculator") built the way the kit's docs tell apps to build one: `PlatformThemeProvider` with a theme file, a top nav, an agreement dialog, release notes, settings (color scheme, appearance, text size, number locale, theme file validation), several calculations in `WorkspaceTabs`, each a `SectionLayout` with inputs in accordions, a drawing in `VisualizationStage` and results in a `GridView`, plus help pages with formulas and the number helpers.

| Path | What |
| --- | --- |
| `src/App.tsx` | App shell: provider, nav, tabs, dialogs, toasts |
| `src/features/` | One file per screen part: `InputForm`, `IllustrationPanel`, `OutputPanel`, `CalculationWorkspace`, dialogs, `AppNav` |
| `src/lib/` | Made-up calculation, data, settings stored in `localStorage` |
| `e2e/poc.spec.ts` | User journeys, run against the production build (`vite preview`), with axe and a console-error check |
| `scripts/coverage.mjs` | Lists runtime exports of the installed kit that no PoC file imports. `IGNORED` lists the exports apps should not import (theme-builder helpers, raw and default token values, CSS variable-name helpers, the grouped `tokens` object), each with a reason |

It installs `@platform/ui` from `vendor/platform-ui.tgz`, which `check-poc.sh` copies there. `vendor/` and `package-lock.json` are not committed: every check installs the peer dependencies fresh within the kit's ranges, like a new app, so a peer release that breaks the kit shows up here first.

To work on the PoC by hand: `integration/check-poc.sh <tgz> --project desktop` once (it installs), then `cd integration/poc-app && npm run dev`.

### Keeping it complete

When a release adds an export, `coverage.mjs` fails until the PoC uses it. Add it where an app would (and a journey step if it has visible behavior), using only the docs shipped in the package: if they are not enough, fix the docs. When existing PoC code stops compiling or a journey fails, either the changelog documents the migration (apply it to the PoC exactly as written) or the release has an undocumented breaking change.

Accessibility follows the kit's own rule: axe runs everywhere, and color contrast is checked in the dark scheme only, because some default light-scheme pairs are a documented gap (see the kit README, "Not included yet").

### When it is checked

Only by `check-poc.sh`, at release time. `npm run check` and CI do not type-check or lint the PoC (the kit's ESLint config ignores `integration/`, which has its own `node_modules` and `tsconfig.json`). So a change to the kit's exports can break the PoC unnoticed until the next release check; run `integration/check-poc.sh <tgz> --project desktop` after changing `src/index.ts` if you want to know earlier.

## Real apps

`apps.txt` lists app folders relative to the kit. Apps that are not checked out on the machine are reported as missing and skipped. Add a line when a new app starts using the kit.

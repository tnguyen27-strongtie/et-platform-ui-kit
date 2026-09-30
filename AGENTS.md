# AGENTS.md

Context for AI coding agents working in this repository. Human-facing docs: [README.md](README.md), [docs/](docs/), [CONTRIBUTING.md](CONTRIBUTING.md).

## What this is

`@platform/ui`: a shared React component kit (React 19, MUI 9, Tailwind CSS 4, TypeScript strict) for the platform's calculator apps. It ships design tokens, an MUI theme, ~50 components, a data grid (`GridView`) and a three-section workspace layout. The package is private and consumed by apps as a tarball, a local link or from an internal registry.

The repo also contains a **showcase** (`src/showcase/`, `pnpm dev`) that demos every export. It is not part of the package.

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` (pnpm 12, Node ≥ 22.18) |
| Showcase | `pnpm dev` → http://localhost:5173 |
| Fast checks (run before saying you are done) | `pnpm check` = lint + typecheck + unit tests + library build |
| E2E (Playwright, starts its own server) | `pnpm test:e2e` (Chromium and WebKit, about 2 minutes); one file: `pnpm test:e2e tests/e2e/components/forms.spec.ts`; one browser: `--project desktop` or `--project safari` |
| Regenerate token CSS after editing `tokens.ts` | `pnpm tokens` |
| Package | `pnpm pack`, then `scripts/verify-pack.sh <tgz>`. CI keeps a tarball per commit; tags `vX.Y.Z` create a GitHub Release |

## Map

| Path | What |
| --- | --- |
| `src/tokens/tokens.ts` | Single source of every design value. `tokens.generated.css` is generated from it; never edit that file |
| `src/theme/createPlatformTheme.ts` | MUI theme: most component styling lives here as `styleOverrides` / `variants` |
| `src/theme/theme.css` | Tailwind layers, utilities, variants, GridView CSS |
| `src/components/` | Components; `grid/`, `workspace/`, `release-notes/` are sub-areas |
| `src/index.ts` | Public API. Everything exported here needs a showcase demo (a test enforces it) |
| `src/showcase/catalog.ts`, `src/showcase/pages/` | Showcase pages and the list of exports each demo covers |
| `tests/e2e/harness/fixtures.tsx` | One fixture per component; e2e specs drive fixtures, not the showcase |
| `tests/unit/` | `node --test` for pure logic |
| `docs/` | Library docs (English), shipped inside the package |

## Rules that matter

- **Colors come from tokens.** Use `colors.*` (CSS variables) or role classes (`bg-brand`, `text-danger`). No hex in components (ESLint fails on it; `#fff`/`#000` are allowed). MUI `alpha()` cannot take `colors.*`; use `color-mix(in srgb, ${colors.x} 15%, transparent)`.
- **MUI is the only base library.** No Radix, Headless UI, Bootstrap. Icons from `@mui/icons-material`.
- **Theme first, wrapper second.** Style MUI through the theme so plain MUI usage matches; add a wrapper only for a simpler API.
- **Callbacks return values, not events**, and keep value types (numbers stay numbers).
- **Accessibility is tested.** Every fixture runs through axe; keyboard behavior has specs. Icon-only buttons need `aria-label`; form controls get their wiring from `FormField` via `useFormField()`.
- **Public API changes** need: export in `src/index.ts`, a showcase demo plus `catalog.ts` entry, a fixture and spec, docs in `docs/`, a `CHANGELOG.md` entry.
- **English everywhere** in code, comments and docs. Vietnamese appears only in translation examples.
- The kit is an independent platform. Do not describe components by reference to other products.

## Skills

Project skills in `.claude/skills/` hold the step-by-step workflows:

| Skill | Use for |
| --- | --- |
| `platform-ui-component` | Adding or changing a component, prop, variant, token or theme style in this kit |
| `platform-ui-app` | Building screens in an app that depends on `@platform/ui` |
| `platform-ui-release` | Bumping the version, writing the changelog, verifying and packing a release |
| `platform-ui-theme` | Turning a look-and-feel idea (a named style, a website, a logo, mood words) into a checked `theme.config.ts` with a custom appearance |

Agents without skill support can read those `SKILL.md` files directly; they are plain Markdown.

## Definition of done

1. `pnpm check` passes.
2. `pnpm test:e2e` passes when components, the theme, CSS or the showcase changed.
3. Docs and `CHANGELOG.md` updated when the public API or visible behavior changed.
4. Report what you verified and what you did not.

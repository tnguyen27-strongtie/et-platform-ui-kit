---
name: platform-ui-architecture
description: Architecture guard and review for the @platform/ui kit - checks that a new feature, fix or refactor follows the kit's layers (tokens → utils → theme / base components → feature areas → index.ts), puts code in the right place, reuses existing helpers and components instead of duplicating them, keeps the public API and dependencies small, stays within file-size budgets and ships complete (showcase, fixture, docs, changelog). Use it before implementing anything non-trivial in this repository (to decide where it goes) and always before saying a change is done, committing or opening a PR; also whenever the user asks for an architecture review, code review, design review, "does this follow the architecture", "check my branch/PR/diff", or worries about the codebase growing messy, even if they only mention one file.
---

# Architecture guard for @platform/ui

Several apps depend on this kit, so every shortcut is copied and multiplied. The kit stays extensible only if each change lands in the right layer, reuses what exists, and grows the public surface on purpose. This skill has two parts: a **design gate** before writing code and a **review gate** before calling the change done. Use both for features; for a small fix the review gate alone is enough.

The architecture itself (layers, placement table, reuse table, budgets, API and dependency rules, known debt) is in `references/architecture.md`. Read it the first time you use this skill in a session.

This skill decides *whether and where*; `platform-ui-component` has the *how* (templates, showcase, fixtures, docs). Use them together.

## 1. Design gate (before writing code)

Answer these in a few lines, in your reply or plan, before editing:

1. **Layer and file.** Which layer holds the change (use the placement table)? Name the files you will touch or create. Pick the lowest layer that works: token before theme, theme before wrapper, prop on an existing component before a new component, util before a component helper.
2. **Reuse.** What already exists that does this or almost this? Search first:
   ```bash
   grep -rn "<keyword>" src/components src/utils src/theme docs/
   ```
   If something close exists, extend it. A new component needs a sentence on why no existing one fits.
3. **Public surface.** Which new exports, props or types will apps see? Can any stay internal? Do new prop names match the existing vocabulary (`value`/`onChange`, `open`/`onClose`, `labels`, `disabled`, `loading`)?
4. **Growth.** Will a touched file go past its budget (component 400 lines, module 300)? If it is already over, plan the split first, as a separate step.
5. **Dependencies.** Any new package? Default answer is no; build it from MUI and existing deps.

If an answer conflicts with the architecture (a component that needs to import the theme, an area that needs another area), stop and move the shared piece down a layer instead of adding the import. If the right design needs a change to the architecture itself, say so to the user and update `references/architecture.md` as part of the change; do not bend the rule silently.

## 2. Review gate (before "done", commit or PR)

### 2a. Run the automated check

```bash
node .claude/skills/platform-ui-architecture/scripts/check-architecture.mjs              # this branch + uncommitted work vs main
node .claude/skills/platform-ui-architecture/scripts/check-architecture.mjs --base <ref> # a specific range, e.g. a PR base
node .claude/skills/platform-ui-architecture/scripts/check-architecture.mjs --all        # whole library, shows known debt
```

It checks layer direction, import cycles, files outside the library layers, unknown or banned packages, MUI barrel imports, Node built-ins, orphan files, raw Web Storage, `clsx` outside `cn`, `alpha(colors.x)`, `JSON.stringify` in hook deps, default exports, file growth over budget, new exports without catalog / docs / changelog / fixture, removed exports, too many new exports, new dependencies, `tokens.ts` vs `tokens.generated.css`, new logic modules without unit tests, and library changes without a changelog entry.

- **Errors** must be fixed. Do not work around one by moving code to a place the script does not look.
- **Warnings** are fixed, or explained in the review.
- A deliberate exception gets `// architecture-allow: <rule> <reason>` on or above the line; the script lists every allowance, and you mention each in the review. Use it rarely; an exception that keeps coming back means the architecture doc needs a change.

### 2b. Review what the script cannot see

Read the full diff (`git diff <base>` plus untracked files) and go through each point. Most have no automatic check, so this part matters as much as 2a.

| Check | What to look for |
| --- | --- |
| Right layer | Styling that belongs in `createPlatformTheme` written as `sx` or `styled()` in a wrapper; a design value hard-coded in a component instead of a token; pure logic inside a component body instead of a tested module |
| Duplication | A new helper, hook or component that repeats something in the reuse table or in another component; copy-pasted blocks between files |
| One job per component | A new component overlapping an existing one; a component that grew a mode flag that turns it into two components (a `variant` that switches between a table and a grid) |
| API shape | Callbacks return values, not events; numbers stay numbers; `null` for empty; `className` merged with `cn()`; texts overridable through `labels` on text-heavy components; old signatures still work |
| Minimal surface | Exports that only the showcase or one component uses; props that only exist for one demo; types exported that apps never need |
| Tokens and appearance | `colors.*`, `shape.*`, `elevation.*`, `material.*` rather than raw values; works in Glass and Dark |
| Accessibility wiring | Form controls use `useFormField()`; icon-only buttons use `IconButton`; focus and keyboard handled like the nearest existing component |
| Scope | Unrelated refactors or formatting mixed into a feature; drive-by changes to files the task did not need |
| Tests and docs match | Specs assert the new behavior, not just render; docs tables match the real defaults in code; changelog under the right heading (Added / Changed / Fixed / Removed) |
| Known debt | Did the change add to a debt item in `references/architecture.md`, or copy its pattern? If it paid one off, remove the row |

### 2c. Verify

Run `npm run check`, plus `npm run test:e2e` (in the background; `npm run test:e2e -- --project desktop` while iterating) when components, the theme, CSS or the showcase changed. The architecture check does not replace them.

## 3. Report

End with a short review in this shape (the user reads it to decide whether to merge):

```
Architecture review: <PASS | PASS with notes | CHANGES NEEDED>

Placement: <where the change landed and why that layer>
Script:    <n errors, n warnings>; allowances: <list or none>
Checklist: <items that needed attention, with file:line; "no issues" for the rest>
Surface:   <new/changed/removed exports and props>
Deps:      <new dependencies or none>
Debt:      <added / paid off / untouched>
Verified:  <commands run and results>; not verified: <anything skipped>
```

`CHANGES NEEDED` whenever the script reports an error or a checklist item is a real violation. If you are reviewing your own change, fix the problems and run the gate again instead of reporting them; report `CHANGES NEEDED` only for someone else's code, or when fixing needs a decision from the user.

## Reviewing someone else's branch or PR

1. `git fetch` and find the base: `git merge-base origin/main <branch>`, or the PR's base (`gh pr view <n> --json baseRefName,headRefName`).
2. Check out the branch (or use a worktree) and run the script with `--base <merge-base>`.
3. Do 2b on `git diff <merge-base>...<branch>`.
4. Report as in section 3, with file:line for every finding and the concrete fix (which layer, which existing helper). Post it to the PR only if the user asks.

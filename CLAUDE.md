@AGENTS.md

## Claude Code notes

- Use the project skills in `.claude/skills/` for component work (`platform-ui-component`), app-side usage (`platform-ui-app`) and releases (`platform-ui-release`).
- `pnpm test:e2e` takes about two minutes (Chromium and WebKit); `--project desktop` runs Chromium only while iterating; run it in the background and keep working.
- To look at UI changes, run `pnpm dev` and open the showcase page or the harness fixture (`/tests/e2e/harness/index.html#<fixture>`); screenshots with Playwright work well for before/after comparisons.

@AGENTS.md

## Claude Code notes

- Use the project skills in `.claude/skills/` for architecture decisions and review (`platform-ui-architecture`: before non-trivial changes and before saying any change is done), component work (`platform-ui-component`), app-side usage (`platform-ui-app`) releases (`platform-ui-release`) and creating themes from a user's idea (`platform-ui-theme`).
- The `repo-maintainer` subagent (`.claude/agents/repo-maintainer.md`) handles a feature, bug fix or upkeep task end to end; delegate to it when the user asks for one, or do the work inline with the same skills.
- `npm run test:e2e` takes about two minutes (Chromium and WebKit); `npm run test:e2e -- --project desktop` runs Chromium only while iterating; run it in the background and keep working.
- To look at UI changes, run `npm run dev` and open the showcase page or the harness fixture (`/tests/e2e/harness/index.html#<fixture>`); screenshots with Playwright work well for before/after comparisons.

@AGENTS.md

## Claude Code notes

- Use the project skills in `.claude/skills/` for architecture decisions and review (`platform-ui-architecture`: before non-trivial changes and before saying any change is done), component work (`platform-ui-component`), app-side usage (`platform-ui-app`) releases (`platform-ui-release`) and creating themes from a user's idea (`platform-ui-theme`).
- The `repo-maintainer` subagent (`.claude/agents/repo-maintainer.md`) handles a feature, bug fix or upkeep task end to end; delegate to it when the user asks for one, or do the work inline with the same skills.
- The `integration-engineer` subagent (`.claude/agents/integration-engineer.md`) checks a release inside apps: it installs the tarball into the PoC app (`integration/poc-app`) and copies of the real apps, and says whether the release breaks one. Run it only for releases, after the version bump and changelog and before pushing the tag; it never edits the kit's source or the apps.
- The `human` subagent (`.claude/agents/human.md`) is the human-ownership guard; run it after `repo-maintainer` and before merging or releasing, and pass its owner questions on to the user. In silent mode (say "silent" in its prompt) it asks the user nothing and returns a fix list instead: send that list to `repo-maintainer`, then run `human` in silent mode again until it reports `CLEAN`; tell the user only what is under "Needs a person".
- `npm run test:e2e` takes about two minutes (Chromium and WebKit); `npm run test:e2e -- --project desktop` runs Chromium only while iterating; run it in the background and keep working.
- To look at UI changes, run `npm run dev` and open the showcase page or the harness fixture (`/tests/e2e/harness/index.html#<fixture>`); screenshots with Playwright work well for before/after comparisons.

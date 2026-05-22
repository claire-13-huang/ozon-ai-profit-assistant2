# Night Task Template

Use this template for one small future night-work task. This is a manual planning document only; it does not create automation.

## Task Title

`[short title here]`

## Goal

Describe the exact outcome Codex should produce.

Example:

- Improve one validation message.
- Add one small UI explanation.
- Update one documentation section.

## Context

Explain the current project state and why this task matters.

Include:

- Current phase: Phase 2 — Profit Decision MVP Improvement.
- Relevant files or feature area.
- Any prior behavior Codex must preserve.

## Allowed Files

List exact files or folders Codex may edit.

Example:

- `index.html`
- `css/style.css`
- `js/main.js`
- `docs/DEVELOPMENT_LOG.md`

## Forbidden Files

List files or areas Codex must not edit.

Example:

- `netlify.toml`
- deployment settings
- secrets or API key files
- unrelated archived files
- files outside the project workspace

## Constraints

Use concrete constraints.

Example:

- Do not change profit formulas.
- Do not change logistics formulas.
- Do not rename existing input/select/button IDs.
- Do not add dependencies.
- Do not add backend, database, login, API, Docker, GitHub Actions, or scheduled automation.
- Keep the change small and beginner-maintainable.

## Done When

Define completion criteria.

Example:

- The requested UI/documentation behavior exists.
- Existing valid calculation still works.
- Invalid states are not misleading.
- `node --check` passes for modified JavaScript files.
- `docs/DEVELOPMENT_LOG.md` is updated.
- A short report lists changed files, checks, risks, and manual test steps.

## Manual Test Cases

List exact manual tests Codex should report.

1. `[test case 1]`
2. `[test case 2]`
3. `[test case 3]`

## Expected Report Format

Codex should report:

- Summary of what changed
- Files changed
- Commands/checks run
- Manual tests to perform
- Known risks or limitations
- Whether formulas, deployment, dependencies, or product scope changed

## Rollback Notes

Explain how to undo the task if the morning review rejects it.

Example:

- Revert the task branch.
- Or revert only the listed changed files.
- Do not delete unrelated files.

## Human Approval Checkbox

- [ ] Human reviewed changed files
- [ ] Human reviewed git diff
- [ ] Human ran or accepted manual tests
- [ ] Human approved commit
- [ ] Human approved merge
- [ ] Human approved deployment, if relevant

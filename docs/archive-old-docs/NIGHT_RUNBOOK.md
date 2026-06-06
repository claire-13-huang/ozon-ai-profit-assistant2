# Night Runbook

This runbook describes a safe manual night-work workflow for future Codex automation. It does not create real automation, scheduled jobs, GitHub Actions, or background agents.

## Why Phase 2 Should Not Be Interrupted

- The product is still stabilizing as a Phase 2 Profit Decision MVP.
- Automation should support product delivery, not become the product.
- Premature automation can distract from input validation, error states, cost explanations, decision UI, and seller-facing usefulness.
- The safest path is to finish stable manual workflows first, then automate only the parts that are already reliable.

## A. Before Sleeping

1. Make sure current work is committed or intentionally saved.
2. Run `git status` and confirm there are no unexpected changes.
3. Create or switch to a safe branch for the night task.
4. Write one small task using `docs/NIGHT_TASK_TEMPLATE.md`.
5. Confirm allowed files and forbidden files.
6. Confirm forbidden actions:
   - no automatic merge
   - no automatic deploy
   - no API keys
   - no backend/database/API work
   - no new dependencies without approval
7. Define manual test cases before Codex starts.
8. Keep the task small enough to review in the morning.

## B. During Night Manual Simulation

Codex may:

- Execute only the prepared task.
- Modify only allowed files.
- Keep changes small and focused.
- Run safe checks such as `node --check` for modified JavaScript files.
- Update `docs/DEVELOPMENT_LOG.md`.
- Report changed files.
- Report test/check results.
- Report risks and unresolved questions.

Codex must not:

- Merge branches.
- Push automatically.
- Deploy automatically.
- Modify secrets or API keys.
- Install tools or dependencies.
- Start background agents.
- Add GitHub Actions or scheduled automation.
- Perform large refactors.

## C. Morning Review

1. Run `git status`.
2. Review changed files.
3. Inspect `git diff`.
4. Run browser manual tests from the task.
5. Run `node --check` for modified JavaScript files, if any.
6. Read the Codex report.
7. Decide:
   - accept
   - reject
   - ask Codex to revise
   - revert
8. Only after review, commit or merge manually.

## D. Safety Rules

- No direct edits to `main` for night tasks.
- No API keys in the repository.
- No auto-push unless explicitly approved.
- No auto-deploy.
- No large refactors.
- No backend, database, or API work.
- No new dependencies without approval.
- One night equals one small task.
- Every task needs a report.
- Every task needs a rollback path.
- Human user remains the final approval point.

## E. Future Automation Levels

### Level 1: Manual Night Task Template

- Use `docs/NIGHT_TASK_TEMPLATE.md`.
- User writes task manually.
- Codex executes only when explicitly asked.

### Level 2: Local Script Runs Checks Only

- A local script may later run safe checks.
- It should not edit code.
- It should not merge, push, deploy, or use secrets.

### Level 3: Local Script Runs Codex Exec On A Branch

- Only after Level 1 and Level 2 are stable.
- Must use a safe branch or isolated worktree.
- Must generate a report.
- Must not merge automatically.

### Level 4: GitHub Action Runs Codex On Schedule

- Only after manual and local workflows are stable.
- Must avoid secrets exposure.
- Must never deploy or merge without human approval.

### Level 5: Hermes Or Another Analysis Agent Creates Morning Report

- Analysis agent reviews diffs, logs, changed files, tests, and risk points.
- Analysis agent does not merge.
- Human user remains final decision maker.

## Recommended Current Use

For now, use this runbook only as documentation. Continue Phase 2 MVP development manually and safely.

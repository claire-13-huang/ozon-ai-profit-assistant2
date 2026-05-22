# AI Automation Roadmap

Date: 2026-05-22

This roadmap documents a possible future night automation workflow. It is not an implementation plan for the current Phase 2 milestone.

## Current Principle

- Do not interrupt Phase 2 Profit Decision MVP Improvement.
- Do not install automation tools yet.
- Do not add backend, database, login, API automation, or deployment automation.
- Keep the static MVP stable first.
- Keep all Phase 2 tasks small, reviewable, and manually verifiable.

## Future Night Workflow Idea

### Daytime

- User writes a small, clear Codex task.
- Each task includes:
  - Goal
  - Context
  - Constraints
  - Done when
  - Files or areas that may be changed
- Task is added to a queue document or task list.

### Night

- Codex runs one small task in a safe branch or isolated worktree.
- Codex modifies only allowed files.
- Codex runs available checks, such as `node --check` for JavaScript files and manual-test-report style summaries.
- Codex generates a report with changed files, diff summary, checks, risks, and unresolved questions.

### Morning

- Hermes or another analysis agent reviews:
  - git diff
  - changed files
  - test/check results
  - risk points
  - unresolved questions
- Human user manually decides:
  - accept
  - reject
  - ask Codex to revise
  - merge

## Agent Responsibility Boundaries

- Codex: development execution agent. It writes code/docs, runs checks, and prepares reports.
- Hermes or future analysis agent: post-run analysis and reporting agent. It reviews logs, diffs, risks, and test results.
- Human user: final decision maker and merge approver.
- n8n: may later orchestrate schedules once the manual workflow is stable.
- Dify: may later provide a workflow UI for task intake or review.
- Claude Skills: may later store reusable project and business rules.
- LangGraph or OpenAI Agents SDK: should only be considered after the workflow is stable and the project has clear multi-agent needs.

## Safety Rules

- No automatic merge.
- No production deployment without human approval.
- No secret or API key exposure.
- No direct modification of the main branch for night automation tasks.
- Every task must be small.
- Every task must generate a report.
- Every task must have a rollback path.
- Every task must preserve current MVP formulas unless the user explicitly approves a formula change.
- Every task should prefer documentation, checks, and small UI/logic improvements over broad rewrites.

## Recommended Future Phases

### Phase A: Documentation-Only Planning

- Keep documenting rules, test cases, responsibilities, and future automation boundaries.
- Do not install automation tools.

### Phase B: Manual Night Workflow Simulation

- User writes a queue item.
- Codex manually works on a separate branch or worktree.
- Codex produces a morning-style report.
- User reviews and decides manually.

### Phase C: Semi-Automated Task Queue

- Use a simple document or issue list as the queue.
- Add task templates with Goal / Context / Constraints / Done when.
- Keep execution manual or explicitly triggered.

### Phase D: Automated Checks And Reports

- Add safe check scripts only after the MVP is stable.
- Reports should include changed files, command results, risk notes, and manual verification steps.
- Still no automatic merge.

### Phase E: Optional Orchestration With n8n / Dify / Hermes

- Consider n8n only for scheduling and notifications.
- Consider Dify only for task intake or review UI.
- Consider Hermes or another analysis agent only for post-run review.
- Keep Codex as the implementation agent.

### Phase F: True Multi-Agent Workflow

- Consider LangGraph or OpenAI Agents SDK only much later.
- Use this only if the workflow genuinely needs multiple coordinated agents and the simpler process is already stable.

## What Not To Do Now

- Do not install Hermes now.
- Do not install Dify now.
- Do not install n8n now.
- Do not introduce LangGraph now.
- Do not create real background automation now.
- Do not add OpenAI API automation now.
- Do not add secrets, API keys, or service accounts.
- Do not add automatic merge or deploy behavior.
- Do not distract from Phase 2 MVP improvement.

## Near-Term Recommendation

Finish Phase 2 first:

- input validation
- empty/error states
- cost/result explanations
- decision-focused UI
- localStorage save/load if still useful

After Phase 2 is stable, simulate the night workflow manually before adding any automation runtime.

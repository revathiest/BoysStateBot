# Codex Agent Instructions

This file applies to the entire repository and supplements `agents.md`.

- **Tests Required**: Every change must include corresponding tests.
- **Coverage Requirement**: The test suite must maintain at least **80%** line coverage.
- Use `npm test` to run tests and generate coverage reports.

# NMBS Discord Bot Development Guidelines

## Purpose & Scope

This document outlines coding standards, test expectations, deployment requirements, and GitHub practices for contributors to the New Mexico Boys State Discord Bot.

---

## Coding Standards

* Use **ESLint** (Airbnb or equivalent).
* Prefer `const` unless reassignment is necessary.
* Always use `async/await` — no `.then()` chains.
* Modular, reusable code structure is required.
* Document exported functions and maintain logical clarity.
* Follow linting rules and minimise complexity.
* Inject dependencies for testability.
* Maintain clear separation of Discord I/O, DB logic, and utilities.

---

## Command Structure

* Use `SlashCommandBuilder` (Discord.js v14).
* Export `data` and `execute` in each command module.
* Place commands in appropriate logical folders.
* Use ephemeral replies for admin/user-specific interactions.
* Prefer **Embeds** for bot responses.

---

## Database Use

* Use **Sequelize ORM** exclusively.
* Define models clearly with types, constraints, defaults.
* Wrap DB logic in `try/catch` with context-aware error logs.
* Validate inputs both in Sequelize and commands.

---

## Testing Protocols

* Use **Jest** with high-fidelity mocks (Discord.js).
* Include test files for each command/module.
* Cover all logical branches.
* Ensure test stability with state resets.
* Use `beforeEach`/`afterEach` for mocks cleanup.

---

## Git & Repo Hygiene

* Feature branches: `feature/`, `fix/`, `test/`, etc.
* Peer review all PRs.
* Include a summary, evidence, and screenshots where needed.
* Clean, conventional commit messages.
* No stray `console.log`s — clean code only.

---

## Bot Behaviour Expectations

* Don’t alter nicknames unless necessary.
* Enforce rules immediately — no delay queues.
* Preserve name structure/casing.
* Log moderation actions with full context.

---

## Deployment Practices

* Deploy via GitHub Actions.
* Tag releases semantically (e.g., `v1.2.3`).
* Require passing tests and one approval before merge.

---

## ✅ Pull Request Checklist

* [ ] Merges latest changes from `origin/development` or `origin/master`.
* [ ] Unit tests cover all new logic, including edge cases and failures.
* [ ] Mocks validate input/output.
* [ ] All tests pass (`npm test`).
* [ ] `CHANGELOG.md` updated (unless trivial/internal).
* [ ] Branch name uses correct prefix.
* [ ] Commits are concise, descriptive, and linked to issues.
* [ ] Code is clean, documented, and free of `console.log`.

---

## 📈 Test Coverage Requirements

### Coverage Goals

* Target **≥80% line coverage** overall.
* Require **80–90%** in core modules (auth, payments, logic).
* Accept **≥70%** in low-risk or legacy code.

### Principles

1. Focus on business-critical/security-sensitive logic.
2. Use branch & condition coverage for tricky bits.
3. Rely on code reviews to catch weak/missing tests.
4. Generate coverage reports but don’t gate PRs solely on %.

### Expectations

* Tests must:

  * Cover success, failure, and edge cases.
  * Validate parameters and DB interactions.
  * Handle external service/data failures.
  * Confirm side effects (roles, messages, writes).
  * Avoid redundant/trivial tests.

* Codex Agents:

  * Review all `__tests__/*.test.js` files.
  * Fill coverage gaps where valuable.
  * Flag weak assertions, invalid mocks, or missing branches.
  * Refactor with deeper checks or edge handling.

---

## ⚠️ Prohibited Patterns

* Tests without behavioural validation.
* Always-true mocks with no input checks.
* Duplicate tests.
* Raw SQL.
* Noisy or unscoped logging.

---

Keep it clean, clear, and reliable. If you're unsure, speak up — better to ask than assume.

Onward, coders. Let’s keep this bot razor-sharp.

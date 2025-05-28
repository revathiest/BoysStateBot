# NMBS Discord Bot Development Guidelines

## Purpose & Scope

Defines best practices and development standards for contributors to the New Mexico Boys State Discord Bot.

## Coding Standards

* Use **ESLint** (Airbnb or equivalent).
* Prefer `const` unless reassignment is required.
* Use `async/await` exclusively.
* Write modular, reusable code.
* Document exported functions and key logic thoroughly.
* Follow linting rules and minimise complexity.
* Use dependency injection for testability.
* Maintain separation between Discord I/O, DB logic, and utilities.

## Command Design

* Use `SlashCommandBuilder` (Discord.js v14).
* Export `data` and `execute` in each command file.
* Organise commands in logical folders.
* Use ephemeral replies for admin/user-specific commands.
* Prefer **Embeds** for responses.

## Database Use

* Use **Sequelize ORM** only.
* Define models clearly with types, constraints, defaults.
* Wrap DB logic in `try/catch` with clear error logs.
* Validate inputs both in Sequelize and commands.

## Testing Protocols

* Use **Jest** with high-fidelity mocks (Discord.js).
* Include test files for each command/module.
* Cover all logical branches.
* Ensure test stability with state resets.
* Use `beforeEach`/`afterEach` to clean mocks.

## Git & Repo Hygiene

* Name branches: `feature/`, `fix/`, `test/`, etc.
* Peer review all PRs.
* Include a summary, evidence, and relevant screenshots.
* Use clear, conventional commit messages.

## Bot Behaviour Expectations

* Don’t alter nicknames unless necessary.
* Enforce rules immediately — no delays.
* Preserve name structure/casing.
* Log moderation actions with full context.

## Deployment Practices

* Deploy via GitHub Actions.
* Tag releases semantically (e.g., `v1.2.3`).
* Require passing tests and one approval before production.

---

## ✅ Pull Request Checklist

* [ ] Merged latest changes from `origin/development` or `origin/master`.
* [ ] Unit tests cover all new logic, including edge cases and failures.
* [ ] Mocks validate input/output (`toHaveBeenCalledWith`, etc.).
* [ ] All tests pass (`npm test`).
* [ ] `CHANGELOG.md` updated (unless trivial/internal).
* [ ] Branch name uses correct prefix.
* [ ] Commits are concise, descriptive, and issue-linked.
* [ ] Code is clean, documented, and free of `console.log`.

---

## 📁 Test Coverage Requirements

### Coverage Goals

* Target **70–80% overall line coverage**.
* Require **80–90%** in core modules (e.g., auth, payments).
* Accept **60–70%** in low-risk or legacy code.

### Principles

1. Focus on business-critical/security-sensitive code.
2. Use branch and condition coverage for logic-heavy parts.
3. Rely on code reviews to catch weak/missing tests.
4. Generate coverage reports but don’t gate PRs solely on coverage %.

### Expectations

* Tests must:

  * Cover success, failure, edge cases.
  * Validate parameters and DB interactions.
  * Handle external service/data failures.
  * Confirm side effects (roles, messages, writes).
  * Avoid redundant/trivial tests.

* Codex Agents:

  * Review all `__tests__/` and `*.test.js` files.
  * Fill coverage gaps where valuable.
  * Flag weak assertions, unvalidated mocks, missing branches.
  * Refactor with deeper checks, failure simulations, edge handling.

---

## 🚫 Prohibited Patterns

* Tests without behavioural validation.
* Always-true mocks with no input checks.
* Duplicated tests.
* Raw SQL.
* Noisy or unscoped logging.

---

Keep it clean, clear, and reliable. If you're unsure, speak up — better to ask than to assume.

Onward, coders. Keep this bot razor-sharp.

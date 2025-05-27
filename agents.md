# AGENTS.md

This document outlines contributor and AI agent standards for maintaining and extending the **NMBS Discord Bot** project. These guidelines are mandatory for all code contributions, automation tasks, and test implementations across the repository.

---

## ⚙️ Repo Standards

### Language & Design

* Use **JavaScript (Node.js)** with CommonJS or ESM as appropriate.
* Prioritise **modular design** — one logical function per file, keep it clean and decoupled.
* Use **Sequelize ORM** for all DB interactions — no raw SQL, ever.
* All Discord integration must leverage the **Discord.js v14 Slash Command Interaction API**.

### Command Structure

* All commands live in the `commands/` directory.
* Organise them by category (e.g. `admin`, `city`, `elections`) for clarity only.
* Each `.js` file defines a complete top-level slash command.
* For multi-part commands like `/election start` or `/election status`, break logic into subcommand files within a subfolder, and register them in the main command file using `.addSubcommand(...)`.

**Structure Example:**

```
commands/
├── user/
│   ├── verify.js           => /verify
│   └── whois.js            => /whois
├── election/
│   ├── election.js         => /election (aggregates subcommands)
│   └── election/
│       ├── start.js        => defines `start` subcommand logic
│       └── status.js       => defines `status` subcommand logic
```

**Command File Structure:**

```js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandName')
    .setDescription('Command description'),
  async execute(interaction) {
    // Command logic goes here
  },
};
```

---

## ✅ Pull Request Checklist

* [ ] Latest from `origin/main` or `origin/dev` merged with no conflicts.
* [ ] Unit tests cover all new logic, including failure paths.
* [ ] Input validation is mocked and asserted.
* [ ] All tests pass (`npm test` is green).
* [ ] `CHANGELOG.md` updated unless change is trivial/internal.
* [ ] Branch name uses correct prefix: `feat/`, `fix/`, `refactor/`, `test/`.
* [ ] Commits are concise, descriptive, and reference any issues.
* [ ] Code is clean, modular, documented — and no console logs.
* [ ] Mocks properly scoped with `beforeEach`/`afterEach`.

---

## 📁 Test Coverage Requirements

### Unit Testing

Each module **must** include tests that:

* Cover success, failure, and edge cases.
* Validate function parameters.
* Assert Sequelize interactions with `toHaveBeenCalledWith(expect.objectContaining(...))`.
* Simulate external service failure and confirm graceful fallback.
* Confirm side effects: e.g. role assignment, embed messages, database updates.
* Avoid noise — no meaningless tests just to hit coverage numbers.

### AI Agent Test Tasking

* Review all `*.test.js` and `__tests__/` content.

* Watch for:

  * Weak assertions (like `toHaveBeenCalled()` with no args).
  * Missing negative case coverage.
  * Untested mocks or outputs.

* Refactor to:

  * Improve assertions — validate arguments and outputs.
  * Test conditional logic and error paths using `mockRejectedValueOnce()`.
  * Validate unexpected or invalid inputs.
  * Remove dead/duplicate tests.

---

## 🚫 Prohibited Patterns

* Tests that don’t assert logic.
* Mocked functions that return truthy with no verification.
* Duplicate test paths.
* Raw SQL queries.
* Console logging in non-debug code.

---

## 🧵 Code Hygiene

* Adhere to linting rules — format like a professional, not a pirate.
* Don’t be clever for clever’s sake — keep logic lean.
* Use dependency injection for clean testing.
* Keep Discord logic, DB logic, and utilities clearly separated.

---

This file is your gospel if you're contributing to the NMBS Discord Bot. No mess, no shortcuts — just clean code and top-tier bot behaviour.

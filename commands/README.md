# Commands Directory

This folder contains all top-level command handlers for the BoysStateBot.

✅ Each command is implemented as a separate `.js` file using Discord.js v14's SlashCommandBuilder.

✅ Commands that support **subcommands** will have a subdirectory matching the command's name.

Example:

- `calendar.js` → `/calendar` command
- `calendar/` → holds `set.js`, `edit.js`, `remove.js`, `list.js` for `/calendar set`, `/calendar edit`, etc.

When adding a new command:

1. Create a new `.js` file here if it’s a standalone command.
2. If adding subcommands, create a directory with the same name as the main command and place the subcommands inside.

Permissions, options, and descriptions should be defined inside each command file using `SlashCommandBuilder`.

# /calendar Subcommands

This folder contains the subcommand handlers for the `/calendar` command.

Each file implements a subcommand for managing Google Calendar integration:

- `set.js` → `/calendar set`
- `edit.js` → `/calendar edit`
- `remove.js` → `/calendar remove`
- `list.js` → `/calendar list`
- `toggle-notifications.js` → `/calendar toggle-notifications`

All subcommands are built using Discord.js v14's SlashCommandBuilder.

Permissions and validation are handled per subcommand.

To add a new subcommand:

1. Create a new `.js` file in this folder.
2. Export a `SlashCommandBuilder` instance and handler function.

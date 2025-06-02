# /drive Subcommands

Handlers for the `/drive` command. Accessible to users with the **Director**, **Office Staff**, **Senior Counselor**, or **Junior Counselor** roles (and administrators).

- `search.js` – `/drive search` for locating and directly downloading Google Drive files by name.
- `grep.js` – `/drive grep` lets authorized staff search the contents of private Drive files. Results are shown in a dropdown menu and, once selected, the bot downloads the file (Google Docs are exported as PDFs) and attaches it in an ephemeral reply.

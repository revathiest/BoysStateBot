# Transcribe Subcommands

Handlers for `/transcribe`:

- `start.js` – admin-only; joins a voice channel and begins transcribing (needs `OPENAI_API_KEY`).
- `stop.js` – admin-only; leaves, posts the .txt transcript and saves it to the database.

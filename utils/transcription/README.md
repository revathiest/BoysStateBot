# Transcription Utilities

Voice transcription pipeline:

- `audio.js` – PCM downmix and WAV encoding.
- `whisper.js` – OpenAI Whisper API client (`OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, `TRANSCRIPTION_LANGUAGE`).
- `session.js` – joins a voice channel and transcribes each speaker.
- `manager.js` – one active session per guild; saves and posts results.
- `formatter.js` – builds the transcript text and file name.
- `summarizer.js` – AI summary (key points, action items) via chat completions (`OPENAI_SUMMARY_MODEL`, default gpt-4o-mini).

## Reliability and long meetings

- **Checkpointing** – `manager.begin` inserts a draft `Transcript` row; every `CHECKPOINT_MS` (3 min) the entries so far are written to it. `finish` updates the same row.
- **Chunked summaries** – `summarizer.js` sends transcripts up to `CHUNK_CHARS` (300k chars) in one request; longer ones are summarised per part and merged.
- **Long summaries** – embed text is capped at `EMBED_LIMIT`; the full summary is attached as `summary-*.md`.
- **Timeouts** – Whisper and summary requests abort after 60 s; `session.stop` waits at most 90 s for in-flight audio.
- **Failure reporting** – `finish` returns `summaryError`, `saveError` and `postError`; `/transcribe stop` and the posted embed footer show them.
- Speakers are labelled with their server display name on every entry.

# Transcription Utilities

Voice transcription pipeline:

- `audio.js` – PCM downmix and WAV encoding.
- `whisper.js` – OpenAI Whisper API client (`OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, `TRANSCRIPTION_LANGUAGE`).
- `session.js` – joins a voice channel and transcribes each speaker.
- `manager.js` – one active session per guild; saves and posts results.
- `formatter.js` – builds the transcript text and file name.
- `summarizer.js` – AI summary (key points, action items) via chat completions (`OPENAI_SUMMARY_MODEL`, default gpt-4o-mini).

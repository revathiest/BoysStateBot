# Changelog

## Unreleased

- Add `/transcribe start|stop`: joins a voice channel, transcribes speech with OpenAI Whisper, posts a .txt file and saves it to the `transcripts` table. Requires `OPENAI_API_KEY` and the GuildVoiceStates intent.
- Transcripts now include an AI summary (key points, decisions, action items) posted with the file and stored in `transcripts.summary`. Existing databases need: `ALTER TABLE transcripts ADD COLUMN summary LONGTEXT NULL;`
- Transcription hardening for long meetings: transcript is checkpointed to the database every 3 minutes (a crash no longer loses it); long transcripts are summarised in chunks and merged; summaries over the embed limit are attached as `summary-*.md`; API calls have timeouts and `/transcribe stop` can no longer hang on a stuck request.
- `/transcribe stop` and the posted transcript now state exactly what failed (summary, database save, or posting) and why.

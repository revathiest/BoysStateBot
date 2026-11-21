# Changelog

## Unreleased

- Add `/transcribe start|stop`: joins a voice channel, transcribes speech with OpenAI Whisper, posts a .txt file and saves it to the `transcripts` table. Requires `OPENAI_API_KEY` and the GuildVoiceStates intent.
- Transcripts now include an AI summary (key points, decisions, action items) posted with the file and stored in `transcripts.summary`. Existing databases need: `ALTER TABLE transcripts ADD COLUMN summary LONGTEXT NULL;`

# Sequelize Models

This folder contains Sequelize model definitions for the BoysStateBot database.

Current models:

- `CalendarConfig.js` → stores configured Google Calendar IDs for each guild.
- `TriviaQuestion.js` → stores trivia questions and answers for the `/nmtrivia` command.

Each model exports a function that defines the schema and associations.

Models are initialized and synced in `/db/index.js` and `/db/sync.js`.

When adding a new model:

1. Create a new `.js` file here.
2. Follow the existing pattern (define the model as a function with `(sequelize, DataTypes)`).
3. Register it in `/db/models/index.js`.

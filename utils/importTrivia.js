const fs = require('fs');
const path = require('path');
const TriviaQuestion = require('../db/models/TriviaQuestion');

async function importTriviaFromJSON() {
  const filePath = path.join(__dirname, '../data/nmtrivia.json');

  if (!fs.existsSync(filePath)) {
    console.log('📁 No trivia JSON file found, skipping import.');
    return;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  let questions;
  try {
    questions = JSON.parse(data);
  } catch (err) {
    console.error('❌ Invalid JSON in nmtrivia.json:', err);
    return;
  }

  let inserted = 0;
  for (const q of questions) {
    const exists = await TriviaQuestion.findOne({
      where: {
        question: q.question,
        correct_answer: q.answer,
      },
    });

    if (!exists) {
      const [a, b, c, d] = q.choices;
      await TriviaQuestion.create({
        question: q.question,
        correct_answer: q.answer,
        choice_a: a,
        choice_b: b,
        choice_c: c,
        choice_d: d,
      });
      inserted++;
    }
  }

  if (inserted > 0) {
    console.log(`✅ Imported ${inserted} new trivia questions.`);
  } else {
    console.log('🟡 Trivia questions already in database. Nothing new to import.');
  }
}

module.exports = importTriviaFromJSON;

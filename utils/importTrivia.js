const fs = require('fs');
const path = require('path');
const TriviaQuestion = require('../db/models/TriviaQuestion');

async function importTriviaFromJSON() {
  const filePath = path.join(__dirname, '../data/nmtrivia.json');

  if (!fs.existsSync(filePath)) {
    console.log('📁 No trivia JSON file found at:', filePath);
    return;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  let questions;
  try {
    questions = JSON.parse(data);
    console.log(`📚 Loaded ${questions.length} questions from JSON`);
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err);
    return;
  }

  let inserted = 0;
  for (const [i, q] of questions.entries()) {
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
      console.log(`✅ Inserted [${i + 1}/${questions.length}]: ${q.question}`);
    } else {
      //console.log(`⏭️ Skipped duplicate [${i + 1}/${questions.length}]: "${q.question}"`);
    }
  }

  console.log(`📦 Import complete. Inserted: ${inserted}, Skipped: ${questions.length - inserted}`);

  // Delete the JSON file after import
try {
  fs.unlinkSync(filePath);
  console.log(`🧹 Removed JSON file after successful import: ${filePath}`);
} catch (err) {
  console.warn(`⚠️ Could not delete trivia file: ${err.message}`);
}

}

module.exports = importTriviaFromJSON;

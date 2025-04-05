const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const TriviaQuestion = sequelize.define('TriviaQuestion', {
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correct_answer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  choice_a: DataTypes.STRING,
  choice_b: DataTypes.STRING,
  choice_c: DataTypes.STRING,
  choice_d: DataTypes.STRING,
  category: DataTypes.STRING,
  difficulty: DataTypes.STRING,
}, {
  tableName: 'trivia_questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = TriviaQuestion;

const sequelize = require('./index');
const TriviaQuestion = require('./models/TriviaQuestion');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to the database has been established successfully.');
    
    await sequelize.sync();
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

syncDB();

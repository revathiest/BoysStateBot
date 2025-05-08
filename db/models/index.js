const fs = require('fs');
const path = require('path');
const sequelize = require('../index');
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file)); // ✅ no function call
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
module.exports = db;

const mockSequelize = { id: 'sequelize' };
jest.mock('../../../db/index', () => mockSequelize);

jest.mock('../../../db/models/CalendarConfig', () => ({ name: 'CalendarConfig', associate: jest.fn() }));
jest.mock('../../../db/models/CalendarEvent', () => ({ name: 'CalendarEvent', associate: jest.fn() }));
jest.mock('../../../db/models/NotificationChannel', () => ({ name: 'NotificationChannel', associate: jest.fn() }));
jest.mock('../../../db/models/TriviaQuestion', () => ({ name: 'TriviaQuestion', associate: jest.fn() }));

describe('models/index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('loads models and sets up associations', () => {
    const db = require('../../../db/models');
    const cfg = require('../../../db/models/CalendarConfig');
    const event = require('../../../db/models/CalendarEvent');
    const channel = require('../../../db/models/NotificationChannel');
    const trivia = require('../../../db/models/TriviaQuestion');

    expect(db.CalendarConfig).toBe(cfg);
    expect(db.CalendarEvent).toBe(event);
    expect(db.NotificationChannel).toBe(channel);
    expect(db.TriviaQuestion).toBe(trivia);
    expect(cfg.associate).toHaveBeenCalledWith(db);
    expect(event.associate).toHaveBeenCalledWith(db);
    expect(channel.associate).toHaveBeenCalledWith(db);
    expect(trivia.associate).toHaveBeenCalledWith(db);
    expect(db.sequelize).toBe(mockSequelize);
  });

  it('handles models without an associate function', () => {
    const fs = require('fs');
    const path = require('path');
    const modelsDir = path.join(__dirname, '../../../db/models');
    const original = fs.readdirSync(modelsDir);
    jest.spyOn(fs, 'readdirSync').mockReturnValue([...original, 'NoAssociate.js']);

    jest.mock('../../../db/models/NoAssociate.js', () => ({ name: 'NoAssociate' }), { virtual: true });

    const db = require('../../../db/models');

    expect(db.NoAssociate).toBeDefined();
    expect(db.NoAssociate.associate).toBeUndefined();
  });
});

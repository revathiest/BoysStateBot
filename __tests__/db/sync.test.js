jest.mock('../../db/index', () => ({
  authenticate: jest.fn(() => Promise.resolve()),
  sync: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../db/models/TriviaQuestion', () => ({}));

describe('db/sync.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('authenticates, syncs and closes connection on import', async () => {
    const sequelize = require('../../db/index');
    jest.isolateModules(() => {
      require('../../db/sync');
    });
    await new Promise(setImmediate);
    expect(sequelize.authenticate).toHaveBeenCalled();
    expect(sequelize.sync).toHaveBeenCalled();
    expect(sequelize.close).toHaveBeenCalled();
  });

  it('logs error when authenticate fails', async () => {
    const sequelize = require('../../db/index');
    const error = new Error('fail');
    sequelize.authenticate.mockRejectedValueOnce(error);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../../db/sync');
    });
    await new Promise(setImmediate);
    expect(errSpy).toHaveBeenCalledWith('\u274c Unable to connect to the database:', error);
    expect(sequelize.close).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

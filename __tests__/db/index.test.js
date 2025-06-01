jest.mock('sequelize', () => ({ Sequelize: jest.fn() }));

describe('db/index.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initialises Sequelize using environment vars', () => {
    const mockInstance = {};
    const { Sequelize } = require('sequelize');
    Sequelize.mockImplementation(() => mockInstance);

    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'user';
    process.env.DB_PASS = 'pass';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '3306';

    jest.isolateModules(() => {
      const sequelize = require('../../db');
      expect(Sequelize).toHaveBeenCalledWith(
        'testdb',
        'user',
        'pass',
        expect.objectContaining({
          host: 'localhost',
          port: '3306',
          dialect: 'mysql',
          logging: false,
        })
      );
      expect(sequelize).toBe(mockInstance);
    });
  });
});

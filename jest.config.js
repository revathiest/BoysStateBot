module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    moduleDirectories: ['node_modules', '<rootDir>'],
    moduleNameMapper: {
      '^discord.js$': '<rootDir>/__mocks__/discord.js',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
  
    // === COVERAGE SETTINGS ===
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
      'utils/**/*.{js,ts}',
      'commands/**/*.{js,ts}',
      'db/**/*.{js,ts}',
      'handlers/**/*.{js,ts}',
      '!**/node_modules/**',
      '!**/__mocks__/**',
      '!**/__tests__/**'
    ],
    coverageThreshold: {
      global: {
        lines: 80
      }
    },
  
    // === SILENT MODE ===
    verbose: false,
    silent: true,
    reporters: ['default']
  };
  
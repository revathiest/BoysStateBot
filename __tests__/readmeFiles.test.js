const fs = require('fs');
const path = require('path');

describe('Repository documentation', () => {
  const directories = [
    '__mocks__',
    '__tests__/handlers',
    '__tests__/handlers/selectMenus',
    '__tests__/handlers/modals',
    '__tests__/handlers/buttons',
    '__tests__/db',
    '__tests__/db/models',
    '__tests__/commands',
  ];

  directories.forEach((dir) => {
    test(`${dir} has README.md with a heading`, () => {
      const filePath = path.join(__dirname, '..', dir, 'README.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
      expect(firstLine.startsWith('# ')).toBe(true);
    });
  });
});

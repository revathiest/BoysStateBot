const fs = require('fs');
const path = require('path');

describe('Repository documentation', () => {
  const repoRoot = path.join(__dirname, '..');
  const excluded = new Set(['node_modules', '.git', 'coverage']);

  const getDirectories = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !excluded.has(entry.name))
      .flatMap((entry) => {
        const res = path.join(dir, entry.name);
        return [res, ...getDirectories(res)];
      });
  };

  const directories = [repoRoot, ...getDirectories(repoRoot)];

  directories.forEach((dir) => {
    const relativeDir = path.relative(repoRoot, dir) || '.';
    test(`${relativeDir} has README.md with a heading`, () => {
      const filePath = path.join(dir, 'README.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
      expect(firstLine.startsWith('# ')).toBe(true);
    });
  });
});

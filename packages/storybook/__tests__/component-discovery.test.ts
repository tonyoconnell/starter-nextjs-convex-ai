import path from 'path';
import fs from 'fs';

describe('Component Discovery', () => {
  const uiPackagePath = path.resolve(__dirname, '../../ui/src');

  it('should be able to resolve UI package path', () => {
    expect(fs.existsSync(uiPackagePath)).toBe(true);
  });

  it('should find Button component in UI package', () => {
    const buttonPath = path.join(uiPackagePath, 'button.tsx');
    expect(fs.existsSync(buttonPath)).toBe(true);
  });

  it('should find Button story in Storybook', () => {
    const storiesPath = path.resolve(__dirname, '../stories');
    const buttonStoryPath = path.join(storiesPath, 'Button.stories.tsx');
    expect(fs.existsSync(buttonStoryPath)).toBe(true);
  });

  it('should have proper export structure in UI package', async () => {
    const indexPath = path.join(uiPackagePath, '../index.ts');

    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      expect(indexContent).toContain('button');
    }
  });

  it('should have TypeScript configuration that supports UI imports', () => {
    const tsconfigPath = path.resolve(__dirname, '../tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@ui']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@ui/*']).toBeDefined();
  });
});

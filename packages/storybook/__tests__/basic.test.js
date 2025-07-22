// Basic test to verify Storybook configuration and component discovery
const fs = require('fs');
const path = require('path');

describe('Storybook Basic Configuration', () => {
  it('should have Storybook main configuration file', () => {
    const mainConfigPath = path.resolve(__dirname, '../.storybook/main.ts');
    expect(fs.existsSync(mainConfigPath)).toBe(true);
  });

  it('should have Storybook preview configuration file', () => {
    const previewConfigPath = path.resolve(
      __dirname,
      '../.storybook/preview.ts'
    );
    expect(fs.existsSync(previewConfigPath)).toBe(true);
  });

  it('should have Button story file', () => {
    const buttonStoryPath = path.resolve(
      __dirname,
      '../stories/Button.stories.tsx'
    );
    expect(fs.existsSync(buttonStoryPath)).toBe(true);
  });

  it('should have Tailwind CSS file', () => {
    const cssPath = path.resolve(__dirname, '../storybook.css');
    expect(fs.existsSync(cssPath)).toBe(true);
  });

  it('should be able to find UI package Button component', () => {
    const buttonPath = path.resolve(__dirname, '../../ui/src/button.tsx');
    expect(fs.existsSync(buttonPath)).toBe(true);
  });

  it('should have proper package.json scripts', () => {
    const packagePath = path.resolve(__dirname, '../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    expect(packageData.scripts.storybook).toBeDefined();
    expect(packageData.scripts['build-storybook']).toBeDefined();
    expect(packageData.scripts.test).toBeDefined();
  });

  it('should have required dependencies', () => {
    const packagePath = path.resolve(__dirname, '../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check for essential Storybook dependencies
    expect(packageData.devDependencies['@storybook/react']).toBeDefined();
    expect(packageData.devDependencies['@storybook/react-vite']).toBeDefined();
    expect(packageData.devDependencies['tailwindcss']).toBeDefined();
    expect(packageData.devDependencies['@tailwindcss/postcss']).toBeDefined();
  });
});

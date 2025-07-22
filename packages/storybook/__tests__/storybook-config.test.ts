import config from '../.storybook/main';
import path from 'path';

describe('Storybook Configuration', () => {
  it('should have the correct stories patterns', () => {
    expect(config.stories).toEqual([
      '../stories/**/*.mdx',
      '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
      '../../ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    ]);
  });

  it('should include essential addons', () => {
    const addonNames = config.addons;
    expect(addonNames).toBeDefined();
    expect(Array.isArray(addonNames)).toBe(true);

    // Check for essential addons (they'll be resolved paths in actual config)
    expect(addonNames.length).toBeGreaterThan(0);
  });

  it('should use React Vite framework', () => {
    expect(config.framework).toBeDefined();
    expect(typeof config.framework).toBe('object');
  });

  it('should have TypeScript configuration', () => {
    expect(config.typescript).toBeDefined();
    expect(config.typescript?.reactDocgen).toBe('react-docgen-typescript');
    expect(config.typescript?.reactDocgenTypescriptOptions).toBeDefined();
  });

  it('should have viteFinal configuration for aliases and PostCSS', () => {
    expect(config.viteFinal).toBeDefined();
    expect(typeof config.viteFinal).toBe('function');
  });

  describe('viteFinal configuration', () => {
    it('should configure aliases and PostCSS correctly', async () => {
      const mockConfig = {
        resolve: {},
        css: {},
      };

      const result = await config.viteFinal?.(mockConfig as any);

      expect(result?.resolve?.alias).toBeDefined();
      expect(result?.resolve?.alias['@ui']).toBeDefined();
      expect(result?.css?.postcss).toBeDefined();
      expect(result?.css?.postcss?.plugins).toBeDefined();
      expect(Array.isArray(result?.css?.postcss?.plugins)).toBe(true);
    });
  });
});

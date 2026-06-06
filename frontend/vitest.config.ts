import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit-test config. Coverage is scoped to the pure-logic / utility modules that
// are meaningfully unit-testable (the React overlay/control components are
// validated by tsc + lint, not unit-tested). See src/test/setup.ts.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      // Only the modules we exercise with unit tests count toward coverage.
      include: [
        'src/lib/profanity.ts',
        'src/lib/currency.ts',
        'src/lib/itemGrouping.ts',
        'src/lib/accentDeck.ts',
        'src/lib/utils.ts',
        'src/lib/api.ts',
        'src/lib/logoCatalog.ts',
        'src/lib/eventBus.ts',
        'src/lib/splashBus.ts',
        'src/lib/useTTS.ts',
        'src/lib/usePageTitle.ts',
        'src/routes/obs/objectiveSection.ts',
        'src/routes/obs/omnibar/fsm/playthroughMachine.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
});

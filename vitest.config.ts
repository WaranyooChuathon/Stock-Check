import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Native tsconfig path alias resolution (Vite supports this without a plugin).
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    // Load .env so integration tests can reach the dev database.
    setupFiles: ['dotenv/config'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'src/**/*.test.ts'],
  },
});

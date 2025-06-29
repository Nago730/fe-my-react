import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/helpers/testSetup.ts'],
		coverage: {
			reporter: ['text', 'html'],
			exclude: ['**/helpers/**'],
		},
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
	},
});

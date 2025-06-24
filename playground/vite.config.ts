import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react({
			// automatic runtime
			jsxRuntime: 'automatic',
			// pass custom importSource into @babel/preset-react:
			babel: {
				presets: [
					[
						'@babel/preset-react',
						{
							runtime: 'automatic',
							importSource: '@my-react',
						},
					],
				],
			},
		}),
	],
	resolve: {
		alias: {
			// this makes @my-react/* point at your src folder
			'@src': path.resolve(__dirname, '../src'),
			'@my-react': path.resolve(__dirname, '../src'),
		},
	},
});

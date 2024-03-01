import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, 'db/*.db', 'db/migrations/**', 'knexfile.ts', '*.env', '*.test', '*.example'],
	},
});

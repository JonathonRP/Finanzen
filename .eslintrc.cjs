const config = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:svelte/recommended',
		'airbnb-base',
		'airbnb-typescript/base',
		'prettier',
	],
	plugins: ['@typescript-eslint', 'import-no-duplicates-prefix-resolved-path', 'unused-imports'],
	ignorePatterns: [
		'node_modules',
		'dist',
		'build',
		'.{svelte,svelte-kit,pnpm-store,vercel_build_output}',
		'*.cjs',
		'svelte.config.js',
		'static/*.{js,ts,css}',
	],
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			rules: {
				'import/no-named-as-default': 0,
				'import/no-named-as-default-member': 0,
			},
		},
	],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		tsconfigRootDir: __dirname,
		project: true,
		extraFileExtensions: ['.svelte'],
	},
	env: {
		es6: true,
		node: true,
		browser: true,
	},
	settings: {
		'import/parsers': {
			'@typescript-eslint/parser': ['.cjs', 'js', '.ts'],
		},
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
			},
		},
	},
	rules: {
		'arrow-body-style': ['error', 'as-needed'],
		'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
		'import/prefer-default-export': 0,
		'no-param-reassign': 0,
		'import/extensions': 0,
		'import/no-extraneous-dependencies': 0,
		'import/no-mutable-exports': 0,
		'import/no-duplicates': 0,
		'import-no-duplicates-prefix-resolved-path/no-duplicates': [
			'error',
			{
				prefixResolvedPathWithImportName: true,
			},
		],
		'unused-imports/no-unused-imports-ts': 2,
	},
};

module.exports = config;

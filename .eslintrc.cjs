const config = {
  root: true,
  parser: "@typescript-eslint/parser",
  rules: {
    semi: ["error", "always"],
    "arrow-body-style": ["error", "as-needed"],
    "prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "import/prefer-default-export": "off",
    "import/no-mutable-exports": 0,
    "no-labels": 0,
    "no-restricted-syntax": 0,
  },
  extends: [
    "eslint:recommended",
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:import/recommended",
    "plugin:promise/recommended",
    "plugin:eslint-comments/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
    extraFileExtensions: [".svelte"],
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  overrides: [
    {
      files: ["**/*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".cjs", "js", ".ts", ".svelte"],
    },
    "import/extensions": [".js", ".ts"],
    "import/resolver": {
      node: {
        extensions: [".js", ".ts"],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "node_modules",
    "dist",
    "build",
    ".{svelte,svelte-kit,pnpm-store,vercel_build_output}",
    "*.cjs",
    "svelte.config.js",
    "static/*.{js,ts,css}",
  ],
};

module.exports = config;
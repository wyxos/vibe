import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const MAX_LINES = 500;

export default [
  {
    // Global ignores (equivalent of .eslintignore)
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/.output/**",
      "**/.gh-pages/**",
      "**/lib/**",
    ],
  },

  js.configs.recommended,

  // Base rules for all source-like files we care about.
  {
    files: ["**/*.{js,jsx,ts,tsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.es2021,
        ...globals.browser,
      },
    },
    rules: {
      // Prefer TS-aware versions where applicable.
      "no-undef": "off",
      "no-unused-vars": "off",

      "max-lines": [
        "warn",
        {
          max: MAX_LINES,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },

  // Node / tooling files
  {
    files: [
      "eslint.config.js",
      "playwright.config.{js,ts}",
      "vite.config.{js,ts}",
      "vitest.config.{js,ts}",
      "**/*.config.{js,ts}",
      "scripts/**/*.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Node ESM scripts at repo root (release helpers, etc.)
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
    },
  },

  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.es2021,
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // Defer undefined checks to TypeScript.
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Vue SFCs
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: {
        ...globals.es2021,
        ...globals.browser,
      },
    },
    plugins: {
      vue: vuePlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...(vuePlugin.configs["flat/recommended"]?.rules ?? {}),

      // Defer undefined checks to TypeScript.
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Tests: keep the max-lines rule, but relax some strictness.
  {
    files: ["tests/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];

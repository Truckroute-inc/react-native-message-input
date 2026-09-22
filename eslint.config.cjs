const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

const readableConditions = [
  {
    selector: "ConditionalExpression[test.type='LogicalExpression']",
    message: "Name compound decisions before selecting a value.",
  },
  {
    selector:
      "LogicalExpression[operator='&&'] > LogicalExpression[operator='||'], LogicalExpression[operator='||'] > LogicalExpression[operator='&&'], UnaryExpression[operator='!'] > LogicalExpression",
    message: "Use named predicates or separate guards for mixed conditions.",
  },
  {
    selector: "ChainExpression",
    message: "Handle missing values explicitly instead of optional chaining.",
  },
];

module.exports = defineConfig([
  expo,
  {
    files: ["*.cjs"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
  { ignores: ["coverage/**", "dist/**"] },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    files: ["{src,tests,example}/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-duplicate-type-constituents": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "import/no-cycle": "error",
      "no-restricted-syntax": ["error", ...readableConditions],
      "no-console": "error",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-nested-ternary": "error",
      "no-else-return": "error",
      "no-param-reassign": "error",
      "no-return-assign": "error",
      "no-unneeded-ternary": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "max-depth": ["error", 4],
    },
  },
  {
    files: ["{src,example}/**/*.{ts,tsx}"],
    rules: {
      "import/no-default-export": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: ["variable", "function", "typeLike"],
          modifiers: ["exported"],
          format: null,
          custom: {
            match: false,
            regex:
              "(?:Adapter|Common|Handler|Helper|Manager|Processor|Service|Utils|Wrapper)s?$",
          },
        },
        {
          selector: "function",
          modifiers: ["exported"],
          format: null,
          custom: {
            match: false,
            regex: "^(?:compute|convert|manage|process|run|transform)[A-Z0-9_]",
          },
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...readableConditions,
        {
          selector: "TSAsExpression",
          message: "Model the value instead of coercing its type.",
        },
        {
          selector: "TSNonNullExpression",
          message: "Guard nullable values instead of asserting them.",
        },
        {
          selector: "CallExpression[callee.name='require']",
          message: "Use ES module imports in package code.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: ["vitest", "bun:test", "node:test"],
          patterns: [
            {
              group: [
                "**/tests/**",
                "**/*.test",
                "**/*.test.*",
                "**/*fixtures*",
              ],
              message: "Production code must not import tests or fixtures.",
            },
          ],
        },
      ],
    },
  },
]);

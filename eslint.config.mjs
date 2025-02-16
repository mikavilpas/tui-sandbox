import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginImportX from "eslint-plugin-import-x"
import noOnlyTests from "eslint-plugin-no-only-tests"
import tseslint from "typescript-eslint"

export default tseslint.config([
  {
    ignores: [
      "eslint.config.mjs",
      "packages/integration-tests/cypress.config.ts",
      "packages/integration-tests/test-environment/**/*",
      "vitest.workspace.js",
      "packages/integration-tests/dist/",
      "packages/library/dist/",
      "packages/library/vite.config.js",
    ],
  },

  tseslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,

  {
    files: ["packages/integration-tests/cypress/support/tui-sandbox.ts"],
    rules: {
      // it's important that no relative packages are imported in this file,
      // because the end user does not have access to them in their own
      // project.
      "import-x/no-relative-packages": "error",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    plugins: {
      "no-only-tests": noOnlyTests,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: true,
      },
    },

    rules: {
      "no-only-tests/no-only-tests": "error",
      "@typescript-eslint/require-await": "off",

      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Don't declare enums",
        },
      ],
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            Omit: "Prefer using Except from type-fest instead. That one checks that the unwanted properties actually exist on the source object. See https://github.com/sindresorhus/type-fest",
          },
        },
      ],

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/explicit-module-boundary-types": ["warn"],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["error"],

      "lines-between-class-members": [
        "error",
        "always",
        {
          exceptAfterSingleLine: true,
        },
      ],

      "no-empty-function": [
        "error",
        {
          allow: ["constructors"],
        },
      ],

      "no-return-await": "off",
      "@typescript-eslint/return-await": "error",
      "no-useless-constructor": "off",

      "no-void": [
        "error",
        {
          allowAsStatement: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": "off",

      "import-x/no-extraneous-dependencies": [
        "error",
        {
          // Forbid the import of external modules that are not declared in the
          // package.json. This rule makes sure all the expected dependencies are
          // available at runtime. Because we leave out devDependencies from
          // production, there might be an issue if production code depended on a
          // devDependency.
          //
          // https://github.com/import-js/eslint-plugin-import/blob/HEAD/docs/rules/no-extraneous-dependencies.md
          devDependencies: [
            // don't check this in the files that match these
            "**/*.test.ts",
          ],
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
    },
  },

  // should be the last item, https://github.com/prettier/eslint-config-prettier?tab=readme-ov-file#installation
  eslintConfigPrettier,
])

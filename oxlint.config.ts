import mikaConfig from "@mikavilpas/oxlint-config"
import { defineConfig } from "oxlint"

export default defineConfig({
  extends: [mikaConfig],
  jsPlugins: [
    // https://github.com/levibuzolic/eslint-plugin-no-only-tests#oxlint
    "eslint-plugin-no-only-tests",
    "eslint-plugin-import-zod",
  ],
  env: {
    builtin: true,
    es2026: true,
  },
  ignorePatterns: [
    "eslint.config.mjs",
    "packages/integration-tests/cypress.config.ts",
    "packages/integration-tests/test-environment/**/*",
    "vitest.config.js",
    "packages/integration-tests/dist/",
    "packages/library/dist/",
    "packages/library/vite.config.js",
    "packages/library/src/server/cypress-support/tui-sandbox-template.ts",
  ],
  rules: {
    "no-only-tests/no-only-tests": "error",
    "typescript/consistent-return": "off", // use typescript noImplicitReturns as recommended by the rule
  },
  overrides: [
    {
      files: ["integration-tests/cypress/e2e/utils/*.ts", "integration-tests/cypress/e2e/*.cy.ts"],
      rules: {
        "no-unused-expressions": "off",
        // cypress does not support the node: protocol
        "unicorn/prefer-node-protocol": "off",
      },
    },
    {
      files: ["packages/library/bin/tui.js"],
      rules: { "no-unassigned-import": "off" },
    },
    {
      files: ["packages/library/src/scripts/**/*.ts"],
      rules: {
        // this is a cli application
        "unicorn/no-process-exit": "off",
      },
    },

    {
      files: ["packages/library/src/server/**/*.ts"],
      rules: {
        "no-restricted-properties": [
          "error",
          {
            object: "console",
            property: "log",
            message: 'Use `debuglog` from "node:util" instead.',
          },
        ],
      },
    },
    {
      files: ["packages/integration-tests/cypress/support/tui-sandbox.ts"],
      rules: {
        "typescript/no-unsafe-type-assertion": "off",
        // cypress type namespaces need to be modified by the file
        "typescript/no-namespace": "off",
      },
    },
  ],
})

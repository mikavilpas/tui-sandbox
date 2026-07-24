import config from "@mikavilpas/knip-config"

config.ignoreDependencies = [
  // Used for running TypeScript scripts via CLI
  "tsx",
  // Root devDependency satisfying @tui-sandbox/library's peer dependency
  "wait-on",
]
config.ignoreBinaries = [
  "show", // false positive: "pnpm show" in github-actions
]
config.ignoreFiles = [
  // runtime blueprint for the tests, not published code
  "packages/integration-tests/test-environment/**/*",
  "packages/integration-tests/tui-sandbox.config.ts",
]
config.workspaces = {
  "packages/integration-tests": {
    ignoreIssues: {
      "MyTestDirectory.ts": ["exports"],
    },
    ignoreDependencies: [
      // polyfill for cypress, knip confuses this for the builtin assert
      "assert",
    ],
  },
  "packages/library": {
    ignoreBinaries: [
      // used by the mise integration. The consumer provides the binary, we
      // just support it.
      "mise",
    ],
  },
}

export default config

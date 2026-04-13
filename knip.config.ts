import type { KnipConfig } from "knip"

const config: KnipConfig = {
  include: ["exports", "types", "dependencies", "unlisted", "files"],

  ignoreWorkspaces: [
    // Integration tests — Cypress specs are not traced as entry points
    "packages/integration-tests",
  ],

  ignoreDependencies: [
    // Used in CI for link checking, not referenced in code
    "@umbrelladocs/linkspector",
    // Root devDependency used by integration-tests (which is ignored by knip)
    "cypress",
    // Used for running TypeScript scripts via CLI
    "tsx",
    // Root devDependency satisfying @tui-sandbox/library's peer dependency
    "wait-on",
  ],

  workspaces: {
    "packages/library": {
      // package.json exports point to dist/ paths, so knip can't resolve
      // them to source files automatically
      entry: ["src/client/index.ts", "src/server/index.ts"],
    },
  },

  // Don't flag exports that are used within the same file
  ignoreExportsUsedInFile: true,
}

export default config

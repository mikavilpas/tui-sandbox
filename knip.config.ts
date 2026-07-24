import type { KnipConfig } from "knip"

const config: KnipConfig = {
  include: ["exports", "types", "dependencies", "unlisted", "files"],

  ignoreWorkspaces: [
    // Integration tests — Cypress specs are not traced as entry points
    "packages/integration-tests",
  ],

  ignoreDependencies: [
    // Root devDependency used by integration-tests (which is ignored by knip)
    "cypress",
    // Used for running TypeScript scripts via CLI
    "tsx",
    // Root devDependency satisfying @tui-sandbox/library's peer dependency
    "wait-on",
  ],

  // Don't flag exports that are used within the same file
  ignoreExportsUsedInFile: true,
}

export default config

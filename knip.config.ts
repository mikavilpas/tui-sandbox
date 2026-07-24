import config from "@mikavilpas/knip-config"

config.ignoreWorkspaces = [
  // Integration tests — Cypress specs are not traced as entry points
  "packages/integration-tests",
]
config.ignoreDependencies = [
  // Root devDependency used by integration-tests (which is ignored by knip)
  "cypress",
  // Used for running TypeScript scripts via CLI
  "tsx",
  // Root devDependency satisfying @tui-sandbox/library's peer dependency
  "wait-on",
]
config.ignoreBinaries = [
  "show", // false positive: "pnpm show" in github-actions
]
config.workspaces = {
  "packages/library": {
    ignoreBinaries: ["mise"],
  },
}

export default config

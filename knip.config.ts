import type { KnipConfig } from "knip"

const config: KnipConfig = {
  exclude: [
    // Caught by TypeScript
    "unresolved",
    // Managed with oxlint https://github.com/mikavilpas/mika-config/blob/7cf92e8bb5048b2ac87d470eb47cd064abe6beae/packages/oxlint-config/configs/default.ts?plain=1#L140
    "cycles",
  ],

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

  ignoreBinaries: [
    "show", // false positive: "pnpm show" in github-actions
  ],
  workspaces: {
    "packages/library": {
      ignoreBinaries: ["mise"],
    },
  },
}

export default config

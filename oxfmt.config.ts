import packageConfig from "@mikavilpas/oxfmt-config"
import { defineConfig } from "oxfmt"

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  ...packageConfig,
  ignorePatterns: [
    "lazy-lock.json",
    "CHANGELOG.md",
    "release-please-config.json",
    ".release-please-manifest.json",
    "packages/integration-tests/test-environment/.repro",
    "packages/integration-tests/dist",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ],
})

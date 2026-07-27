import packageConfig from "@mikavilpas/oxfmt-config"
import { defineConfig } from "oxfmt"

export default defineConfig({
  ...packageConfig,
  ignorePatterns: [
    "lazy-lock.json",
    "CHANGELOG.md",
    "packages/integration-tests/test-environment/.repro",
    "packages/integration-tests/dist",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ],
})

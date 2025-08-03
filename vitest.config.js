// https://vitest.dev/guide/projects
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: ["packages/*"],
  },
})

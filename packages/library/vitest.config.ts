import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true, // This will make describe, it, etc. available globally
    environment: "node",
    mockReset: true,
  },
})

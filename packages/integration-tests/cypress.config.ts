import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    allowCypressEnv: false,
    experimentalRunAllSpecs: true,
    baseUrl: `http://localhost:5173`,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
})

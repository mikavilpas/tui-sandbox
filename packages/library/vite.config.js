import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    https: false,
    strictPort: true,
    proxy: {
      // inside @tui-sandbox/library, a vite development server can be used. It
      // will proxy requests to the backend.
      //
      // When running in production, the backend starts its own static file
      // server that is used (in development, it's just ignored).
      "/trpc": "http://localhost:3000",
    },
  },
  build: {
    outDir: "./dist/browser/",
  },
  test: {
    globals: true, // This will make describe, it, etc. available globally
    environment: "node",
    mockReset: true,
  },
})

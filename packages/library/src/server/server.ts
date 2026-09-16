import { lazy } from "@trpc/server"

import { trpc } from "./connection/trpc.js"
import { TestServer } from "./TestServer.js"
import type { TestServerConfig } from "./updateTestdirectorySchemaFile.js"

/** @private */
// oxlint-disable-next-line explicit-module-boundary-types
export async function createAppRouter(config: TestServerConfig) {
  const appRouter = trpc.router({
    terminal: lazy(async () => {
      const terminal = await import("./applications/terminal/terminalRouter.js")
      return terminal.createTerminalRouter(config)
    }),
    neovim: lazy(async () => {
      const neovim = await import("./applications/neovim/neovimRouter.js")
      return neovim.createNeovimRouter(config)
    }),
  })

  return appRouter
}

export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>

export async function startTestServer(config: TestServerConfig): Promise<void> {
  try {
    const testServer = new TestServer({
      port: config.port,
    })
    const appRouter = await createAppRouter(config)

    await testServer.startAndRun(appRouter)
  } catch (err: unknown) {
    console.error("Error starting test server", err)
    throw err
  }
}

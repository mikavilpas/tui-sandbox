import type { inferRouterInputs } from "@trpc/server"
import "core-js/proposals/async-explicit-resource-management.js"
import { createNeovimRouter } from "./applications/neovim/neovimRouter.js"
import { createTerminalRouter } from "./applications/terminal/terminalRouter.js"
import { trpc } from "./connection/trpc.js"
import { TestServer } from "./TestServer.js"
import type { DirectoriesConfig, TestServerConfig } from "./updateTestdirectorySchemaFile.js"

/** @private */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createAppRouter(config: DirectoriesConfig) {
  const appRouter = trpc.router({
    terminal: createTerminalRouter(config),

    neovim: createNeovimRouter(config),
  })

  return appRouter
}

export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>
export type RouterInput = inferRouterInputs<AppRouter>

export async function startTestServer(config: TestServerConfig): Promise<void> {
  try {
    const testServer = new TestServer({
      port: config.port,
    })
    const appRouter = await createAppRouter(config.directories)

    await testServer.startAndRun(appRouter)
  } catch (err: unknown) {
    console.error("Error starting test server", err)
    throw err
  }
}

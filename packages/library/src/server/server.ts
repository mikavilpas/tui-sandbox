import type { inferRouterInputs } from "@trpc/server"
import "core-js/proposals/async-explicit-resource-management.js"
import { z } from "zod"
import { trpc } from "./connection/trpc.js"
import * as neovim from "./neovim/index.js"
import { TestServer } from "./TestServer.js"
import type { TestServerConfig } from "./updateTestdirectorySchemaFile.js"
import { applicationAvailable } from "./utilities/applicationAvailable.js"
import { tabIdSchema } from "./utilities/tabId.js"

/** Stack for managing resources that need to be disposed of when the server
 * shuts down */
await using autocleanup = new AsyncDisposableStack()
autocleanup.defer(() => {
  console.log("Closing any open test applications")
})
export { autocleanup }

/** @private */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createAppRouter(config: TestServerConfig) {
  if (!(await applicationAvailable("nvim"))) {
    throw new Error("Neovim is not installed. Please install Neovim (nvim).")
  }

  const appRouter = trpc.router({
    neovim: trpc.router({
      start: trpc.procedure
        .input(
          z.object({
            tabId: tabIdSchema,
            startNeovimArguments: z.object({
              filename: z.union([
                z.string(),
                z.object({
                  openInVerticalSplits: z.array(z.string()),
                }),
              ]),
              startupScriptModifications: z.array(z.string()).optional(),
              terminalDimensions: z.object({
                cols: z.number(),
                rows: z.number(),
              }),
            }),
          })
        )
        .mutation(options => {
          return neovim.start(options.input.startNeovimArguments, options.input.tabId, config)
        }),
      onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
        return neovim.onStdout(options.input, options.signal, config.testEnvironmentPath)
      }),
      sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
        return neovim.sendStdin(options.input)
      }),
    }),
  })

  return appRouter
}

export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>
export type RouterInput = inferRouterInputs<AppRouter>

export async function startTestServer(config: TestServerConfig): Promise<TestServer> {
  const testServer = new TestServer({
    port: 3000,
  })
  const appRouter = await createAppRouter(config)
  await testServer.startAndRun(appRouter, config)

  return testServer
}

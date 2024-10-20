import type { inferRouterInputs } from "@trpc/server"
import { z } from "zod"
import { trpc } from "./connection/trpc"
import * as neovim from "./neovim"
import { TestServer } from "./TestServer"
import type { TestServerConfig } from "./updateTestdirectorySchemaFile"
import { tabIdSchema } from "./utilities/tabId"

/** Stack for managing resources that need to be disposed of when the server
 * shuts down */
await using autocleanup = new AsyncDisposableStack()
autocleanup.defer(() => {
  console.log("Closing any open test applications")
})
export { autocleanup }

function createAppRouter(config: TestServerConfig) {
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

export type AppRouter = ReturnType<typeof createAppRouter>
export type RouterInput = inferRouterInputs<AppRouter>

export async function startTestServer(config: TestServerConfig): Promise<TestServer> {
  const testServer = new TestServer(3000)
  const appRouter = createAppRouter(config)
  await testServer.startAndRun(appRouter, config)

  return testServer
}

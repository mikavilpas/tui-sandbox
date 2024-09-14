import type { inferRouterInputs } from "@trpc/server"
import { z } from "zod"
import { TestServer } from "../library/server"
import { trpc } from "../library/server/connection/trpc"
import * as neovim from "../library/server/neovim"
import { tabIdSchema } from "../library/server/utilities/tabId"

/** Stack for managing resources that need to be disposed of when the server
 * shuts down */
await using autocleanup = new AsyncDisposableStack()
autocleanup.defer(() => {
  console.log("Closing any open test applications")
})
export { autocleanup }

const appRouter = trpc.router({
  neovim: trpc.router({
    start: trpc.procedure
      .input(
        z.object({
          tabId: tabIdSchema,
          terminalDimensions: z
            .object({
              cols: z.number(),
              rows: z.number(),
            })
            .optional(),
          startNeovimArguments: z.object({
            filename: z
              .union([
                z.string(),
                z.object({
                  openInVerticalSplits: z.array(z.string()),
                }),
              ])
              .optional(),
            startupScriptModifications: z.array(z.string()).optional(),
          }),
        })
      )
      .mutation(options => {
        return neovim.start(options.input, options.input.tabId)
      }),
    onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
      return neovim.onStdout(options.input)
    }),
    sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
      return neovim.sendStdin(options.input)
    }),
  }),
})

export type AppRouter = typeof appRouter
export type RouterInput = inferRouterInputs<AppRouter>

export const testServer = new TestServer(3000)
await testServer.startAndRun(appRouter)

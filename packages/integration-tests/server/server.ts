import { z } from "zod"
import { TestServer } from "../library/server"
import { trpc } from "../library/server/connection/trpc"
import * as neovim from "../library/server/neovim"
import { myStartNeovimArguments } from "../library/server/types"
import { tabIdSchema } from "../library/server/utilities/tabId"

/** Stack for managing resources that need to be disposed of when the server
 * shuts down */
await using autocleanup = new AsyncDisposableStack()
autocleanup.defer(() => {
  console.log("Closing any open test applications")
})
export { autocleanup }

/** The arguments given to the server */
export const startNeovimServerArguments = z.object({
  tabId: tabIdSchema,
  terminalDimensions: z
    .object({
      cols: z.number(),
      rows: z.number(),
    })
    .optional(),
  startNeovimArguments: myStartNeovimArguments,
})

export type MyStartNeovimServerArguments = z.infer<typeof myStartNeovimArguments>

const appRouter = trpc.router({
  neovim: trpc.router({
    start: trpc.procedure.input(startNeovimServerArguments).mutation(options => neovim.start(options.input)),
    onStdout: trpc.procedure
      .input(z.object({ client: tabIdSchema }))
      .subscription(options => neovim.onStdout(options.input)),
    sendStdin: trpc.procedure
      .input(z.object({ tabId: tabIdSchema, data: z.string() }))
      .mutation(options => neovim.sendStdin(options.input)),
  }),
})
export type AppRouter = typeof appRouter

export const testServer = new TestServer(3000)
await testServer.startAndRun(appRouter)

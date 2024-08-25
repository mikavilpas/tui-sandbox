import { z } from "zod"
import { TestServer } from "../library/server"
import { trpc } from "../library/server/connection/trpc"
import * as neovim from "../library/server/neovim/neovimRouter"
import { startNeovimServerArguments } from "../library/server/types"
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

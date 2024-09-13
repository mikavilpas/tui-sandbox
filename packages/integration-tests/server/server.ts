import type { inferRouterInputs } from "@trpc/server"
import { z } from "zod"
import { TestServer } from "../library/server"
import { trpc } from "../library/server/connection/trpc"
import * as neovim from "../library/server/neovim"
import { tabIdSchema } from "../library/server/utilities/tabId"
import { MyTestDirectoryContentsSchema, testDirectoryFiles } from "../MyTestDirectory"

/** Stack for managing resources that need to be disposed of when the server
 * shuts down */
await using autocleanup = new AsyncDisposableStack()
autocleanup.defer(() => {
  console.log("Closing any open test applications")
})
export { autocleanup }

/** The arguments given from the tests to send to the server */
export const myStartNeovimArguments = z.object({
  filename: z
    .union([
      testDirectoryFiles,
      z.object({
        openInVerticalSplits: z.array(testDirectoryFiles),
      }),
    ])
    .optional(),
  startupScriptModifications: z
    .array(z.enum(MyTestDirectoryContentsSchema.shape["config-modifications"].shape.contents.keyof().options))
    .optional(),
})

/** The arguments given to the server */
const myStartNeovimServerArguments = z.object({
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
    start: trpc.procedure.input(myStartNeovimServerArguments).mutation(options => {
      return neovim.start(options.input)
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

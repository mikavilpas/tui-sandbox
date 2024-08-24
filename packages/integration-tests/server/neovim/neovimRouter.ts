import { observable } from "@trpc/server/observable"
import assert from "assert"
import { z } from "zod"
import { trpc } from "../../library/server/connection/trpc"
import { startNeovimServerArguments } from "../../library/server/types"
import type { TabId } from "../../library/server/utilities/tabId"
import { tabIdSchema } from "../../library/server/utilities/tabId"
import { NeovimTestDirectory } from "./environment/NeovimTestEnvironment"
import type { StdoutMessage } from "./NeovimApplication"
import { NeovimApplication } from "./NeovimApplication"

const neovims = new Map<TabId["tabId"], NeovimApplication>()

export const neovimRouter = trpc.router({
  start: trpc.procedure.input(startNeovimServerArguments).mutation(async options => {
    const neovim = neovims.get(options.input.tabId.tabId)
    assert(neovim, `Neovim instance not found for client id ${options.input.tabId.tabId}`)

    const testDirectory = await NeovimTestDirectory.create()
    await neovim.startNextAndKillCurrent(testDirectory, options.input)

    const processId = neovim.processId()
    assert(processId !== undefined, "Neovim was started without a process ID. This is a bug - please open an issue.")
    console.log(`🚀 Started Neovim instance ${processId}`)

    return { dir: testDirectory.directory }
  }),

  onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
    return observable<string>(emit => {
      const tabId = options.input.client.tabId
      const neovim = neovims.get(tabId) ?? new NeovimApplication()
      if (neovims.get(tabId) === undefined) {
        neovims.set(tabId, neovim)
      }

      const send = (data: unknown) => {
        assert(typeof data === "string")
        emit.next(data)
      }

      neovim.events.on("stdout" satisfies StdoutMessage, send)

      return () => {
        neovim.events.off("stdout" satisfies StdoutMessage, send)
        void neovim[Symbol.asyncDispose]().finally(() => {
          neovims.delete(tabId)
        })
      }
    })
  }),

  sendStdin: trpc.procedure
    .input(
      z.object({
        tabId: tabIdSchema,
        data: z.string(),
      })
    )
    .mutation(async options => {
      const neovim = neovims.get(options.input.tabId.tabId)
      assert(
        neovim !== undefined,
        `Neovim instance for clientId not found - cannot send stdin. Maybe it's not started yet?`
      )

      await neovim.write(options.input.data)
    }),
})

import { MyTestDirectoryContentsSchema, testDirectoryFiles } from "../MyTestDirectory"
import { prepareClient } from "../library/client/websocket-client"
import type { MyStartNeovimServerArguments } from "../server/server"
import type { NeovimContext } from "./__global"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const prepareServer = prepareClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: MyStartNeovimServerArguments): Promise<NeovimContext> {
  const server = await prepareServer
  await server.ready
  const terminalDimensions = { cols: server.terminal.cols, rows: server.terminal.rows }

  const neovim = await server.trpc.neovim.start.mutate({
    startNeovimArguments: {
      filename: startArgs?.filename ?? "initial-file.txt",
      startupScriptModifications: startArgs?.startupScriptModifications ?? [],
    },
    tabId: server.tabId,
    terminalDimensions,
  })

  const contents = MyTestDirectoryContentsSchema.parse(neovim.contents)
  const files = testDirectoryFiles.enum

  return { contents, files }
}

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
  const neovim = await server.startNeovim(startArgs)

  const contents = MyTestDirectoryContentsSchema.parse(neovim.contents)
  const files = testDirectoryFiles.enum

  return { contents, files }
}

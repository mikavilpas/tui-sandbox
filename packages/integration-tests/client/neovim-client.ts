import type { MyTestDirectory } from "../MyTestDirectory"
import { MyTestDirectoryContentsSchema } from "../MyTestDirectory"
import { prepareClient } from "../library/client/websocket-client"
import type { StartNeovimArguments } from "../library/server/types"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const prepareServer = prepareClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimArguments): Promise<MyTestDirectory> {
  const server = await prepareServer
  const neovim = await server.startNeovim(startArgs)

  return MyTestDirectoryContentsSchema.parse(neovim.contents)
}

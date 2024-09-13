import { MyTestDirectoryContentsSchema, testDirectoryFiles } from "../MyTestDirectory"
import { NeovimClient } from "../library/client/websocket-client"
import type { MyStartNeovimServerArguments } from "../server/server"
import type { NeovimContext } from "./__global"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const client = new NeovimClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: MyStartNeovimServerArguments): Promise<NeovimContext> {
  const neovim = await client.startNeovim({
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
  })
  const contents = MyTestDirectoryContentsSchema.parse(neovim.contents)
  const files = testDirectoryFiles.enum

  return { contents, files }
}

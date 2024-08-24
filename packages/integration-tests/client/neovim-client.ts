import { prepareClient } from 'library/client/websocket-client.ts'
import type { StartNeovimArguments, TestDirectory } from 'library/server/types.ts'
import type { MyTestDirectoryFile } from 'server/neovim/environment/testEnvironmentTypes.ts'
import './__global.ts'

export type MyTestDirectory = TestDirectory<MyTestDirectoryFile>

const app = document.querySelector<HTMLElement>('#app')
if (!app) {
  throw new Error('No app element found')
}

const prepareServer = prepareClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimArguments): Promise<MyTestDirectory> {
  const server = await prepareServer
  const neovim = await server.startNeovim(startArgs)

  return neovim
}

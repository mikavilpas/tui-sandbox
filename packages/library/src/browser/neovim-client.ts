import { TerminalClient } from "../client/index.js"
import type { BlockingCommandClientInput, ExCommandClientInput, LuaCodeClientInput } from "../server/server.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../server/types.js"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const client = new TerminalClient(app)

export type GenericNeovimBrowserApi = {
  runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
  runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput>
  runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput>
  dir: TestDirectory
}

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi> {
  const testDirectory = await client.startNeovim({
    additionalEnvironmentVariables: startArgs?.additionalEnvironmentVariables,
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
  })

  const neovimBrowserApi: GenericNeovimBrowserApi = {
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
      return client.runBlockingShellCommand(input)
    },
    runLuaCode(input) {
      return client.runLuaCode(input)
    },
    runExCommand(input) {
      return client.runExCommand(input)
    },
    dir: testDirectory,
  }

  return neovimBrowserApi
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi>
  }
}

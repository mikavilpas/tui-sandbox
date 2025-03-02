import { TerminalClient as NeovimTerminalClient } from "../client/index.js"
import { TerminalTerminalClient } from "../client/terminal-terminal-client.js"
import type { BlockingCommandClientInput } from "../server/blockingCommandInputSchema.js"
import type { ExCommandClientInput, LuaCodeClientInput, PollLuaCodeClientInput } from "../server/server.js"
import type { StartTerminalGenericArguments } from "../server/terminal/TerminalTestApplication.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../server/types.js"
import { Lazy } from "../server/utilities/Lazy.js"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

// limitation: right now only one client can be used in the same test
const neovimClient = new Lazy(() => new NeovimTerminalClient(app))
const terminalClient = new Lazy(() => new TerminalTerminalClient(app))

export type GenericNeovimBrowserApi = {
  runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
  runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput>
  waitForLuaCode(input: PollLuaCodeClientInput): Promise<RunLuaCodeOutput>
  runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput>
  dir: TestDirectory
}

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi> {
  const neovim = neovimClient.get()
  const testDirectory = await neovim.startNeovim({
    additionalEnvironmentVariables: startArgs?.additionalEnvironmentVariables,
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
  })

  const neovimBrowserApi: GenericNeovimBrowserApi = {
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
      return neovim.runBlockingShellCommand(input)
    },
    runLuaCode(input) {
      return neovim.runLuaCode(input)
    },
    waitForLuaCode(input) {
      return neovim.waitForLuaCode(input)
    },
    runExCommand(input) {
      return neovim.runExCommand(input)
    },
    dir: testDirectory,
  }

  return neovimBrowserApi
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi>
    startTerminalApplication(args: StartTerminalGenericArguments): Promise<GenericTerminalBrowserApi>
  }
}

export type GenericTerminalBrowserApi = {
  dir: TestDirectory
  runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
}

/** Entrypoint for the test runner (cypress) */
window.startTerminalApplication = async function (
  args: StartTerminalGenericArguments
): Promise<GenericTerminalBrowserApi> {
  const terminal = terminalClient.get()
  const testDirectory = await terminal.startTerminalApplication(args)
  return {
    dir: testDirectory,
    runBlockingShellCommand(input) {
      return terminal.runBlockingShellCommand(input)
    },
  }
}

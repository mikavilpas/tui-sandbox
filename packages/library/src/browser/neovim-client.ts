import type { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import type { InMemoryClipboard } from "../client/clipboard.js"
import { NeovimTerminalClient } from "../client/neovim/neovim-terminal-client.js"
import type { TuiTerminalApi } from "../client/startTerminal.js"
import "../client/style.css"
import { TerminalTerminalClient } from "../client/terminal/terminal-terminal-client.js"
import type {
  ExCommandClientInput,
  LuaCodeClientInput,
  PollLuaCodeClientInput,
  RunLuaFileClientInput,
} from "../server/applications/neovim/neovimRouter.js"
import type { StartTerminalGenericArguments } from "../server/applications/terminal/TerminalTestApplication.js"
import type { BlockingCommandClientInput } from "../server/blockingCommandInputSchema.js"
import type {
  AllKeys,
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
const neovimClient = new Lazy(() => NeovimTerminalClient.create(app))
const terminalClient = new Lazy(() => TerminalTerminalClient.create(app))

export type GenericNeovimBrowserApi = {
  runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
  runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput>
  doFile(input: RunLuaFileClientInput): Promise<RunLuaCodeOutput>
  waitForLuaCode(input: PollLuaCodeClientInput): Promise<RunLuaCodeOutput>
  runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput>
  dir: TestDirectory
  clipboard: InMemoryClipboard
}

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi> {
  const neovim = await neovimClient.get()
  const testDirectory = await neovim.startNeovim({
    additionalEnvironmentVariables: startArgs?.additionalEnvironmentVariables,
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
    headlessCmd: undefined,
    NVIM_APPNAME: startArgs?.NVIM_APPNAME,
  } satisfies AllKeys<StartNeovimGenericArguments>)

  const neovimBrowserApi: GenericNeovimBrowserApi = {
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
      return neovim.runBlockingShellCommand(input)
    },
    runLuaCode(input) {
      return neovim.runLuaCode(input)
    },
    doFile(input) {
      return neovim.doFile(input)
    },
    waitForLuaCode(input) {
      return neovim.waitForLuaCode(input)
    },
    runExCommand(input) {
      return neovim.runExCommand(input)
    },
    dir: testDirectory,
    clipboard: neovim.clipboard,
  }

  return neovimBrowserApi
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<GenericNeovimBrowserApi>
    startTerminalApplication(args: StartTerminalBrowserArguments): Promise<GenericTerminalBrowserApi>
  }
}

export type GenericTerminalBrowserApi = {
  dir: TestDirectory
  runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
  clipboard: InMemoryClipboard
}

export type BrowserTerminalSettings = {
  configureTerminal?: (term: {
    terminal: Terminal
    api: TuiTerminalApi
    recipes: {
      /** Make the terminal respond to "DA1—Primary Device Attributes" requests.
       *
       * In this DA exchange, the host asks for the terminal's architectural class and basic attributes.
       * https://vt100.net/docs/vt510-rm/DA1.html
       *
       * Terminal Response
       *
       * The terminal responds by sending its architectural class and basic
       * attributes to the host. This response depends on the terminal's current
       * operating VT level.
       */
      supportDA1: () => void
    }
  }) => void
}

export type StartTerminalBrowserArguments = {
  serverSettings: StartTerminalGenericArguments
  browserSettings: BrowserTerminalSettings
}

/** Entrypoint for the test runner (cypress) */
window.startTerminalApplication = async function (
  args: StartTerminalBrowserArguments
): Promise<GenericTerminalBrowserApi> {
  const terminal = await terminalClient.get()
  const testDirectory = await terminal.startTerminalApplication(args)

  const terminalBrowserApi: GenericTerminalBrowserApi = {
    dir: testDirectory,
    runBlockingShellCommand(input) {
      return terminal.runBlockingShellCommand(input)
    },
    clipboard: terminal.clipboard,
  }
  return terminalBrowserApi
}

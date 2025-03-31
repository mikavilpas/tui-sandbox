/// <reference types="cypress" />
//
// This file is autogenerated by tui-sandbox. Do not edit it directly.
//
import type {
  GenericNeovimBrowserApi,
  GenericTerminalBrowserApi,
} from "@tui-sandbox/library/dist/src/browser/neovim-client"
import type {
  ExCommandClientInput,
  LuaCodeClientInput,
  PollLuaCodeClientInput,
} from "@tui-sandbox/library/dist/src/server/server"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "@tui-sandbox/library/dist/src/server/types"
import type { BlockingCommandClientInput } from "@tui-sandbox/library/src/server/blockingCommandInputSchema"
import type { StartTerminalGenericArguments } from "@tui-sandbox/library/src/server/terminal/TerminalTestApplication"
import type { OverrideProperties } from "type-fest"
import type { MyTestDirectory, MyTestDirectoryFile } from "../../MyTestDirectory"

export type TerminalTestApplicationContext = {
  /** Types text into the terminal, making the terminal application receive the
   * keystrokes as input. Requires the application to be running. */
  typeIntoTerminal(text: string, options?: Partial<Cypress.TypeOptions>): void

  /** Runs a shell command in a blocking manner, waiting for the command to
   * finish before returning. Requires the terminal to be running. */
  runBlockingShellCommand(input: MyBlockingCommandClientInput): Cypress.Chainable<BlockingShellCommandOutput>

  /** The test directory, providing type-safe access to its file and directory structure */
  dir: TestDirectory<MyTestDirectory>
}

/** The api that can be used in tests after a Neovim instance has been started. */
export type NeovimContext = {
  /** Types text into the terminal, making the terminal application receive
   * the keystrokes as input. Requires neovim to be running. */
  typeIntoTerminal(text: string, options?: Partial<Cypress.TypeOptions>): void

  /** Runs a shell command in a blocking manner, waiting for the command to
   * finish before returning. Requires neovim to be running. */
  runBlockingShellCommand(input: MyBlockingCommandClientInput): Cypress.Chainable<BlockingShellCommandOutput>

  /** Runs a shell command in a blocking manner, waiting for the command to
   * finish before returning. Requires neovim to be running. */
  runLuaCode(input: LuaCodeClientInput): Cypress.Chainable<RunLuaCodeOutput>

  /**
   * Like runLuaCode, but waits until the given code (maybe using lua's return
   * assert()) does not raise an error, and returns the first successful result.
   *
   * Useful for waiting until Neovim's internal state has changed in a way that
   * means the test can continue executing. This can avoid timing issues that are
   * otherwise hard to catch.
   */
  waitForLuaCode(input: PollLuaCodeClientInput): Cypress.Chainable<RunLuaCodeOutput>

  /** Run an ex command in neovim.
   * @example "echo expand('%:.')" current file, relative to the cwd
   */
  runExCommand(input: ExCommandClientInput): Cypress.Chainable<RunExCommandOutput>

  /** The test directory, providing type-safe access to its file and directory structure */
  dir: TestDirectory<MyTestDirectory>
}

/** Arguments for starting the neovim server. They are built based on your test
 * environment in a type safe manner. */
export type MyStartNeovimServerArguments = OverrideProperties<
  StartNeovimGenericArguments,
  {
    filename?: MyTestDirectoryFile | { openInVerticalSplits: MyTestDirectoryFile[] }
    startupScriptModifications?: Array<keyof MyTestDirectory["config-modifications"]["contents"]>
  }
>

Cypress.Commands.add("startNeovim", (startArguments?: MyStartNeovimServerArguments) => {
  cy.window().then(async win => {
    const underlyingNeovim: GenericNeovimBrowserApi = await win.startNeovim(
      startArguments as StartNeovimGenericArguments
    )
    testNeovim = underlyingNeovim

    // wrap everything so that Cypress can await all the commands
    Cypress.Commands.addAll({
      nvim_runBlockingShellCommand: underlyingNeovim.runBlockingShellCommand,
      nvim_runExCommand: underlyingNeovim.runExCommand,
      nvim_runLuaCode: underlyingNeovim.runLuaCode,
      nvim_waitForLuaCode: underlyingNeovim.waitForLuaCode,
    })

    const api: NeovimContext = {
      runBlockingShellCommand(input) {
        return cy.nvim_runBlockingShellCommand(input)
      },
      runExCommand(input) {
        return cy.nvim_runExCommand(input)
      },
      runLuaCode(input) {
        return cy.nvim_runLuaCode(input)
      },
      waitForLuaCode(input) {
        return cy.nvim_waitForLuaCode(input)
      },
      typeIntoTerminal(text, options) {
        cy.typeIntoTerminal(text, options)
      },
      dir: underlyingNeovim.dir as TestDirectory<MyTestDirectory>,
    }

    return api
  })
})

Cypress.Commands.add("nvim_isRunning", () => {
  return cy.window().then(async _ => {
    return !!testNeovim
  })
})

Cypress.Commands.add("startTerminalApplication", (args: StartTerminalGenericArguments) => {
  cy.window().then(async win => {
    const terminal: GenericTerminalBrowserApi = await win.startTerminalApplication(args)

    Cypress.Commands.addAll({
      terminal_runBlockingShellCommand: terminal.runBlockingShellCommand,
    })

    const api: TerminalTestApplicationContext = {
      dir: terminal.dir as TestDirectory<MyTestDirectory>,
      runBlockingShellCommand(input) {
        return cy.terminal_runBlockingShellCommand(input)
      },
      typeIntoTerminal(text, options) {
        cy.typeIntoTerminal(text, options)
      },
    }

    return api
  })
})

Cypress.Commands.add("typeIntoTerminal", (text: string, options?: Partial<Cypress.TypeOptions>) => {
  // the syntax for keys is described here:
  // https://docs.cypress.io/api/commands/type
  cy.get("textarea").focus().type(text, options)
})

let testNeovim: GenericNeovimBrowserApi | undefined

before(function () {
  // disable Cypress's default behavior of logging all XMLHttpRequests and
  // fetches to the Command Log
  // https://gist.github.com/simenbrekken/3d2248f9e50c1143bf9dbe02e67f5399?permalink_comment_id=4615046#gistcomment-4615046
  cy.intercept({ resourceType: /xhr|fetch/ }, { log: false })
})

export type MyBlockingCommandClientInput = OverrideProperties<
  BlockingCommandClientInput,
  { cwdRelative?: MyTestDirectoryFile | undefined }
>

declare global {
  namespace Cypress {
    interface Chainable {
      startNeovim(args?: MyStartNeovimServerArguments): Chainable<NeovimContext>
      startTerminalApplication(args: StartTerminalGenericArguments): Chainable<TerminalTestApplicationContext>

      /** Types text into the terminal, making the terminal application receive
       * the keystrokes as input. Requires neovim to be running. */
      typeIntoTerminal(text: string, options?: Partial<Cypress.TypeOptions>): Chainable<void>

      /** Runs a shell command in a blocking manner, waiting for the command to
       * finish before returning. Requires neovim to be running. */
      nvim_runBlockingShellCommand(input: MyBlockingCommandClientInput): Chainable<BlockingShellCommandOutput>

      nvim_runLuaCode(input: LuaCodeClientInput): Chainable<RunLuaCodeOutput>
      nvim_waitForLuaCode(input: PollLuaCodeClientInput): Chainable<RunLuaCodeOutput>

      /** Run an ex command in neovim.
       * @example "echo expand('%:.')" current file, relative to the cwd
       */
      nvim_runExCommand(input: ExCommandClientInput): Chainable<RunExCommandOutput>

      /** Returns true if neovim is running. Useful to conditionally run
       * afterEach actions based on whether it's running. */
      nvim_isRunning(): Chainable<boolean>

      terminal_runBlockingShellCommand(input: MyBlockingCommandClientInput): Chainable<BlockingShellCommandOutput>
    }
  }
}

afterEach(async () => {
  if (!testNeovim) return

  let timeoutId: NodeJS.Timeout | undefined = undefined
  const timeout = new Promise<void>((_, reject) => {
    timeoutId = setTimeout(() => {
      Cypress.log({ name: "timeout when waiting for :messages to finish. Neovim might be stuck or showing a message." })
      reject(new Error("timeout when waiting for :messages to finish. Neovim might be stuck or showing a message."))
    }, 5_000)
  })

  try {
    await Promise.race([timeout, testNeovim.runExCommand({ command: "messages" })])
  } finally {
    clearTimeout(timeoutId) // Ensure the timeout is cleared
    testNeovim = undefined
  }
})

/// <reference types="cypress" />
//
// This file is autogenerated by tui-sandbox. Do not edit it directly.
//
import type {
  BlockingCommandClientInput,
  ExCommandClientInput,
  LuaCodeClientInput,
} from "@tui-sandbox/library/dist/src/server/server"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
} from "@tui-sandbox/library/dist/src/server/types"
import type { OverrideProperties } from "type-fest"
import type { MyTestDirectory, MyTestDirectoryFile } from "../../MyTestDirectory"

export type NeovimContext = {
  contents: MyTestDirectory
  rootPathAbsolute: string
}

declare global {
  interface Window {
    startNeovim(startArguments?: MyStartNeovimServerArguments): Promise<NeovimContext>
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
    runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput>
    runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput>
  }
}

type MyStartNeovimServerArguments = OverrideProperties<
  StartNeovimGenericArguments,
  {
    filename?: MyTestDirectoryFile | { openInVerticalSplits: MyTestDirectoryFile[] }
    // NOTE: right now you need to make sure the config-modifications directory exists in your test directory
    startupScriptModifications?: Array<keyof MyTestDirectory["config-modifications"]["contents"]>
  }
>

Cypress.Commands.add("startNeovim", (startArguments?: MyStartNeovimServerArguments) => {
  cy.window().then(async win => {
    return await win.startNeovim(startArguments)
  })
})

Cypress.Commands.add("runBlockingShellCommand", (input: BlockingCommandClientInput) => {
  cy.window().then(async win => {
    return await win.runBlockingShellCommand(input)
  })
})

Cypress.Commands.add("typeIntoTerminal", (text: string, options?: Partial<Cypress.TypeOptions>) => {
  // the syntax for keys is described here:
  // https://docs.cypress.io/api/commands/type
  cy.get("textarea").focus().type(text, options)
})

Cypress.Commands.add("runLuaCode", (input: LuaCodeClientInput) => {
  cy.window().then(async win => {
    return await win.runLuaCode(input)
  })
})

Cypress.Commands.add("runExCommand", (input: ExCommandClientInput) => {
  cy.window().then(async win => {
    return await win.runExCommand(input)
  })
})

before(function () {
  // disable Cypress's default behavior of logging all XMLHttpRequests and
  // fetches to the Command Log
  // https://gist.github.com/simenbrekken/3d2248f9e50c1143bf9dbe02e67f5399?permalink_comment_id=4615046#gistcomment-4615046
  cy.intercept({ resourceType: /xhr|fetch/ }, { log: false })
})

declare global {
  namespace Cypress {
    interface Chainable {
      startNeovim(args?: MyStartNeovimServerArguments): Chainable<NeovimContext>

      /** Types text into the terminal, making the terminal application receive
       * the keystrokes as input. Requires neovim to be running. */
      typeIntoTerminal(text: string, options?: Partial<Cypress.TypeOptions>): Chainable<void>

      /** Runs a shell command in a blocking manner, waiting for the command to
       * finish before returning. Requires neovim to be running. */
      runBlockingShellCommand(input: BlockingCommandClientInput): Chainable<BlockingShellCommandOutput>

      runLuaCode(input: LuaCodeClientInput): Chainable<RunLuaCodeOutput>

      /** Run an ex command in neovim.
       * @example "echo expand('%:.')" current file, relative to the cwd
       */
      runExCommand(input: ExCommandClientInput): Chainable<RunExCommandOutput>
    }
  }
}

/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

import type { OverrideProperties } from "type-fest"
import type { StartNeovimGenericArguments } from "../../../library/src/server/types.ts"
import type { MyTestDirectory, MyTestDirectoryFile } from "../../MyTestDirectory"

export type NeovimContext = {
  contents: MyTestDirectory
  rootPathAbsolute: string
}

declare global {
  interface Window {
    // keep in sync with ../../../library/src/browser/neovim-client.ts
    startNeovim(startArguments?: MyStartNeovimServerArguments): Promise<NeovimContext>
  }
}

type MyStartNeovimServerArguments = OverrideProperties<
  StartNeovimGenericArguments,
  {
    filename?: MyTestDirectoryFile | { openInVerticalSplits: MyTestDirectoryFile[] }
    startupScriptModifications?: Array<keyof MyTestDirectory["config-modifications"]["contents"]>
  }
>

Cypress.Commands.add("startNeovim", (startArguments?: MyStartNeovimServerArguments) => {
  cy.window().then(async win => {
    return await win.startNeovim(startArguments)
  })
})

Cypress.Commands.add("typeIntoTerminal", (text: string, options?: Partial<Cypress.TypeOptions>) => {
  // the syntax for keys is described here:
  // https://docs.cypress.io/api/commands/type
  cy.get("textarea").focus().type(text, options)
})

declare global {
  namespace Cypress {
    interface Chainable {
      startNeovim(args?: MyStartNeovimServerArguments): Chainable<NeovimContext>
      typeIntoTerminal(text: string, options?: Partial<Cypress.TypeOptions>): Chainable<void>
    }
  }
}

import { flavors } from "@catppuccin/palette"
import { rgbify } from "../../../library/src/client/color-utilities"
import type { MyTestDirectoryFile } from "../../MyTestDirectory"

describe("neovim features", () => {
  it("can load a custom init.lua file from the .config/nvim directory", () => {
    cy.visit("/")
    cy.startNeovim().then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      cy.typeIntoTerminal(":=_G.isInitFileLoaded{enter}")
      cy.contains("yesTheInitFileIsLoaded")
    })
  })

  it("can start with startupScriptModifications and open another file", () => {
    cy.visit("/")
    cy.startNeovim({
      startupScriptModifications: ["add_command_to_count_open_buffers.lua"],
    }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      const fpath = "subdirectory/subdirectory-file.txt" satisfies MyTestDirectoryFile
      cy.typeIntoTerminal(`:edit ${fpath}{enter}`)

      cy.contains("Hello from the subdirectory!")

      cy.typeIntoTerminal(":CountBuffers{enter}")
      cy.contains("Number of open buffers: 2")
    })
  })

  it("can start with a different file name", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "subdirectory/subdirectory-file.txt" }).then(() => {
      cy.typeIntoTerminal("{control+l}")
      cy.contains("Hello from the subdirectory!")
    })
  })

  it("can pass environment variables to neovim", () => {
    cy.visit("/")
    cy.startNeovim({ additionalEnvironmentVariables: { hello: "my-variable-value" } }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      cy.typeIntoTerminal(":=vim.uv.os_environ().hello{enter}")
      cy.contains("my-variable-value")
    })
  })

  it("can load plugins that are defined in the neovim configuration", () => {
    cy.visit("/")
    cy.startNeovim().then(() => {
      // wait until text on the start screen is visible
      cy.contains("f you see this text, Neovim is ready!").should(
        "have.css",
        "background-color",
        rgbify(flavors.macchiato.colors.base.rgb)
      )

      // to make sure the catppuccin/nvim plugin is loaded, let's change the
      // color scheme and make sure the new color is visible
      cy.typeIntoTerminal(":Catppuccin latte{enter}")
      cy.contains("f you see this text, Neovim is ready!").should(
        "have.css",
        "background-color",
        rgbify(flavors.latte.colors.base.rgb)
      )
    })
  })
})

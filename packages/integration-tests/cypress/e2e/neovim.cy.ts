import type { MyTestDirectoryFile } from "../../MyTestDirectory"

describe("neovim features", () => {
  it("can start with startupScriptModifications and open another file", () => {
    cy.visit("/")
    cy.startNeovim({
      startupScriptModifications: ["add_command_to_count_open_buffers.lua"],
    }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      const fpath = "subdirectory/subdirectory-file.txt" satisfies MyTestDirectoryFile
      cy.typeIntoTerminal(`:edit ${fpath}{enter}`, { delay: 0 })

      cy.contains("Hello from the subdirectory!")
    })
  })

  it("can start with a different file name", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "subdirectory/subdirectory-file.txt" }).then(() => {
      cy.typeIntoTerminal("{control+l}")
      cy.contains("Hello from the subdirectory!")
    })
  })
})

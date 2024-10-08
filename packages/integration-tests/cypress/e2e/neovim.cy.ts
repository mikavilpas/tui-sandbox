describe("neovim features", () => {
  it("can start with startupScriptModifications and open another file", () => {
    cy.visit("http://localhost:5173")
    cy.startNeovim({
      startupScriptModifications: ["add_command_to_count_open_buffers.lua"],
    }).then(dir => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      cy.typeIntoTerminal(`:edit ${dir.files["subdirectory/subdirectory-file.txt"]}{enter}`, { delay: 0 })

      cy.contains("Hello from the subdirectory!")
    })
  })

  it("can start with a different file name", () => {
    cy.visit("http://localhost:5173")
    cy.startNeovim({ filename: "subdirectory/subdirectory-file.txt" }).then(dir => {
      cy.typeIntoTerminal("{control+l}")
      cy.contains("Hello from the subdirectory!")
      //
    })
  })
})

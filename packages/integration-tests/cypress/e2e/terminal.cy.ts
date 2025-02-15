describe("TerminalTestApplication features", () => {
  it("can start the shell", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
    }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("myprompt")

      // verify that the shell is able to run a simple command
      cy.typeIntoTerminal(`echo "42 + 1" | bc{enter}`)
      cy.contains("43")
    })
  })

  it("shows an error if the application fails to start", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["thisdoesnotexist"],
    }).then(() => {
      // the error message is not very informative, but the tester should be
      // able to see more details in the test output
      cy.contains(/Child process \d+? \(thisdoesnotexist\) exited with code 1/)
    })
  })
})

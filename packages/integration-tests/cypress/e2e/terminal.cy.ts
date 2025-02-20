import type { TestDirsPath } from "@tui-sandbox/library/src/server/neovim/environment/createTempDir"
import assert from "assert"

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

      // the shell should have been started in the createUniqueDirectory path,
      // not the test directory blueprint which includes the testdirs
      // directory
      cy.typeIntoTerminal("ls -al{enter}")
      cy.contains("testdirs" satisfies TestDirsPath).should("not.exist")
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

  it("can runBlockingShellCommand", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
    }).then(term => {
      // successful command should work
      term.runBlockingShellCommand({ command: "ls -al" }).then(output => {
        assert(output.type === "success")
        assert(output.stdout.includes(".bashrc"))
      })

      // failing command should work
      term
        .runBlockingShellCommand({
          command: "thisdoesnotexist",
          allowFailure: true,
        })
        .then(output => {
          assert(output.type === "failed")
        })

      // piping should work
      term
        .runBlockingShellCommand({
          command: "echo '42 + 1' | bc",
        })
        .then(output => {
          assert(output.type === "success")
          assert(output.stdout.includes("43"))
        })

      // setting the cwdRelative to a directory in MyTestDirectory
      term.runBlockingShellCommand({ command: "pwd", cwdRelative: "dir with spaces" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\//)
        expect(output.stdout).to.match(/dir with spaces\n$/)
      })
    })
  })
})

import type { FakeDA1Response } from "@tui-sandbox/library/dist/src/client/terminal-config.js"
import type { TestDirsPath } from "@tui-sandbox/library/dist/src/server/applications/neovim/environment/createTempDir.js"
import assert from "assert"

describe("TerminalTestApplication features", () => {
  it("can start the shell", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
      additionalEnvironmentVariables: {
        FOO: "barbarbarbarbarbar",
      },
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

      // verify that the additional environment variable is set
      cy.typeIntoTerminal("echo $FOO{enter}")
      cy.contains("barbarbarbarbarbar")
    })
  })

  it("creates a symlink to the latest test-environment", () => {
    cy.visit("/")
    cy.startTerminalApplication({ commandToRun: ["bash"] }).then(term => {
      // wait until text on the start screen is visible
      cy.contains("myprompt")

      term.runBlockingShellCommand({ command: `readlink ${term.dir.latestEnvironmentSymlink}` }).then(output => {
        assert(output.type === "success")
        const symlinkTarget = output.stdout.trim()
        expect(symlinkTarget).to.equal(term.dir.rootPathAbsolute)
      })
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

  it("returns the TestDirectory for type-safe access to the environment", () => {
    cy.visit("/")
    cy.startTerminalApplication({ commandToRun: ["bash"] }).then(term => {
      // it should not be undefined
      expect(term.dir).to.not.be.undefined

      expect(term.dir.testEnvironmentPathRelative).to.match(/testdirs\/dir-.*?/)
      expect(
        term.dir.contents.subdirectory.contents["subdirectory-file.txt"].name satisfies "subdirectory-file.txt"
      ).to.equal("subdirectory-file.txt")

      term.runBlockingShellCommand({ command: "echo $TUI_SANDBOX_TEST_ENVIRONMENT_PATH" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout.trim()).to.equal(term.dir.testEnvironmentPath)
      })
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

  it("can support DA1 (Primary Device Attributes) requests", () => {
    // Use case: the `yazi` terminal application needs the terminal to support DA1 requests
    //
    // https://github.com/sxyazi/yazi/blob/aae3f9ea4ad280a0e7b5596e137f38ec6f6f698b/yazi-adapter/src/emulator.rs?plain=1#L117-L136
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
      configureTerminal: term => {
        term.recipes.supportDA1()
      },
    }).then(() => {
      cy.contains("myprompt")
      // send a DA1 request to the terminal (/dev/tty), and read the response.
      // Print the response to the terminal raw
      cy.typeIntoTerminal(`echo -ne '\\033[c' > /dev/tty; dd bs=1 count=10 < /dev/tty 2>/dev/null{enter}`)

      // the response from the supportDA1 recipe should be printed to the
      // terminal
      cy.contains(`^[${"[?1;2c" satisfies FakeDA1Response}`)
    })
  })

  it("can support OSC52 clipboard requests", () => {
    // OSC52 is used this way: the terminal application sends an escape
    // sequence that requests the host terminal (e.g. iTerm2, kitty, wezterm,
    // ghostty) to set the clipboard contents to some data. This should work
    // even through an ssh connection to an external system, so it's very
    // flexible.
    //
    // Some references:
    // - https://github.com/xtermjs/xterm.js/pull/4220
    // - https://github.com/neovim/neovim/pull/25872
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
    }).then(term => {
      cy.contains("myprompt")
      term.clipboard.system().should("eql", "")

      // send an OSC52 clipboard set request to the terminal
      cy.typeIntoTerminal(`printf "\\033]52;c;$(printf "%s" "blabla" | base64)\\a"{enter}`)
      term.clipboard.system().should("eql", "blabla")
    })
  })

  describe("mise integration", () => {
    it("can use applications installed to the host environment with the miseIntegration", () => {
      cy.visit("/")
      cy.startTerminalApplication({ commandToRun: ["bash"] }).then(term => {
        // in the test environment's mise.toml file, cowsay is defined as an
        // application managed by mise. The test environment is expected to have
        // initialized the mise environment before starting the tests.
        term.runBlockingShellCommand({
          command: "which cowsay",
          allowFailure: false,
        })
        cy.typeIntoTerminal("cowsay --version{enter}")
      })
    })
  })
})

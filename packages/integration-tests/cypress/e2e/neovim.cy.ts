import { flavors } from "@catppuccin/palette"
import assert from "assert"
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

  it("can execute shell commands", () => {
    cy.visit("/")
    cy.startNeovim().then(() => {
      // successful command (stdout)
      cy.runBlockingShellCommand({ command: `echo HOME directory is $HOME` }).then(output => {
        // environment variables are supported
        assert(output.type === "success")
        expect(output.stdout).to.match(/HOME directory is .+?integration-tests\/test-environment\/testdirs\/dir-.*?/)
        expect(output.stderr).to.equal("")
      })

      cy.runBlockingShellCommand({ command: "echo file-contents > $HOME/somefile.txt" })
      cy.typeIntoTerminal(":e $HOME/somefile.txt{enter}", { delay: 0 })
      cy.contains("file-contents")

      // failing command (stderr)
      cy.runBlockingShellCommand({ command: "echo 'hello from the shell' >&2" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.equal("")
        expect(output.stderr).to.equal("hello from the shell\n")
      })

      // command not found, allowFailure=true
      cy.runBlockingShellCommand({ command: "commandnotfoundreallynotfound", allowFailure: true }).then(output => {
        assert(output.type === "failed")
      })

      // setting the cwd
      cy.runBlockingShellCommand({ command: "pwd", cwd: "/" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.equal("/\n")
      })

      // by default, the cwd is the home directory, which is the root of the
      // unique test environment
      cy.runBlockingShellCommand({ command: "pwd" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\n/)
      })

      // it's possible to use `cd` to change the cwd to a directory defined by
      // an environment variable
      cy.runBlockingShellCommand({ command: "cd $XDG_CONFIG_HOME; pwd" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\/.config\n/)
      })
    })
  })

  it("can run lua code and get its result", () => {
    cy.visit("/")
    cy.startNeovim().then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      // can do math
      cy.runLuaCode({ luaCode: "return 40 + 2" }).then(result => {
        expect(result.value).to.equal(42)
      })

      // can return strings
      cy.runLuaCode({ luaCode: "return 'hello from lua'" }).then(result => {
        expect(result.value).to.equal("hello from lua")
      })

      // can use nvim apis
      cy.runLuaCode({ luaCode: "return vim.api.nvim_get_current_win()" }).then(result => {
        expect(result.value).to.equal(1000)
      })

      // does not return anything if the lua code does not return anything.
      // But side effects are visible in the neovim instance.
      cy.runLuaCode({ luaCode: `vim.api.nvim_command('echo "hello from lua"')` }).then(result => {
        expect(result.value).to.equal(null)
      })
      cy.contains("hello from lua")

      // can programmatically manipulate the buffer
      cy.runLuaCode({
        luaCode: `
        vim.api.nvim_buf_set_lines(0, 0, -1, false, {'hello', 'from', 'lua'})
      `,
      })
      cy.contains("If you see this text, Neovim is ready!").should("not.exist")
      cy.contains("hello")
      cy.contains("from")
      cy.contains("lua")

      // can return tables
      cy.runLuaCode({ luaCode: "return {1, 2, 3}" }).then(result => {
        expect(result.value).to.deep.equal([1, 2, 3])
      })

      // can return nested tables
      cy.runLuaCode({ luaCode: "return {1, {2, 3}, 4}" }).then(result => {
        expect(result.value).to.deep.equal([1, [2, 3], 4])
      })
    })
  })
})

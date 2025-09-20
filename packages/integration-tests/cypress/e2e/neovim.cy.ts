import { flavors } from "@catppuccin/palette"
import assert from "assert"
import { join } from "path"
import { rgbify } from "../../../library/src/client"
import type { MyNeovimAppName, MyTestDirectoryFile } from "../../MyTestDirectory"
import type { MyBlockingCommandClientInput, NeovimContext } from "../support/tui-sandbox"

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

  it("can start neovim with a different NVIM_APPNAME", () => {
    cy.visit("/")
    cy.startNeovim({ NVIM_APPNAME: "nvim_alt" }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      // this variable only exists in the nvim_alt/init.lua file
      cy.typeIntoTerminal(":=_G.isInitFileLoaded_alt{enter}")
      cy.contains("yesTheInitFileIsLoaded")
    })
  })

  it("can start with startupScriptModifications and open another file", () => {
    cy.visit("/")
    cy.startNeovim({
      startupScriptModifications: [
        "add_command_to_count_open_buffers.lua",
        "don't_crash_when_modification_contains_unescaped_characters\".lua",
        "subdir/subdir-modification.lua",
      ],
    }).then(nvim => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      const fpath = "subdirectory/subdirectory-file.txt" satisfies MyTestDirectoryFile
      cy.typeIntoTerminal(`:edit ${fpath}{enter}`)

      cy.contains("Hello from the subdirectory!")

      cy.typeIntoTerminal(":CountBuffers{enter}")
      cy.contains("Number of open buffers: 2")

      nvim.runLuaCode({
        luaCode: `assert(_G.subdirectory_modification_loaded)`,
      })
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

  it("can 'restart' neovim by starting a second instance after the first one", () => {
    cy.visit("/")
    cy.startNeovim().then(() => {
      // wait until text on the start screen is visible
      cy.contains("f you see this text, Neovim is ready!").should(
        "have.css",
        "background-color",
        rgbify(flavors.macchiato.colors.base.rgb)
      )
    })

    // Restart neovim by starting a new instance. This will kill the previous one.
    cy.startNeovim({ filename: "routes/posts.$postId/adjacent-file.txt" }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("this file is adjacent-file.txt")
    })
  })

  it("can execute shell commands", () => {
    cy.visit("/")
    cy.startNeovim().then(nvim => {
      // successful command (stdout)
      nvim.runBlockingShellCommand({ command: `echo HOME directory is $HOME` }).then(output => {
        // environment variables are supported
        assert(output.type === "success")
        expect(output.stdout).to.match(/HOME directory is .+?integration-tests\/test-environment\/testdirs\/dir-.*?/)
        expect(output.stderr).to.equal("")
      })

      nvim.runBlockingShellCommand({ command: "echo file-contents > $HOME/somefile.txt" })
      cy.typeIntoTerminal(":e $HOME/somefile.txt{enter}", { delay: 0 })
      cy.contains("file-contents")

      // failing command (stderr)
      nvim.runBlockingShellCommand({ command: "echo 'hello from the shell' >&2" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.equal("")
        expect(output.stderr).to.equal("hello from the shell\n")
      })

      // command not found, allowFailure=true
      nvim.runBlockingShellCommand({ command: "commandnotfoundreallynotfound", allowFailure: true }).then(output => {
        assert(output.type === "failed")
      })

      // setting the cwd
      nvim.runBlockingShellCommand({ command: "pwd", cwd: "/" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.equal("/\n")
      })

      // setting the cwdRelative to a directory in MyTestDirectory
      nvim.runBlockingShellCommand({ command: "pwd", cwdRelative: "dir with spaces" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\//)
        expect(output.stdout).to.match(/dir with spaces\n$/)
      })

      // by default, the cwd is the home directory, which is the root of the
      // unique test environment
      nvim.runBlockingShellCommand({ command: "pwd" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\n/)
      })

      // it's possible to use `cd` to change the cwd to a directory defined by
      // an environment variable
      nvim.runBlockingShellCommand({ command: "cd $XDG_CONFIG_HOME; pwd" }).then(output => {
        assert(output.type === "success")
        expect(output.stdout).to.match(/integration-tests\/test-environment\/testdirs\/dir-.*?\/.config\n/)
      })
    })
  })

  it("can run lua code and get its result", () => {
    cy.visit("/")
    cy.startNeovim().then(nvim => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      nvim.runLuaCode({ luaCode: "return 40 + 2" }).then(result => {
        expect(result.value).to.equal(42)
      })

      // can return strings
      nvim.runLuaCode({ luaCode: "return 'hello from lua'" }).then(result => {
        expect(result.value).to.equal("hello from lua")
      })

      // can use nvim apis
      nvim.runLuaCode({ luaCode: "return vim.api.nvim_get_current_win()" }).then(result => {
        expect(result.value).to.equal(1000)
      })

      // does not return anything if the lua code does not return anything.
      // But side effects are visible in the neovim instance.
      nvim.runLuaCode({ luaCode: `vim.api.nvim_command('echo "hello from lua"')` }).then(result => {
        expect(result.value).to.equal(null)
      })
      cy.contains("hello from lua")

      // can programmatically manipulate the buffer
      nvim.runLuaCode({
        luaCode: `
        vim.api.nvim_buf_set_lines(0, 0, -1, false, {'hello', 'from', 'lua'})
      `,
      })
      cy.contains("If you see this text, Neovim is ready!").should("not.exist")
      cy.contains("hello")
      cy.contains("from")
      cy.contains("lua")

      // can return tables
      nvim.runLuaCode({ luaCode: "return {1, 2, 3}" }).then(result => {
        expect(result.value).to.deep.equal([1, 2, 3])
      })

      // can return nested tables
      nvim.runLuaCode({ luaCode: "return {1, {2, 3}, 4}" }).then(result => {
        expect(result.value).to.deep.equal([1, [2, 3], 4])
      })
    })
  })

  it("can poll until a lua expression passes", () => {
    cy.visit("/")
    cy.startNeovim({ startupScriptModifications: ["add_command_to_update_buffer_after_timeout.lua"] }).then(nvim => {
      // Set an initial buffer line
      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, -1, false, {'initial'})`,
      })

      // Start a timer that updates the buffer after some time
      nvim.runExCommand({ command: "UpdateBufferAfterTimeout" })

      // Poll until the buffer contains "updated". Using runLuaCode here would
      // crash if the editor state has not been updated yet, so it cannot be
      // used here.
      nvim.waitForLuaCode({
        luaAssertion: `assert(vim.api.nvim_buf_get_lines(0, 0, -1, false)[1] == 'updated')`,
      })

      // Assert the final state
      cy.contains("updated")
    })
  })

  it("does not show duplicated errors if the polling fails", () => {
    cy.visit("/")
    cy.startNeovim().then(nvim => {
      Cypress.on("fail", () => {
        // we expect this error to be able to inspect what the error looks like -
        // hide it so that the rest of the e2e tests can run
      })

      // poll for something that will never pass to see what the error messages
      // look like
      nvim.waitForLuaCode({
        luaAssertion: `assert(-1 == 1337)`,
        timeoutMs: 500,
      })
    })
  })

  it("can show messages after a test fails", () => {
    cy.visit("/")
    cy.startNeovim().then(nvim => {
      nvim.runLuaCode({ luaCode: `vim.api.nvim_echo({{"This is a message", "Normal"}}, true, {})` })
      nvim.runExCommand({ command: "echo 'test message'" })
    })
  })

  it("can runExCommand and get its result", () => {
    cy.visit("/")
    cy.startNeovim().then(nvim => {
      // wait until text on the start screen is visible
      cy.contains("If you see this text, Neovim is ready!")

      nvim.runExCommand({ command: "echo 'hello from ex command'" }).then(result => {
        expect(result.value).to.equal("hello from ex command")
      })

      cy.contains("Hello from the subdirectory!").should("not.exist")
      nvim
        .runExCommand({ command: `vsplit ${"subdirectory/subdirectory-file.txt" satisfies MyTestDirectoryFile}` })
        .then(result => {
          expect(result.value).to.equal("")
        })
      cy.contains("Hello from the subdirectory!")
    })
  })

  it(`"dofile" can load additional lua files easily after nvim startup`, () => {
    cy.visit("/")

    cy.startNeovim().then(nvim => {
      cy.contains("If you see this text, Neovim is ready!")

      // the file should not be loaded yet, meaning the command is not available
      nvim.runLuaCode({
        luaCode: `assert(vim.api.nvim_get_commands({})['CountBuffers'] == nil)`,
      })

      nvim.doFile({
        luaFile: "config-modifications/add_command_to_count_open_buffers.lua",
      })

      // the command should now be available
      nvim.runLuaCode({
        luaCode: `assert(vim.api.nvim_get_commands({})['CountBuffers'] ~= nil)`,
      })

      // test some types, no need to run this in the tests though
      if (1 + 0 === 1337) {
        nvim.doFile({
          // @ts-expect-error the file is not listed in MyTestDirectoryFile, so
          // it should be a type error
          luaFile: "invalid-file",
        })
      }
    })
  })

  describe("using an LSP server", () => {
    let currentNeovim: NeovimContext | undefined

    afterEach(function () {
      if (this.currentTest?.state === "failed") {
        assert(currentNeovim)
        const logFilePath = join(currentNeovim.dir.rootPathAbsolute, ".local/state/nvim/lsp.log")
        cy.task("showLspLogFile", { logFilePath: logFilePath })
      }
    })

    it.only("can use an LSP server that's already installed", () => {
      // in the test setup, the LSP server is installed in the file
      // prepare.lua when the test environment is started
      cy.visit("/")
      cy.startNeovim({ filename: "lua-project/init.lua" }).then(nvim => {
        currentNeovim = nvim

        // wait until text on the start screen is visible
        cy.contains(`require("config")`)
        // make sure nvim finds the executable for emmylua_ls
        nvim.runLuaCode({ luaCode: `assert(vim.fn.executable("emmylua_ls") == 1)` })

        // It takes a bit of time for the LSP server to start.
        nvim.runLuaCode({ luaCode: `vim.lsp.get_clients({bufnr=0})` }).then(result => {
          const clients = result.value
          assert(!clients)
        })
        nvim.waitForLuaCode({
          luaAssertion: `assert(#vim.diagnostic.get(0) > 0)`,
        })
        cy.typeIntoTerminal("/config.defaults/e{enter}")

        // the final `s` is the cursor itself, and it has a different background-color
        cy.contains("config.default").should("have.css", "background-color", rgbify(flavors.macchiato.colors.red.rgb))

        cy.typeIntoTerminal("gd")

        // should have navigated to the definition of `config.defaults`, which
        // is another file
        cy.contains("the default configuration")
        nvim.runExCommand({ command: `echo expand("%")` }).then(result => {
          expect(result.value).to.match(new RegExp("lua-project/config.lua" satisfies MyTestDirectoryFile))
        })
      })
    })
  })

  describe("mise integration", () => {
    it("can use applications installed to the host environment with the miseIntegration", () => {
      cy.visit("/")
      cy.startNeovim().then(nvim => {
        // in the test environment's mise.toml file, cowsay is defined as an
        // application managed by mise. The test environment is expected to have
        // initialized the mise environment before starting the tests.
        nvim.runBlockingShellCommand({
          command: "which cowsay",
          allowFailure: false,
        })
        cy.typeIntoTerminal("cowsay --version{enter}")
      })
    })
  })
})

describe("nvim_isRunning", () => {
  it("can report whether nvim_isRunning", () => {
    cy.visit("/")
    cy.nvim_isRunning().should("be.false")

    cy.startNeovim().then(() => {
      cy.nvim_isRunning().should("be.true")
    })
  })

  // test some types and make sure they are as expected
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (false) {
    cy.startNeovim({ NVIM_APPNAME: "nvim" satisfies MyNeovimAppName })
    cy.startNeovim({ NVIM_APPNAME: "nvim_alt" satisfies MyNeovimAppName })
    cy.startNeovim({
      // @ts-expect-error this NVIM_APPNAME is not configured, should be a type error
      NVIM_APPNAME: "doesnotexist",
    })
  }
})

{
  // @ts-expect-error cwdRelative should only allow MyTestDirectoryFile paths
  const invalid: MyBlockingCommandClientInput["cwdRelative"] = "invalid-invalid"
}

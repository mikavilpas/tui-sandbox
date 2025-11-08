import assert from "assert"
import { exec } from "child_process"
import EventEmitter from "events"
import { access } from "fs/promises"
import type { NeovimClient as NeovimApiClient } from "neovim"
import { tmpdir } from "os"
import path, { join } from "path"
import { debuglog } from "util"
import type { TestDirectory, TestEnvironmentCommonEnvironmentVariables } from "../../types.js"
import { DisposableSingleApplication } from "../../utilities/DisposableSingleApplication.js"
import type { Lazy } from "../../utilities/Lazy.js"
import { TerminalApplication } from "../../utilities/TerminalApplication.js"
import { connectNeovimApi } from "./NeovimJavascriptApiClient.js"

const log = debuglog("tui-sandbox-neovim-application")

/*

Usage:
  nvim [options] [file ...]

Options:
  --cmd <cmd>           Execute <cmd> before any config
  +<cmd>, -c <cmd>      Execute <cmd> after config and first file
  -l <script> [args...] Execute Lua <script> (with optional args)
  -S <session>          Source <session> after loading the first file
  -s <scriptin>         Read Normal mode commands from <scriptin>
  -u <config>           Use this config file

  -d                    Diff mode
  -es, -Es              Silent (batch) mode
  -h, --help            Print this help message
  -i <shada>            Use this shada file
  -n                    No swap file, use memory only
  -o[N]                 Open N windows (default: one per file)
  -O[N]                 Open N vertical windows (default: one per file)
  -p[N]                 Open N tab pages (default: one per file)
  -R                    Read-only (view) mode
  -v, --version         Print version information
  -V[N][file]           Verbose [level][file]

  --                    Only file names after this
  --api-info            Write msgpack-encoded API metadata to stdout
  --clean               "Factory defaults" (skip user config and plugins, shada)
  --embed               Use stdin/stdout as a msgpack-rpc channel
  --headless            Don't start a user interface
  --listen <address>    Serve RPC API from this address
  --remote[-subcommand] Execute commands remotely on a server
  --server <address>    Connect to this Nvim server
  --startuptime <file>  Write startup timing messages to <file>

See ":help startup-options" for all options.

NVIM v0.11.2
Build type: Release
LuaJIT 2.1.1741730670
Run "nvim -V1 -v" for more info

*/

export type StdoutOrStderrMessage = "stdout"

export type StartNeovimGenericArguments = {
  filename: string | { openInVerticalSplits: string[] }
  startupScriptModifications?: string[]

  /** Executes the given command with --headless -c <command> -c qa */
  headlessCmd?: string

  /**
   * This variable controls the sub-directory that Nvim will read from (and
   * auto-create) in each of the base directories.
   *
   * For example, setting $NVIM_APPNAME to "foo" before starting will cause
   * Nvim to look for configuration files in $XDG_CONFIG_HOME/foo instead of
   * $XDG_CONFIG_HOME/nvim. $NVIM_APPNAME must be a name, such as "foo", or a
   * relative path, such as "foo/bar".
   *
   * https://neovim.io/doc/user/starting.html#_nvim_appname
   */
  NVIM_APPNAME?: string

  /** Additions to the environment variables for the Neovim process. These
   * override any already existing environment variables. */
  additionalEnvironmentVariables?: Record<string, string> | undefined
}

export type TerminalDimensions = { cols: number; rows: number }

type ResettableState = {
  testDirectory: TestDirectory
  NVIM_APPNAME: string | undefined
  socketPath: string
  client: Lazy<Promise<NeovimApiClient>>
}

export class NeovimApplication implements AsyncDisposable {
  public state: ResettableState | undefined
  public readonly events: EventEmitter

  public constructor(
    private readonly testEnvironmentPath: string,
    public readonly application: DisposableSingleApplication = new DisposableSingleApplication()
  ) {
    this.events = new EventEmitter()
  }

  /**
   * Kill the current application and start a new one with the given arguments.
   */
  public async startNextAndKillCurrent(
    testDirectory: TestDirectory,
    startArgs: StartNeovimGenericArguments,
    terminalDimensions: TerminalDimensions
  ): Promise<void> {
    await this[Symbol.asyncDispose]()
    assert(
      this.state === undefined,
      "NeovimApplication state should be undefined after disposing so that no previous state is reused."
    )

    const neovimArguments: string[] = []

    if (startArgs.startupScriptModifications) {
      for (const modification of startArgs.startupScriptModifications) {
        let file = path.join(testDirectory.rootPathAbsolute, "config-modifications", modification)
        try {
          await access(file)
        } catch (e) {
          throw new Error(`startupScriptModifications file does not exist: ${file}. Error: ${String(e)}`)
        }

        file = file.replaceAll("'", "\\'")
        neovimArguments.push("-c", `lua dofile('${file}')`)
      }
    }

    if (typeof startArgs.filename === "string") {
      const file = path.join(testDirectory.rootPathAbsolute, startArgs.filename)
      neovimArguments.push(file)
    } else if (startArgs.filename.openInVerticalSplits.length > 0) {
      // `-O[N]` Open N vertical windows (default: one per file)
      neovimArguments.push("-O")

      for (const file of startArgs.filename.openInVerticalSplits) {
        const filePath = path.join(testDirectory.rootPathAbsolute, file)
        neovimArguments.push(filePath)
      }
    }

    if (startArgs.headlessCmd) {
      // NOTE: update the doc comment above if this changes
      neovimArguments.push("--headless")
      neovimArguments.push("-c", startArgs.headlessCmd)
      neovimArguments.push("-c", "qa")
    }

    const id = Math.random().toString().slice(2, 8)
    const socketPath = `${tmpdir()}/tui-sandbox-nvim-socket-${id}`
    neovimArguments.push("--listen", socketPath)

    const stdout = this.events

    await this.application.startNextAndKillCurrent(async () => {
      const env = NeovimApplication.getEnvironmentVariables(
        testDirectory,
        startArgs.NVIM_APPNAME,
        startArgs.additionalEnvironmentVariables
      )
      return TerminalApplication.start({
        command: "nvim",
        args: neovimArguments,

        cwd: this.testEnvironmentPath,
        env,
        dimensions: terminalDimensions,

        onStdoutOrStderr(data) {
          data satisfies string
          stdout.emit("stdout" satisfies StdoutOrStderrMessage, data)
        },
      })
    })

    const processId = this.application.processId()
    assert(processId !== undefined, "Neovim was started without a process ID. This is a bug - please open an issue.")

    this.state = {
      testDirectory,
      socketPath,
      NVIM_APPNAME: startArgs.NVIM_APPNAME,
      client: connectNeovimApi(socketPath),
    }

    log(`🚀 Started Neovim instance ${processId} (NVIM_APPNAME: ${startArgs.NVIM_APPNAME})`)
  }

  public static getEnvironmentVariables(
    testDirectory: TestDirectory,
    NVIM_APPNAME: string | undefined,
    additionalEnvironmentVariables?: Record<string, string>
  ): NodeJS.ProcessEnv {
    return {
      ...process.env,
      ...({
        HOME: testDirectory.rootPathAbsolute,
        XDG_CONFIG_HOME: join(testDirectory.rootPathAbsolute, ".config"),
        XDG_DATA_HOME: join(testDirectory.testEnvironmentPath, ".repro", "data"),
        TUI_SANDBOX_TEST_ENVIRONMENT_PATH: testDirectory.testEnvironmentPath,
      } satisfies TestEnvironmentCommonEnvironmentVariables),
      NVIM_APPNAME: NVIM_APPNAME ?? "nvim",

      ...additionalEnvironmentVariables,
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.application[Symbol.asyncDispose]()

    if (!this.state) return

    exec(`rm -rf ${this.state.testDirectory.rootPathAbsolute}`)

    try {
      await access(this.state.socketPath)
      // this is probably not dangerous, but I'm not sure why it sometimes
      // happens. It's better to report it than to hide it.
      log(`Socket file ${this.state.socketPath} should have been removed by neovim when it exited.`)
      return
    } catch {
      // all good
    } finally {
      this.state = undefined
    }
  }
}

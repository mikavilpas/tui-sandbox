import { exec } from "child_process"
import EventEmitter from "events"
import { existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import type { TestDirectory } from "../types"
import { DisposableSingleApplication } from "../utilities/DisposableSingleApplication"
import { TerminalApplication } from "../utilities/TerminalApplication"

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
  --server <address>    Specify RPC server to send commands to
  --startuptime <file>  Write startup timing messages to <file>

See ":help startup-options" for all options.

$ nvim --version
NVIM v0.11.0-dev-608+g9d74dc3ac
Build type: Release
LuaJIT 2.1.1720049189
Run "nvim -V1 -v" for more info

*/

const __dirname = fileURLToPath(new URL(".", import.meta.url))
export type StdoutMessage = "stdout"

export type StartNeovimGenericArguments = {
  terminalDimensions?: { cols: number; rows: number }
  filename?: string | { openInVerticalSplits: string[] }
  startupScriptModifications?: string[]
}

export class NeovimApplication extends DisposableSingleApplication {
  private testDirectory: TestDirectory | undefined
  public readonly events: EventEmitter

  public constructor(private readonly testEnvironmentPath: string) {
    super()
    this.events = new EventEmitter()
  }

  /**
   * Kill the current application and start a new one with the given arguments.
   */
  public async startNextAndKillCurrent(
    testDirectory: TestDirectory,
    startArgs: StartNeovimGenericArguments
  ): Promise<void> {
    await this[Symbol.asyncDispose]()
    this.testDirectory = testDirectory

    const neovimArguments = ["-u", "test-setup.lua"]

    if (startArgs.startupScriptModifications) {
      for (const modification of startArgs.startupScriptModifications) {
        const file = path.join(testDirectory.rootPathAbsolute, "config-modifications", modification)
        if (!existsSync(file)) {
          throw new Error(`startupScriptModifications file does not exist: ${file}`)
        }

        neovimArguments.push("-c", `lua dofile('${file}')`)
      }
    }

    if (!startArgs.filename) {
      startArgs.filename = "initial-file.txt"
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
    const stdout = this.events

    this.application = TerminalApplication.start({
      command: "nvim",
      args: neovimArguments,

      cwd: this.testEnvironmentPath,
      env: process.env,
      dimensions: startArgs.terminalDimensions,

      onStdoutOrStderr(data: string) {
        stdout.emit("stdout" satisfies StdoutMessage, data)
      },
    })
  }

  override async [Symbol.asyncDispose](): Promise<void> {
    await super.killCurrent()
    if (this.testDirectory) {
      exec(`rm -rf ${this.testDirectory.rootPathAbsolute}`)
    }
  }
}

import assert from "assert"
import { exec } from "child_process"
import EventEmitter from "events"
import { join } from "path"
import { debuglog } from "util"

import type {
  MiseIntegrationEnvironmentVariables,
  TestDirectory,
  TestEnvironmentCommonEnvironmentVariables,
} from "../../types.js"
import type { TestServerConfig } from "../../updateTestdirectorySchemaFile.js"
import { DisposableSingleApplication } from "../../utilities/DisposableSingleApplication.js"
import { TerminalApplication } from "../../utilities/TerminalApplication.js"
import { prependMiseBinPathsToPath, resolveMiseBinPaths } from "../neovim/environment/resolveMiseBinPaths.js"
import { resolveMiseStateDirectory } from "../neovim/environment/resolveMiseStateDirectory.js"
import { XdgRuntimeDirectory } from "../neovim/environment/XdgRuntimeDirectory.js"
import type { StdoutOrStderrMessage, TerminalDimensions } from "../neovim/NeovimApplication.js"

export type { StdoutOrStderrMessage }

const log = debuglog("tui-sandbox.terminal.TerminalTestApplication")

type ResettableState = {
  testDirectory: TestDirectory
  xdgRuntimeDirectory: XdgRuntimeDirectory
}

export type StartTerminalGenericArguments = {
  commandToRun: string[]
  additionalEnvironmentVariables?: Record<string, string> | undefined
}

export default class TerminalTestApplication implements AsyncDisposable {
  public state: ResettableState | undefined

  public readonly events: EventEmitter

  public constructor(public readonly application: DisposableSingleApplication = new DisposableSingleApplication()) {
    this.events = new EventEmitter()
  }

  public async startNextAndKillCurrent(
    config: TestServerConfig,
    testDirectory: TestDirectory,
    startArgs: StartTerminalGenericArguments,
    terminalDimensions: TerminalDimensions,
  ): Promise<void> {
    await this[Symbol.asyncDispose]()
    assert(
      this.state === undefined,
      "TerminalTestApplication state should be undefined after disposing so that no previous state is reused.",
    )

    const command = startArgs.commandToRun[0]
    assert(command, "No command to run was provided.")
    // TODO could check if the command is executable
    const terminalArguments = startArgs.commandToRun.slice(1)

    const xdgRuntimeDirectory = await XdgRuntimeDirectory.create(testDirectory.rootPathAbsolute)

    const stdout = this.events

    await this.application.startNextAndKillCurrent(async () => {
      const env = this.getEnvironmentVariables(
        config,
        testDirectory,
        xdgRuntimeDirectory.path,
        startArgs.additionalEnvironmentVariables,
      )
      return TerminalApplication.start({
        command,
        args: terminalArguments,

        cwd: testDirectory.rootPathAbsolute,
        env,
        dimensions: terminalDimensions,

        onStdoutOrStderr(data) {
          // zigpty's onData provides string when encoding is "utf8" (the
          // default). It only returns Buffer when encoding is explicitly null.
          assert(typeof data === "string")
          stdout.emit("stdout" satisfies StdoutOrStderrMessage, data)
        },
      })
    })

    const processId = this.application.processId()
    assert(
      processId !== undefined,
      "TerminalApplication was started without a process ID. This is a bug - please open an issue.",
    )

    this.state = { testDirectory, xdgRuntimeDirectory }

    log(`🚀 Started Terminal instance ${processId}`)
  }

  public getEnvironmentVariables(
    config: TestServerConfig,
    testDirectory: TestDirectory,
    xdgRuntimeDir: string,
    additionalEnvironmentVariables?: Record<string, string>,
  ): Record<string, string> {
    const miseStateDirectory = resolveMiseStateDirectory()
    let env: Record<string, string> = {
      ...process.env,
      HOME: testDirectory.rootPathAbsolute,
      XDG_CONFIG_HOME: join(testDirectory.rootPathAbsolute, ".config"),
      XDG_DATA_HOME: join(testDirectory.testEnvironmentPath, ".repro", "data"),
      XDG_RUNTIME_DIR: xdgRuntimeDir,
      TUI_SANDBOX_TEST_ENVIRONMENT_PATH: testDirectory.testEnvironmentPath,
    } satisfies TestEnvironmentCommonEnvironmentVariables

    if (config.integrations.mise) {
      Object.assign(env, {
        ...(miseStateDirectory ? { MISE_STATE_DIR: miseStateDirectory } : {}),
        MISE_OFFLINE: "1",
      } satisfies MiseIntegrationEnvironmentVariables)

      // put mise-managed tools' real install dirs on PATH so they are
      // invocable in the isolated env (shims can't re-resolve there)
      env = prependMiseBinPathsToPath(env, resolveMiseBinPaths())
    }

    Object.assign(env, additionalEnvironmentVariables ?? {})
    return env
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.application[Symbol.asyncDispose]()

    if (!this.state) return

    await this.state.xdgRuntimeDirectory[Symbol.asyncDispose]()

    exec(`rm -rf ${this.state.testDirectory.rootPathAbsolute}`)

    this.state = undefined
  }
}

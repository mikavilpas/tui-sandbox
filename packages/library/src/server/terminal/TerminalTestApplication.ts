import assert from "assert"
import { exec } from "child_process"
import EventEmitter from "events"
import { join } from "path"
import type { StdoutOrStderrMessage, TerminalDimensions } from "../neovim/NeovimApplication.js"
import type { TestDirectory, TestEnvironmentCommonEnvironmentVariables } from "../types.js"
import { DisposableSingleApplication } from "../utilities/DisposableSingleApplication.js"
import { TerminalApplication } from "../utilities/TerminalApplication.js"

type ResettableState = {
  testDirectory: TestDirectory
}

export type StartTerminalGenericArguments = {
  commandToRun: string[]
  additionalEnvironmentVariables?: Record<string, string> | undefined
}

export default class TerminalTestApplication implements AsyncDisposable {
  public state: ResettableState | undefined
  public readonly events: EventEmitter

  public constructor(
    private readonly testEnvironmentPath: string,
    public readonly application: DisposableSingleApplication = new DisposableSingleApplication()
  ) {
    this.events = new EventEmitter()
  }

  public async startNextAndKillCurrent(
    testDirectory: TestDirectory,
    startArgs: StartTerminalGenericArguments,
    terminalDimensions: TerminalDimensions
  ): Promise<void> {
    await this[Symbol.asyncDispose]()
    assert(
      this.state === undefined,
      "TerminalTestApplication state should be undefined after disposing so that no previous state is reused."
    )

    const command = startArgs.commandToRun[0]
    assert(command, "No command to run was provided.")
    // TODO could check if the command is executable
    const terminalArguments = startArgs.commandToRun.slice(1)

    const stdout = this.events

    await this.application.startNextAndKillCurrent(async () => {
      const env = this.getEnvironmentVariables(testDirectory, startArgs.additionalEnvironmentVariables)
      return TerminalApplication.start({
        command,
        args: terminalArguments,

        cwd: testDirectory.rootPathAbsolute,
        env: env,
        dimensions: terminalDimensions,

        onStdoutOrStderr(data) {
          data satisfies string
          stdout.emit("stdout" satisfies StdoutOrStderrMessage, data)
        },
      })
    })

    const processId = this.application.processId()
    assert(
      processId !== undefined,
      "TerminalApplication was started without a process ID. This is a bug - please open an issue."
    )

    this.state = { testDirectory }

    console.log(`🚀 Started Terminal instance ${processId}`)
  }

  public getEnvironmentVariables(
    testDirectory: TestDirectory,
    additionalEnvironmentVariables?: Record<string, string>
  ): NodeJS.ProcessEnv {
    return {
      ...process.env,
      HOME: testDirectory.rootPathAbsolute,
      XDG_CONFIG_HOME: join(testDirectory.rootPathAbsolute, ".config"),
      XDG_DATA_HOME: join(testDirectory.testEnvironmentPath, ".repro", "data"),
      ...additionalEnvironmentVariables,
    } satisfies TestEnvironmentCommonEnvironmentVariables
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.application[Symbol.asyncDispose]()

    if (!this.state) return

    exec(`rm -rf ${this.state.testDirectory.rootPathAbsolute}`)

    this.state = undefined
  }
}

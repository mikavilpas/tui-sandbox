import type winston from "winston"
import { createLogger, format, transports } from "winston"

import type { ITerminalDimensions } from "@xterm/addon-fit"
import type { IPty } from "node-pty"
import pty from "node-pty"
import type { StartableApplication } from "./DisposableSingleApplication.js"

export type ExitInfo = { exitCode: number; signal: number | undefined }

// NOTE separating stdout and stderr is not supported by node-pty
// https://github.com/microsoft/node-pty/issues/71
export class TerminalApplication implements StartableApplication {
  public readonly processId: number

  public readonly logger: winston.Logger

  private constructor(
    private readonly subProcess: IPty,
    public readonly onStdoutOrStderr: (data: string) => void,
    public readonly untilExit: Promise<ExitInfo>,
    public readonly name: string
  ) {
    this.processId = subProcess.pid

    this.logger = createLogger({
      transports: [new transports.Console()],
      defaultMeta: { pid: this.processId },
      format: format.combine(format.colorize(), format.cli()),
    })

    this.logger.debug(`started`)

    subProcess.onExit(({ exitCode, signal }) => {
      signal satisfies number | undefined
      const msg = `Child process ${this.processId} (${this.name}) exited with code ${String(exitCode)} and signal ${String(signal)}`
      this.onStdoutOrStderr(msg)
      this.logger.debug(msg)
    })
  }

  /** @constructor Start a new terminal application. */
  public static start({
    onStdoutOrStderr,
    command,
    args,
    cwd,
    env,
    dimensions,
  }: {
    onStdoutOrStderr: (data: string) => void
    command: string
    args: string[]
    cwd: string
    env?: NodeJS.ProcessEnv
    dimensions: ITerminalDimensions
  }): TerminalApplication {
    console.log(`Starting '${command}' with args '${args.join(" ")}' in cwd '${cwd}'`)

    const ptyProcess = pty.spawn(command, args, {
      name: "xterm-color",
      cwd,
      env,
      cols: dimensions.cols,
      rows: dimensions.rows,
    })
    ptyProcess.onData(onStdoutOrStderr)
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`Child process exited with code ${exitCode} and signal ${signal}`)
    })

    const processId = ptyProcess.pid

    if (!processId) {
      throw new Error("Failed to spawn child process")
    }
    const untilExit = new Promise<ExitInfo>(resolve => {
      ptyProcess.onExit(({ exitCode, signal }) => {
        // console.log(`Child process ${processId} exited with code ${exitCode} and signal ${signal}`)
        resolve({ exitCode, signal })
      })
    })

    return new TerminalApplication(ptyProcess, onStdoutOrStderr, untilExit, ptyProcess.process satisfies string)
  }

  /** Write to the terminal's stdin. */
  public write(data: string): void {
    this.subProcess.write(data)
  }

  public async killAndWait(): Promise<void> {
    console.log(`💣 Killing process ${this.processId}`)
    this.subProcess.kill()
    console.log(`💥 Killed process ${this.processId}`)
  }
}

import type winston from "winston"
import { createLogger, format, transports } from "winston"

import type { ITerminalDimensions } from "@xterm/addon-fit"
import { debuglog } from "util"
import * as zigpty from "zigpty"
import type { StartableApplication } from "./DisposableSingleApplication.js"

const log = debuglog("tui-sandbox.TerminalApplication")

export type ExitInfo = { exitCode: number; signal: number | undefined }

// NOTE separating stdout and stderr is not supported by node-pty
// https://github.com/microsoft/node-pty/issues/71
export class TerminalApplication implements StartableApplication {
  public readonly processId: number

  public readonly logger: winston.Logger

  private constructor(
    private readonly subProcess: zigpty.IPty,
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
    onStdoutOrStderr: (data: string | Buffer) => void
    command: string
    args: string[]
    cwd: string
    env?: Record<string, string>
    dimensions: ITerminalDimensions
  }): TerminalApplication {
    log(`Starting '${command}' with args '${args.join(" ")}' in cwd '${cwd}'`)

    const ptyProcess = zigpty.spawn(command, args, {
      name: "xterm-color",
      cwd,
      env,
      cols: dimensions.cols,
      rows: dimensions.rows,
    })
    ptyProcess.onData(onStdoutOrStderr)
    ptyProcess.onExit(({ exitCode, signal }) => {
      log(`Child process exited with code ${exitCode} and signal ${signal}`)
    })

    const processId = ptyProcess.pid

    if (!processId) {
      throw new Error("Failed to spawn child process")
    }
    const untilExit = new Promise<ExitInfo>(resolve => {
      // Keep the Node.js event loop alive until the exit callback fires.
      // When the child process exits, zigpty's internal tty.ReadStream on the
      // PTY fd is destroyed. If that was the last active handle, Node.js would
      // exit before the native waitpid() callback can post the exit event back
      // to the event loop.
      // oxlint-disable-next-line no-empty-function
      const keepAlive = setInterval(() => {}, 60_000)
      ptyProcess.onExit(({ exitCode, signal }) => {
        clearInterval(keepAlive)
        resolve({ exitCode, signal })
      })
    })

    return new TerminalApplication(ptyProcess, onStdoutOrStderr, untilExit, command)
  }

  /** Write to the terminal's stdin. */
  public write(data: string): void {
    this.subProcess.write(data)
  }

  public async killAndWait(): Promise<void> {
    log(`💣 Killing process ${this.processId}`)
    this.subProcess.kill()
    log(`💥 Killed process ${this.processId}`)
  }
}

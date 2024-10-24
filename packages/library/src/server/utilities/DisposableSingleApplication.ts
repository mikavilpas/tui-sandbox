import assert from "assert"
import type { TerminalApplication } from "./TerminalApplication"

export type StartableApplication = Pick<TerminalApplication, "write" | "processId" | "killAndWait">

/** A testable application that can be started, killed, and given input. For a
 * single instance of this interface, only a single instance can be running at
 * a time.
 */
export class DisposableSingleApplication implements AsyncDisposable {
  protected application: StartableApplication | undefined

  public async startNextAndKillCurrent(startNext: () => Promise<StartableApplication>): Promise<void> {
    await this[Symbol.asyncDispose]()
    this.application = await startNext()
  }

  public async write(input: string): Promise<void> {
    assert(
      this.application,
      "The application not started yet. It makes no sense to write to it, so this looks like a bug."
    )
    this.application.write(input)
  }

  public processId(): number | undefined {
    return this.application?.processId
  }

  /** Kill the current application if it exists. */
  public async [Symbol.asyncDispose](): Promise<void> {
    if (this.processId() === undefined) {
      return
    }
    console.log(`Killing current application ${this.processId()}...`)
    await this.application?.killAndWait()
  }
}

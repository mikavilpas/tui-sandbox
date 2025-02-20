import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import type { BlockingCommandClientInput } from "../server/blockingCommandInputSchema.js"
import type { AppRouter } from "../server/server.js"
import type { StartTerminalGenericArguments } from "../server/terminal/TerminalTestApplication.js"
import type { BlockingShellCommandOutput, TestDirectory } from "../server/types.js"
import "./style.css"
import { getTabId, startTerminal } from "./websocket-client.js"

/** Manages the terminal state in the browser as well as the (browser's)
 * connection to the server side terminal application api. */
export class TerminalTerminalClient {
  private readonly ready: Promise<void>
  private readonly tabId: { tabId: string }
  private readonly terminal: Terminal
  private readonly trpc: ReturnType<typeof createTRPCClient<AppRouter>>

  constructor(app: HTMLElement) {
    const trpc = createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: operation => operation.type === "subscription",
          true: unstable_httpSubscriptionLink({
            url: "/trpc",
          }),
          false: httpBatchLink({
            url: "/trpc",
          }),
        }),
      ],
    })
    this.trpc = trpc

    this.tabId = getTabId()
    const tabId = this.tabId

    const terminal = startTerminal(app, {
      onMouseEvent(data: string) {
        void trpc.terminal.sendStdin.mutate({ tabId, data }).catch((error: unknown) => {
          console.error(`Error sending mouse event`, error)
        })
      },
      onKeyPress(event) {
        void trpc.terminal.sendStdin.mutate({ tabId, data: event.key })
      },
    })
    this.terminal = terminal

    // start listening to Neovim stdout - this will take some (short) amount of
    // time to complete
    this.ready = new Promise<void>(resolve => {
      console.log("Subscribing to stdout")
      trpc.terminal.onStdout.subscribe(
        { client: tabId },
        {
          onStarted() {
            resolve()
          },
          onData(data: string) {
            terminal.write(data)
          },
          onError(err: unknown) {
            console.error(`Error from the application`, err)
          },
        }
      )
    })
  }

  public async startTerminalApplication(args: StartTerminalGenericArguments): Promise<TestDirectory> {
    await this.ready
    const testDirectory = await this.trpc.terminal.start.mutate({
      tabId: this.tabId,
      startTerminalArguments: {
        additionalEnvironmentVariables: args.additionalEnvironmentVariables,
        commandToRun: args.commandToRun,
        terminalDimensions: {
          cols: this.terminal.cols,
          rows: this.terminal.rows,
        },
      },
    })

    return testDirectory
  }

  public async runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
    await this.ready
    return this.trpc.terminal.runBlockingShellCommand.mutate({ ...input, tabId: this.tabId })
  }
}

import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import type { StartTerminalBrowserArguments } from "../browser/neovim-client.js"
import type { BlockingCommandClientInput } from "../server/blockingCommandInputSchema.js"
import type { AppRouter } from "../server/server.js"
import type { BlockingShellCommandOutput, ServerTestDirectory } from "../server/types.js"
import type { InMemoryClipboard } from "./clipboard.js"
import { InMemoryClipboardProvider } from "./clipboard.js"
import type { TuiTerminalApi } from "./startTerminal.js"
import { getTabId, startTerminal } from "./startTerminal.js"
import { supportDA1 } from "./terminal-config.js"

/** Manages the terminal state in the browser as well as the (browser's)
 * connection to the server side terminal application api. */
export class TerminalTerminalClient {
  private readonly ready: Promise<void>
  private readonly tabId: { tabId: string }
  private readonly terminal: Terminal
  private readonly trpc: ReturnType<typeof createTRPCClient<AppRouter>>

  public readonly clipboard: InMemoryClipboard
  public readonly terminalApi: TuiTerminalApi

  constructor(app: HTMLElement) {
    const trpc = createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: operation => operation.type === "subscription",
          true: httpSubscriptionLink({
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

    const clipboard = new InMemoryClipboardProvider()
    this.terminalApi = {
      onMouseEvent(data: string) {
        void trpc.terminal.sendStdin.mutate({ tabId, data }).catch((error: unknown) => {
          console.error(`Error sending mouse event`, error)
        })
      },
      onKeyPress(event) {
        void trpc.terminal.sendStdin.mutate({ tabId, data: event.key })
      },
      clipboard,
    }
    this.clipboard = clipboard
    const terminal = startTerminal(app, this.terminalApi)
    this.terminal = terminal

    // start listening to stdout - this will take some (short) amount of time
    // to complete
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

  public async startTerminalApplication(args: StartTerminalBrowserArguments): Promise<ServerTestDirectory> {
    await this.ready

    args.browserSettings.configureTerminal?.({
      terminal: this.terminal,
      api: this.terminalApi,
      recipes: {
        supportDA1: () => {
          supportDA1(this.terminal, this.terminalApi)
        },
      },
    })

    const testDirectory = await this.trpc.terminal.start.mutate({
      tabId: this.tabId,
      startTerminalArguments: {
        additionalEnvironmentVariables: args.serverSettings.additionalEnvironmentVariables,
        commandToRun: args.serverSettings.commandToRun,
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

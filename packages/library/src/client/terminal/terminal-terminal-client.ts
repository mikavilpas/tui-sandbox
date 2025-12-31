import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import type { StartTerminalBrowserArguments } from "../../browser/neovim-client.js"
import type { BlockingCommandClientInput } from "../../server/blockingCommandInputSchema.js"
import type { AppRouter } from "../../server/server.js"
import type { BlockingShellCommandOutput, ServerTestDirectory } from "../../server/types.js"
import type { TabId } from "../../server/utilities/tabId.js"
import { BatchedAsyncQueue, type TerminalInputEvent } from "../BatchedAsyncQueue.js"
import { InMemoryClipboardProvider } from "../clipboard.js"
import type { TuiTerminalApi } from "../startTerminal.js"
import { getTabId, startTerminal } from "../startTerminal.js"
import { supportDA1 } from "./terminal-config.js"

/** Manages the terminal state in the browser as well as the (browser's)
 * connection to the server side terminal application api. */
export class TerminalTerminalClient {
  public constructor(
    private readonly tabId: TabId,
    private readonly terminal: Terminal,
    private readonly trpc: ReturnType<typeof createTRPCClient<AppRouter>>,
    private readonly inputQueue: BatchedAsyncQueue<TerminalInputEvent>,
    public readonly terminalApi: TuiTerminalApi
  ) {}

  static async create(app: HTMLElement): Promise<TerminalTerminalClient> {
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

    const tabId = getTabId()

    const controller = new AbortController()
    window.addEventListener("pagehide", () => {
      controller.abort()
    })

    const inputQueue = new BatchedAsyncQueue<TerminalInputEvent>(async (events: string[]) => {
      const keys = events.join("")
      await trpc.terminal.sendStdin.mutate({ tabId, data: keys })
    }, controller.signal)

    const clipboard = new InMemoryClipboardProvider()
    const terminalApi = {
      onMouseEvent: (data: string) => {
        inputQueue.enqueue(data)
      },
      onKeyPress: (event: { key: string; domEvent: KeyboardEvent }) => {
        inputQueue.enqueue(event.key)
      },
      clipboard,
    }
    const terminal = startTerminal(app, terminalApi)

    // start listening to stdout - this will take some (short) amount of time
    // to complete
    await new Promise<void>(resolve => {
      console.log("Subscribing to stdout")
      trpc.terminal.onStdout.subscribe(
        { client: tabId },
        {
          onStarted() {
            resolve()
          },
          onData: (data: string) => {
            terminal.write(data)
          },
          onError(err: unknown) {
            console.error(`Error from the application`, err)
          },
        }
      )
    })

    return new TerminalTerminalClient(tabId, terminal, trpc, inputQueue, terminalApi)
  }

  public async startTerminalApplication(args: StartTerminalBrowserArguments): Promise<ServerTestDirectory> {
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

    void this.inputQueue.startProcessing()
    return testDirectory
  }

  public async runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
    return this.trpc.terminal.runBlockingShellCommand.mutate({ ...input, tabId: this.tabId })
  }
}

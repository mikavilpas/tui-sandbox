import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import type {
  ExCommandClientInput,
  LuaCodeClientInput,
  PollLuaCodeClientInput,
  RunLuaFileClientInput,
} from "../..//server/applications/neovim/neovimRouter.js"
import type { AppRouter } from "../..//server/server.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../..//server/types.js"
import type { BlockingCommandClientInput } from "../../server/blockingCommandInputSchema.js"
import { BatchedAsyncQueue, type TerminalInputEvent } from "../BatchedAsyncQueue.js"
import type { InMemoryClipboard } from "../clipboard.js"
import { InMemoryClipboardProvider } from "../clipboard.js"
import { getTabId, startTerminal } from "../startTerminal.js"

/** Manages the terminal state in the browser as well as the (browser's)
 * connection to the server side terminal application api. */
export class NeovimTerminalClient {
  public constructor(
    private readonly tabId: { tabId: string },
    private readonly terminal: Terminal,
    private readonly trpc: ReturnType<typeof createTRPCClient<AppRouter>>,
    public readonly clipboard: InMemoryClipboard,
    private readonly inputQueue: BatchedAsyncQueue<TerminalInputEvent>
  ) {}

  static async create(app: HTMLElement): Promise<NeovimTerminalClient> {
    const trpc = createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: operation => operation.type === "subscription",
          true: httpSubscriptionLink({ url: "/trpc" }),
          false: httpBatchLink({ url: "/trpc" }),
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
      await trpc.neovim.sendStdin.mutate({ tabId, data: keys })
    }, controller.signal)

    const clipboard = new InMemoryClipboardProvider()
    const terminal = startTerminal(app, {
      onMouseEvent: (data: string) => {
        inputQueue.enqueue(data)
      },
      onKeyPress: (event: { key: string; domEvent: KeyboardEvent }) => {
        inputQueue.enqueue(event.key)
      },
      clipboard,
    })

    // start listening to Neovim stdout - this will take some (short) amount of
    // time to complete
    await new Promise<void>(resolve => {
      console.log("Subscribing to stdout")
      trpc.neovim.onStdout.subscribe(
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

    return new NeovimTerminalClient(tabId, terminal, trpc, clipboard, inputQueue)
  }

  public async startNeovim(args: StartNeovimGenericArguments): Promise<TestDirectory> {
    const testDirectory = await this.trpc.neovim.start.mutate({
      startNeovimArguments: {
        filename: args.filename,
        additionalEnvironmentVariables: args.additionalEnvironmentVariables,
        startupScriptModifications: args.startupScriptModifications,
        NVIM_APPNAME: args.NVIM_APPNAME,
      },
      terminalDimensions: {
        cols: this.terminal.cols,
        rows: this.terminal.rows,
      },
      tabId: this.tabId,
    })

    void this.inputQueue.startProcessing()
    return testDirectory
  }

  public async runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
    return this.trpc.neovim.runBlockingShellCommand.mutate({ ...input, tabId: this.tabId })
  }

  public async runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput> {
    return this.trpc.neovim.runLuaCode.mutate({ ...input, tabId: this.tabId })
  }

  public async doFile(input: RunLuaFileClientInput): Promise<RunExCommandOutput> {
    return this.trpc.neovim.runExCommand.mutate({
      ...input,
      tabId: this.tabId,
      command: `lua dofile("${input.luaFile}")`,
    })
  }

  public async waitForLuaCode(input: PollLuaCodeClientInput): Promise<RunLuaCodeOutput> {
    return this.trpc.neovim.waitForLuaCode.mutate({ ...input, tabId: this.tabId })
  }

  public async runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput> {
    return this.trpc.neovim.runExCommand.mutate({ ...input, tabId: this.tabId })
  }
}

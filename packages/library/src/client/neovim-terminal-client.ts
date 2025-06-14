import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import type {
  ExCommandClientInput,
  LuaCodeClientInput,
  PollLuaCodeClientInput,
} from "../server/applications/neovim/neovimRouter.js"
import type { BlockingCommandClientInput } from "../server/blockingCommandInputSchema.js"
import type { AppRouter } from "../server/server.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../server/types.js"
import "./style.css"
import { getTabId, startTerminal } from "./websocket-client.js"

/** Manages the terminal state in the browser as well as the (browser's)
 * connection to the server side terminal application api. */
export class NeovimTerminalClient {
  private readonly ready: Promise<void>
  private readonly tabId: { tabId: string }
  private readonly terminal: Terminal
  private readonly trpc: ReturnType<typeof createTRPCClient<AppRouter>>

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

    const terminal = startTerminal(app, {
      onMouseEvent(data: string) {
        void trpc.neovim.sendStdin.mutate({ tabId, data }).catch((error: unknown) => {
          console.error(`Error sending mouse event`, error)
        })
      },
      onKeyPress(event) {
        void trpc.neovim.sendStdin.mutate({ tabId, data: event.key })
      },
    })
    this.terminal = terminal

    // start listening to Neovim stdout - this will take some (short) amount of
    // time to complete
    this.ready = new Promise<void>(resolve => {
      console.log("Subscribing to stdout")
      trpc.neovim.initializeStdout.subscribe(
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

  public async startNeovim(args: StartNeovimGenericArguments): Promise<TestDirectory> {
    await this.ready

    const testDirectory = await this.trpc.neovim.start.mutate({
      startNeovimArguments: {
        filename: args.filename,
        additionalEnvironmentVariables: args.additionalEnvironmentVariables,
        startupScriptModifications: args.startupScriptModifications,
        terminalDimensions: {
          cols: this.terminal.cols,
          rows: this.terminal.rows,
        },
      },
      tabId: this.tabId,
    })

    return testDirectory
  }

  public async runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput> {
    await this.ready
    return this.trpc.neovim.runBlockingShellCommand.mutate({ ...input, tabId: this.tabId })
  }

  public async runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput> {
    await this.ready
    return this.trpc.neovim.runLuaCode.mutate({ ...input, tabId: this.tabId })
  }

  public async waitForLuaCode(input: PollLuaCodeClientInput): Promise<RunLuaCodeOutput> {
    await this.ready
    try {
      return await this.trpc.neovim.waitForLuaCode.mutate({ ...input, tabId: this.tabId })
    } catch (e) {
      throw e
    }
  }

  public async runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput> {
    await this.ready
    return this.trpc.neovim.runExCommand.mutate({ ...input, tabId: this.tabId })
  }
}

import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client"
import type { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import type { AppRouter } from "../server/server.ts"
import type { StartNeovimGenericArguments, TestDirectory } from "../server/types.js"
import "./style.css"
import { getTabId, startTerminal } from "./websocket-client.js"

export class NeovimClient {
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
      console.log("Subscribing to Neovim stdout")
      trpc.neovim.onStdout.subscribe(
        { client: tabId },
        {
          onStarted() {
            resolve()
          },
          onData(data: string) {
            terminal.write(data)
          },
          onError(err: unknown) {
            console.error(`Error from Neovim`, err)
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
        terminalDimensions: {
          cols: this.terminal.cols,
          rows: this.terminal.rows,
        },
      },
      tabId: this.tabId,
    })

    return testDirectory
  }
}

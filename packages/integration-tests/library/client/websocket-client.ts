import { flavors } from "@catppuccin/palette"
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client"
import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import z from "zod"
import type { AppRouter } from "../../server/server.ts"
import type { StartNeovimArguments, TestDirectory } from "../server/types.ts"
import type { TabId } from "../server/utilities/tabId.ts"
import "./style.css"
import { validateMouseEvent } from "./validateMouseEvent"

export type StartTerminalOptions = {
  onMouseEvent: (data: string) => void
  onKeyPress: (event: { key: string; domEvent: KeyboardEvent }) => void
}
export function startTerminal(app: HTMLElement, options: StartTerminalOptions): Terminal {
  const terminal = new Terminal({
    cursorBlink: false,
    convertEol: true,
    fontSize: 13,
  })

  const colors = flavors.macchiato.colors
  terminal.options.theme = {
    background: colors.base.hex,
    black: colors.crust.hex,
    brightBlack: colors.surface2.hex,
    blue: colors.blue.hex,
    brightBlue: colors.blue.hex,
    brightCyan: colors.sky.hex,
    brightRed: colors.maroon.hex,
    brightYellow: colors.yellow.hex,
    cursor: colors.text.hex,
    cyan: colors.sky.hex,
    foreground: colors.text.hex,
    green: colors.green.hex,
    magenta: colors.lavender.hex,
    red: colors.red.hex,
    white: colors.text.hex,
    yellow: colors.yellow.hex,
  }

  // The FitAddon makes the terminal fit the size of the container, the entire
  // page in this case
  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(app)
  fitAddon.fit()

  window.addEventListener("resize", () => {
    fitAddon.fit()
  })

  terminal.onData(data => {
    data satisfies string
    // Send mouse clicks to the terminal application
    //
    // this gets called for mouse events. However, some mouse events seem to
    // confuse Neovim, so for now let's just send click events

    if (typeof data !== "string") {
      throw new Error(`unexpected onData message type: '${JSON.stringify(data)}'`)
    }

    const mouseEvent = validateMouseEvent(data)
    if (mouseEvent) {
      options.onMouseEvent(mouseEvent)
    }
  })

  terminal.onKey(event => {
    options.onKeyPress(event)
  })

  return terminal
}

/** An identifier unique to a browser tab, so that each tab can have its own
 * unique session that persists across page reloads. */
export function getTabId(): TabId {
  // Other tabs will have a different id because sessionStorage is unique to
  // each tab.
  let tabId = z.string().safeParse(sessionStorage.getItem("tabId")).data
  if (!tabId) {
    tabId = Math.random().toString(36)
    sessionStorage.setItem("tabId", tabId)
  }

  return { tabId }
}

export type TestPreparationResult = {
  terminal: Terminal
  startNeovim(startArgs?: StartNeovimArguments): Promise<TestDirectory>
}

export async function prepareClient(app: HTMLElement): Promise<TestPreparationResult> {
  const wsClient = createWSClient({ url: `ws://localhost:3000`, WebSocket })
  const trpc = createTRPCClient<AppRouter>({
    links: [wsLink({ client: wsClient })],
  })

  const tabId = getTabId()

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

  // start listening to Neovim stdout - this will take some (short) amount of
  // time to complete
  const ready = new Promise<void>(resolve => {
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

  return {
    terminal,
    async startNeovim(startArgs?: StartNeovimArguments): Promise<TestDirectory> {
      await ready
      const terminalDimensions = { cols: terminal.cols, rows: terminal.rows }
      const neovim = await trpc.neovim.start.mutate({
        tabId,
        filename: startArgs?.filename ?? "initial-file.txt",
        startupScriptModifications: startArgs?.startupScriptModifications,
        terminalDimensions,
      })

      return neovim.dir
    },
  }
}

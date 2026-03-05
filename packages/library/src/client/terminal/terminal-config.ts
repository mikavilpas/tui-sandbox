import type { Terminal } from "@xterm/xterm"
import type { TuiTerminalApi } from "../startTerminal.js"

/** DA1—Primary Device Attributes
 * In this DA exchange, the host asks for the terminal's architectural class and basic attributes.
 * https://vt100.net/docs/vt510-rm/DA1.html
 *
 * Terminal Response
 * The terminal responds by sending its architectural class and basic
 * attributes to the host. This response depends on the terminal's current
 * operating VT level.
 */
export function supportDA1(terminal: Terminal, api: TuiTerminalApi): void {
  // Register a CSI handler for the 'c' command (ESC [ c)
  terminal.parser.registerCsiHandler({ final: "c" }, () => {
    // Emit a fake DA1 response: ESC [ ? 1 ; 2 c
    api.onKeyPress({
      key: "\x1b" + ("[?1;2c" satisfies FakeDA1Response),
      domEvent: new KeyboardEvent("keydown", { key: "Escape" }),
    })
    return true // prevent default handling
  })
}

export type FakeDA1Response = "[?1;2c"

/** DSR—Device Status Report
 * The terminal application sends ESC[5n to ask "are you OK?"
 * The terminal responds with ESC[0n meaning "terminal ready, no malfunction."
 * https://vt100.net/docs/vt510-rm/DSR.html
 *
 * Neovim uses this during startup to detect terminal capabilities faster.
 * Without a DSR response, Neovim waits 100ms and logs a warning about slower
 * startup.
 */
export function supportDSR(terminal: Terminal, api: TuiTerminalApi): void {
  terminal.parser.registerCsiHandler({ final: "n" }, params => {
    if (params[0] === 5) {
      // Respond with ESC[0n (terminal OK)
      api.onKeyPress({
        key: "\x1b[0n",
        domEvent: new KeyboardEvent("keydown", { key: "Escape" }),
      })
      return true
    }
    return false // let other 'n' handlers run
  })
}

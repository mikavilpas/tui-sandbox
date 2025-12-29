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

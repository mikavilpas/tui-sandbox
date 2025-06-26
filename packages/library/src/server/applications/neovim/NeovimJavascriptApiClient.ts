import { access } from "fs/promises"
import type { NeovimClient as NeovimApiClient } from "neovim"
import { attach } from "neovim"
import { createLogger, format, transports } from "winston"
import { Lazy } from "../../utilities/Lazy.js"

// const log = debuglog("tui-sandbox.neovim.NeovimJavascriptApiClient")

export type NeovimJavascriptApiClient = NeovimApiClient

export type PollingInterval = 100

export function connectNeovimApi(socketPath: string): Lazy<Promise<NeovimJavascriptApiClient>> {
  // When a custom logger is provided to attach(), we can hide debug level log
  // messages
  //
  // https://github.com/neovim/node-client/blob/e0568e32e0fc8837ad900146bfd5ca27b9416235/README.md#logging
  const logger = createLogger({
    level: "warn",
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    ],
  })

  // it takes about 100ms for the socket file to be created - best make this
  // Lazy so that we don't wait for it unnecessarily.
  return new Lazy(async () => {
    for (let i = 0; i < 100; i++) {
      try {
        await access(socketPath)
        // log(`socket file ${socketPath} created after at attempt ${i + 1}`)
        break
      } catch (e) {
        // log(`polling for socket file ${socketPath} to be created (attempt ${i + 1})`)
        await new Promise(resolve => setTimeout(resolve, 100 satisfies PollingInterval))
      }
    }

    // Prevent neovim node client from monkey patching console.log. It runs in
    // a separate process entirely, so there doesn't seem to be any benefit to
    // this.
    process.env["ALLOW_CONSOLE"] = "1"

    return attach({
      socket: socketPath,
      options: {
        logger,
      },
    })
  })
}

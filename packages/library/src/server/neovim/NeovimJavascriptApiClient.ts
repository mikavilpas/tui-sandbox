import { access } from "fs/promises"
import type { NeovimClient as NeovimApiClient } from "neovim"
import { attach } from "neovim"
import { Lazy } from "../utilities/Lazy.js"

export type NeovimJavascriptApiClient = NeovimApiClient

export type PollingInterval = 100

export function connectNeovimApi(socketPath: string): Lazy<Promise<NeovimJavascriptApiClient>> {
  // it takes about 100ms for the socket file to be created - best make this
  // Lazy so that we don't wait for it unnecessarily.
  return new Lazy(async () => {
    for (let i = 0; i < 100; i++) {
      try {
        await access(socketPath)
        console.log(`socket file ${socketPath} created after at attempt ${i + 1}`)
        break
      } catch (e) {
        console.log(`polling for socket file ${socketPath} to be created (attempt ${i + 1})`)
        await new Promise(resolve => setTimeout(resolve, 100 satisfies PollingInterval))
      }
    }

    return attach({ socket: socketPath })
  })
}

import { once } from "events"
import { accessSync } from "fs"
import { createServer } from "http"
import path from "path"
import { fileURLToPath } from "url"
import { debuglog } from "util"

import type { AnyTRPCRouter } from "@trpc/server"
import { createHTTPHandler } from "@trpc/server/adapters/standalone"
import cors from "cors"
import type { RequestHandler } from "sirv"
import sirv from "sirv"

export type TestServerSettings = {
  port: number
}

const thisdir = path.dirname(fileURLToPath(import.meta.url))
const log = debuglog("tui-sandbox.TestServer")

export class TestServer {
  public constructor(private readonly settings: TestServerSettings) {}

  public async startAndRun(appRouter: AnyTRPCRouter): Promise<void> {
    log("🚀 Server starting")

    const trpcHandler = createHTTPHandler({
      router: appRouter,
      createContext: () => ({}),
      basePath: "/trpc/",
      middleware: cors({ origin: "*" }),
    })

    const publicPath = path.resolve(thisdir, "..", "..", "browser")
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    let serveStatic: RequestHandler = (_req, _res, next) => void next?.()

    try {
      accessSync(publicPath)
      serveStatic = sirv(publicPath, { single: true })
    } catch {
      // This is normal when developing the tui-sandbox library locally. It
      // should always exist when using it as an npm package, however.
      console.warn(`⚠️ Warning: Looks like the tui-sandbox root contents directory is not accessible at: ${publicPath}`)
    }

    const server = createServer((req, res) => {
      const url = req.url ?? "/"

      if (url.startsWith("/trpc/")) {
        trpcHandler(req, res)
        return
      }

      if (url === "/ping") {
        // used by the command-line test runner to see when the server is ready
        res.end("pong")
        return
      }

      serveStatic(req, res, () => {
        res.statusCode = 404
        res.end("Not Found")
      })
    })

    server.listen(this.settings.port, "0.0.0.0")

    console.info(`✅ Server listening on port ${this.settings.port}`)

    await Promise.race([once(process, "SIGTERM"), once(process, "SIGINT")])
    log("😴 Shutting down...")
    server.close(error => {
      if (error) {
        console.error("Error closing server", error)
        // oxlint-disable-next-line unicorn/no-process-exit
        process.exit(1)
      }
      log("Server closed")
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(0)
    })
  }
}

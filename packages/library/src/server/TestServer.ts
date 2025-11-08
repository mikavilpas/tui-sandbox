import type { AnyTRPCRouter } from "@trpc/server"
import * as trpcExpress from "@trpc/server/adapters/express"
import cors from "cors"
import { once } from "events"
import express from "express"
import { accessSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { debuglog } from "util"

export type TestServerSettings = {
  port: number
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const log = debuglog("tui-sandbox.TestServer")

export class TestServer {
  public constructor(private readonly settings: TestServerSettings) {}

  public async startAndRun(appRouter: AnyTRPCRouter): Promise<void> {
    log("🚀 Server starting")

    const app = express()
    app.use(
      "/trpc",
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: () => ({}),
        middleware: cors({
          origin: "*",
        }),
      })
    )

    {
      const publicPath = path.resolve(__dirname, "..", "..", "browser")
      try {
        accessSync(publicPath)
      } catch {
        // This is normal when developing the tui-sandbox library locally. It
        // should always exist when using it as an npm package, however.
        console.warn(
          `⚠️ Warning: Looks like the tui-sandbox root contents directory is not accessible at: ${publicPath}`
        )
      }

      // eslint-disable-next-line import-x/no-named-as-default-member
      app.use(express.static(publicPath))
    }

    app.use("/ping", (_, res) => {
      // used by the command-line test runner to see when the server is ready
      res.send("pong")
    })

    const server = app.listen(this.settings.port, "0.0.0.0")

    console.info(`✅ Server listening on port ${this.settings.port}`)

    await Promise.race([once(process, "SIGTERM"), once(process, "SIGINT")])
    log("😴 Shutting down...")
    server.close(error => {
      if (error) {
        console.error("Error closing server", error)
        process.exit(1)
      }
      log("Server closed")
      process.exit(0)
    })
  }
}

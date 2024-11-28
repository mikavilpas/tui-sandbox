import type { AnyTRPCRouter } from "@trpc/server"
import * as trpcExpress from "@trpc/server/adapters/express"
import cors from "cors"
import { once } from "events"
import express from "express"
import { accessSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

export type TestServerSettings = {
  port: number
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class TestServer {
  public constructor(private readonly settings: TestServerSettings) {}

  public async startAndRun(appRouter: AnyTRPCRouter): Promise<void> {
    console.log("🚀 Server starting")

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
      } catch (e) {
        // This is normal when developing the tui-sandbox library locally. It
        // should always exist when using it as an npm package, however.
        console.log(
          `⚠️ Warning: Looks like the tui-sandbox root contents directory is not accessible at: ${publicPath}`
        )
      }

      // eslint-disable-next-line import-x/no-named-as-default-member
      app.use(express.static(publicPath))
    }

    app.use("/ping", (_, res) => {
      // console.log("🏓 received /ping")
      res.send("pong")
    })

    const server = app.listen(this.settings.port, "0.0.0.0")

    server.on("connection", socket => {
      // const connectionInfo = `${socket.remoteAddress}:${socket.remotePort}`
      // console.log(`➕➕ Connection from ${connectionInfo}`)
      socket.once("close", () => {
        // console.log(`➖➖ Connection from ${connectionInfo}`)
      })
    })

    console.log(`✅ Server listening on port ${this.settings.port}`)

    await Promise.race([once(process, "SIGTERM"), once(process, "SIGINT")])
    console.log("😴 Shutting down...")
    server.close(error => {
      if (error) {
        console.error("Error closing server", error)
        process.exit(1)
      }
      console.log("Server closed")
      process.exit(0)
    })
  }
}

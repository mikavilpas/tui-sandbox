import type { AnyTRPCRouter } from "@trpc/server"
import { createHTTPServer } from "@trpc/server/adapters/standalone"
import "core-js/proposals/async-explicit-resource-management"
import cors from "cors"
import { once } from "events"
import type { TestServerConfig } from "./updateTestdirectorySchemaFile"
import { updateTestdirectorySchemaFile } from "./updateTestdirectorySchemaFile"

export class TestServer {
  public constructor(private readonly port: number) {}

  public async startAndRun(appRouter: AnyTRPCRouter, config: TestServerConfig): Promise<void> {
    console.log("🚀 Server starting")

    await updateTestdirectorySchemaFile(config)

    const server = createHTTPServer({
      router: appRouter,
      createContext: () => ({}),
      middleware: cors({
        origin: "*",
      }),
    })

    server.listen(this.port)
    server.on("connection", socket => {
      console.log(`➕➕ Connection`)
      socket.once("close", () => {
        console.log(`➖➖ Connection`)
      })
    })

    console.log(`✅ Server listening on ws://localhost:${this.port}`)

    await Promise.race([once(process, "SIGTERM"), once(process, "SIGINT")])
    console.log("Shutting down...")
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

import { defineConfig } from "cypress"
import { accessSync } from "fs"
import { readFile } from "fs/promises"
import { inspect } from "util"

export default defineConfig({
  e2e: {
    experimentalRunAllSpecs: true,
    baseUrl: `http://localhost:5173`,
    retries: {
      runMode: 2,
      openMode: 0,
    },

    setupNodeEvents(on, _config) {
      on("task", {
        async showLspLogFile({ logFilePath }: { logFilePath: string }): Promise<null> {
          accessSync(logFilePath) // throws if not accessible
          try {
            const log = await readFile(logFilePath, "utf-8")
            console.log(`${logFilePath}`, inspect(log.split("\n"), { maxArrayLength: null, colors: true }))
          } catch (err) {
            console.error(
              `Error reading log file at ${logFilePath}. Does the file exist? Is it accessible? ${err}`,
              err
            )
          }
          return null // something must be returned
        },
      })
    },
  },
})

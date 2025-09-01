import path from "path"
import { createCypressSupportFile } from "../../server/cypress-support/createCypressSupportFile.js"
import { startTestServer } from "../../server/server.js"
import type { TestServerConfig } from "../../server/updateTestdirectorySchemaFile.js"
import { updateTestdirectorySchemaFile } from "../../server/updateTestdirectorySchemaFile.js"
import { cwd } from "../tui.js"

export async function commandTuiStart(config: TestServerConfig): Promise<void> {
  await Promise.allSettled([updateSchemaFile(config), createSupportFile()])

  try {
    console.log(`🚀 Starting test server in ${cwd} - this should be the root of your integration-tests directory 🤞🏻`)
    await startTestServer(config)
  } catch (e) {
    console.error("Failed to startTestServer", e)
  }
}

async function updateSchemaFile(config: TestServerConfig): Promise<void> {
  try {
    await updateTestdirectorySchemaFile(config.directories)
  } catch (e) {
    console.error("Failed to updateTestdirectorySchemaFile", e)
  }
}

async function createSupportFile(): Promise<void> {
  try {
    await createCypressSupportFile({
      cypressSupportDirectoryPath: path.join(cwd, "cypress", "support"),
      supportFileName: "tui-sandbox.ts",
    })
  } catch (e) {
    console.error("Failed to createCypressSupportFile", e)
  }
}

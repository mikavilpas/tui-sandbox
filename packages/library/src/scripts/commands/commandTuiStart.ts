import path from "path"
import { createCypressSupportFile } from "../../server/cypress-support/createCypressSupportFile.js"
import { startTestServer } from "../../server/server.js"
import { updateTestdirectorySchemaFile } from "../../server/updateTestdirectorySchemaFile.js"
import { config, cwd } from "../tui.js"

export async function commandTuiStart(): Promise<void> {
  try {
    await createCypressSupportFile({
      cypressSupportDirectoryPath: path.join(cwd, "cypress", "support"),
      supportFileName: "tui-sandbox.ts",
    })
  } catch (e) {
    console.error("Failed to createCypressSupportFile", e)
  }

  try {
    await updateTestdirectorySchemaFile(config.directories)
  } catch (e) {
    console.error("Failed to updateTestdirectorySchemaFile", e)
  }

  try {
    console.log(`🚀 Starting test server in ${cwd} - this should be the root of your integration-tests directory 🤞🏻`)
    await startTestServer(config)
  } catch (e) {
    console.error("Failed to startTestServer", e)
  }
}

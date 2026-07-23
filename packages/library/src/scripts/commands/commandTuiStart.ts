import path from "path"

import { createCypressSupportFile } from "../../server/cypress-support/createCypressSupportFile.js"
import { startTestServer } from "../../server/server.js"
import type { TestServerConfig, TestServerConfigMetadata } from "../../server/updateTestdirectorySchemaFile.js"
import { updateTestdirectorySchemaFile } from "../../server/updateTestdirectorySchemaFile.js"

export async function commandTuiStart(cwd: string, config: TestServerConfigMetadata): Promise<void> {
  await updateGeneratedCode(cwd, config)

  try {
    console.log(`🚀 Starting test server in ${cwd} - this should be the root of your integration-tests directory 🤞🏻`)
    await startTestServer(config.config)
  } catch (e) {
    console.error("Failed to startTestServer", e)
  }
}

export async function updateGeneratedCode(cwd: string, config: TestServerConfigMetadata): Promise<void> {
  await Promise.allSettled([updateSchemaFile(config.config), createSupportFile(cwd, config.config)])
}

async function updateSchemaFile(config: TestServerConfig): Promise<void> {
  try {
    await updateTestdirectorySchemaFile(config)
  } catch (e) {
    console.error("Failed to updateTestdirectorySchemaFile", e)
  }
}

async function createSupportFile(cwd: string, config: TestServerConfig): Promise<void> {
  try {
    await createCypressSupportFile({
      config: config.formatter,
      cypressSupportDirectoryPath: path.join(cwd, "cypress", "support"),
      supportFileName: "tui-sandbox.ts",
    })
  } catch (e) {
    console.error("Failed to createCypressSupportFile", e)
  }
}

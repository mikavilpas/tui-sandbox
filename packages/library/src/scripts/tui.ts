import { stat } from "node:fs/promises"
import path from "node:path"
import { createCypressSupportFile } from "../server/cypress-support/createCypressSupportFile.js"
import type { TestServerConfig } from "../server/index.js"
import { startTestServer, updateTestdirectorySchemaFile } from "../server/index.js"

//
// This is the main entrypoint to tui-sandbox
//

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)

if (args[0] !== "start") {
  throw new Error(`Usage: tui start`)
}
const outputFileName = "MyTestDirectory.ts"

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
const cwd = process.cwd()
console.log(`🚀 Starting test server in ${cwd} - this should be the root of your integration-tests directory 🤞🏻`)
await stat(path.join(cwd, outputFileName))

try {
  const config = {
    testEnvironmentPath: path.join(cwd, "test-environment/"),
    outputFilePath: path.join(cwd, outputFileName),
  } satisfies TestServerConfig
  await createCypressSupportFile({
    cypressSupportDirectoryPath: path.join(cwd, "cypress", "support"),
    supportFileName: "tui-sandbox.ts",
  })
  await updateTestdirectorySchemaFile(config)
  await startTestServer(config)
} catch (e) {
  console.error(e)
}

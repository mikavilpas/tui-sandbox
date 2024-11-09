import { stat } from "node:fs/promises"
import path from "node:path"
import { startTestServer } from "../server/index.js"

//
// This is the main entrypoint to tui-sandbox
//

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)

if (args[0] !== "start") {
  throw new Error(`Usage: tui start`)
}

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
const cwd = process.cwd()
console.log(`🚀 Starting test server in ${cwd}`)
await stat(path.join(cwd, "MyTestDirectory.ts"))

try {
  await startTestServer({
    testEnvironmentPath: path.join(cwd, "test-environment/"),
    outputFilePath: path.join(cwd, "MyTestDirectory.ts"),
  })
} catch (e) {
  console.error(e)
}

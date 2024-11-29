import assert from "node:assert"
import { stat } from "node:fs/promises"
import path from "node:path"
import { createCypressSupportFile } from "../server/cypress-support/createCypressSupportFile.js"
import type { TestServerConfig } from "../server/index.js"
import { startTestServer, updateTestdirectorySchemaFile } from "../server/index.js"
import type { StdoutOrStderrMessage } from "../server/neovim/NeovimApplication.js"
import { NeovimApplication } from "../server/neovim/NeovimApplication.js"
import { prepareNewTestDirectory } from "../server/neovim/index.js"

//
// This is the main entrypoint to tui-sandbox
//

const outputFileName = "MyTestDirectory.ts"

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
const cwd = process.cwd()
const config = {
  testEnvironmentPath: path.join(cwd, "test-environment/"),
  outputFilePath: path.join(cwd, outputFileName),
} satisfies TestServerConfig

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)

if (args[0] === "neovim") {
  if (!(args[1] === "exec" && args.length === 3)) {
    showUsageAndExit()
  }

  const command = args[2]
  assert(command, "No command provided")

  {
    // automatically dispose of the neovim instance when done
    await using app = new NeovimApplication(config.testEnvironmentPath)
    app.events.on("stdout" satisfies StdoutOrStderrMessage, data => {
      console.log(`  neovim output: ${data}`)
    })
    const testDirectory = await prepareNewTestDirectory(config)
    await app.startNextAndKillCurrent(
      testDirectory,
      { filename: "empty.txt", headlessCmd: command },
      { cols: 80, rows: 24 }
    )
    await app.application.untilExit()
  }

  process.exit(0)
}

if (args[0] !== "start") {
  showUsageAndExit()
}
console.log(`🚀 Starting test server in ${cwd} - this should be the root of your integration-tests directory 🤞🏻`)
await stat(path.join(cwd, outputFileName))

try {
  await createCypressSupportFile({
    cypressSupportDirectoryPath: path.join(cwd, "cypress", "support"),
    supportFileName: "tui-sandbox.ts",
  })
  await updateTestdirectorySchemaFile(config)
  await startTestServer(config)
} catch (e) {
  console.error(e)
}

function showUsageAndExit() {
  console.log(
    [
      //
      `Usage (pick one):`,
      `    tui start`,
      `    tui neovim exec '<ex-command>'`,
    ].join("\n")
  )

  process.exit(1)
}

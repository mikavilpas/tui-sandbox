import assert from "node:assert"
import path from "node:path"
import { installDependencies } from "../server/applications/neovim/api.js"
import type { StdoutOrStderrMessage } from "../server/applications/neovim/NeovimApplication.js"
import { NeovimApplication } from "../server/applications/neovim/NeovimApplication.js"
import { prepareNewTestDirectory } from "../server/applications/neovim/prepareNewTestDirectory.js"
import { createCypressSupportFile } from "../server/cypress-support/createCypressSupportFile.js"
import type { TestServerConfig } from "../server/index.js"
import { startTestServer, updateTestdirectorySchemaFile } from "../server/index.js"

//
// This is the main entrypoint to tui-sandbox
//

const outputFileName = "MyTestDirectory.ts"

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
const cwd = process.cwd()
const config = {
  directories: {
    testEnvironmentPath: path.join(cwd, "test-environment/"),
    outputFilePath: path.join(cwd, outputFileName),
  },
  port: process.env["PORT"] ? parseInt(process.env["PORT"]) : 3000,
} satisfies TestServerConfig

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)

if (args[0] === "neovim") {
  if (args[1] === "prepare" && args.length === 2) {
    console.log("🚀 Installing neovim dependencies...")
    await installDependencies(config.directories.testEnvironmentPath, config.directories).catch((err: unknown) => {
      console.error("Error installing neovim dependencies", err)
      process.exit(1)
    })
    process.exit(0)
  }

  if (!(args[1] === "exec" && args.length === 3)) {
    showUsageAndExit()
  }

  const command = args[2]
  assert(command, "No command provided")

  {
    // automatically dispose of the neovim instance when done
    await using app = new NeovimApplication(config.directories.testEnvironmentPath)
    app.events.on("stdout" satisfies StdoutOrStderrMessage, data => {
      console.log(`  neovim output: ${data}`)
    })
    const testDirectory = await prepareNewTestDirectory(config.directories)
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
  await startTestServer(config)
} catch (e) {
  console.error("Failed to startTestServer", e)
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

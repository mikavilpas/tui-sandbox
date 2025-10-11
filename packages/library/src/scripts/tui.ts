import assert from "node:assert"
import type { TestServerConfigMetadata } from "../server/updateTestdirectorySchemaFile.js"
import type { TestResultExitCode } from "./commands/commandRun.js"
import { commandRun } from "./commands/commandRun.js"
import { commandTuiNeovimExec } from "./commands/commandTuiNeovimExec.js"
import { commandTuiNeovimPrepare } from "./commands/commandTuiNeovimPrepare.js"
import { commandTuiStart } from "./commands/commandTuiStart.js"
import { parseArguments } from "./parseArguments.js"
import { resolveTuiConfig } from "./resolveTuiConfig.js"

//
// This is the main entrypoint to tui-sandbox
//

const [major] = process.versions.node.split(".").map(Number)
assert(major)
assert(!isNaN(major))

if (major < 24) {
  console.error(`tui-sandbox error: Node.js >= 24.0.0 is required. You are using ${process.version}.`)
  process.exit(1)
}

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
export const cwd = process.cwd()
const configResult = await resolveTuiConfig(cwd)
if (configResult.error) {
  console.error(configResult.message, configResult.error)
  process.exit(1)
}

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)
const config: TestServerConfigMetadata = configResult.result
const command = await parseArguments(args)

switch (command?.action) {
  case "neovim prepare": {
    await commandTuiNeovimPrepare(config)
    break
  }
  case "neovim exec": {
    await commandTuiNeovimExec(command, config)
    break
  }
  case "start": {
    await commandTuiStart(config)
    break
  }
  case "run": {
    const result: TestResultExitCode = await commandRun()
    // important:
    //
    // This is what determines if the test run was successful or not.
    process.exitCode = typeof result === "number" ? result : 1
    break
  }
  default: {
    command satisfies undefined
    showUsageAndExit()
  }
}

function showUsageAndExit() {
  console.log(
    [
      //
      `Usage (pick one):`,
      `    tui start`,
      `    tui neovim exec '<ex-command>'`,
      `    tui neovim prepare`,
    ].join("\n")
  )

  process.exit(1)
}

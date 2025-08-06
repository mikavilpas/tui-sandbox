import path from "node:path"
import type { TestServerConfig } from "../server/index.js"
import { commandRun } from "./commands/commandRun.js"
import { commandTuiNeovimExec } from "./commands/commandTuiNeovimExec.js"
import { commandTuiNeovimPrepare } from "./commands/commandTuiNeovimPrepare.js"
import { commandTuiStart } from "./commands/commandTuiStart.js"
import { parseArguments } from "./parseArguments.js"

//
// This is the main entrypoint to tui-sandbox
//

const outputFileName = "MyTestDirectory.ts"

/** The cwd in the user's directory when they are running this script. Not the
 * cwd of the script itself. */
export const cwd = process.cwd()
export const config = {
  directories: {
    testEnvironmentPath: path.join(cwd, "test-environment/"),
    outputFilePath: path.join(cwd, outputFileName),
  },
  port: process.env["PORT"] ? parseInt(process.env["PORT"]) : 3000,
} satisfies TestServerConfig

// the arguments passed to this script start at index 2
const args = process.argv.slice(2)

const command = await parseArguments(args)

switch (command?.action) {
  case "neovim prepare": {
    await commandTuiNeovimPrepare()
    break
  }
  case "neovim exec": {
    await commandTuiNeovimExec(command)
    break
  }
  case "start": {
    await commandTuiStart()
    break
  }
  case "run": {
    await commandRun()
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

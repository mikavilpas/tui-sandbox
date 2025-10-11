import { NeovimApplication, type StdoutOrStderrMessage } from "../../server/applications/neovim/NeovimApplication.js"
import { prepareNewTestDirectory } from "../../server/applications/neovim/prepareNewTestDirectory.js"
import type { TestServerConfigMetadata } from "../../server/updateTestdirectorySchemaFile.js"
import type { NeovimExec } from "../parseArguments.js"

export async function commandTuiNeovimExec(command: NeovimExec, config: TestServerConfigMetadata): Promise<void> {
  // automatically dispose of the neovim instance when done
  await using app = new NeovimApplication(config.config.directories.testEnvironmentPath)
  app.events.on("stdout" satisfies StdoutOrStderrMessage, data => {
    console.log(`  neovim output: ${data}`)
  })
  const testDirectory = await prepareNewTestDirectory(config.config)
  await app.startNextAndKillCurrent(
    testDirectory,
    {
      filename: "empty.txt",
      headlessCmd: command.command,
      NVIM_APPNAME: process.env["NVIM_APPNAME"],
    },
    { cols: 80, rows: 24 }
  )
  await app.application.untilExit()
}

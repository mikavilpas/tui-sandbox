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
  const NVIM_APPNAME = process.env["NVIM_APPNAME"]

  if (NVIM_APPNAME && !config.config.integrations.neovim.NVIM_APPNAMEs.find(n => n === NVIM_APPNAME)) {
    process.exitCode = 1
    const message = `The NVIM_APPNAME environment variable is set to "${NVIM_APPNAME}", but only the following neovim configurations are known in the configuration file: ${JSON.stringify(
      config.config.integrations.neovim.NVIM_APPNAMEs
    )}. Please set NVIM_APPNAME to one of the configured names or unset it to use the default ("nvim"). Config file path: ${config.configFilePath}`

    console.error(message)

    return
  }

  await app.startNextAndKillCurrent(
    testDirectory,
    {
      filename: "empty.txt",
      headlessCmd: command.command,
      NVIM_APPNAME,
    },
    { cols: 80, rows: 24 }
  )
  await app.application.untilExit()
}

import { installDependencies } from "../../server/applications/neovim/api.js"
import { config } from "../tui.js"

export async function commandTuiNeovimPrepare(): Promise<void> {
  const NVIM_APPNAME = process.env["NVIM_APPNAME"]
  console.log(`🚀 Installing neovim dependencies${NVIM_APPNAME ? ` for NVIM_APPNAME=${NVIM_APPNAME}` : ""}...`)
  await installDependencies(
    config.directories.testEnvironmentPath,
    process.env["NVIM_APPNAME"],
    config.directories
  ).catch((err: unknown) => {
    console.error("Error installing neovim dependencies", err)
    process.exit(1)
  })
  process.exit(0)
}

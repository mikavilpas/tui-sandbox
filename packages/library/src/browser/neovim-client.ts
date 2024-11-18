import { TerminalClient } from "../client/index.js"
import type { BlockingCommandClientInput } from "../server/server.js"
import type { BlockingShellCommandOutput, StartNeovimGenericArguments, TestDirectory } from "../server/types.js"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const client = new TerminalClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimGenericArguments): Promise<TestDirectory> {
  const testDirectory = await client.startNeovim({
    additionalEnvironmentVariables: startArgs?.additionalEnvironmentVariables,
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
  })

  return testDirectory
}

window.runBlockingShellCommand = async function (
  input: BlockingCommandClientInput
): Promise<BlockingShellCommandOutput> {
  return client.runBlockingShellCommand(input)
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<TestDirectory>
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
  }
}

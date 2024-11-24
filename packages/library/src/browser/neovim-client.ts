import { TerminalClient } from "../client/index.js"
import type { BlockingCommandClientInput, ExCommandClientInput, LuaCodeClientInput } from "../server/server.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../server/types.js"

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

window.runLuaCode = async function (input: LuaCodeClientInput): Promise<RunLuaCodeOutput> {
  return client.runLuaCode(input)
}

window.runExCommand = async function (input: ExCommandClientInput): Promise<RunExCommandOutput> {
  return client.runExCommand(input)
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<TestDirectory>
    runBlockingShellCommand(input: BlockingCommandClientInput): Promise<BlockingShellCommandOutput>
    runLuaCode(input: LuaCodeClientInput): Promise<RunLuaCodeOutput>
    runExCommand(input: ExCommandClientInput): Promise<RunExCommandOutput>
  }
}

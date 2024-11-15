import assert from "assert"
import type { TestDirectory } from "../types.js"
import type { TestServerConfig } from "../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator.js"
import type { TabId } from "../utilities/tabId.js"
import { createTempDir, removeTestDirectories } from "./environment/createTempDir.js"
import type { StartNeovimGenericArguments, TerminalDimensions } from "./NeovimApplication.js"
import { NeovimApplication } from "./NeovimApplication.js"

const neovims = new Map<TabId["tabId"], NeovimApplication>()

export async function onStdout(
  options: { client: TabId },
  signal: AbortSignal | undefined,
  testEnvironmentPath: string
): Promise<AsyncGenerator<string, void, unknown>> {
  const tabId = options.client.tabId
  const neovim = neovims.get(tabId) ?? new NeovimApplication(testEnvironmentPath)
  if (neovims.get(tabId) === undefined) {
    neovims.set(tabId, neovim)
  }

  const stdout = convertEventEmitterToAsyncGenerator(neovim.events, "stdout")
  if (signal) {
    signal.addEventListener("abort", () => {
      void neovim[Symbol.asyncDispose]().finally(() => {
        neovims.delete(tabId)
      })
    })
  }

  return stdout
}

export async function start(
  options: StartNeovimGenericArguments,
  terminalDimensions: TerminalDimensions,
  tabId: TabId,
  config: TestServerConfig
): Promise<TestDirectory> {
  const neovim = neovims.get(tabId.tabId)
  assert(neovim, `Neovim instance not found for client id ${tabId.tabId}`)

  await removeTestDirectories(config.testEnvironmentPath)
  const testDirectory = await createTempDir(config)
  await neovim.startNextAndKillCurrent(testDirectory, options, terminalDimensions)

  return testDirectory
}

export async function sendStdin(options: { tabId: TabId; data: string }): Promise<void> {
  const neovim = neovims.get(options.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot send stdin. Maybe it's not started yet?`
  )
  assert(
    neovim.application,
    `Neovim application not found for client id ${options.tabId.tabId}. Maybe it's not started yet?`
  )

  await neovim.application.write(options.data)
}

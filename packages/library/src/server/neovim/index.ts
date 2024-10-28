import assert from "assert"
import type { TestDirectory } from "../types"
import type { TestServerConfig } from "../updateTestdirectorySchemaFile"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator"
import type { TabId } from "../utilities/tabId"
import { createTempDir } from "./environment/createTempDir"
import type { StartNeovimGenericArguments } from "./NeovimApplication"
import { NeovimApplication } from "./NeovimApplication"

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
  tabId: TabId,
  config: TestServerConfig
): Promise<TestDirectory> {
  const neovim = neovims.get(tabId.tabId)
  assert(neovim, `Neovim instance not found for client id ${tabId.tabId}`)

  const testDirectory = await createTempDir(config)
  await neovim.startNextAndKillCurrent(testDirectory, options)

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

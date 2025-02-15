import assert from "assert"
import "core-js/proposals/async-explicit-resource-management.js"
import type { TerminalDimensions } from "../neovim/NeovimApplication.js"
import { prepareNewTestDirectory } from "../neovim/prepareNewTestDirectory.js"
import type { DirectoriesConfig } from "../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator.js"
import { Lazy } from "../utilities/Lazy.js"
import type { TabId } from "../utilities/tabId.js"
import TerminalTestApplication from "./TerminalTestApplication.js"

const terminals = new Map<TabId["tabId"], TerminalTestApplication>()
const resources: Lazy<AsyncDisposableStack> = new Lazy(() => {
  return new AsyncDisposableStack()
})

export async function start(
  terminalDimensions: TerminalDimensions,
  commandToRun: string[],
  tabId: TabId,
  config: DirectoriesConfig
): Promise<void> {
  const app = terminals.get(tabId.tabId)
  assert(app, `Terminal with tabId ${tabId.tabId} not found.`)
  const testDirectory = await prepareNewTestDirectory(config)
  await app.startNextAndKillCurrent(testDirectory, { commandToRun }, terminalDimensions)
}

export async function initializeStdout(
  options: { client: TabId },
  signal: AbortSignal | undefined,
  testEnvironmentPath: string
): Promise<AsyncGenerator<string, void, unknown>> {
  const tabId = options.client.tabId
  const app = terminals.get(tabId) ?? new TerminalTestApplication(testEnvironmentPath)
  if (terminals.get(tabId) === undefined) {
    terminals.set(tabId, app)
    resources.get().adopt(app, async a => {
      await a[Symbol.asyncDispose]()
    })
  }

  const stdout = convertEventEmitterToAsyncGenerator(app.events, "stdout")
  signal?.addEventListener("abort", () => {
    void app[Symbol.asyncDispose]().finally(() => {
      terminals.delete(tabId)
    })
  })

  return stdout
}

export async function sendStdin(options: { tabId: TabId; data: string }): Promise<void> {
  const tabId = options.tabId.tabId
  const app = terminals.get(tabId)
  assert(app !== undefined, `Terminal instance for clientId not found - cannot send stdin. Maybe it's not started yet?`)
  assert(
    app.application,
    `Terminal application not found for client id ${options.tabId.tabId}. Maybe it's not started yet?`
  )

  await app.application.write(options.data)
}

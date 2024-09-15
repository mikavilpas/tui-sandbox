import type { Observable } from "@trpc/server/observable"
import { observable } from "@trpc/server/observable"
import assert from "assert"
import type { TestDirectory } from "../types"
import type { TestServerConfig } from "../updateTestdirectorySchemaFile"
import type { TabId } from "../utilities/tabId"
import { createTempDir } from "./environment/createTempDir"
import type { StartNeovimGenericArguments, StdoutMessage } from "./NeovimApplication"
import { NeovimApplication } from "./NeovimApplication"

const neovims = new Map<TabId["tabId"], NeovimApplication>()

export function onStdout(options: { client: TabId }, testEnvironmentPath: string): Observable<string, unknown> {
  return observable<string>(emit => {
    const tabId = options.client.tabId
    const neovim = neovims.get(tabId) ?? new NeovimApplication(testEnvironmentPath)
    if (neovims.get(tabId) === undefined) {
      neovims.set(tabId, neovim)
    }

    const send = (data: unknown) => {
      assert(typeof data === "string")
      emit.next(data)
    }

    neovim.events.on("stdout" satisfies StdoutMessage, send)

    return () => {
      neovim.events.off("stdout" satisfies StdoutMessage, send)
      void neovim[Symbol.asyncDispose]().finally(() => {
        neovims.delete(tabId)
      })
    }
  })
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

  const processId = neovim.processId()
  assert(processId !== undefined, "Neovim was started without a process ID. This is a bug - please open an issue.")
  console.log(`🚀 Started Neovim instance ${processId}`)

  return testDirectory
}

export async function sendStdin(options: { tabId: TabId; data: string }): Promise<void> {
  const neovim = neovims.get(options.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot send stdin. Maybe it's not started yet?`
  )

  await neovim.write(options.data)
}

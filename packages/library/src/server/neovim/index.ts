import assert from "assert"
import { exec } from "child_process"
import "core-js/proposals/async-explicit-resource-management.js"
import util from "util"
import type { BlockingCommandInput } from "../server.js"
import type { BlockingShellCommandOutput, StartNeovimGenericArguments, TestDirectory } from "../types.js"
import type { TestServerConfig } from "../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator.js"
import type { TabId } from "../utilities/tabId.js"
import { createTempDir, removeTestDirectories } from "./environment/createTempDir.js"
import type { TerminalDimensions } from "./NeovimApplication.js"
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

export async function runBlockingShellCommand(
  signal: AbortSignal | undefined,
  input: BlockingCommandInput
): Promise<BlockingShellCommandOutput> {
  const neovim = neovims.get(input.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot run blocking shell command. Maybe neovim's not started yet?`
  )
  const testDirectory = neovim.state?.testDirectory
  assert(testDirectory, `Test directory not found for client id ${input.tabId.tabId}. Maybe neovim's not started yet?`)

  const execPromise = util.promisify(exec)
  const env = neovim.getEnvironmentVariables(testDirectory, input.envOverrides)
  const processPromise = execPromise(input.command, {
    signal: signal,
    shell: input.shell,
    uid: input.uid,
    gid: input.gid,
    cwd: input.cwd ?? env["HOME"],
    env,
  })

  try {
    const result = await processPromise
    console.log(
      `Successfully ran shell blockingCommand (${input.command}) with stdout: ${result.stdout}, stderr: ${result.stderr}`
    )
    return {
      type: "success",
      stdout: result.stdout,
      stderr: result.stderr,
    } satisfies BlockingShellCommandOutput
  } catch (e) {
    console.warn(`Error running shell blockingCommand (${input.command})`, e)
    return {
      type: "failed",
    }
  }
}

import assert from "assert"
import { exec } from "child_process"
import "core-js/proposals/async-explicit-resource-management.js"
import util from "util"
import type { BlockingCommandInput, ExCommandInput, LuaCodeInput } from "../server.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../types.js"
import type { TestServerConfig } from "../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator.js"
import { Lazy } from "../utilities/Lazy.js"
import type { TabId } from "../utilities/tabId.js"
import { createTempDir, removeTestDirectories } from "./environment/createTempDir.js"
import type { TerminalDimensions } from "./NeovimApplication.js"
import { NeovimApplication } from "./NeovimApplication.js"

const neovims = new Map<TabId["tabId"], NeovimApplication>()
export const resources: Lazy<AsyncDisposableStack> = new Lazy(() => {
  return new AsyncDisposableStack()
})

export async function initializeStdout(
  options: { client: TabId },
  signal: AbortSignal | undefined,
  testEnvironmentPath: string
): Promise<AsyncGenerator<string, void, unknown>> {
  const tabId = options.client.tabId
  const neovim = neovims.get(tabId) ?? new NeovimApplication(testEnvironmentPath)
  if (neovims.get(tabId) === undefined) {
    neovims.set(tabId, neovim)
    resources.get().adopt(neovim, async n => {
      await n[Symbol.asyncDispose]()
    })
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

  const testDirectory = await prepareNewTestDirectory(config)
  await neovim.startNextAndKillCurrent(testDirectory, options, terminalDimensions)

  return testDirectory
}

export async function prepareNewTestDirectory(config: TestServerConfig): Promise<TestDirectory> {
  await removeTestDirectories(config.testEnvironmentPath)
  const testDirectory = await createTempDir(config)
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
  input: BlockingCommandInput,
  allowFailure: boolean
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
    if (allowFailure) {
      return {
        type: "failed",
      }
    }
    throw new Error(`Error running shell blockingCommand (${input.command})`, { cause: e })
  }
}

export async function runLuaCode(options: LuaCodeInput): Promise<RunLuaCodeOutput> {
  const neovim = neovims.get(options.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot run Lua code. Maybe neovim's not started yet?`
  )
  assert(
    neovim.application,
    `Neovim application not found for client id ${options.tabId.tabId}. Maybe it's not started yet?`
  )

  const api = await neovim.state?.client.get()
  if (!api) {
    throw new Error(`Neovim API not available for client id ${options.tabId.tabId}. Maybe it's not started yet?`)
  }

  console.log(`Neovim ${neovim.application.processId()} running Lua code: ${options.luaCode}`)
  try {
    const value = await api.lua(options.luaCode)
    return { value }
  } catch (e) {
    console.warn(`Error running Lua code: ${options.luaCode}`, e)
    throw new Error(`Error running Lua code: ${options.luaCode}`, { cause: e })
  }
}

export async function runExCommand(options: ExCommandInput): Promise<RunExCommandOutput> {
  const neovim = neovims.get(options.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot runExCommand. Maybe neovim's not started yet?`
  )
  assert(
    neovim.application,
    `Neovim application not found for client id ${options.tabId.tabId}. Maybe it's not started yet?`
  )

  const api = await neovim.state?.client.get()
  if (!api) {
    throw new Error(`Neovim API not available for client id ${options.tabId.tabId}. Maybe it's not started yet?`)
  }

  console.log(`Neovim ${neovim.application.processId()} running Ex command: ${options.command}`)
  try {
    const output = await api.commandOutput(options.command)
    return { value: output }
  } catch (e) {
    console.warn(`Error running Ex command: ${options.command}`, e)
    throw new Error(`Error running Ex command: ${options.command}`, { cause: e })
  }
}

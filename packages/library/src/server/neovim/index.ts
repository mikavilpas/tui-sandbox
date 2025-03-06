import assert from "assert"
import "core-js/proposals/async-explicit-resource-management.js"
import { access } from "fs/promises"
import path from "path"
import type { BlockingCommandInput } from "../blockingCommandInputSchema.js"
import type { ExCommandInput, LuaCodeInput } from "../server.js"
import { executeBlockingShellCommand } from "../terminal/runBlockingShellCommand.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../types.js"
import type { DirectoriesConfig } from "../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../utilities/generator.js"
import { Lazy } from "../utilities/Lazy.js"
import type { TabId } from "../utilities/tabId.js"
import { timeout } from "../utilities/timeout.js"
import type { StdoutOrStderrMessage, TerminalDimensions } from "./NeovimApplication.js"
import { NeovimApplication } from "./NeovimApplication.js"
import { prepareNewTestDirectory } from "./prepareNewTestDirectory.js"

const neovims = new Map<TabId["tabId"], NeovimApplication>()
const resources: Lazy<AsyncDisposableStack> = new Lazy(() => {
  return new AsyncDisposableStack()
})

export async function installDependencies(testEnvironmentPath: string, config: DirectoriesConfig): Promise<void> {
  await using app = new NeovimApplication(testEnvironmentPath)
  const testDirectory = await prepareNewTestDirectory(config)
  const prepareFilePath = path.join(testDirectory.rootPathAbsolute, ".config", "nvim", "prepare.lua")
  try {
    await access(prepareFilePath)
  } catch (e) {
    console.log(
      `Neovim prepareFilePath does not exist: ${prepareFilePath}. If you want to run a prepare script before starting the tests, create it.`
    )
    return
  }

  console.log(`🚀 Running Neovim prepareFilePath ${prepareFilePath}...`)

  let output = ""
  app.events.on("stdout" satisfies StdoutOrStderrMessage, data => {
    assert(data)
    assert(typeof data === "string")
    output += data
  })
  await app.startNextAndKillCurrent(
    testDirectory,
    { filename: "empty.txt", headlessCmd: `lua dofile("${prepareFilePath}")` },
    { cols: 80, rows: 24 }
  )
  await app.application.untilExit()
  console.log(`🚀 Neovim installDependencies output:`)
  console.log(output)
}

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
  config: DirectoriesConfig
): Promise<TestDirectory> {
  const neovim = neovims.get(tabId.tabId)
  assert(neovim, `Neovim instance not found for client id ${tabId.tabId}`)

  const testDirectory = await prepareNewTestDirectory(config)
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

  const env = neovim.getEnvironmentVariables(testDirectory, input.envOverrides)
  return executeBlockingShellCommand(testDirectory, input, signal, allowFailure, env)
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

export type PollLuaCodeInput = {
  luaAssertion: string
  tabId: TabId
}

export async function waitForLuaCode(
  options: PollLuaCodeInput,
  signal: AbortSignal | undefined
): Promise<RunLuaCodeOutput> {
  const neovim = neovims.get(options.tabId.tabId)
  assert(
    neovim !== undefined,
    `Neovim instance for clientId not found - cannot pollLuaCode. Maybe neovim's not started yet?`
  )
  assert(
    neovim.application,
    `Neovim application not found for client id ${options.tabId.tabId}. Maybe it's not started yet?`
  )

  const api = await neovim.state?.client.get()
  if (!api) {
    throw new Error(`Neovim API not available for client id ${options.tabId.tabId}. Maybe it's not started yet?`)
  }

  console.log(`Neovim ${neovim.application.processId()} polling Lua code: ${options.luaAssertion}`)

  let running: boolean = true
  signal?.addEventListener("abort", () => {
    console.log(`Polling Lua code: '${options.luaAssertion}' was aborted via signal`)
    running = false
  })

  const maxIterations = 100
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!running) {
      throw new Error(`Polling Lua code: '${options.luaAssertion}' was aborted after ${iteration} iterations`)
    }

    try {
      const value = await api.lua(options.luaAssertion)
      console.log(`Lua code assertion passed: ${options.luaAssertion} (iteration ${iteration})`)

      return { value }
    } catch (e) {
      console.error(`Caught error in iteration ${iteration}:`, e)
      await timeout(100)
    }
  }

  throw new Error(
    `Polling Lua code: '${options.luaAssertion}' always raised an error after ${maxIterations} iterations`
  )
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
    if (options.log) {
      console.log(`:${options.command} output: ${output}`)
    }
    return { value: output }
  } catch (e) {
    console.warn(`Error running Ex command: ${options.command}`, e)
    throw new Error(`Error running Ex command: ${options.command}`, { cause: e })
  }
}

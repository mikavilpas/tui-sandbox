import assert from "assert"
import { access } from "fs/promises"
import path from "path"
import { debuglog } from "util"
import type { BlockingCommandInput } from "../../blockingCommandInputSchema.js"
import type {
  BlockingShellCommandOutput,
  RunExCommandOutput,
  RunLuaCodeOutput,
  StartNeovimGenericArguments,
  TestDirectory,
} from "../../types.js"
import type { DirectoriesConfig } from "../../updateTestdirectorySchemaFile.js"
import { convertEventEmitterToAsyncGenerator } from "../../utilities/generator.js"
import { Lazy } from "../../utilities/Lazy.js"
import type { TabId } from "../../utilities/tabId.js"
import { timeout } from "../../utilities/timeout.js"
import { executeBlockingShellCommand } from "../terminal/runBlockingShellCommand.js"
import type { StdoutOrStderrMessage, TerminalDimensions } from "./NeovimApplication.js"
import { NeovimApplication } from "./NeovimApplication.js"
import type { ExCommandInput, LuaCodeInput } from "./neovimRouter.js"
import { prepareNewTestDirectory } from "./prepareNewTestDirectory.js"

const neovims = new Map<TabId["tabId"], NeovimApplication>()
const resources: Lazy<AsyncDisposableStack> = new Lazy(() => {
  return new AsyncDisposableStack()
})

const log = debuglog("tui-sandbox.neovim.api")

export async function installDependencies(testEnvironmentPath: string, config: DirectoriesConfig): Promise<void> {
  await using app = new NeovimApplication(testEnvironmentPath)
  const testDirectory = await prepareNewTestDirectory(config)
  const prepareFilePath = path.join(testDirectory.rootPathAbsolute, ".config", "nvim", "prepare.lua")
  try {
    await access(prepareFilePath)
  } catch (e) {
    // show the output here because it's typically shown in the console before
    // the tests start. It's also sensitive to outside changes.
    //
    // eslint-disable-next-line no-restricted-properties
    console.log(
      `Neovim prepareFilePath does not exist: ${prepareFilePath}. If you want to run a prepare script before starting the tests, create it.`
    )
    return
  }

  // eslint-disable-next-line no-restricted-properties
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
  // eslint-disable-next-line no-restricted-properties
  console.log(`🚀 Neovim installDependencies output:`)
  // eslint-disable-next-line no-restricted-properties
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

  log(`Neovim ${neovim.application.processId()} running Lua code: ${options.luaCode}`)
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

  log(`Neovim ${neovim.application.processId()} polling Lua code: ${options.luaAssertion}`)

  let running: boolean = true
  signal?.addEventListener("abort", () => {
    log(`Polling Lua code: '${options.luaAssertion}' was aborted via signal`)
    running = false
  })

  const failureMessages: string[] = []
  const reportFailure = () => {
    console.warn(
      `Polling Lua code: '${options.luaAssertion}' failed after ${maxIterations} iterations. Failure messages:`,
      new Set(failureMessages).values()
    )
  }

  const maxIterations = 100
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!running) {
      reportFailure()
      throw new Error(`Polling Lua code: '${options.luaAssertion}' was aborted after ${iteration} iterations`)
    }

    try {
      const value = await api.lua(options.luaAssertion)
      log(`Lua code assertion passed: ${options.luaAssertion} (iteration ${iteration})`)

      return { value }
    } catch (e) {
      failureMessages.push(`Caught error in iteration ${iteration}: ${String(e)}`)
      await timeout(100)
    }
  }

  reportFailure()
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

  log(`Neovim ${neovim.application.processId()} running Ex command: ${options.command}`)
  try {
    const output = await api.commandOutput(options.command)
    if (options.log) {
      console.info(`:${options.command} output: ${output}`)
    }
    return { value: output }
  } catch (e) {
    console.warn(`Error running Ex command: ${options.command}`, e)
    throw new Error(`Error running Ex command: ${options.command}`, { cause: e })
  }
}

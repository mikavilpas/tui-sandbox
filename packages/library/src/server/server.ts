import type { inferRouterInputs } from "@trpc/server"
import "core-js/proposals/async-explicit-resource-management.js"
import type { Except } from "type-fest"
import { z } from "zod"
import { trpc } from "./connection/trpc.js"
import * as neovim from "./neovim/index.js"
import * as terminal from "./terminal/index.js"
import { TestServer } from "./TestServer.js"
import type { DirectoriesConfig, TestServerConfig } from "./updateTestdirectorySchemaFile.js"
import { tabIdSchema } from "./utilities/tabId.js"

const blockingCommandInputSchema = z.object({
  command: z.string(),
  shell: z.string().optional(),
  tabId: tabIdSchema,
  allowFailure: z.boolean().optional(),

  // child_process.ProcessEnvOptions
  uid: z.number().optional(),
  gid: z.number().optional(),
  cwd: z.string().optional(),
  envOverrides: z.record(z.string()).optional(),
})

export type BlockingCommandClientInput = Except<BlockingCommandInput, "tabId">
export type BlockingCommandInput = z.infer<typeof blockingCommandInputSchema>

const luaCodeInputSchema = z.object({ tabId: tabIdSchema, luaCode: z.string() })
export type LuaCodeClientInput = Except<LuaCodeInput, "tabId">
export type LuaCodeInput = z.infer<typeof luaCodeInputSchema>

const exCommandInputSchema = z.object({
  tabId: tabIdSchema,
  command: z.string(),
  log: z.boolean().optional(),
})
export type ExCommandClientInput = Except<ExCommandInput, "tabId">
export type ExCommandInput = z.infer<typeof exCommandInputSchema>

/** @private */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createAppRouter(config: DirectoriesConfig) {
  const appRouter = trpc.router({
    terminal: trpc.router({
      onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
        return terminal.initializeStdout(options.input, options.signal, config.testEnvironmentPath)
      }),

      start: trpc.procedure
        .input(
          z.object({
            tabId: tabIdSchema,
            startTerminalArguments: z.object({
              commandToRun: z.array(z.string()),
              additionalEnvironmentVariables: z.record(z.string()).optional(),
              terminalDimensions: z.object({
                cols: z.number(),
                rows: z.number(),
              }),
            }),
          })
        )
        .mutation(options => {
          return terminal.start(
            options.input.startTerminalArguments.terminalDimensions,
            options.input.startTerminalArguments.commandToRun,
            options.input.tabId,
            config
          )
        }),

      sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
        return terminal.sendStdin(options.input)
      }),

      runBlockingShellCommand: trpc.procedure.input(blockingCommandInputSchema).mutation(async options => {
        return terminal.runBlockingShellCommand(options.signal, options.input, options.input.allowFailure ?? false)
      }),
    }),

    neovim: trpc.router({
      start: trpc.procedure
        .input(
          z.object({
            tabId: tabIdSchema,
            startNeovimArguments: z.object({
              filename: z.union([
                z.string(),
                z.object({
                  openInVerticalSplits: z.array(z.string()),
                }),
              ]),
              startupScriptModifications: z.array(z.string()).optional(),
              terminalDimensions: z.object({
                cols: z.number(),
                rows: z.number(),
              }),
              additionalEnvironmentVariables: z.record(z.string()).optional(),
            }),
          })
        )
        .mutation(options => {
          return neovim.start(
            options.input.startNeovimArguments,
            options.input.startNeovimArguments.terminalDimensions,
            options.input.tabId,
            config
          )
        }),
      onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
        return neovim.initializeStdout(options.input, options.signal, config.testEnvironmentPath)
      }),
      sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
        return neovim.sendStdin(options.input)
      }),

      runBlockingShellCommand: trpc.procedure.input(blockingCommandInputSchema).mutation(async options => {
        return neovim.runBlockingShellCommand(options.signal, options.input, options.input.allowFailure ?? false)
      }),

      runLuaCode: trpc.procedure.input(luaCodeInputSchema).mutation(options => {
        return neovim.runLuaCode(options.input)
      }),

      runExCommand: trpc.procedure.input(exCommandInputSchema).mutation(options => {
        return neovim.runExCommand(options.input)
      }),
    }),
  })

  return appRouter
}

export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>
export type RouterInput = inferRouterInputs<AppRouter>

export async function startTestServer(config: TestServerConfig): Promise<TestServer> {
  try {
    const testServer = new TestServer({
      port: config.port,
    })
    const appRouter = await createAppRouter(config.directories)

    const neovimTask: Promise<void> = neovim
      .installDependencies(config.directories.testEnvironmentPath, config.directories)
      .catch((err: unknown) => {
        console.error("Error installing neovim dependencies", err)
        // suppress the error because neovim is optional - other applications
        // can still be tested
      })

    const startServerTask = testServer.startAndRun(appRouter)

    await Promise.all([neovimTask, startServerTask])

    return testServer
  } catch (err: unknown) {
    console.error("Error starting test server", err)
    throw err
  }
}

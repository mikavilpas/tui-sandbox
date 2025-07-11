import type { Except } from "type-fest"
import { z } from "zod"
import { blockingCommandInputSchema } from "../../blockingCommandInputSchema.js"
import { trpc } from "../../connection/trpc.js"
import type { DirectoriesConfig } from "../../updateTestdirectorySchemaFile.js"
import { tabIdSchema } from "../../utilities/tabId.js"
import { timeoutable } from "../../utilities/timeoutable.js"
import * as neovim from "./api.js"

const luaCodeInputSchema = z.object({ tabId: tabIdSchema, luaCode: z.string() })
export type LuaCodeClientInput = Except<LuaCodeInput, "tabId">
export type LuaCodeInput = z.infer<typeof luaCodeInputSchema>

const pollLuaCodeInputSchema = z.object({
  tabId: tabIdSchema,
  luaAssertion: z.string(),
  timeoutMs: z.number().optional().default(10_000),
})
export type PollLuaCodeClientInput = Except<z.input<typeof pollLuaCodeInputSchema>, "tabId">

const exCommandInputSchema = z.object({
  tabId: tabIdSchema,
  command: z.string(),
  log: z.boolean().optional(),
})
export type ExCommandClientInput = Except<ExCommandInput, "tabId">
export type ExCommandInput = z.infer<typeof exCommandInputSchema>

// let trpc infer the type as that is what it is designed to do
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createNeovimRouter(config: DirectoriesConfig) {
  return trpc.router({
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
            additionalEnvironmentVariables: z.record(z.string(), z.string()).optional(),
            NVIM_APPNAME: z.string().optional().default("nvim"),
          }),
          terminalDimensions: z.object({
            cols: z.number(),
            rows: z.number(),
          }),
        })
      )
      .mutation(options => {
        return neovim.start(
          options.input.startNeovimArguments,
          options.input.terminalDimensions,
          options.input.tabId,
          config
        )
      }),
    onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
      return neovim.initializeStdout(options.input, options.signal, config.testEnvironmentPath)
    }),

    initializeStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
      return neovim.initializeStdout(options.input, options.signal, config.testEnvironmentPath)
    }),
    sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
      return neovim.sendStdin(options.input)
    }),

    runBlockingShellCommand: trpc.procedure.input(blockingCommandInputSchema).mutation(async options => {
      return neovim.runBlockingShellCommand(options.signal, options.input, options.input.allowFailure ?? false)
    }),

    runLuaCode: trpc.procedure.input(luaCodeInputSchema).mutation(options => {
      return timeoutable(10_000, neovim.runLuaCode(options.input))
    }),

    waitForLuaCode: trpc.procedure.input(pollLuaCodeInputSchema).mutation(async options => {
      const result = await timeoutable(options.input.timeoutMs, neovim.waitForLuaCode(options.input, options.signal))
      return result
    }),

    runExCommand: trpc.procedure.input(exCommandInputSchema).mutation(options => {
      return timeoutable(10_000, neovim.runExCommand(options.input))
    }),
  })
}

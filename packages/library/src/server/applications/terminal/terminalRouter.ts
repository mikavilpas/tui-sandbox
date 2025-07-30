import * as z from "zod"
import { blockingCommandInputSchema } from "../../blockingCommandInputSchema.js"
import { trpc } from "../../connection/trpc.js"
import type { DirectoriesConfig } from "../../updateTestdirectorySchemaFile.js"
import { tabIdSchema } from "../../utilities/tabId.js"
import * as terminal from "./api.js"

const startTerminalInputSchema = z.object({
  tabId: tabIdSchema,
  startTerminalArguments: z.object({
    commandToRun: z.array(z.string()),
    additionalEnvironmentVariables: z.record(z.string(), z.string()).optional(),
    terminalDimensions: z.object({
      cols: z.number(),
      rows: z.number(),
    }),
  }),
})
export type StartTerminalInput = z.infer<typeof startTerminalInputSchema>

// let trpc infer the type as that is what it is designed to do
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createTerminalRouter(config: DirectoriesConfig) {
  const terminalRouter = trpc.router({
    onStdout: trpc.procedure.input(z.object({ client: tabIdSchema })).subscription(options => {
      return terminal.initializeStdout(options.input, options.signal, config.testEnvironmentPath)
    }),

    start: trpc.procedure.input(startTerminalInputSchema).mutation(options => {
      return terminal.start(options.input, config)
    }),

    sendStdin: trpc.procedure.input(z.object({ tabId: tabIdSchema, data: z.string() })).mutation(options => {
      return terminal.sendStdin(options.input)
    }),

    runBlockingShellCommand: trpc.procedure.input(blockingCommandInputSchema).mutation(async options => {
      return terminal.runBlockingShellCommand(options.signal, options.input, options.input.allowFailure ?? false)
    }),
  })

  return terminalRouter
}

import type { Except } from "type-fest"
import * as z from "zod"
import { tabIdSchema } from "./utilities/tabId.js"

export const blockingCommandInputSchema = z
  .object({
    command: z.string(),
    shell: z.string().optional(),
    tabId: tabIdSchema,
    allowFailure: z.boolean().optional(),

    // absolute cwd
    cwd: z.string().optional(),
    cwdRelative: z.string().optional(),
    envOverrides: z.record(z.string(), z.string()).optional(),
    uid: z.number().optional(),
    gid: z.number().optional(),
  })
  .refine(
    data =>
      // disallow both cwd and cwdRelative
      !(data.cwd && data.cwdRelative),
    { message: "Both cwd and cwdRelative provided. Please provide either but not both at the same time." }
  )

export type BlockingCommandClientInput = Except<BlockingCommandInput, "tabId">
export type BlockingCommandInput = z.infer<typeof blockingCommandInputSchema>

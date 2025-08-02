import assert from "assert"
import * as z from "zod"

export const parseArguments = async (args: string[]): Promise<ParseArgumentsResult | undefined> => {
  {
    // tui neovim prepare
    const schema = z.tuple([z.literal("neovim"), z.literal("prepare")])
    const prepareArguments = schema.safeParse(args)
    if (prepareArguments.success) {
      return {
        action: "neovim prepare",
      }
    }
  }

  {
    // tui neovim exec <command> [<args>...]
    const schema = z.tuple([z.literal("neovim"), z.literal("exec"), z.string()])
    const execArguments = schema.safeParse(args)
    if (execArguments.success) {
      const command = execArguments.data.at(2)
      assert(command, "No command provided for neovim exec")
      return {
        action: "neovim exec",
        command,
      }
    }
  }

  {
    // tui start
    const schema = z.tuple([z.literal("start")])
    const result = schema.safeParse(args)
    if (result.success) {
      return {
        action: "start",
      }
    }
  }
}

export type ParseArgumentsResult =
  | { action: "neovim prepare" }
  | {
      action: "neovim exec"
      command: string
    }
  | { action: "start" }

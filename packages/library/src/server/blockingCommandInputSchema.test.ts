import { blockingCommandInputSchema, type BlockingCommandInput } from "./blockingCommandInputSchema.js"

describe("blockingCommandInputSchema", () => {
  it("allows either cwd or cwdRelative but not both", () => {
    // It doesn't make sense to have two sources of truth for the cwd.
    const fails = blockingCommandInputSchema.safeParse({
      command: "command",
      tabId: { tabId: "123" },
      cwd: "cwd",
      cwdRelative: "cwdRelative",
    } satisfies Partial<BlockingCommandInput>)

    expect(fails.error).toMatchInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "Both cwd and cwdRelative provided. Please provide either but not both at the same time.",
          "path": []
        }
      ]]
    `)
  })
})

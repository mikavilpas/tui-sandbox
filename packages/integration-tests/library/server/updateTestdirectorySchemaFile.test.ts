import { describe, expect, it } from "vitest"
import { updateTestdirectorySchemaFile } from "./updateTestdirectorySchemaFile"

describe("updateTestdirectorySchemaFile", () => {
  it("should update the schema file", async () => {
    await expect(updateTestdirectorySchemaFile()).resolves.not.toThrow()
  })
})

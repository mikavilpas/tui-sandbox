import { readFileSync, writeFileSync } from "fs"
import { buildTestDirectorySchema } from "./dirtree/index.js"
import type { UpdateTestdirectorySchemaFileResult } from "./updateTestdirectorySchemaFile.js"
import { updateTestdirectorySchemaFile } from "./updateTestdirectorySchemaFile.js"

vi.mock("fs")
vi.mock("./dirtree")
vi.spyOn(console, "log").mockImplementation(vi.fn())

const mock = {
  readFileSync: vi.mocked(readFileSync),
  writeFileSync: vi.mocked(writeFileSync),
  buildTestDirectorySchema: vi.mocked(buildTestDirectorySchema),
}

describe("when the schema has not changed", () => {
  it("does not write the file", async () => {
    mock.buildTestDirectorySchema.mockResolvedValue("schema")
    mock.readFileSync.mockImplementation(() => "schema")

    const result = await updateTestdirectorySchemaFile({
      testEnvironmentPath: "path",
      outputFilePath: "path",
    })

    expect(result).toBe("did-nothing" satisfies UpdateTestdirectorySchemaFileResult)
  })
})

describe("when the schema has changed", () => {
  it("writes the file", async () => {
    mock.buildTestDirectorySchema.mockResolvedValue("new schema")
    mock.readFileSync.mockImplementation(() => "old schema")

    const result = await updateTestdirectorySchemaFile({
      testEnvironmentPath: "path",
      outputFilePath: "path",
    })

    expect(result).toBe("updated" satisfies UpdateTestdirectorySchemaFileResult)
    expect(mock.writeFileSync).toHaveBeenCalledWith("path", "new schema")
  })
})

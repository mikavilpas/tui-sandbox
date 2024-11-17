import { readFileSync, writeFileSync } from "fs"
import { createCypressSupportFileContents } from "./contents.js"
import type { CreateCypressSupportFileResult } from "./createCypressSupportFile.js"
import { createCypressSupportFile } from "./createCypressSupportFile.js"

vi.mock("fs")
vi.mock("./contents.ts")

const mocked = {
  readFileSync: vi.mocked(readFileSync),
  writeFileSync: vi.mocked(writeFileSync),
  createCypressSupportFileContents: vi.mocked(createCypressSupportFileContents),
}

describe("createCypressSupportFileContents", () => {
  it("should update the file if the schema has changed", async () => {
    mocked.readFileSync.mockImplementationOnce(() => "")
    mocked.writeFileSync.mockImplementationOnce(() => {
      //
    })

    const result = await createCypressSupportFile({
      cypressSupportDirectoryPath: "cypress/support",
      supportFileName: "tui-sandbox.ts",
    })

    expect(result).toBe("updated" satisfies CreateCypressSupportFileResult)
  })

  it("should not update the file if the schema has not changed", async () => {
    mocked.readFileSync.mockImplementationOnce(() => "contents")
    mocked.writeFileSync.mockImplementationOnce(() => {
      //
    })
    mocked.createCypressSupportFileContents.mockImplementationOnce(async () => "contents")

    const result = await createCypressSupportFile({
      cypressSupportDirectoryPath: "cypress/support",
      supportFileName: "tui-sandbox.ts",
    })

    expect(result).toBe("did-nothing" satisfies CreateCypressSupportFileResult)
  })
})

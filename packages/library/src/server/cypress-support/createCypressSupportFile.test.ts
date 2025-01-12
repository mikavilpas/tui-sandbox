import { readFileSync, writeFileSync } from "fs"
import { mkdir, stat } from "fs/promises"
import { createCypressSupportFileContents } from "./contents.js"
import type { CreateCypressSupportFileResult } from "./createCypressSupportFile.js"
import { createCypressSupportFile } from "./createCypressSupportFile.js"

vi.mock("fs")
vi.mock("fs/promises")
vi.mock("./contents.ts")

const mocked = {
  readFileSync: vi.mocked(readFileSync),
  writeFileSync: vi.mocked(writeFileSync),
  createCypressSupportFileContents: vi.mocked(createCypressSupportFileContents),
  mkdir: vi.mocked(mkdir),
  stat: vi.mocked(stat),
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

  it("should create the config-modifications directory if it does not exist", async () => {
    // This directory is required to exist so that a type safe schema of the
    // neovimArguments can be built and used.
    mocked.readFileSync.mockImplementationOnce(() => "")
    mocked.writeFileSync.mockImplementationOnce(() => {
      //
    })
    mocked.createCypressSupportFileContents.mockImplementationOnce(async () => "contents")
    mocked.stat.mockRejectedValueOnce(new Error("ENOENT"))

    const result = await createCypressSupportFile({
      cypressSupportDirectoryPath: "cypress/support",
      supportFileName: "tui-sandbox.ts",
    })

    expect(result).toBe("updated" satisfies CreateCypressSupportFileResult)
    expect(mocked.mkdir).toHaveBeenCalledWith("cypress/support/config-modifications")
    expect(mocked.mkdir).toHaveBeenCalledTimes(1)
  })
})

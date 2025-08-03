import { rm } from "fs/promises"
import path from "path"
import { assert, describe, expect, it } from "vitest"
import { prepareNewTestDirectory } from "./prepareNewTestDirectory.js"

describe("prepareNewTestDirectory when the testEnvironmentPath does not exist", () => {
  it("should be able to create a new test directory", async () => {
    // this happens when starting a new project, and the directory structure
    // has not been created yet
    const testEnvironmentPath = "/tmp/test"
    const testDirectory = await prepareNewTestDirectory({
      outputFilePath: path.join(testEnvironmentPath, "foo.ts"),
      testEnvironmentPath,
    })

    try {
      expect(testDirectory.contents).toEqual({})
      expect(testDirectory.testEnvironmentPath).toEqual("/tmp/test")
    } finally {
      // for safety, only remove inside /tmp
      assert(testEnvironmentPath.startsWith("/tmp/"))
      await rm(testEnvironmentPath, { recursive: true })
    }
  })
})

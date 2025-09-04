import { rm } from "fs/promises"
import path from "path"
import type { PartialDeep } from "type-fest"
import { assert, describe, expect, it } from "vitest"
import { createDefaultConfig } from "../../config.js"
import type { TestServerConfig } from "../../updateTestdirectorySchemaFile.js"
import { prepareNewTestDirectory } from "./prepareNewTestDirectory.js"

describe("prepareNewTestDirectory when the testEnvironmentPath does not exist", () => {
  it("should be able to create a new test directory", async () => {
    // this happens when starting a new project, and the directory structure
    // has not been created yet
    const testEnvironmentPath = "/tmp/test"
    const testDirectory = await prepareNewTestDirectory({
      ...createDefaultConfig("cwd", {}),
      directories: {
        outputFilePath: path.join(testEnvironmentPath, "foo.ts"),
        testEnvironmentPath,
      },
    } satisfies PartialDeep<TestServerConfig>)

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

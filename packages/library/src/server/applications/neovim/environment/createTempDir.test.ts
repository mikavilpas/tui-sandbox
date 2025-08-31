import nodePath from "path"
import { expect, it, vi } from "vitest"
import type { TestDirsPath } from "./createTempDir.js"
import { createTempDir } from "./createTempDir.js"
import type { TestTempDirPrefix } from "./TempDirectory.js"
import { TempDirectory } from "./TempDirectory.js"

vi.spyOn(console, "log").mockImplementation(vi.fn())

it("should create a temp dir with no contents", async () => {
  // typically the user will want to have contents, but this should not be an error
  using dir = TempDirectory.create()
  const result = await createTempDir({
    testEnvironmentPath: dir.path,
    outputFilePath: nodePath.join(dir.path, "MyTestDirectory.ts"),
  })

  expect(result.contents).toEqual({})
  expect(result.testEnvironmentPath).toEqual(dir.path)
  expect(result.testEnvironmentPath.includes("test-temp-dir-" satisfies TestTempDirPrefix)).toBeTruthy()
  expect(result.testEnvironmentPathRelative.includes("testdirs" satisfies TestDirsPath)).toBeTruthy()
})

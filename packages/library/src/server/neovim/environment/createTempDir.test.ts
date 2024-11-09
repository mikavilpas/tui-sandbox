import fs, { rmdirSync } from "fs"
import nodePath from "path"
import { expect, it } from "vitest"
import type { TestDirsPath } from "./createTempDir.js"
import { createTempDir } from "./createTempDir.js"

vi.spyOn(console, "log").mockImplementation(vi.fn())

type TestTempDirPrefix = "test-temp-dir-"

class TempDirectory implements Disposable {
  constructor(public readonly path: string) {}

  public static create(): TempDirectory {
    const tmp = fs.mkdtempSync("test-temp-dir-" satisfies TestTempDirPrefix)
    return new TempDirectory(tmp)
  }

  [Symbol.dispose](): void {
    rmdirSync(this.path, { recursive: true })
  }
}

it("should create a temp dir with no contents", async () => {
  // typically the user will want to have contents, but this should not be an error
  await using dir = TempDirectory.create()
  const result = await createTempDir({
    testEnvironmentPath: dir.path,
    outputFilePath: nodePath.join(dir.path, "MyTestDirectory.ts"),
  })

  expect(result.contents).toEqual({})
  expect(result.testEnvironmentPath).toEqual(dir.path)
  expect(result.testEnvironmentPath.startsWith("test-temp-dir-" satisfies TestTempDirPrefix)).toBeTruthy()
  expect(result.testEnvironmentPathRelative.startsWith("testdirs" satisfies TestDirsPath)).toBeTruthy()
})

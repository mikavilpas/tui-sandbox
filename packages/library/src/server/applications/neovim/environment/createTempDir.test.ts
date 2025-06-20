import fs from "fs"
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
    const absolutePath = nodePath.resolve(tmp)
    return new TempDirectory(absolutePath)
  }

  [Symbol.dispose](): void {
    fs.rmdirSync(this.path, { recursive: true, maxRetries: 5 })
  }
}

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

// TODO
it("should recreate symlink to repo root with correct relative path in temp dir", async () => {
  using dir = TempDirectory.create()

  // Simulate repo structure: create original symlink pointing to repo root
  const symlinkDir = nodePath.join(dir.path, "symlink-test/a/b/c")
  fs.mkdirSync(symlinkDir, { recursive: true })

  const symlinkPath = nodePath.join(symlinkDir, "rename.yazi")
  const relativeRepoRoot = "../../../../../../.." // adjust if needed
  fs.symlinkSync(relativeRepoRoot, symlinkPath)

  // Run test helper
  const result = await createTempDir({
    testEnvironmentPath: dir.path,
    outputFilePath: nodePath.join(dir.path, "MyTestDirectory.ts"),
  })

  // Find copied symlink
  const copiedSymlinkPath = nodePath.join(result.testEnvironmentPath, "symlink-test/a/b/c/rename.yazi")

  // Ensure the copied symlink exists and still points to repo root from new location
  const copiedTarget = fs.readlinkSync(copiedSymlinkPath)
  const resolvedTarget = nodePath.resolve(nodePath.dirname(copiedSymlinkPath), copiedTarget)

  const repoRoot = nodePath.resolve(dir.path) // original dir is at repo root level
  expect(fs.existsSync(copiedSymlinkPath)).toBe(true)
  expect(fs.lstatSync(copiedSymlinkPath).isSymbolicLink()).toBe(true)
  expect(resolvedTarget).toEqual(repoRoot)
})

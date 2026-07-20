import fs from "fs"
import fsPromises from "fs/promises"
import nodePath from "path"

export type TestTempDirPrefix = "test-temp-dir-"

export class TempDirectory implements AsyncDisposable {
  private constructor(public readonly path: string) {}

  public static create(prefix: `${string}-` = "test-temp-dir-" satisfies TestTempDirPrefix): TempDirectory {
    const tmp = fs.mkdtempSync(prefix)
    const absolutePath = nodePath.resolve(tmp)
    return new TempDirectory(absolutePath)
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await fsPromises.rm(this.path, { recursive: true, force: true })
  }
}

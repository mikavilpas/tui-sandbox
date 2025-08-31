import fs from "fs"
import nodePath from "path"

export type TestTempDirPrefix = "test-temp-dir-"

export class TempDirectory implements Disposable {
  private constructor(public readonly path: string) {}

  public static create(): TempDirectory {
    const tmp = fs.mkdtempSync("test-temp-dir-" satisfies TestTempDirPrefix)
    const absolutePath = nodePath.resolve(tmp)
    return new TempDirectory(absolutePath)
  }

  [Symbol.dispose](): void {
    fs.rmdirSync(this.path, { recursive: true, maxRetries: 5 })
  }
}

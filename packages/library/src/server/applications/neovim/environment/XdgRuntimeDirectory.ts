import { mkdtemp, rm, symlink } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { debuglog } from "util"

const log = debuglog("tui-sandbox.XdgRuntimeDirectory")

export type XdgRuntimeDirPrefix = "tui-xdg-"

/**
 * A short-lived, uniquely named directory used as `$XDG_RUNTIME_DIR` for a
 * single application instance. Disposing it removes the directory (and anything
 * the application created inside it, such as sockets).
 *
 * It is created under the system temp directory. `$XDG_RUNTIME_DIR` holds Unix
 * domain sockets (for example yazi's DDS `.dds.sock`), and socket paths have a
 * hard OS length limit (~104 bytes on macOS, ~108 on Linux). The deep path of
 * a test directory easily exceeds it, which makes `bind()` fail with
 * `ENAMETOOLONG` so the socket silently never appears. Keeping this directory
 * shallow leaves room for the socket name the application appends.
 *
 * For discoverability while debugging, a `.xdg-runtime` symlink pointing at
 * {@link path} is also created inside the unique test directory. The symlink is
 * never used as `$XDG_RUNTIME_DIR` itself (that is always {@link path}, the
 * short one), so it does not affect the socket path length.
 */
export class XdgRuntimeDirectory implements AsyncDisposable {
  private constructor(
    public readonly path: string,
    public readonly symlinkPath: string
  ) {}

  public static async create(uniqueTestDirectory: string): Promise<XdgRuntimeDirectory> {
    const path = await mkdtemp(join(tmpdir(), "tui-xdg-" satisfies XdgRuntimeDirPrefix))

    // symlink it to the unique test directory for discoverability while
    // debugging
    const symlinkPath = join(uniqueTestDirectory, ".xdg-runtime")
    try {
      await symlink(path, symlinkPath, "junction")
    } catch (e) {
      // don't leak the temp directory if the symlink could not be created
      await rm(path, { recursive: true, force: true, maxRetries: 5 })
      throw e
    }

    return new XdgRuntimeDirectory(path, symlinkPath)
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    log(`Removing XDG_RUNTIME_DIR ${this.path}`)
    await rm(this.path, { recursive: true, force: true, maxRetries: 5 })

    log(`Removing XDG_RUNTIME_DIR symlink ${this.symlinkPath}`)
    await rm(this.symlinkPath, { force: true })
  }
}

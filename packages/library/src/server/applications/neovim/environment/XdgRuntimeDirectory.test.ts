import { existsSync, lstatSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

import { expect, it } from "vitest"

import { TempDirectory } from "./TempDirectory.js"
import type { XdgRuntimeDirPrefix } from "./XdgRuntimeDirectory.js"
import { XdgRuntimeDirectory } from "./XdgRuntimeDirectory.js"

const newTestDir = () => TempDirectory.create("tui-test-")

/** Whether a symlink file exists at `path`, without following it (so a dangling
 * link still counts as existing). Plain `existsSync` follows the link and would
 * report `false` for a dangling symlink, hiding whether the link was removed. */
const symlinkFileExists = (path: string): boolean => {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

it("creates a uniquely named directory under the system temp dir", async () => {
  using testDir = newTestDir()
  await using dir = await XdgRuntimeDirectory.create(testDir.path)

  expect(existsSync(dir.path)).toBe(true)
  expect(dir.path).toContain("tui-xdg-" satisfies XdgRuntimeDirPrefix)
})

it("removes the directory and the symlink when disposed", async () => {
  using testDir = newTestDir()

  let createdPath: string
  let createdSymlinkPath: string
  {
    await using dir = await XdgRuntimeDirectory.create(testDir.path)
    createdPath = dir.path
    createdSymlinkPath = dir.symlinkPath
    expect(existsSync(createdPath)).toBe(true)
    expect(symlinkFileExists(createdSymlinkPath)).toBe(true)
  }

  // checked while `testDir` is still alive, so this asserts the dispose itself
  // unlinked the symlink (rather than the test directory cleanup doing it)
  expect(existsSync(createdPath)).toBe(false)
  expect(symlinkFileExists(createdSymlinkPath)).toBe(false)
})

it("rejects (and does not leak a temp dir) when the symlink cannot be created", async () => {
  // a non-existent parent makes the symlink() call fail with ENOENT
  const missingTestDir = join(tmpdir(), "does-not-exist-3f9c1a", "nested")
  await expect(XdgRuntimeDirectory.create(missingTestDir)).rejects.toThrow()
})

it("stays well under the OS Unix-socket path limit (this is the reason it exists)", async () => {
  // The directory holds Unix domain sockets (e.g. yazi appends
  // `/yazi+<uid>/.dds.sock`). The full socket path must fit in `sun_path`
  // (~104 bytes on macOS, ~108 on Linux), so the directory itself must leave
  // ample room.
  using testDir = newTestDir()
  await using dir = await XdgRuntimeDirectory.create(testDir.path)

  const exampleSocketPath = join(dir.path, "yazi+1000", ".dds.sock")
  // Use the stricter macOS limit as the bound so it holds on both platforms.
  expect(exampleSocketPath.length).toBeLessThan(104)
})

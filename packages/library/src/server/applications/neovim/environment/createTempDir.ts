import assert from "assert"
import { execSync } from "child_process"
import { Type } from "dree"
import { constants, readdirSync, statSync } from "fs"
import { access, mkdir, mkdtemp } from "fs/promises"
import path from "path"
import { debuglog } from "util"
import { convertDree, getDirectoryTree } from "../../../dirtree/index.js"
import type { TestDirectory } from "../../../types.js"
import type { TestServerConfig } from "../../../updateTestdirectorySchemaFile.js"
import { updateTestdirectorySchemaFile } from "../../../updateTestdirectorySchemaFile.js"

const log = debuglog("tui-sandbox.createTempDir")

export async function createTempDir(config: TestServerConfig): Promise<TestDirectory> {
  try {
    // before calling this function, the testEnvironmentPath should already exist
    statSync(config.directories.testEnvironmentPath)
    const dir = await createUniqueDirectory(config.directories.testEnvironmentPath)

    readdirSync(config.directories.testEnvironmentPath).forEach(entry => {
      if (entry === ("testdirs" satisfies TestDirsPath)) return
      if (entry === ".repro") return

      execSync(`cp -R '${path.join(config.directories.testEnvironmentPath, entry)}' ${dir}/`)
    })
    log(`Created test directory at ${dir}`)

    const tree = convertDree(getDirectoryTree(dir).dree)
    assert(tree.type === Type.DIRECTORY)

    await updateTestdirectorySchemaFile(config)
    return {
      rootPathAbsolute: dir,
      contents: tree.contents,
      testEnvironmentPath: config.directories.testEnvironmentPath,
      testEnvironmentPathRelative: path.relative(config.directories.testEnvironmentPath, dir),
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}

export type TestDirsPath = "testdirs"

async function createUniqueDirectory(testEnvironmentPath: string): Promise<string> {
  const testdirs = path.join(testEnvironmentPath, "testdirs" satisfies TestDirsPath)
  try {
    await access(testdirs, constants.F_OK)
  } catch {
    await mkdir(testdirs)
  }
  const dir = await mkdtemp(path.join(testdirs, "dir-"))
  assert(typeof dir === "string")

  return dir
}

export async function removeTestDirectories(testEnvironmentPath: string): Promise<void> {
  try {
    const testdirs = path.join(testEnvironmentPath, "testdirs" satisfies TestDirsPath)
    await access(testdirs, constants.F_OK)
    execSync(`rm -rf ${testdirs}/*`)
  } catch (e) {
    console.debug("Could not remove test directories, maybe they don't exist yet", e)
  }
}

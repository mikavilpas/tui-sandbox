import assert from "assert"
import { execSync } from "child_process"
import { Type } from "dree"
import { constants, readdirSync, statSync } from "fs"
import { access, mkdir, mkdtemp } from "fs/promises"
import path from "path"
import { convertDree, getDirectoryTree } from "../../dirtree/index.js"
import type { TestDirectory } from "../../types.js"
import type { DirectoriesConfig } from "../../updateTestdirectorySchemaFile.js"
import { updateTestdirectorySchemaFile } from "../../updateTestdirectorySchemaFile.js"

export async function createTempDir(config: DirectoriesConfig): Promise<TestDirectory> {
  try {
    // before calling this function, the testEnvironmentPath should already exist
    statSync(config.testEnvironmentPath)
    const dir = await createUniqueDirectory(config.testEnvironmentPath)

    readdirSync(config.testEnvironmentPath).forEach(entry => {
      if (entry === ("testdirs" satisfies TestDirsPath)) return
      if (entry === ".repro") return

      execSync(`cp -a '${path.join(config.testEnvironmentPath, entry)}' ${dir}/`)
    })
    console.log(`Created test directory at ${dir}`)

    const tree = convertDree(getDirectoryTree(dir).dree)
    assert(tree.type === Type.DIRECTORY)

    await updateTestdirectorySchemaFile(config)
    return {
      rootPathAbsolute: dir,
      contents: tree.contents,
      testEnvironmentPath: config.testEnvironmentPath,
      testEnvironmentPathRelative: path.relative(config.testEnvironmentPath, dir),
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

import assert from "assert"
import { execSync } from "child_process"
import { Type } from "dree"
import { constants, readdirSync } from "fs"
import { access, mkdir, mkdtemp } from "fs/promises"
import path from "path"
import { convertDree, getDirectoryTree } from "../../dirtree"
import type { TestDirectory } from "../../types"
import { updateTestdirectorySchemaFile } from "../../updateTestdirectorySchemaFile"
import { NeovimApplication } from "../NeovimApplication"

export async function createTempDir(): Promise<TestDirectory> {
  try {
    const dir = await createUniqueDirectory()

    readdirSync(NeovimApplication.testEnvironmentDir).forEach(entry => {
      if (entry === "testdirs") return
      if (entry === ".repro") return

      execSync(`cp -a '${path.join(NeovimApplication.testEnvironmentDir, entry)}' ${dir}/`)
    })
    console.log(`Created test directory at ${dir}`)

    const tree = convertDree(getDirectoryTree(dir).dree)
    assert(tree.type === Type.DIRECTORY)

    await updateTestdirectorySchemaFile()
    return { rootPathAbsolute: dir, contents: tree.contents }
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function createUniqueDirectory(): Promise<string> {
  const testdirs = path.join(NeovimApplication.testEnvironmentDir, "testdirs")
  try {
    await access(testdirs, constants.F_OK)
  } catch {
    await mkdir(testdirs)
  }
  const dir = await mkdtemp(path.join(testdirs, "dir-"))
  assert(typeof dir === "string")

  return dir
}

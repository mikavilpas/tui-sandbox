import assert from "assert"
import { execSync } from "child_process"
import { Type } from "dree"
import { constants, readdirSync } from "fs"
import { access, mkdir, mkdtemp } from "fs/promises"
import path from "path"
import { convertDree, getDirectoryTree } from "../../../library/server/dirtree/index"
import type { TestDirectory } from "../../../library/server/types"
import { updateTestdirectorySchemaFile } from "../../../library/server/updateTestdirectorySchemaFile"
import { MyTestDirectorySchema } from "../../../MyTestDirectory"
import { NeovimTestDirectory } from "./NeovimTestEnvironment"

export async function createTempDir(): Promise<TestDirectory> {
  try {
    const dir = await createUniqueDirectory()

    readdirSync(NeovimTestDirectory.testEnvironmentDir).forEach(entry => {
      if (entry === "testdirs") return
      if (entry === ".repro") return

      execSync(`cp -a '${path.join(NeovimTestDirectory.testEnvironmentDir, entry)}' ${dir}/`)
    })
    console.log(`Created test directory at ${dir}`)

    const tree = convertDree(getDirectoryTree(dir).dree)
    assert(tree.type === Type.DIRECTORY)

    await updateTestdirectorySchemaFile()
    const contents = MyTestDirectorySchema.shape.contents.parse(tree.contents)
    return { rootPathAbsolute: dir, contents: contents }
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function createUniqueDirectory(): Promise<string> {
  const testdirs = path.join(NeovimTestDirectory.testEnvironmentDir, "testdirs")
  try {
    await access(testdirs, constants.F_OK)
  } catch {
    await mkdir(testdirs)
  }
  const dir = await mkdtemp(path.join(testdirs, "dir-"))
  assert(typeof dir === "string")

  return dir
}

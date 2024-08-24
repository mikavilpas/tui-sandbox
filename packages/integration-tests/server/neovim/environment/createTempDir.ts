import assert from "assert"
import { execSync } from "child_process"
import { Type } from "dree"
import { constants, readdirSync } from "fs"
import { access, mkdir, mkdtemp } from "fs/promises"
import path from "path"
import { buildTestDirectorySchema, convertDree, getDirectoryTree } from "../../../library/server/dirtree/index"
import type { TestDirectory } from "../../../library/server/types"
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

    const tree = convertDree(getDirectoryTree(dir))

    assert(tree.type === Type.DIRECTORY)
    const contents = MyTestDirectorySchema.shape.contents.safeParse(tree.contents)
    if (!contents.success) {
      await buildTestDirectorySchema(NeovimTestDirectory.testEnvironmentDir)
      throw new Error(
        `Failed to validate the test directory contents: ${contents.error.toString()}. Got ${JSON.stringify(tree, null, 2)}`
      )
    }
    return { rootPathAbsolute: dir, contents: contents.data }
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

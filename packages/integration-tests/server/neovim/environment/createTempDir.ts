import assert from 'assert'
import { execSync } from 'child_process'
import { constants, readdirSync } from 'fs'
import { access, mkdir, mkdtemp } from 'fs/promises'
import type { MyTestDirectoryType } from 'MyTestDirectory'
import path from 'path'
import { NeovimTestDirectory } from './NeovimTestEnvironment'

export async function createTempDir(): Promise<MyTestDirectoryType> {
  try {
    const dir = await createUniqueDirectory()

    readdirSync(NeovimTestDirectory.testEnvironmentDir).forEach(entry => {
      if (entry === 'testdirs') return
      if (entry === '.repro') return

      execSync(`cp -a ${path.join(NeovimTestDirectory.testEnvironmentDir, entry)} ${dir}/`)
    })
    console.log(`Created test directory at ${dir}`)

    return directory
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function createUniqueDirectory(): Promise<string> {
  const testdirs = path.join(NeovimTestDirectory.testEnvironmentDir, 'testdirs')
  try {
    await access(testdirs, constants.F_OK)
  } catch {
    await mkdir(testdirs)
  }
  const dir = await mkdtemp(path.join(testdirs, 'dir-'))
  assert(typeof dir === 'string')

  return dir
}

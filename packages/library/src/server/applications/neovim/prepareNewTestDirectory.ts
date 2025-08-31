import { access, mkdir } from "fs/promises"
import { debuglog } from "util"
import type { TestDirectory } from "../../types.js"
import type { TestServerConfig } from "../../updateTestdirectorySchemaFile.js"
import { createTempDir, removeTestDirectories } from "./environment/createTempDir.js"

const log = debuglog("tui-sandbox.neovim.prepareNewTestDirectory")

export async function prepareNewTestDirectory(config: TestServerConfig): Promise<TestDirectory> {
  try {
    // if the directory does not exist, create it
    await access(config.directories.testEnvironmentPath)
  } catch {
    log(`Creating testEnvironmentPath directory at ${config.directories.testEnvironmentPath}`)
    await mkdir(config.directories.testEnvironmentPath, { recursive: true })
  }

  await removeTestDirectories(config.directories.testEnvironmentPath)
  const testDirectory = await createTempDir(config)
  return testDirectory
}

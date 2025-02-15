import { access, mkdir } from "fs/promises"
import type { TestDirectory } from "../types.js"
import type { DirectoriesConfig } from "../updateTestdirectorySchemaFile.js"
import { createTempDir, removeTestDirectories } from "./environment/createTempDir.js"

export async function prepareNewTestDirectory(config: DirectoriesConfig): Promise<TestDirectory> {
  try {
    // if the directory does not exist, create it
    await access(config.testEnvironmentPath)
  } catch {
    console.log(`Creating testEnvironmentPath directory at ${config.testEnvironmentPath}`)
    await mkdir(config.testEnvironmentPath, { recursive: true })
  }

  await removeTestDirectories(config.testEnvironmentPath)
  const testDirectory = await createTempDir(config)
  return testDirectory
}

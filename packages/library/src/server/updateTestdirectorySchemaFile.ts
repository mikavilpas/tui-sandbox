import "core-js/proposals/async-explicit-resource-management"
import { readFileSync, writeFileSync } from "fs"
import { buildTestDirectorySchema } from "./dirtree"

export type TestServerConfig = {
  testEnvironmentPath: string
  outputFilePath: string
}

export async function updateTestdirectorySchemaFile({
  testEnvironmentPath,
  outputFilePath,
}: TestServerConfig): Promise<void> {
  const newSchema = await buildTestDirectorySchema(testEnvironmentPath)
  const oldSchema = readFileSync(outputFilePath, "utf-8")

  if (oldSchema !== newSchema) {
    // it's important to not write the file if the schema hasn't changed
    // because file watchers will trigger on file changes and we don't want to
    // trigger a build if the schema hasn't changed
    writeFileSync(outputFilePath, newSchema)
  }
}

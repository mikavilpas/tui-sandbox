import { readFileSync, writeFileSync } from "fs"
import { debuglog } from "util"
import { buildTestDirectorySchema } from "./dirtree/index.js"

const log = debuglog("tui-sandbox.updateTestdirectorySchemaFile")

export type DirectoriesConfig = {
  testEnvironmentPath: string
  outputFilePath: string
}

export type TestServerConfig = {
  directories: DirectoriesConfig
  port: number
}

export type UpdateTestdirectorySchemaFileResult = "updated" | "did-nothing"

export async function updateTestdirectorySchemaFile({
  testEnvironmentPath,
  outputFilePath,
}: DirectoriesConfig): Promise<UpdateTestdirectorySchemaFileResult> {
  const newSchema: string = await buildTestDirectorySchema(testEnvironmentPath)
  let oldSchema = ""

  try {
    oldSchema = readFileSync(outputFilePath, "utf-8")
  } catch (error) {
    log("No existing schema file found, creating a new one")
  }

  if (oldSchema !== newSchema) {
    // it's important to not write the file if the schema hasn't changed
    // because file watchers will trigger on file changes and we don't want to
    // trigger a build if the schema hasn't changed
    writeFileSync(outputFilePath, newSchema)
    return "updated"
  } else {
    return "did-nothing"
  }
}

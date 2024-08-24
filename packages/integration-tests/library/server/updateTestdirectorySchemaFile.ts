import "core-js/proposals/async-explicit-resource-management"
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { buildTestDirectorySchema } from "./dirtree"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export async function updateTestdirectorySchemaFile(): Promise<void> {
  const testEnvironmentPath = path.join(__dirname, "..", "..", "test-environment")
  const newSchema = await buildTestDirectorySchema(testEnvironmentPath)
  const oldSchema = readFileSync(path.join(__dirname, "..", "..", "MyTestDirectory.ts"), "utf-8")

  if (oldSchema !== newSchema) {
    const filePath = path.join(__dirname, "..", "..", "MyTestDirectory.ts")
    writeFileSync(filePath, newSchema)
  }
}

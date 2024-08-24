import "core-js/proposals/async-explicit-resource-management"
import { writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { buildTestDirectorySchema } from "./dirtree"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export async function updateTestdirectorySchemaFile(): Promise<void> {
  const testEnvironmentPath = path.join(__dirname, "..", "..", "test-environment")
  const schema = await buildTestDirectorySchema(testEnvironmentPath)
  writeFileSync(path.join(__dirname, "..", "..", "MyTestDirectory.ts"), schema)
}

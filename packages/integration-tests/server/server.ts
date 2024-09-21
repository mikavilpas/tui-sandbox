import { startTestServer } from "@tui-sandbox/library/src/server/server"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await startTestServer({
  testEnvironmentPath: path.join(__dirname, "..", "test-environment/"),
  outputFilePath: path.join(__dirname, "..", "MyTestDirectory.ts"),
})

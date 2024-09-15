import path from "node:path"
import { fileURLToPath } from "node:url"
import { startTestServer } from "../../library/src/server/server"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await startTestServer({
  testEnvironmentPath: path.join(__dirname, "..", "test-environment/"),
  outputFilePath: path.join(__dirname, "..", "MyTestDirectory.ts"),
})

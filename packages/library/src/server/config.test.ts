import { createDefaultConfig } from "./config.js"
import { testServerConfigSchema } from "./updateTestdirectorySchemaFile.js"

it("is possible not to customize anything", () => {
  const defaultConfig = createDefaultConfig(process.cwd(), process.env)
  testServerConfigSchema.parse(defaultConfig)
})

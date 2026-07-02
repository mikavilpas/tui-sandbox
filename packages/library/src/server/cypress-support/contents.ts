import { readFileSync } from "fs"
import { createRequire } from "module"

import type { FormatterConfig } from "../updateTestdirectorySchemaFile.js"
import { formatCode } from "../utilities/format.js"

const require = createRequire(import.meta.url)

export async function createCypressSupportFileContents(config: FormatterConfig): Promise<string> {
  const templatePath = require.resolve("#tui-sandbox-template")
  let text = readFileSync(templatePath, "utf-8")

  text = await formatCode(config, text)

  return text
}

import { readFileSync } from "fs"
import { createRequire } from "module"
import { format, resolveConfig } from "prettier"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const require = createRequire(import.meta.url)

export async function createCypressSupportFileContents(): Promise<string> {
  const templatePath = require.resolve("#tui-sandbox-template")
  let text = readFileSync(templatePath, "utf-8")

  const options = await resolveConfig(__filename)
  text = await format(text, { ...options, parser: "typescript" })

  return text
}

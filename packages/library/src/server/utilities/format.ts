import { fileURLToPath } from "node:url"

import type { FormatterConfig } from "../updateTestdirectorySchemaFile.js"

const __filename = fileURLToPath(import.meta.url)

export const formatCode = async (config: FormatterConfig, code: string): Promise<string> => {
  config.use satisfies "prettier"
  const { format, resolveConfig } = await import("prettier")
  const prettierConfig = await resolveConfig(__filename)

  return format(code, {
    ...prettierConfig,
    parser: "typescript",
  })
}

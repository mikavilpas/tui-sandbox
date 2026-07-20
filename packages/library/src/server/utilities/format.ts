import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as z from "zod"

import type { FormatterConfig } from "../updateTestdirectorySchemaFile.js"

const __filename = fileURLToPath(import.meta.url)
const require = createRequire(import.meta.url)
export const isTypeScriptPath = (filePath: string): filePath is `${string}.ts` => filePath.endsWith(".ts")

export const formatCode = async (
  config: FormatterConfig,
  code: string,
  // oxfmt selects its parser from the file name's extension, and (via the CLI)
  // resolves its config by walking up from the file's directory.
  fileName: `${string}.ts` = "generated.ts",
): Promise<string> => {
  if (config.use === "prettier") {
    const { format, resolveConfig } = await import("prettier")
    const prettierConfig = await resolveConfig(__filename)

    return format(code, {
      ...prettierConfig,
      parser: "typescript",
    })
  }

  config.use satisfies "oxfmt"
  return formatWithOxfmt(code, fileName)
}
const oxfmtPackageJsonSchema = z.object({ bin: z.object({ oxfmt: z.string() }) })

const resolveOxfmtCliPath = (): string => {
  const packageJsonPath = require.resolve("oxfmt/package.json")
  const contents: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  const packageJson = oxfmtPackageJsonSchema.parse(contents)
  return path.join(path.dirname(packageJsonPath), packageJson.bin.oxfmt)
}

const formatWithOxfmt = (code: string, fileName: string): Promise<string> => {
  const oxfmtCliPath = resolveOxfmtCliPath()

  return new Promise<string>((resolve, reject) => {
    // oxfmt discovers config by walking up from the --stdin-filepath directory,
    // reads the source from stdin, and writes the formatted result to stdout.
    const child = spawn(process.execPath, [oxfmtCliPath, `--stdin-filepath=${fileName}`])

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", chunk => (stdout += String(chunk)))
    child.stderr.on("data", chunk => (stderr += String(chunk)))
    child.on("error", reject)
    child.on("close", exitCode => {
      if (exitCode === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Error formatting code with oxfmt (exit code ${String(exitCode)}): ${stderr.trim()}`))
      }
    })

    // guard against EPIPE if oxfmt exits before consuming all of stdin
    child.stdin.on("error", reject)
    child.stdin.end(code)
  })
}

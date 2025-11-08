import { readFileSync, writeFileSync } from "fs"
import { debuglog } from "util"
import * as z from "zod"
import { buildTestDirectorySchema } from "./dirtree/index.js"

const log = debuglog(`tui-sandbox.${updateTestdirectorySchemaFile.name}`)

export type DirectoriesConfig = TestServerConfig["directories"]

export type TestServerConfig = z.output<typeof testServerConfigSchema>

export type TestServerConfigMetadata = {
  configFilePath: string
  config: TestServerConfig
}

export type Dictionary = Record<string, string>

export type CustomizeEnv = (env: Dictionary) => Promise<Dictionary>

export type CustomizeMiseEnvironmentVariables = (
  env: Dictionary,
  defaultImplementation: CustomizeEnv
) => Promise<Record<string, string>>

export type NeovimIntegrationDefaultAppName = "nvim"
const neovimIntegration = z.strictObject({
  NVIM_APPNAMEs: z
    .array(z.string())
    .min(1)
    .default(["nvim" satisfies NeovimIntegrationDefaultAppName]),
})

export type NeovimIntegrationConfig = z.output<typeof neovimIntegration>

export const testServerConfigSchema = z.strictObject({
  directories: z.object({
    testEnvironmentPath: z.string(),
    outputFilePath: z.string(),
    latestSymlinkName: z.string().optional().default("latest"),
  }),
  port: z.number().int().min(1).max(65535),
  integrations: z.strictObject({
    neovim: neovimIntegration,
  }),
})

export type UpdateTestdirectorySchemaFileResult = "updated" | "did-nothing"

export async function updateTestdirectorySchemaFile(
  config: TestServerConfig
): Promise<UpdateTestdirectorySchemaFileResult> {
  const newSchema: string = await buildTestDirectorySchema(config)
  let oldSchema = ""

  try {
    oldSchema = readFileSync(config.directories.outputFilePath, "utf-8")
  } catch {
    log("No existing schema file found, creating a new one")
  }

  if (oldSchema !== newSchema) {
    // it's important to not write the file if the schema hasn't changed
    // because file watchers will trigger on file changes and we don't want to
    // trigger a build if the schema hasn't changed
    writeFileSync(config.directories.outputFilePath, newSchema)
    return "updated"
  } else {
    return "did-nothing"
  }
}

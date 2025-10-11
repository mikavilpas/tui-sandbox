import assert from "assert"
import { resolve } from "path/posix"
import { pathToFileURL } from "url"
import { debuglog } from "util"
import * as z from "zod"
import { createDefaultConfig } from "../server/config.js"
import { testServerConfigSchema, type TestServerConfigMetadata } from "../server/updateTestdirectorySchemaFile.js"

const log = debuglog("tui-sandbox.resolveConfig")

export type ResolveTuiConfigResultSuccess = {
  id: "default-config" | "custom-config" | "no-config-found"
  result: TestServerConfigMetadata
  error?: never
}
export type ResolveTuiConfigResultError = {
  error: object
  configFilePath: string
  message: string
}

export type ResolveTuiConfigResult = ResolveTuiConfigResultSuccess | ResolveTuiConfigResultError

export const resolveTuiConfig = async (cwd: string): Promise<ResolveTuiConfigResult> => {
  const defaultConfig = createDefaultConfig(cwd, process.env)

  const url = pathToFileURL(resolve(cwd, "tui-sandbox.config.ts"))

  let file: unknown
  try {
    // loading typescript files works when using https://tsx.is/
    file = await import(url.href)
    log(`Found configuration file in ${url.pathname}:`, JSON.stringify(file, null, 2))
  } catch (e) {
    console.log("Using the default configuration.")
    log("Config load error:", e)

    return {
      id: "no-config-found",
      result: {
        config: defaultConfig,
        configFilePath: url.pathname,
      },
    }
  }

  assert(file)
  const customConfigSchema = z.strictObject({ config: testServerConfigSchema })
  const customConfig = customConfigSchema.safeParse(file)
  if (customConfig.success) {
    return {
      id: "custom-config",
      result: {
        config: customConfig.data.config,
        configFilePath: url.pathname,
      },
    }
  } else {
    return {
      error: z.treeifyError(customConfig.error),
      configFilePath: url.pathname,
      message: `Issues found in the config file`,
    }
  }
}

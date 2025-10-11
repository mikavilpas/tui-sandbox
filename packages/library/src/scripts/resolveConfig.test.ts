import assert from "assert"
import { writeFile } from "fs/promises"
import { expect } from "vitest"
import { TempDirectory } from "../server/applications/neovim/environment/TempDirectory.js"
import type { TestServerConfig } from "../server/updateTestdirectorySchemaFile.js"
import { testServerConfigSchema } from "../server/updateTestdirectorySchemaFile.js"
import type { ResolveTuiConfigResult, ResolveTuiConfigResultSuccess } from "./resolveTuiConfig.js"
import { resolveTuiConfig } from "./resolveTuiConfig.js"

it("defaults to the default configuration if no config file is found", async () => {
  const config = await resolveTuiConfig(__dirname)
  assert(!config.error)
  expect(config.id).toBe("no-config-found" satisfies ResolveTuiConfigResultSuccess["id"])
  expect(testServerConfigSchema.safeParse(config.result.config).success).toBe(true)
})

it("loads a custom configuration file if it exists", async () => {
  using dir = TempDirectory.create()

  const filename = `${dir.path}/tui-sandbox.config.ts`
  const customConfig: TestServerConfig = {
    directories: {
      testEnvironmentPath: "./test-environment2/",
      outputFilePath: "./output.ts",
    },
    integrations: { neovim: { NVIM_APPNAMEs: ["nvim", "nvim_2"] } },
    port: 12345,
  }
  {
    const contents = `export const config = ${JSON.stringify(customConfig)}`
    await writeFile(filename, contents)
  }

  const config = await resolveTuiConfig(dir.path)
  expect(config).toStrictEqual({
    id: "custom-config",
    result: {
      config: customConfig,
      configFilePath: filename,
    },
  } satisfies ResolveTuiConfigResult)
})

it("uses the default configuration file if the config has invalid contents", async () => {
  using dir = TempDirectory.create()

  {
    const customConfig: TestServerConfig = {
      // @ts-expect-error testing an invalid config on purpose
      directories: undefined,
      port: 12345,
    }
    const filename = `${dir.path}/tui-sandbox.config.ts`
    const contents = `export const config = ${JSON.stringify(customConfig)}`
    await writeFile(filename, contents)
  }

  const result = await resolveTuiConfig(dir.path)
  assert(result.error)
  expect(result.configFilePath).contains(dir.path)
  expect(result.message).match(/Issues found in the config file/)
})

it("fails if the config has not been exported from the config file", async () => {
  using dir = TempDirectory.create()

  {
    const filename = `${dir.path}/tui-sandbox.config.ts`
    const contents = ``
    await writeFile(filename, contents)
  }

  const result = await resolveTuiConfig(dir.path)
  assert(result.error)
  expect(result.configFilePath).contains(dir.path)
  expect(result.message).match(/Issues found in the config file/)
})

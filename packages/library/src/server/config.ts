import path from "path"

import {
  testServerConfigSchema,
  type TestServerConfig,
  type TestServerConfigInput,
} from "./updateTestdirectorySchemaFile.js"

export const createDefaultConfig = (cwd: string, environment: NodeJS.ProcessEnv): TestServerConfig => {
  return testServerConfigSchema.parse({
    directories: {
      testEnvironmentPath: path.join(cwd, "test-environment/"),
      outputFilePath: path.join(cwd, "MyTestDirectory.ts"),
    },
    port: environment["PORT"] ? parseInt(environment["PORT"]) : undefined,
    integrations: {
      neovim: {},
    },
  } satisfies TestServerConfigInput)
}

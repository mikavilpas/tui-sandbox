import path from "path"
import type { TestServerConfig } from "./updateTestdirectorySchemaFile.js"

export const createDefaultConfig = (cwd: string, environment: NodeJS.ProcessEnv): TestServerConfig => {
  return {
    directories: {
      testEnvironmentPath: path.join(cwd, "test-environment/"),
      outputFilePath: path.join(cwd, "MyTestDirectory.ts"),
    },
    port: environment["PORT"] ? parseInt(environment["PORT"]) : 3000,
    integrations: {
      neovim: {
        NVIM_APPNAMEs: ["nvim"],
      },
    },
  }
}

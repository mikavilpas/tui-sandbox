import "core-js/proposals/async-explicit-resource-management"

// This is the public server api. Semantic versioning will be applied to this.

export { startTestServer } from "./server"
export { updateTestdirectorySchemaFile } from "./updateTestdirectorySchemaFile"
export type { TestServerConfig } from "./updateTestdirectorySchemaFile"
